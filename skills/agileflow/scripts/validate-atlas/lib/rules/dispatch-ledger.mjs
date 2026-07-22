import fs from 'node:fs';
import path from 'node:path';
import { collectFiles, exists, rel } from '../fs-utils.mjs';
import { loadAfEnv } from '../af-env.mjs';

/** 派活台账（与 agileflow.env 同级，项目 atlas/ 内） */
export const DISPATCH_LEDGER_REL = 'atlas/agileflow-dispatch.json';

/** 旧路径（可读以迁移；warn 硬挡，bootstrap 不再写入） */
export const DISPATCH_LEDGER_LEGACY_RELS = [
  'atlas/.agileflow-dispatch.json',
  '.cursor/agileflow-dispatch.json',
];

/** Subagent 派活提示（Cursor 宿主用 Task 工具） */
const DISPATCH_SUBAGENT_HINT = '须先派 Subagent 派 role-{role}（Cursor=Task）';

/** @typedef {'req-confirm'|'mod-confirm'|'sol-confirm'|'dev-step1-literal'|'write-code'} DispatchGateId */

/**
 * 解析台账 JSON（优先权威路径；旧路径可读但 gate warn 硬挡）
 * @param {string} projectRoot
 * @returns {{ ok: true, ledger: { version?: number, mode?: string, entries: object[] }, legacyFrom?: string } | { ok: false, reason: 'missing'|'invalid', error?: string }}
 */
export function loadDispatchLedger(projectRoot) {
  const candidates = [DISPATCH_LEDGER_REL, ...DISPATCH_LEDGER_LEGACY_RELS];
  for (let i = 0; i < candidates.length; i++) {
    const relPath = candidates[i];
    const abs = path.join(projectRoot, relPath);
    if (!exists(abs)) continue;
    try {
      const raw = fs.readFileSync(abs, 'utf8');
      const ledger = JSON.parse(raw);
      if (!ledger || typeof ledger !== 'object') {
        return { ok: false, reason: 'invalid', error: '根对象须为 JSON 对象' };
      }
      if (!Array.isArray(ledger.entries)) {
        return { ok: false, reason: 'invalid', error: '缺少 entries 数组' };
      }
      const legacyFrom = i > 0 ? relPath : undefined;
      return { ok: true, ledger, legacyFrom };
    } catch (e) {
      return { ok: false, reason: 'invalid', error: e instanceof Error ? e.message : String(e) };
    }
  }
  return { ok: false, reason: 'missing' };
}

/**
 * 创建空台账结构
 * @param {'normal'|'degraded-single-session'} [mode]
 */
export function createEmptyLedger(mode = 'normal') {
  return {
    version: 1,
    mode,
    entries: [],
  };
}

/**
 * 台账是否处于无 Subagent 降级模式（跳过 ORCH 校验）
 * @param {unknown} ledger
 */
export function isDegradedDispatchMode(ledger) {
  return ledger?.mode === 'degraded-single-session';
}

/**
 * 将台账 paths 模式转为 RegExp（`*` 按段通配，如 `REQ-001-*.md`、`model/**`）
 * @param {string} pattern 如 atlas/requirements/REQ-001-*.md
 */
