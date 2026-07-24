/**
 * CodeBuddy 适配：用户 ~/.codebuddy/skills 或项目 .codebuddy/skills
 * @see https://www.codebuddy.ai/docs/ide/Features/Skills
 */
import { installHost, pruneHostDoorplates } from './_install.mjs';

/**
 * @param {Omit<import('./_install.mjs').InstallHostOpts, 'hostId'>} opts
 */
export function installCodebuddy(opts) {
  return installHost({ ...opts, hostId: 'codebuddy' });
}

/**
 * @param {string} installRoot
 * @param {import('./_host.mjs').InstallScope} scope
 * @param {Set<string>} keepIds
 */
export function pruneCodebuddyDoorplates(installRoot, scope, keepIds) {
  return pruneHostDoorplates(installRoot, 'codebuddy', scope, keepIds);
}
