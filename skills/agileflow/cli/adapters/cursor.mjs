/**
 * Cursor 适配：用户 ~/.cursor/skills 或项目 .cursor/skills
 */
import { installHost, pruneHostDoorplates } from './_install.mjs';

/**
 * @param {Omit<import('./_install.mjs').InstallHostOpts, 'hostId'>} opts
 */
export function installCursor(opts) {
  return installHost({ ...opts, hostId: 'cursor' });
}

/**
 * @param {string} installRoot
 * @param {import('./_host.mjs').InstallScope} scope
 * @param {Set<string>} keepIds
 */
export function pruneCursorDoorplates(installRoot, scope, keepIds) {
  return pruneHostDoorplates(installRoot, 'cursor', scope, keepIds);
}

/** @deprecated */
export const pruneCursorCommands = pruneCursorDoorplates;
