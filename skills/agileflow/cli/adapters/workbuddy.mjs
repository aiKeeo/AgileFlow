/**
 * WorkBuddy / CodeBuddy 适配
 */
import { installHost, pruneHostDoorplates } from './_install.mjs';

/**
 * @param {Omit<import('./_install.mjs').InstallHostOpts, 'hostId'>} opts
 */
export function installWorkbuddy(opts) {
  return installHost({ ...opts, hostId: 'workbuddy' });
}

/**
 * @param {string} installRoot
 * @param {import('./_host.mjs').InstallScope} scope
 * @param {Set<string>} keepIds
 */
export function pruneWorkbuddyDoorplates(installRoot, scope, keepIds) {
  return pruneHostDoorplates(installRoot, 'workbuddy', scope, keepIds);
}
