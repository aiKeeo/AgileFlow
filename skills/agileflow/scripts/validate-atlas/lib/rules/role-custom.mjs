import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { exists, readText } from '../fs-utils.mjs';

/** role baseline（与 role-*.md 同目录；须进库） */
export const ROLE_BASELINE_REL = 'atlas/role/.agileflow-role-baseline.json';

/** role 文件名 → 逻辑 key */
export const ROLE_FILE_TO_KEY = {
  'role-req.md': 'req',
  'role-model.md': 'model',
  'role-sol.md': 'sol',
  'role-dev.md': 'dev',
};

export const ROLE_FILES = Object.keys(ROLE_FILE_TO_KEY);

/** @typedef {'req'|'model'|'sol'|'dev'} RoleKey */

/**
 * 规范化文本后 sha256（统一 LF，避免 CRLF 误判）
 * @param {string} text
 */
export function hashRoleContent(text) {
  const norm = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return `sha256:${crypto.createHash('sha256').update(norm, 'utf8').digest('hex')}`;
}

/**
 * 读取 role 文件哈希
 * @param {string} projectRoot
 * @param {string} roleFile basename
 */
function hashRoleFile(projectRoot, roleFile) {
  const abs = path.join(projectRoot, 'atlas', 'role', roleFile);
  if (!exists(abs)) return null;
  return hashRoleContent(readText(abs) || '');
}

/**
 * 写入 baseline JSON
 * @param {string} projectRoot
 * @param {{ force?: boolean }} [opts]
 * @returns {{ created: boolean, path: string, files: Record<string, string> }}
 */
export function writeRoleBaselines(projectRoot, opts = {}) {
  const abs = path.join(projectRoot, ROLE_BASELINE_REL);
  if (exists(abs) && !opts.force) {
    return { created: false, path: abs, files: loadBaselineFile(projectRoot)?.files ?? {} };
  }

  /** @type {Record<string, string>} */
  const files = {};
  for (const roleFile of ROLE_FILES) {
    const h = hashRoleFile(projectRoot, roleFile);
    if (h) files[roleFile] = h;
  }

  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(
    abs,
    `${JSON.stringify({ version: 1, files, updatedAt: new Date().toISOString() }, null, 2)}\n`,
  );
  return { created: true, path: abs, files };
}

/**
 * bootstrap 写入 baseline：无文件则全量快照；已有则仅更新本次新复制的 role 条目
 * @param {string} projectRoot
 * @param {string[]} [newlyCopiedFiles] 本次 bootstrap 新复制的 role 文件名
 * @returns {{ created: boolean, merged?: boolean, path: string, files: Record<string, string> }}
 */
export function bootstrapRoleBaselines(projectRoot, newlyCopiedFiles = []) {
  const abs = path.join(projectRoot, ROLE_BASELINE_REL);
  const existing = loadBaselineFile(projectRoot);

  if (!existing) {
    return writeRoleBaselines(projectRoot, { force: true });
  }

  if (!newlyCopiedFiles.length) {
    return { created: false, path: abs, files: existing.files ?? {} };
  }

  const files = { ...(existing.files ?? {}) };
  let merged = false;
  for (const roleFile of newlyCopiedFiles) {
    if (!ROLE_FILES.includes(roleFile)) continue;
    const h = hashRoleFile(projectRoot, roleFile);
    if (h) {
      files[roleFile] = h;
      merged = true;
    }
  }

  if (!merged) {
    return { created: false, path: abs, files: existing.files ?? {} };
  }

  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(
    abs,
    `${JSON.stringify({ version: 1, files, updatedAt: new Date().toISOString() }, null, 2)}\n`,
  );
  return { created: false, merged: true, path: abs, files };
}

/**
 * 读取 baseline 文件
 * @param {string} projectRoot
 */
