#!/usr/bin/env node
/**
 * 一次性：从 monolith role-*.md 拆出 layers/（开发维护用）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..', '..');

const ROLES = ['req', 'model', 'sol', 'dev'];

/**
 * @param {string[]} lines
 * @param {RegExp} re
 */
function findLine(lines, re) {
  return lines.findIndex((l) => re.test(l));
}

/**
 * @param {string[]} lines
 * @param {number} start
 * @param {number} end
 */
function sliceLines(lines, start, end) {
  if (start < 0) return '';
  const endIdx = end >= 0 ? end : lines.length;
  return `${lines.slice(start, endIdx).join('\n').trimEnd()}\n`;
}

/**
 * @param {string} roleKey
 */
function splitRole(roleKey) {
  const srcPath = path.join(skillRoot, 'templates', 'role', `role-${roleKey}.md`);
  const src = fs.readFileSync(srcPath, 'utf8');
  const lines = src.split('\n');

  const i2 = findLine(lines, /^## 2\./);
  const i5 = findLine(lines, /^## 5\./);
  const i6 = findLine(lines, /^## 6\./);
  const i7 = findLine(lines, /^## 7\./);
  const iHard = findLine(lines, /^## 硬禁止/);
  const i9 = findLine(lines, /^## 9\./);
  const iTask = findLine(lines, /^## 本次任务/);

  const personaEnd = i2 >= 0 ? i2 : findLine(lines, /^## 3\./);
  /** @type {string[]} */
  const coreParts = [];
  if (personaEnd > 0) coreParts.push(sliceLines(lines, 0, personaEnd));
  if (i5 >= 0 && i6 >= 0) coreParts.push(sliceLines(lines, i5, i6));
  if (iHard >= 0) {
    const hardEnd = i9 >= 0 ? i9 : iTask >= 0 ? iTask : lines.length;
    coreParts.push(sliceLines(lines, iHard, hardEnd));
  }
  const core = `${coreParts.join('\n\n').trimEnd()}\n`;

  /** @type {string[]} */
  const qualityParts = [];
  if (i2 >= 0 && i5 >= 0) qualityParts.push(sliceLines(lines, i2, i5));
  else if (i2 >= 0 && i6 >= 0) qualityParts.push(sliceLines(lines, i2, i6));
  if (i9 >= 0) {
    const qEnd = iTask >= 0 ? iTask : lines.length;
    qualityParts.push(sliceLines(lines, i9, qEnd));
  }
  const quality = `${qualityParts.join('\n\n').trimEnd()}\n`;

  const ret = i6 >= 0 ? sliceLines(lines, i6, i7 >= 0 ? i7 : iHard >= 0 ? iHard : lines.length) : '';
  const examples = i7 >= 0 && iHard >= 0 ? sliceLines(lines, i7, iHard) : '';

  const outDir = path.join(skillRoot, 'templates', 'role', 'layers', roleKey);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'core.md'), core);
  fs.writeFileSync(path.join(outDir, 'return.md'), ret);
  fs.writeFileSync(path.join(outDir, 'quality.md'), quality);
  if (examples.trim()) fs.writeFileSync(path.join(outDir, 'examples.md'), examples);

  console.log(`${roleKey}: core=${core.length} return=${ret.length} quality=${quality.length} examples=${examples.length}`);
}

for (const roleKey of ROLES) splitRole(roleKey);
