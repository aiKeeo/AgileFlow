import fs from 'node:fs';
import path from 'node:path';

/**
 * 判断路径是否存在
 * @param {string} target
 * @returns {boolean}
 */
export function exists(target) {
  try {
    fs.accessSync(target, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * 读取文本文件，不存在返回 null
 * @param {string} filePath
 * @returns {string | null}
 */
export function readText(filePath) {
  if (!exists(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * 列出目录下文件（不递归）
 * @param {string} dir
 * @returns {string[]}
 */
export function listFiles(dir) {
  if (!exists(dir)) return [];
  return fs.readdirSync(dir).map((name) => path.join(dir, name));
}

/**
 * 递归收集指定扩展名的文件
 * @param {string} root
 * @param {string} [ext] - 如 '.md'
 * @returns {string[]}
 */
export function collectFiles(root, ext = '.md') {
  /** @type {string[]} */
  const results = [];

  if (!exists(root)) return results;

  const walk = (current) => {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (!ext || entry.name.endsWith(ext)) {
        results.push(full);
      }
    }
  };

  walk(root);
  return results;
}

/**
 * 查找内容中第一个匹配的行号
 * @param {string} content
 * @param {RegExp} pattern
 * @returns {number | undefined}
 */
export function findLine(content, pattern) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) return i + 1;
  }
  return undefined;
}

/**
 * 检查内容是否包含模式
 * @param {string} content
 * @param {RegExp | string} pattern
 * @returns {boolean}
 */
export function hasPattern(content, pattern) {
  if (typeof pattern === 'string') return content.includes(pattern);
  return pattern.test(content);
}

/**
 * 相对路径格式化
 * @param {string} root
 * @param {string} filePath
 */
export function rel(root, filePath) {
  return path.relative(root, filePath).replace(/\\/g, '/');
}
