import path from 'node:path';
import { collectFiles, exists, findLine, readText, rel } from '../fs-utils.mjs';

/**
 * 校验 REQ 文档格式
 */
function validateReqFile(projectRoot, filePath, content, reporter) {
  const relPath = rel(projectRoot, filePath);
  const baseName = path.basename(filePath);

  if (baseName === 'README.md' || baseName.startsWith('_')) return;

  if (!/^REQ-\d+-.+\.md$/.test(baseName)) {
    reporter.add({
      severity: 'warn',
      rule: 'REQ-F001',
      file: relPath,
      message: 'REQ 文件名应为 REQ-XXX-名称.md 格式。',
    });
  }

  if (!/^#\s*\[REQ-\d+\]/m.test(content)) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-F002',
      file: relPath,
      line: findLine(content, /^#/),
      message: 'REQ 标题应为 `# [REQ-XXX] 需求名称` 格式。',
    });
  }

  for (const field of ['- 版本：', '- 状态：']) {
    if (!content.includes(field)) {
      reporter.add({
        severity: 'error',
        rule: 'REQ-F003',
        file: relPath,
        message: `REQ 缺少元数据「${field}」。`,
      });
    }
  }

  if (!/^## 验收标准/m.test(content)) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-F004',
      file: relPath,
      message: 'REQ 缺少「## 验收标准（AC）」节。',
    });
  } else if (!/\|\s*AC ID\s*\|/.test(content)) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-F005',
      file: relPath,
      message: 'AC 节缺少标准表格（须含 AC ID 列）。',
    });
  }

  if (!/^## BDD 验收场景/m.test(content)) {
    reporter.add({
      severity: 'warn',
      rule: 'REQ-F006',
      file: relPath,
      message: '建议含「## BDD 验收场景」与 AC 对照。',
    });
  }
}

/**
 * 校验 UID 文档格式
 */
function validateUidFile(projectRoot, filePath, content, reporter) {
  const relPath = rel(projectRoot, filePath);

  if (!/^#\s*\[UID-\d+\]/m.test(content)) {
    reporter.add({
      severity: 'error',
      rule: 'UID-F001',
      file: relPath,
      message: 'UID 标题应为 `# [UID-XXX] 页面名` 格式。',
    });
  }

  const hasLayoutSection = /### 2\.2|布局线条图/.test(content);
  const hasAsciiArt = /[┌│+--]/.test(content);
  if (hasLayoutSection && !hasAsciiArt) {
    reporter.add({
      severity: 'error',
      rule: 'UID-F002',
      file: relPath,
      message: 'UID 含布局节但缺少 ASCII 线条图（须含 ┌ / │ / +-- 之一）。',
    });
  }

  // 声明了原型图 → 文件须存在
  const protoMatch = content.match(/原型图[：:]\s*`?([^`\n\s]+\.(?:png|jpe?g|webp|gif))`?/i);
  if (protoMatch) {
    const protoRel = protoMatch[1].trim();
    const protoAbs = path.isAbsolute(protoRel)
      ? protoRel
      : path.join(projectRoot, protoRel);
    if (!exists(protoAbs)) {
      reporter.add({
        severity: 'error',
        rule: 'UID-PROTO-001',
        file: relPath,
        message: `UID 声明原型图但文件不存在：${protoRel}（须落盘到 atlas/requirements/ui/prototypes/）`,
      });
    }
  }
}

/**
 * 是否为业务 REQ（非 README / 非 UID）
 * @param {string} filePath
 */
function isBusinessReq(filePath) {
  const base = path.basename(filePath);
  if (base === 'README.md' || base.startsWith('_')) return false;
  if (filePath.includes(`${path.sep}ui${path.sep}`)) return false;
  return true;
}

/**
 * A档：sol-confirm 前至少一份 REQ 已确认/已实现
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 */
export function validateReqConfirmed(projectRoot, reporter) {
  const reqRoot = path.join(projectRoot, 'atlas', 'requirements');
  if (!exists(reqRoot)) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-STATUS-000',
      file: 'atlas/requirements/',
      message: '缺少 requirements/，无法核验 REQ 确认状态。',
    });
    return;
  }

  const reqFiles = collectFiles(reqRoot, '.md').filter(isBusinessReq);
  if (reqFiles.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-STATUS-000',
      file: 'atlas/requirements/',
      message: '无业务 REQ 文件，禁止 sol-confirm。',
    });
    return;
  }

  const confirmed = reqFiles.filter((f) => {
    const content = readText(f) || '';
    return /状态：\s*(已确认|已实现)/.test(content);
  });

  if (confirmed.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-STATUS-001',
      file: 'atlas/requirements/',
      message: '无「状态：已确认/已实现」的 REQ。sol-confirm 前须先确认需求。',
    });
  }
}

/**
 * 校验 atlas/requirements/
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 */
export function validateRequirements(projectRoot, reporter) {
  const reqRoot = path.join(projectRoot, 'atlas', 'requirements');
  if (!exists(reqRoot)) return;

  const mdFiles = collectFiles(reqRoot, '.md');
  for (const file of mdFiles) {
    const content = readText(file);
    if (!content) continue;
    if (file.includes(`${path.sep}ui${path.sep}`)) {
      validateUidFile(projectRoot, file, content, reporter);
    } else {
      validateReqFile(projectRoot, file, content, reporter);
    }
  }
}
