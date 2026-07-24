/**
 * init / update：挂载门牌 skill + 同步总控 agileflow skill 树
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  BUILTIN_CATALOG,
  catalogScopesSummary,
  customEntryFromStep,
  isBuiltinId,
  isSafeStepId,
} from './catalog.mjs';
import { FLOW_RESERVED_IDS, loadFlow, listFlowSteps } from '../scripts/validate-atlas/lib/flow.mjs';
import { installCursor, pruneCursorDoorplates } from './adapters/cursor.mjs';
import { installClaude, pruneClaudeDoorplates } from './adapters/claude.mjs';
import { installCodex, pruneCodexDoorplates } from './adapters/codex.mjs';
import { installWorkbuddy, pruneWorkbuddyDoorplates } from './adapters/workbuddy.mjs';
import { installCodebuddy, pruneCodebuddyDoorplates } from './adapters/codebuddy.mjs';
import { installQoder, pruneQoderDoorplates } from './adapters/qoder.mjs';
import { ALL_HOSTS, expandBuddyHosts, isKnownHost } from './adapters/_host.mjs';
import { readPackageMeta } from './package-meta.mjs';
import { assertRootFlag, parseArgv, resolveInitContext, resolveUpdateModes } from './parse-argv.mjs';

const CLI_JSON = path.join('atlas', 'agileflow-cli.json');

/** @type {Record<string, (opts: import('./adapters/_install.mjs').InstallHostOpts) => object>} */
const INSTALLERS = {
  cursor: installCursor,
  claude: installClaude,
  codex: installCodex,
  workbuddy: installWorkbuddy,
  codebuddy: installCodebuddy,
  qoder: installQoder,
};

/** @type {Record<string, (root: string, scope: import('./adapters/_host.mjs').InstallScope, keep: Set<string>) => string[]>} */
const PRUNERS = {
  cursor: pruneCursorDoorplates,
  claude: pruneClaudeDoorplates,
  codex: pruneCodexDoorplates,
  workbuddy: pruneWorkbuddyDoorplates,
  codebuddy: pruneCodebuddyDoorplates,
  qoder: pruneQoderDoorplates,
};

/**
 * @param {string} projectRoot
 */
function flowFingerprint(projectRoot) {
  const loaded = loadFlow(projectRoot);
  if (!loaded.ok || !loaded.flow) return null;
  const parts = listFlowSteps(loaded.flow).map((s) => `${s.id}:${s.skip ? 1 : 0}:${s.mode || ''}`);
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 16);
}

/**
 * @param {string} projectRoot
 * @returns {import('./catalog.mjs').CatalogEntry[]}
 */
export function buildCatalog(projectRoot, opts = {}) {
  const entries = [...BUILTIN_CATALOG];
  const seen = new Set(entries.map((e) => e.id));
  for (const e of BUILTIN_CATALOG) {
    for (const a of e.aliases || []) seen.add(a);
  }
  const loaded = loadFlow(projectRoot);
  if (!loaded.ok || !loaded.flow) {
    if (opts.requireFlow && !loaded.missing && fs.existsSync(path.join(projectRoot, 'atlas', 'flow.yaml'))) {
      throw new Error(`无法解析 atlas/flow.yaml：${loaded.error || 'parse failed'}`);
    }
    return entries;
  }

  for (const step of listFlowSteps(loaded.flow)) {
    const id = step.id;
    if (seen.has(id)) continue;
    if (!isSafeStepId(id)) {
      console.warn(`[agileflow] skip 非法 flow id=${JSON.stringify(id)}（须匹配 /^af-[a-z][a-z0-9_-]*$/i）`);
      continue;
    }
    if (FLOW_RESERVED_IDS.has(id) || isBuiltinId(id)) {
      console.warn(`[agileflow] skip flow id=${id}（与内置/保留字冲突）`);
      continue;
    }
    entries.push(customEntryFromStep(step));
    seen.add(id);
  }
  return entries;
}

/**
 * @param {string} projectRoot
 * @param {object} data
 */