function pathPatternToRegExp(pattern) {
  const norm = String(pattern).replace(/\\/g, '/').replace(/^\.\//, '');
  if (norm.includes('*')) {
    const escaped = norm.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`);
  }
  return new RegExp(`^${norm.replace(/[.+?^${}()|[\]\\]/g, '\\$&')}$`);
}

/**
 * 判断 ledger entry 的 paths 是否覆盖目标文件
 * @param {{ paths?: string[] }} entry
 * @param {string} targetRel 相对项目根，正斜杠
 */
function entryCoversPath(entry, targetRel) {
  const paths = entry.paths ?? [];
  return paths.some((p) => pathPatternToRegExp(p).test(targetRel));
}

/**
 * 从 dev 文件名提取 Tid（T-001-login-BE.md → T-001）
 * @param {string} devFileAbs
 * @param {string} projectRoot
 */
function extractTaskIdFromDevFile(devFileAbs, projectRoot) {
  const base = path.basename(devFileAbs);
  const m = base.match(/^(T-\d+)/);
  return m ? m[1] : null;
}

/**
 * 列出 atlas/dev 下合规 T 级 dev 文件（相对路径）
 * @param {string} projectRoot
 */
function listDevTaskFiles(projectRoot) {
  const devRoot = path.join(projectRoot, 'atlas', 'dev');
  if (!exists(devRoot)) return [];
  return fs
    .readdirSync(devRoot)
    .filter((f) => /^T-\d+-.+\.md$/.test(f) && !f.includes('README'))
    .map((f) => rel(projectRoot, path.join(devRoot, f)).replace(/\\/g, '/'));
}

/**
 * 列出 REQ 文件（相对路径）
 * @param {string} projectRoot
 */
function listReqFiles(projectRoot) {
  const reqRoot = path.join(projectRoot, 'atlas', 'requirements');
  if (!exists(reqRoot)) return [];
  return collectFiles(reqRoot, '.md')
    .filter((f) => /REQ-\d+/.test(path.basename(f)))
    .map((f) => rel(projectRoot, f).replace(/\\/g, '/'));
}

/**
 * 列出 model 落盘文件（相对路径；无 model/ 目录则空）
 * @param {string} projectRoot
 */
function listModelDispatchTargets(projectRoot) {
  const modelRoot = path.join(projectRoot, 'atlas', 'model');
  if (!exists(modelRoot)) return [];
  return collectFiles(modelRoot, '.md')
    .filter((f) => !f.replace(/\\/g, '/').includes('/temp/'))
    .map((f) => rel(projectRoot, f).replace(/\\/g, '/'));
}

/**
 * 列出 sol 落盘关键文件（architecture + F-*.md + contracts）
 * @param {string} projectRoot
 */
function listSolDispatchTargets(projectRoot) {
  const solRoot = path.join(projectRoot, 'atlas', 'solution');
  if (!exists(solRoot)) return [];
  /** @type {string[]} */
  const targets = [];
  const arch = path.join(solRoot, 'architecture.md');
  if (exists(arch)) {
    targets.push(rel(projectRoot, arch).replace(/\\/g, '/'));
  }
  const featRoot = path.join(solRoot, 'features');
  if (exists(featRoot)) {
    for (const f of collectFiles(featRoot, '.md')) {
      if (/F-\d+/.test(path.basename(f))) {
        targets.push(rel(projectRoot, f).replace(/\\/g, '/'));
      }
    }
  }
  const contractRoot = path.join(solRoot, 'contracts');
  if (exists(contractRoot)) {
    for (const f of collectFiles(contractRoot, '.md')) {
      targets.push(rel(projectRoot, f).replace(/\\/g, '/'));
    }
  }
  return targets;
}

/**
 * 查找匹配 role 的台账条目
 * @param {Array<{ role?: string, taskId?: string|null }>} entries
 * @param {string} role
 */
function entriesForRole(entries, role) {
  return entries.filter((e) => e.role === role);
}

/**
 * 降级台账：须 degradedReason；且不得与 env AF_HOST_CAPABILITY=full 冲突
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ degradedReason?: string }} ledger
 * @returns {boolean} true = 可跳过 ORCH 校验
 */
function validateDegradedLedger(projectRoot, reporter, ledger) {
  const reason = String(ledger.degradedReason ?? '').trim();
  if (!reason) {
    reporter.add({
      severity: 'warn',
      rule: 'ORCH-DEGRADED-REASON',
      file: DISPATCH_LEDGER_REL,
      message:
        '降级单会话模式须填写 degradedReason（为何宿主无 Subagent/Task）；缺则禁止跳过 ORCH 校验。',
    });
    return false;
  }

  const envLoaded = loadAfEnv(projectRoot);
  if (envLoaded.ok && envLoaded.state.hostCapability === 'full') {
    reporter.add({
      severity: 'warn',
      rule: 'ORCH-DEGRADED-CONFLICT',
      file: DISPATCH_LEDGER_REL,
      message:
        'AF_HOST_CAPABILITY=full 但台账 mode=degraded-single-session → 滥用降级或 env 未同步；须 normal + subagentId。',
    });
    return false;
  }

  reporter.add({
    severity: 'info',
    rule: 'ORCH-DISPATCH-SKIP',
    file: DISPATCH_LEDGER_REL,
    message: `降级单会话模式：跳过派活台账校验（reason: ${reason.slice(0, 80)}）`,
  });
  return true;
}

/**
 * 若权威路径已读但旧路径仍存在，提示删除 stale 文件
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 */
function warnStaleLegacyLedgers(projectRoot, reporter) {
  for (const staleRel of DISPATCH_LEDGER_LEGACY_RELS) {
    if (!exists(path.join(projectRoot, staleRel))) continue;
    reporter.add({
      severity: 'warn',
      rule: 'ORCH-DISPATCH-STALE-LEGACY',
      file: staleRel,
      message: `检测到旧路径台账 ${staleRel} 仍存在；已读 ${DISPATCH_LEDGER_REL}，请删除旧文件避免混淆`,
    });
  }
}

/**
 * 校验派活台账是否满足当前闸门
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ gateId: DispatchGateId, devFile?: string }} ctx
 */
export function validateDispatchLedger(projectRoot, reporter, ctx) {
  const loaded = loadDispatchLedger(projectRoot);
  const gateId = ctx.gateId;

  if (!loaded.ok) {
    if (loaded.reason === 'missing') {
      reporter.add({
        severity: 'error',
        rule: 'ORCH-NO-DISPATCH',
        file: DISPATCH_LEDGER_REL,
        message:
          '缺少派活台账 atlas/agileflow-dispatch.json：总控须先派 Subagent，收回报后写入台账再跑 gate',
      });
      return;
    }
    reporter.add({
      severity: 'error',
      rule: 'ORCH-DISPATCH-INVALID',
      file: DISPATCH_LEDGER_REL,
      message: `派活台账 JSON 无效：${loaded.error ?? 'parse error'}`,
    });
    return;
  }

  const { ledger, legacyFrom } = loaded;
  if (legacyFrom) {
    reporter.add({
      severity: 'warn',
      rule: 'ORCH-DISPATCH-LEGACY-PATH',
      file: legacyFrom,
      message: `派活台账在旧路径 ${legacyFrom}；须迁移到 ${DISPATCH_LEDGER_REL}（warn 硬挡，与 agileflow.env 同级）`,
    });
  } else {
    warnStaleLegacyLedgers(projectRoot, reporter);
  }
  if (isDegradedDispatchMode(ledger)) {
    validateDegradedLedger(projectRoot, reporter, ledger);
    return;
  }

  const entries = ledger.entries ?? [];

  validateEntryProvenance(reporter, entries);

  if (gateId === 'req-confirm') {
    validatePathDispatch(projectRoot, reporter, entries, 'req', 'req-confirm', listReqFiles);
    return;
  }
  if (gateId === 'mod-confirm') {
    validatePathDispatch(projectRoot, reporter, entries, 'model', 'mod-confirm', listModelDispatchTargets);
    return;
  }
  if (gateId === 'sol-confirm') {
    validatePathDispatch(projectRoot, reporter, entries, 'sol', 'sol-confirm', listSolDispatchTargets);
    return;
  }
  if (gateId === 'dev-step1-literal' || gateId === 'write-code') {
    validateDevDispatch(projectRoot, reporter, entries, ctx.devFile);
  }
}

/**
 * normal 模式：每条台账须能证明「真派过 Subagent」，禁止主线程写完后补假账
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {Array<{ role?: string, taskId?: string|null, subagentId?: string|null }>} entries
 */
function validateEntryProvenance(reporter, entries) {
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const stepId = e.stepId != null ? String(e.stepId).trim() : '';
    if (!stepId) {
      reporter.add({
        severity: 'error',
        rule: 'ORCH-STEP-ID',
        file: DISPATCH_LEDGER_REL,
        message: `台账 entries[${i}] 缺 stepId（须等于当时 AF_STEP / flow 步 id）——走过的步必须记账`,
      });
    }

    const role = e.role != null ? String(e.role) : '';
    const subId = e.subagentId != null ? String(e.subagentId).trim() : '';
    const isOrchDirect = role === 'orch-direct';

    if (isOrchDirect) {
      if (subId !== 'orch-direct') {
        reporter.add({
          severity: 'error',
          rule: 'ORCH-DIRECT-ID',
          file: DISPATCH_LEDGER_REL,
          message: `台账 entries[${i}] role=orch-direct 时 subagentId 须为字面 "orch-direct"（总控直做步；禁止空串）`,
        });
      }
    } else if (!subId) {
      reporter.add({
        severity: 'error',
        rule: 'ORCH-NO-SUBAGENT-ID',
        file: DISPATCH_LEDGER_REL,
        message: `台账 entries[${i}] role=${role || '?'} 缺 subagentId（宿主 Subagent/Task 返回的 ID）——禁止主线程包办后补 paths`,
      });
    }

    if (role === 'dev') {
      const tid = e.taskId;
      if (!tid || !/^T-\d+/.test(String(tid))) {
        reporter.add({
          severity: 'error',
          rule: 'ORCH-DEV-NO-TASKID',
          file: DISPATCH_LEDGER_REL,
          message: `台账 entries[${i}] role=dev 缺合法 taskId（如 T-001）——每 T 须独立派活`,
        });
      }
    }
  }
}

/**
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {Array<{ role?: string, paths?: string[] }>} entries
 * @param {string} role
 * @param {string} gateLabel
 * @param {(root: string) => string[]} listTargets
 */
function validatePathDispatch(projectRoot, reporter, entries, role, gateLabel, listTargets) {
  const targets = listTargets(projectRoot);
  if (targets.length === 0) return;

  const roleEntries = entriesForRole(entries, role);
  if (roleEntries.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'ORCH-NO-DISPATCH',
      file: DISPATCH_LEDGER_REL,
      message: `${gateLabel}：台账无 role=${role} 派活记录（${DISPATCH_SUBAGENT_HINT.replace('{role}', role)}）`,
    });
    return;
  }

  for (const targetRel of targets) {
    const covered = roleEntries.some((e) => entryCoversPath(e, targetRel));
    if (!covered) {
      reporter.add({
        severity: 'error',
        rule: 'ORCH-DISPATCH-MISMATCH',
        file: DISPATCH_LEDGER_REL,
        message: `${gateLabel}：台账未覆盖 ${targetRel}（paths 须含该文件或通配）`,
      });
    }
  }
}

/**
 * dev 闸门：有 dev 文件或指定 devFile 时须匹配 role=dev + taskId/paths
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {Array<{ role?: string, taskId?: string|null, paths?: string[] }>} entries
 * @param {string} [devFileAbs]
 */
function validateDevDispatch(projectRoot, reporter, entries, devFileAbs) {
  /** @type {string[]} */
  let targetRels = [];

  if (devFileAbs) {
    targetRels = [rel(projectRoot, path.resolve(devFileAbs)).replace(/\\/g, '/')];
  } else {
    targetRels = listDevTaskFiles(projectRoot);
  }

  if (targetRels.length === 0) return;

  const devEntries = entriesForRole(entries, 'dev');
  if (devEntries.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'ORCH-NO-DISPATCH',
      file: DISPATCH_LEDGER_REL,
      message: `dev 闸门：台账无 role=dev 派活记录（${DISPATCH_SUBAGENT_HINT.replace('{role}', 'dev')}）`,
    });
    return;
  }

  for (const devRel of targetRels) {
    const tid = extractTaskIdFromDevFile(path.join(projectRoot, devRel), projectRoot);
    const matched = devEntries.some((e) => {
      if (e.taskId && tid && e.taskId === tid) return true;
      return entryCoversPath(e, devRel);
    });
    if (!matched) {
      reporter.add({
        severity: 'error',
        rule: 'ORCH-DISPATCH-MISMATCH',
        file: DISPATCH_LEDGER_REL,
        message: `dev 闸门：台账未覆盖 ${devRel}${tid ? `（taskId=${tid}）` : ''}`,
      });
    }
  }
}
