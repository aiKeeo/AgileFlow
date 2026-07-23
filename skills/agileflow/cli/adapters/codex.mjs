/**
 * Codex CLI 适配：.agents/skills（用户 ~/.agents/skills 或项目内）
 */
import { installHost, pruneHostDoorplates } from './_install.mjs';

/**
 * @param {Omit<import('./_install.mjs').InstallHostOpts, 'hostId'>} opts
 */
export function installCodex(opts) {
  return installHost({ ...opts, hostId: 'codex' });
}

/**
 * @param {string} installRoot
 * @param {import('./_host.mjs').InstallScope} scope
 * @param {Set<string>} keepIds
 */
export function pruneCodexDoorplates(installRoot, scope, keepIds) {
  return pruneHostDoorplates(installRoot, 'codex', scope, keepIds);
}
