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

  if (!/^##\s*范围提示/m.test(content)) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-SCOPE',
      file: relPath,
      message: 'REQ 须含「## 范围提示」节（范围内/范围外，供 sol 提炼边界）。',
    });
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
  } else {
    // AC 表须含观测面列（API|UI|规则|人工）；颗粒度约定见 ac-guide
    const acHeader = content.match(/\|[^\n]*AC ID[^\n]*\|/);
    if (acHeader && !/观测面/.test(acHeader[0])) {
      reporter.add({
        severity: 'error',
        rule: 'REQ-AC-观测面',
        file: relPath,
        message: 'AC 表须含「观测面」列（API|UI|规则|人工）。',
      });
    }
    if (acHeader && (!/Given/i.test(acHeader[0]) || !/When/i.test(acHeader[0]) || !/Then/i.test(acHeader[0]))) {
      reporter.add({
        severity: 'error',
        rule: 'REQ-AC-GWT',
        file: relPath,
        message: 'AC 表须含 Given / When / Then 列。',
      });
    }
  }

  if (/^## BDD 验收场景/m.test(content)) {
    reporter.add({
      severity: 'warn',
      rule: 'REQ-F006',
      file: relPath,
      message: '请合并进 AC 表，勿双写「## BDD 验收场景」（AC 表即 BDD）。',
    });
  }

  // REQ 声明了 UID 链接/编号 → 文件须存在（堵空链勾确认）
  validateReqUidLinks(projectRoot, filePath, content, reporter);
}

/**
 * REQ 内 UID 引用不得断链
 * @param {string} projectRoot
 * @param {string} filePath
 * @param {string} content
 * @param {import('../reporter.mjs').Reporter} reporter
 */
function validateReqUidLinks(projectRoot, filePath, content, reporter) {
  const relPath = rel(projectRoot, filePath);
  const reqDir = path.dirname(filePath);
  /** @type {Set<string>} */
  const declared = new Set();

  for (const m of content.matchAll(/\]\(([^)]*ui\/UID-\d+[^)]*\.md)\)/gi)) {
    declared.add(m[1].trim());
  }
  for (const m of content.matchAll(/`?(atlas\/requirements\/ui\/UID-\d+[^`\s]*\.md)`?/gi)) {
    declared.add(m[1].trim());
  }
  // 界面描述表：| UID-001 | … | ui/UID-001-….md |
  for (const m of content.matchAll(/\|\s*(UID-\d+)\s*\|[^|\n]*\|\s*\[?`?([^|\n\]]+\.md)`?\]?/g)) {
    const link = m[2].trim();
    if (/UID-\d+/i.test(link) || /ui\//i.test(link)) declared.add(link);
  }

  for (const link of declared) {
    const cleaned = link.replace(/^\.\//, '').replace(/^\.\.\//, '');
    let abs;
    if (cleaned.startsWith('atlas/')) {
      abs = path.join(projectRoot, cleaned);
    } else if (path.isAbsolute(cleaned)) {
      abs = cleaned;
    } else {
      abs = path.resolve(reqDir, cleaned);
    }
    if (!exists(abs)) {
      reporter.add({
        severity: 'error',
        rule: 'REQ-UID-断链',
        file: relPath,
        message: `REQ 引用 UID「${link}」但文件不存在——禁止空链标已确认。`,
      });
    }
  }
}

/**
 * 是否为需校验的 UID 文档（跳过索引/草稿，与 REQ 侧一致）
 * @param {string} filePath
 */
function isUidDoc(filePath) {
  const base = path.basename(filePath);
  if (base === 'README.md' || base.startsWith('_')) return false;
  return true;
}

/**
 * 校验 UID 文档格式
 */
function validateUidFile(projectRoot, filePath, content, reporter) {
  if (!isUidDoc(filePath)) return;

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

  // 声明了原型图 → 文件须存在（一个 UID 可声明多张，逐张校验）
  const protoMatches = [...content.matchAll(/原型图[：:]\s*`?([^`\n\s]+\.(?:png|jpe?g|webp|gif))`?/gi)];
  for (const protoMatch of protoMatches) {
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
 * 索引 README 状态 vs 子文件状态（状态权威 = README）
 */
function validateReqIndexStatusConsistency(projectRoot, reporter) {
  const indexPath = path.join(projectRoot, 'atlas', 'requirements', 'README.md');
  if (!exists(indexPath)) return;
  const index = readText(indexPath) || '';
  const rowRe = /\|\s*(REQ-\d+)\s*\|[^|]*\|[^|]*\|\s*([^|]+)\s*\|/g;
  let match;
  while ((match = rowRe.exec(index)) !== null) {
    const reqId = match[1];
    const indexStatus = match[2].trim();
    if (!/草稿|已确认|变更中|已实现|已废弃/.test(indexStatus)) continue;
    const files = collectFiles(path.join(projectRoot, 'atlas', 'requirements'), '.md').filter(
      (f) => path.basename(f).startsWith(reqId) && isBusinessReq(f),
    );
    for (const file of files) {
      const content = readText(file) || '';
      const m = content.match(/状态：\s*(\S+)/);
      if (!m) continue;
      const fileStatus = m[1].trim();
      if (fileStatus !== indexStatus && !indexStatus.includes(fileStatus)) {
        reporter.add({
          severity: 'error',
          rule: 'REQ-STATUS-INDEX',
          file: rel(projectRoot, file),
          message: `状态与 requirements/README 不一致：文件「${fileStatus}」vs 索引「${indexStatus}」。以索引为准并同步。`,
        });
      }
    }
  }
}

/**
 * 开发/测试已声称完成时，AC「测试方法」不得仍全是「（③ 后填）」
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 */
function validateReqAcBackfill(projectRoot, reporter) {
  const todo = readText(path.join(projectRoot, 'atlas', 'todo.md')) || '';
  const claimed =
    /开发实现\s*✅/.test(todo) ||
    /^\s*-\s+\[[xX]\].*开发实现/m.test(todo) ||
    /测试验收\s*✅/.test(todo) ||
    /^\s*-\s+\[[xX]\].*测试验收/m.test(todo);
  if (!claimed) return;

  const reqRoot = path.join(projectRoot, 'atlas', 'requirements');
  if (!exists(reqRoot)) return;

  for (const file of collectFiles(reqRoot, '.md')) {
    if (file.includes(`${path.sep}ui${path.sep}`)) continue;
    if (!/^REQ-\d+-.+\.md$/.test(path.basename(file))) continue;
    const content = readText(file) || '';
    const acRows = [...content.matchAll(/^\|\s*AC-\d+/gm)];
    if (acRows.length === 0) continue;
    const pending = (content.match(/（③\s*后填）/g) || []).length;
    if (pending >= Math.ceil(acRows.length / 2)) {
      reporter.add({
        severity: 'error',
        rule: 'REQ-AC-未回填',
        file: rel(projectRoot, file),
        message: `流程进度已标开发/测试完成，但 AC 表仍有 ${pending}/${acRows.length} 条「（③ 后填）」——须回填 AC 测试方法与状态。`,
      });
    }
  }
}

/**
 * 校验 atlas/requirements/
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ templateMode?: boolean }} [opts]
 */
export function validateRequirements(projectRoot, reporter, opts = {}) {
  if (opts.templateMode) return;
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
  validateReqAcBackfill(projectRoot, reporter);
  validateReqIndexStatusConsistency(projectRoot, reporter);
}
