/**
 * 读取本包 package.json（版本 / 包名）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 本 skill / npm 包根目录 */
export const PACKAGE_ROOT = path.resolve(__dirname, '..');

/**
 * @returns {{ name: string, version: string }}
 */
export function readPackageMeta() {
  const raw = fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8');
  const pkg = JSON.parse(raw);
  return { name: pkg.name, version: pkg.version };
}
