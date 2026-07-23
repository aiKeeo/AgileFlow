/**
 * 各宿主 skills 根目录：用户级（~）与项目级（--root）
 *
 * Codex 官方：项目/用户均为 `.agents/skills/`；`~/.codex/skills/` 仅 legacy 清理
 */
import os from 'node:os';
import path from 'node:path';

/** @typedef {'cursor'|'claude'|'codex'|'workbuddy'|'qoder'} HostId */
/** @typedef {'user'|'project'} InstallScope */

export const ALL_HOSTS = /** @type {const} */ (['cursor', 'claude', 'codex', 'workbuddy', 'qoder']);

/**
 * @typedef {Object} HostConfig
 * @property {string} label
 * @property {string[]} projectRel skills 相对项目根
 * @property {string[]} userRel skills 相对用户 HOME
 * @property {'cursor'|'claude'} [legacyCommandHost]
 * @property {string[][]} projectLegacySkillRels
 * @property {string[][]} userLegacySkillRels
 */

/** @type {Record<HostId, HostConfig>} */
export const HOSTS = {
  cursor: {
    label: 'Cursor',
    projectRel: ['.cursor', 'skills'],
    userRel: ['.cursor', 'skills'],
    legacyCommandHost: 'cursor',
    projectLegacySkillRels: [],
    userLegacySkillRels: [],
  },
  claude: {
    label: 'Claude Code',
    projectRel: ['.claude', 'skills'],
    userRel: ['.claude', 'skills'],
    legacyCommandHost: 'claude',
    projectLegacySkillRels: [],
    userLegacySkillRels: [],
  },
  codex: {
    label: 'Codex CLI',
    projectRel: ['.agents', 'skills'],
    userRel: ['.agents', 'skills'],
    projectLegacySkillRels: [['.codex', 'skills']],
    userLegacySkillRels: [['.codex', 'skills']],
  },
  workbuddy: {
    label: 'WorkBuddy / CodeBuddy',
    projectRel: ['.codebuddy', 'skills'],
    userRel: ['.codebuddy', 'skills'],
    projectLegacySkillRels: [],
    userLegacySkillRels: [],
  },
  qoder: {
    label: 'Qoder',
    projectRel: ['.qoder', 'skills'],
    userRel: ['.qoder', 'skills'],
    projectLegacySkillRels: [],
    userLegacySkillRels: [],
  },
};

/**
 * @param {string} base
 * @param {string[]} rel
 */
function joinRel(base, rel) {
  return path.join(path.resolve(base), ...rel);
}

/**
 * @param {HostId} hostId
 * @param {InstallScope} scope
 * @param {string} installRoot 项目 init=项目根；用户 init=HOME（仅 project 用）
 */
export function hostSkillsRoot(hostId, scope, installRoot) {
  const host = HOSTS[hostId];
  if (!host) throw new Error(`未知宿主: ${hostId}`);
  const base = scope === 'user' ? os.homedir() : installRoot;
  const rel = scope === 'user' ? host.userRel : host.projectRel;
  return joinRel(base, rel);
}

/**
 * @param {HostId} hostId
 * @param {InstallScope} scope
 * @param {string} installRoot
 */
export function hostAgileflowDir(hostId, scope, installRoot) {
  return path.join(hostSkillsRoot(hostId, scope, installRoot), 'agileflow');
}

/**
 * @param {HostId} hostId
 * @param {InstallScope} scope
 * @param {string} installRoot
 */
export function hostLegacySkillRoots(hostId, scope, installRoot) {
  const host = HOSTS[hostId];
  if (!host) return [];
  const base = scope === 'user' ? os.homedir() : installRoot;
  const lists = scope === 'user' ? host.userLegacySkillRels : host.projectLegacySkillRels;
  return lists.map((rel) => joinRel(base, rel));
}

/**
 * @param {string} tool
 * @returns {tool is HostId}
 */
export function isKnownHost(tool) {
  return tool in HOSTS;
}
