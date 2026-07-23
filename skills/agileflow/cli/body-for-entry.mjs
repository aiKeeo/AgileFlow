/**
 * 为 catalog 条目生成 body
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBody, buildCustomBody } from './workflows/_skeleton.mjs';
import { canonicalStepId, isBuiltinId } from './catalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNIPPETS = path.join(__dirname, 'snippets');

/**
 * @param {import('./catalog.mjs').CatalogEntry} entry
 */
function loadL0ForEntry(entry) {
  if (entry.id === 'af') {
    return fs.readFileSync(path.join(SNIPPETS, 'l0-auto-route.md'), 'utf8').trim();
  }
  const map = {
    flow: 'l0-flow.md',
    alias: 'l0-flow.md',
    quick: 'l0-quick.md',
    'pre-flow': 'l0-pre-flow.md',
    routing: 'l0-routing.md',
  };
  const file = map[entry.scope] || 'l0-flow.md';
  return fs.readFileSync(path.join(SNIPPETS, file), 'utf8').trim();
}

/**
 * @param {import('./catalog.mjs').CatalogEntry} entry
 */
export function bodyForEntry(entry) {
  const l0 = loadL0ForEntry(entry);
  if (!isBuiltinId(entry.id)) {
    return buildCustomBody(entry, l0);
  }
  return buildBody({ entry, l0 });
}

export { loadL0ForEntry as loadL0Snippet, canonicalStepId };