function loadBaselineFile(projectRoot) {
  const abs = path.join(projectRoot, ROLE_BASELINE_REL);
  if (!exists(abs)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(abs, 'utf8'));
    if (!data || typeof data !== 'object' || !data.files) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * 确保 baseline 存在（旧项目迁移：快照当前 role 为 default）
 * @param {string} projectRoot
 */
export function ensureRoleBaselines(projectRoot) {
  if (loadBaselineFile(projectRoot)) return { created: false };
  const result = writeRoleBaselines(projectRoot, { force: true });
  return { created: result.created };
}

/**
 * 加载用户自定义 role 集合（相对 baseline 哈希变化）
 * @param {string} projectRoot
 * @returns {Set<RoleKey>}
 */
export function loadCustomRoles(projectRoot) {
  ensureRoleBaselines(projectRoot);
  const baseline = loadBaselineFile(projectRoot);
  /** @type {Set<RoleKey>} */
  const custom = new Set();

  if (!baseline?.files) return custom;

  for (const roleFile of ROLE_FILES) {
    const key = ROLE_FILE_TO_KEY[roleFile];
    const expected = baseline.files[roleFile];
    const current = hashRoleFile(projectRoot, roleFile);
    if (!expected || !current) continue;
    if (current !== expected) custom.add(key);
  }

  return custom;
}

/**
 * 单 role 是否 custom
 * @param {string} projectRoot
 * @param {RoleKey} roleKey
 */
export function isRoleCustom(projectRoot, roleKey) {
  return loadCustomRoles(projectRoot).has(roleKey);
}

/**
 * 模块是否因 custom role 跳过文档闸门
 * @param {string} moduleName validateAtlas 模块名
 * @param {Set<RoleKey>} customRoles
 */
export function shouldSkipDocModule(moduleName, customRoles) {
  if (!customRoles || customRoles.size === 0) return false;

  if (moduleName === 'req' && customRoles.has('req')) return true;
  if (moduleName === 'model' && customRoles.has('model')) return true;
  if (moduleName === 'sol' && customRoles.has('sol')) return true;
  if (moduleName === 'dev' && customRoles.has('dev')) return true;
  if (moduleName === 'dev-step1-literal' && customRoles.has('dev')) return true;

  // req-confirmed 绑定 req 阶段
  if (moduleName === 'req-confirmed' && customRoles.has('req')) return true;

  return false;
}

/**
 * doc-first integrity 是否跳过 sol 相关规则
 * @param {Set<RoleKey>} customRoles
 */
export function shouldSkipSolIntegrity(customRoles) {
  return customRoles.has('sol');
}

/**
 * doc-first integrity 是否跳过 dev 相关规则
 * @param {Set<RoleKey>} customRoles
 */
export function shouldSkipDevIntegrity(customRoles) {
  return customRoles.has('dev');
}

/**
 * doc-first integrity 是否跳过 model 相关规则
 * @param {Set<RoleKey>} customRoles
 */
export function shouldSkipModelIntegrity(customRoles) {
  return customRoles.has('model');
}

/** todo：sol custom 时跳过 T 头形态（TODO-FORMAT-*） */
export function shouldSkipTodoSolFormat(customRoles) {
  return customRoles.has('sol');
}

/** todo：dev custom 时跳过 DEV/TODO-CHECK 与 dev 数对齐 */
export function shouldSkipTodoDevCheck(customRoles) {
  return customRoles.has('dev');
}

/**
 * 生成 ROLE-CUSTOM-SKIP info 文案
 * @param {RoleKey} roleKey
 * @param {string} moduleName
 */
export function customSkipMessage(roleKey, moduleName) {
  return `role-${roleKey} 已自定义 → 跳过默认 ${moduleName} 文档闸门（按用户 role 执行）`;
}

/**
 * 从 module 名反推触发的 role key（用于 info）
 * @param {string} moduleName
 * @param {Set<RoleKey>} customRoles
 * @returns {RoleKey | null}
 */
export function resolveCustomRoleForModule(moduleName, customRoles) {
  if (moduleName === 'req' || moduleName === 'req-confirmed') return customRoles.has('req') ? 'req' : null;
  if (moduleName === 'model') return customRoles.has('model') ? 'model' : null;
  if (moduleName === 'sol') return customRoles.has('sol') ? 'sol' : null;
  if (moduleName === 'dev' || moduleName === 'dev-step1-literal') return customRoles.has('dev') ? 'dev' : null;
  return null;
}
