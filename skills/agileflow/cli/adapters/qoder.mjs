/**
 * Qoder IDE / CLI 适配：用户 ~/.qoder/skills 或项目 .qoder/skills
 * @see https://docs.qoder.com/extensions/skills
 */
import { installHost, pruneHostDoorplates } from './_install.mjs';

/**
 * @param {Omit<import('./_install.mjs').InstallHostOpts, 'hostId'>} opts
 */
export function installQoder(opts) {
  return installHost({ ...opts, hostId: 'qoder' });
}

/**
 * @param {string} installRoot
 * @param {import('./_host.mjs').InstallScope} scope
 * @param {Set<string>} keepIds
 */
export function pruneQoderDoorplates(installRoot, scope, keepIds) {
  return pruneHostDoorplates(installRoot, 'qoder', scope, keepIds);
}
