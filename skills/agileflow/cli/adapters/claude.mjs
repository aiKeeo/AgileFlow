/**
 * Claude Code 适配
 */
import { installHost, pruneHostDoorplates } from './_install.mjs';

/**
 * @param {Omit<import('./_install.mjs').InstallHostOpts, 'hostId'>} opts
 */
export function installClaude(opts) {
  return installHost({ ...opts, hostId: 'claude' });
}

/**
 * @param {string} installRoot
 * @param {import('./_host.mjs').InstallScope} scope
 * @param {Set<string>} keepIds
 */
export function pruneClaudeDoorplates(installRoot, scope, keepIds) {
  return pruneHostDoorplates(installRoot, 'claude', scope, keepIds);
}

/** @deprecated */
export const pruneClaudeCommands = pruneClaudeDoorplates;