function writeCliJson(projectRoot, data) {
  const atlas = path.join(projectRoot, 'atlas');
  fs.mkdirSync(atlas, { recursive: true });
  fs.writeFileSync(path.join(projectRoot, CLI_JSON), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/**
 * @param {string} projectRoot
 */
export function readCliJson(projectRoot) {
  const p = path.join(projectRoot, CLI_JSON);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * 项目内是否已有 agileflow 厚 skill（任宿主）
 * @param {string} projectRoot
 */
function hasInstalledAgileflowSkill(projectRoot) {
  const roots = [
    path.join(projectRoot, '.cursor', 'skills', 'agileflow'),
    path.join(projectRoot, '.claude', 'skills', 'agileflow'),
    path.join(projectRoot, '.agents', 'skills', 'agileflow'),
    path.join(projectRoot, '.codex', 'skills', 'agileflow'),
    path.join(projectRoot, '.workbuddy', 'skills', 'agileflow'),
    path.join(projectRoot, '.codebuddy', 'skills', 'agileflow'),
    path.join(projectRoot, '.qoder', 'skills', 'agileflow'),
  ];
  return roots.some((d) => fs.existsSync(path.join(d, 'scripts', 'validate-atlas.mjs')));
}

/**
 * @param {string[]} tools
 * @param {object} opts
 */
function installTools(tools, opts) {
  const results = {};
  for (const tool of expandBuddyHosts(tools)) {
    if (!isKnownHost(tool)) {
      console.warn(`[agileflow] 未知 tool=${tool}，已忽略（可用: ${ALL_HOSTS.join(',')}）`);
      continue;
    }
    const install = INSTALLERS[tool];
    if (install) results[tool] = install(opts);
  }
  return results;
}

/**
 * @param {string} installRoot
 * @param {import('./adapters/_host.mjs').InstallScope} scope
 * @param {import('./catalog.mjs').CatalogEntry[]} catalog
 * @param {string[]} tools
 */
function pruneAll(installRoot, scope, catalog, tools) {
  const keep = new Set(catalog.map((e) => e.id));
  const removed = [];
  for (const tool of expandBuddyHosts(tools)) {
    const prune = PRUNERS[tool];
    if (prune) removed.push(...prune(installRoot, scope, keep));
  }
  return removed;
}

/**
 * @param {string[]} argvRest
 */
export async function runInit(argvRest) {
  const { flags } = parseArgv(argvRest);
  const ctx = resolveInitContext(flags, ALL_HOSTS);
  const installRoot = path.resolve(ctx.scope === 'user' ? os.homedir() : ctx.installRoot);
  const tools = ctx.tools;
  const force = Boolean(flags.force);
  const meta = readPackageMeta();

  if (ctx.scope === 'project' && !fs.existsSync(installRoot)) {
    console.error(`目录不存在: ${installRoot}`);
    process.exit(1);
  }

  let catalog;
  try {
    catalog = buildCatalog(installRoot, { requireFlow: ctx.scope === 'project' });
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }

  const installOpts = {
    installRoot,
    scope: ctx.scope,
    catalog,
    force,
    backup: true,
    stepSkillsOnly: false,
    skillSyncOnly: false,
  };
  const results = installTools(tools, installOpts);
  const removed = pruneAll(installRoot, ctx.scope, catalog, tools);

  if (ctx.scope === 'project') {
    writeCliJson(installRoot, {
      version: meta.version,
      package: meta.name,
      tools,
      scope: 'project',
      delivery: 'skills',
      doorplateIds: catalog.map((e) => e.id),
      scopes: catalogScopesSummary(catalog),
      flowFingerprint: flowFingerprint(installRoot),
      generatedAt: new Date().toISOString(),
    });
  }

  console.log(`\n✅ AgileFlow init (@agileflow/cli v${meta.version})`);
  console.log(`   模式: ${ctx.scope === 'user' ? '用户级（~ 下各宿主 skills）' : '项目级'}`);
  console.log(`   目标: ${installRoot}`);
  console.log(`   tools: ${tools.join(', ')}`);
  console.log(`   doorplate skills: ${catalog.map((e) => e.id).join(' ')}`);
  for (const [tool, r] of Object.entries(results)) {
    console.log(`   ${tool}: agileflow → ${r.skillDir}`);
    console.log(`   ${tool}: ${r.written.length} doorplate skills → ${r.skillsRoot}/af-*/SKILL.md`);
    if (r.skipped.length) console.log(`   ${tool}: skipped (not generated): ${r.skipped.length}`);
    if (r.legacyRemoved?.length) console.log(`   ${tool}: removed ${r.legacyRemoved.length} legacy file(s)`);
  }
  if (removed.length) console.log(`   pruned doorplates: ${removed.length}`);
  console.log('\n下一步：');
  console.log('  1. 重启 IDE / Agent（或新开会话）');
  console.log('  2. 选用 af-req skill 或输入 /af-req …');
  if (ctx.scope === 'project') {
    console.log('  3. 闸门：agileflow gate --gate req-confirm --root .');
    console.log('  4. 改 flow 后：agileflow update --step-skills-only --root .\n');
  } else {
    console.log('  3. 在具体项目里：agileflow init --root . --tools cursor（或其它宿主）');
    console.log('  4. 闸门：agileflow gate --bootstrap-scaffold --root YOUR_PROJECT\n');
  }
}

/**
 * @param {string[]} argvRest
 */
export async function runUpdate(argvRest) {
  const { flags } = parseArgv(argvRest);
  assertRootFlag(flags);
  const projectRoot = path.resolve(String(flags.root || process.cwd()));
  const prev = readCliJson(projectRoot);
  if (!prev) {
    console.error('缺少 atlas/agileflow-cli.json，请先 agileflow init --root .');
    process.exit(1);
  }

  const tools = flags.tools
    ? String(flags.tools).split(',').map((s) => s.trim()).filter(Boolean)
    : Array.isArray(prev.tools)
      ? prev.tools
      : ['cursor'];

  const modes = resolveUpdateModes(flags);
  if (modes.deprecatedCommandsOnly) {
    console.warn('[agileflow] --commands-only 已弃用，请改用 --step-skills-only');
  }

  if (modes.stepSkillsOnly && !hasInstalledAgileflowSkill(projectRoot)) {
    console.error('项目内无 agileflow skill 树；请先 init 或 update（勿仅 --step-skills-only）');
    process.exit(1);
  }

  const force = true;
  const meta = readPackageMeta();
  let catalog;
  try {
    catalog = buildCatalog(projectRoot, { requireFlow: true });
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }

  const scope = /** @type {const} */ ('project');
  const results = installTools(tools, {
    installRoot: projectRoot,
    scope,
    catalog,
    force,
    backup: !modes.stepSkillsOnly,
    stepSkillsOnly: modes.stepSkillsOnly,
    skillSyncOnly: modes.skillSyncOnly,
  });

  const removed = pruneAll(projectRoot, scope, catalog, tools);
  writeCliJson(projectRoot, {
    ...prev,
    version: meta.version,
    package: meta.name,
    tools,
    scope: 'project',
    delivery: 'skills',
    doorplateIds: catalog.map((e) => e.id),
    scopes: catalogScopesSummary(catalog),
    flowFingerprint: flowFingerprint(projectRoot),
    generatedAt: new Date().toISOString(),
  });

  const modeLabel = modes.stepSkillsOnly
    ? ' --step-skills-only'
    : modes.skillSyncOnly
      ? ' --skill-sync'
      : '';
  console.log(`\n✅ AgileFlow update${modeLabel}`);
  for (const [tool, r] of Object.entries(results)) {
    if (!modes.stepSkillsOnly) console.log(`   ${tool}: agileflow synced → ${r.skillDir}`);
    if (!modes.skillSyncOnly) console.log(`   ${tool}: ${r.written.length} doorplate skills`);
    if (r.legacyRemoved?.length) console.log(`   ${tool}: removed ${r.legacyRemoved.length} legacy file(s)`);
  }
  if (removed.length) console.log(`   pruned: ${removed.map((p) => path.basename(p)).join(', ')}`);
  console.log('');
}
