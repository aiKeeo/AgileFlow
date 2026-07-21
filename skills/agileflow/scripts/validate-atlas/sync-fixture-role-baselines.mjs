#!/usr/bin/env node
/**
 * 同步 validate-atlas fixture 的 role baseline，消除模板漂移导致的假 ROLE-CUSTOM-SKIP。
 *
 * 规则：
 * - 默认 fixture：role-*.md 应与 templates/role/ 一致；漂移则从模板覆盖，baseline = 模板哈希
 * - 有意 custom 的 fixture：仅列出的 role 保留自定义内容，baseline 存模板哈希以触发 custom 检测
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ROLE_FILES,
  ROLE_BASELINE_REL,
  hashRoleContent,
} from './lib/rules/role-custom.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..', '..');
const fixturesRoot = path.join(__dirname, 'fixtures');
const templatesRoleDir = path.join(skillRoot, 'templates', 'role');

/** fixture 名 → 仅允许 custom 的 role key 列表 */
const INTENTIONAL_CUSTOM = {
  'good-req-custom-role': ['req'],
  'good-model-custom': ['model'],
  'good-sol-custom-todo': ['sol'],
  'good-dev-custom-literal': ['dev'],
  'bad-sol-custom-still-checks': ['sol'],
  'bad-orch-no-subagent-id': ['req'],
};

/**
 * 读取模板 role 文本与哈希
 * @returns {Map<string, { text: string, hash: string }>}
 */
function loadTemplateRoles() {
  /** @type {Map<string, { text: string, hash: string }>} */
  const map = new Map();
  for (const roleFile of ROLE_FILES) {
    const abs = path.join(templatesRoleDir, roleFile);
    const text = fs.readFileSync(abs, 'utf8');
    map.set(roleFile, { text, hash: hashRoleContent(text) });
  }
  return map;
}

/**
 * 判断 role 文件是否为有意自定义（以 # 自定义 开头）
 * @param {string} text
 */
function isIntentionalCustomContent(text) {
  return /^#\s*自定义/m.test(String(text).trimStart());
}

/**
 * 同步单个 fixture
 * @param {string} fixtureName
 * @param {Map<string, { text: string, hash: string }>} templates
 * @param {{ dryRun?: boolean }} opts
 */
function syncFixture(fixtureName, templates, opts = {}) {
  const fixtureRoot = path.join(fixturesRoot, fixtureName);
  const roleDir = path.join(fixtureRoot, 'atlas', 'role');
  if (!fs.existsSync(roleDir)) return { fixtureName, skipped: true };

  const allowedCustom = new Set(INTENTIONAL_CUSTOM[fixtureName] ?? []);
  /** @type {Record<string, string>} */
  const baselineFiles = {};
  const actions = [];

  for (const roleFile of ROLE_FILES) {
    const roleKey = roleFile.replace('role-', '').replace('.md', '');
    const roleAbs = path.join(roleDir, roleFile);
    const template = templates.get(roleFile);
    if (!template) continue;

    if (!fs.existsSync(roleAbs)) {
      baselineFiles[roleFile] = template.hash;
      continue;
    }

    const currentText = fs.readFileSync(roleAbs, 'utf8');
    const currentHash = hashRoleContent(currentText);
    const isCustomSlot = allowedCustom.has(roleKey);

    if (isCustomSlot) {
      // 有意 custom：保留自定义内容，baseline 用模板哈希
      if (!isIntentionalCustomContent(currentText)) {
        actions.push(`WARN ${fixtureName}/${roleFile}: 应在 allowedCustom 内且以「# 自定义」开头`);
      }
      baselineFiles[roleFile] = template.hash;
      continue;
    }

    // 非 custom 槽：必须与模板一致
    if (currentHash !== template.hash) {
      if (!opts.dryRun) {
        fs.writeFileSync(roleAbs, template.text);
      }
      actions.push(`RESET ${fixtureName}/${roleFile}: 从模板覆盖（漂移）`);
    }
    baselineFiles[roleFile] = template.hash;
  }

  const baselineAbs = path.join(roleDir, path.basename(ROLE_BASELINE_REL));
  const baselineJson = {
    version: 1,
    files: baselineFiles,
    updatedAt: new Date().toISOString(),
  };

  if (!opts.dryRun) {
    fs.mkdirSync(path.dirname(baselineAbs), { recursive: true });
    fs.writeFileSync(baselineAbs, `${JSON.stringify(baselineJson, null, 2)}\n`);
  }
  actions.push(`BASELINE ${fixtureName}: ${Object.keys(baselineFiles).length} roles`);

  return { fixtureName, skipped: false, actions };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const templates = loadTemplateRoles();
  const fixtureNames = fs
    .readdirSync(fixturesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  let synced = 0;
  for (const name of fixtureNames) {
    const result = syncFixture(name, templates, { dryRun });
    if (result.skipped) continue;
    synced += 1;
    for (const a of result.actions ?? []) {
      console.log(dryRun ? `[dry-run] ${a}` : a);
    }
  }

  console.log(`\n${dryRun ? '[dry-run] ' : ''}Synced ${synced} fixtures under ${fixturesRoot}`);
}

main();
