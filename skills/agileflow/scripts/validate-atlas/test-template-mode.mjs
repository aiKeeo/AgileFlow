#!/usr/bin/env node
/**
 * template 双模式单元回归（对抗用例）
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Reporter } from './lib/reporter.mjs';
import {
  resolveTemplateMode,
  resolveTemplatePreset,
  loadAllTemplateSpecs,
  bootstrapTemplateTree,
} from './lib/template-loader.mjs';
import { validateGenericDocs, validateDevFileFromTemplate } from './lib/rules/generic-doc.mjs';
import { validateRequirements } from './lib/rules/requirements.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, 'fixtures');
const skillRoot = path.resolve(__dirname, '..', '..');

let passed = 0;
let failed = 0;

/**
 * @param {string} name
 * @param {boolean} cond
 * @param {string} [detail]
 */
function check(name, cond, detail = '') {
  if (cond) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

/**
 * @param {Record<string, string>} files rel→content
 */
function writeProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'af-tmpl-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
  }
  return root;
}

// —— resolveTemplateMode ——
{
  const root = writeProject({
    'atlas/agileflow.env':
      'AF_PHASE=1\nAF_DECIDE=ai\nAF_TIER=full\nAF_STACK_SOURCE=pending\nAF_TEMPLATE=yes\n',
  });
  try {
    check('AF_TEMPLATE=yes → mode ON', resolveTemplateMode(root) === true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

{
  const root = writeProject({
    'atlas/agileflow.env':
      'AF_PHASE=1\nAF_DECIDE=ai\nAF_TIER=full\nAF_STACK_SOURCE=pending\nAF_TEMPLATE=no\n',
    'atlas/template/requirements/template-req.md': '---\ntarget: requirements/REQ-*.md\n---\n# x\n',
  });
  try {
    check('AF_TEMPLATE=no → OFF', resolveTemplateMode(root) === false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

{
  const root = writeProject({
    'atlas/agileflow.env':
      'AF_PHASE=1\nAF_DECIDE=ai\nAF_TIER=full\nAF_STACK_SOURCE=pending\n',
    'atlas/template/requirements/template-req.md': '---\ntarget: requirements/REQ-*.md\n---\n# x\n',
  });
  try {
    check('template 文件存在但 AF_TEMPLATE 未设 → OFF（不自动检测）', resolveTemplateMode(root) === false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

// —— resolveTemplatePreset ——
{
  const root = path.join(fixtures, 'good-template-minimal');
  check('good-template-minimal preset=minimal', resolveTemplatePreset(root) === 'minimal');
}

{
  const root = path.join(fixtures, 'good-template-standard');
  check('good-template-standard preset=standard', resolveTemplatePreset(root) === 'standard');
}

// —— loadAllTemplateSpecs minimal 无 sol-feature ——
{
  const root = path.join(fixtures, 'good-template-minimal');
  const specs = loadAllTemplateSpecs(root);
  check(
    'minimal specs 不含 sol-feature',
    !specs.some((s) => s.id === 'sol-feature'),
    specs.map((s) => s.id).join(',')
  );
}

// —— dual-check：template 模式不报 REQ-F* ——
{
  const root = path.join(fixtures, 'bad-dual-check');
  const reporter = new Reporter();
  validateGenericDocs(root, reporter, { phase: '1' });
  const rules = reporter.getIssues().map((i) => i.rule);
  check('bad-dual-check 含 TMPL-AC-BULLET', rules.some((r) => r === 'TMPL-AC-BULLET'));
  check('bad-dual-check 无 REQ-F005', !rules.some((r) => r.startsWith('REQ-F')));

  const legacyRep = new Reporter();
  validateRequirements(root, legacyRep, { templateMode: true });
  check('legacy req templateMode skip 无 REQ-F', legacyRep.getIssues().length === 0);
}

// —— dev 流程表落点（TMPL-DEV-FLOW-ANCHOR）——
{
  const root = path.join(fixtures, 'good-template-minimal');
  const devFile = path.join(root, 'atlas/dev/T-001-scaffold.md');
  const reporter = new Reporter();
  validateDevFileFromTemplate(root, devFile, reporter, { tier: 'full' });
  const rules = reporter.getIssues().map((i) => i.rule);
  check('good-template-minimal dev 涉及改动 通过', rules.length === 0, rules.join(','));
}

{
  const root = path.join(fixtures, 'bad-template-dev-no-anchor');
  const devFile = path.join(root, 'atlas/dev/T-001-scaffold.md');
  const reporter = new Reporter();
  validateDevFileFromTemplate(root, devFile, reporter, { tier: 'full' });
  const rules = reporter.getIssues().map((i) => i.rule);
  check('bad-template-dev-no-anchor 含 TMPL-DEV-FLOW-ANCHOR', rules.some((r) => r === 'TMPL-DEV-FLOW-ANCHOR'));
}

// —— bootstrap ——
{
  const root = writeProject({
    'atlas/agileflow.env':
      'AF_PHASE=1\nAF_DECIDE=ai\nAF_TIER=full\nAF_STACK_SOURCE=pending\n',
  });
  try {
    process.chdir(skillRoot);
    bootstrapTemplateTree(root, 'minimal');
    check(
      'bootstrap minimal 生成 template-req',
      fs.existsSync(path.join(root, 'atlas/template/requirements/template-req.md'))
    );
    check(
      'bootstrap 写入 AF_TEMPLATE=yes',
      fs.readFileSync(path.join(root, 'atlas/agileflow.env'), 'utf8').includes('AF_TEMPLATE=yes')
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

console.log(`\ntemplate-mode: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
