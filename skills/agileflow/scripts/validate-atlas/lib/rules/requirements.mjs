import path from 'node:path';
import { collectFiles, exists, findLine, readText, rel } from '../fs-utils.mjs';

/** 状态枚举（元数据行） */
const STATUS_ENUM = /^(草稿|已确认|变更中|已实现|已废弃)$/;

/** 观测面枚举 */
const OBSERVE_ENUM = /^(API|UI|规则|人工)$/;

/** AC 状态列白名单 */
const AC_STATUS_OK = /^(⬜|✅|PASS|FAIL|BLOCKED|（③\s*后填）|\(③\s*后填\))$/i;

/** AC 表必须列（表头别名） */
const AC_REQUIRED_COLS = [
  { key: 'id', aliases: ['ac id', 'acid', 'ac'] },
  { key: 'scene', aliases: ['场景', 'scene'] },
  { key: 'given', aliases: ['given'] },
  { key: 'when', aliases: ['when'] },
  { key: 'then', aliases: ['then', 'then（可断言）', 'then(可断言)'] },
  { key: 'observe', aliases: ['观测面'] },
  { key: 'method', aliases: ['ac 测试方法', '测试方法', 'ac测试方法'] },
  { key: 'status', aliases: ['状态', 'status'] },
];

/**
 * 是否为空壳/占位符文本
 * @param {string} text
 */
function isPlaceholder(text) {
  const t = String(text ?? '').trim();
  if (!t) return true;
  if (/^[—\-–—/·.…]+$/.test(t)) return true;
  if (/^(N\/A|n\/a|null|none|xxx|占位|待填|稍后|TODO|TBD|示例|例子|……|\.\.\.)$/i.test(t)) return true;
  if (/^[…\.．]{2,}$/.test(t)) return true;
  return false;
}

/**
 * 取 Markdown ## 节正文（到下一 ## 为止）
 * @param {string} content
 * @param {RegExp} headingRe
 */
function extractSection(content, headingRe) {
  const match = content.match(headingRe);
  if (!match || match.index === undefined) return null;
  const rest = content.slice(match.index + match[0].length);
  const next = rest.search(/^##\s/m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

/**
 * 按 | 拆单元格（去掉首尾空段）
 * @param {string} line
 */
function splitCells(line) {
  const raw = line.trim();
  if (!raw.startsWith('|')) return [];
  return raw
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

/**
 * 是否为 Markdown 表分隔线（|---|---|）
 * @param {string} line
 * @param {number} expectedCols
 */
function isSeparatorLine(line, expectedCols) {
  const cells = splitCells(line);
  if (cells.length === 0) return false;
  if (expectedCols > 0 && cells.length !== expectedCols) return false;
  return cells.every((c) => /^:?-{3,}:?$/.test(c));
}

/**
 * 解析 AC Markdown 表：表头 + 分隔线 + 数据行
 * @param {string} section
 * @returns {{ ok: boolean, error?: string, header?: string[], colIndex?: Record<string, number>, rows?: { id: string, cells: string[], line: string }[] }}
 */
function parseAcMarkdownTable(section) {
  const lines = section.split('\n');
  let headerIdx = -1;
  /** @type {string[]} */
  let headerCells = [];

  for (let i = 0; i < lines.length; i++) {
    const cells = splitCells(lines[i]);
    if (cells.length >= 3 && /ac\s*id/i.test(cells.join(' '))) {
      headerIdx = i;
      headerCells = cells;
      break;
    }
  }

  if (headerIdx < 0) {
    return { ok: false, error: 'REQ-AC-表头' };
  }

  const sepLine = lines[headerIdx + 1];
  if (!sepLine || !isSeparatorLine(sepLine, headerCells.length)) {
    return { ok: false, error: 'REQ-AC-分隔线' };
  }

  /** @type {Record<string, number>} */
  const colIndex = {};
  for (const def of AC_REQUIRED_COLS) {
    const idx = headerCells.findIndex((h) =>
      def.aliases.some((a) => h.toLowerCase().replace(/\s+/g, ' ').includes(a)),
    );
    if (idx < 0) {
      return { ok: false, error: 'REQ-AC-表头', missing: def.key };
    }
    colIndex[def.key] = idx;
  }

  /** @type {{ id: string, cells: string[], line: string }[]} */
  const rows = [];
  for (let i = headerIdx + 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith('|')) {
      if (line.trim() === '' || line.trim().startsWith('#')) break;
      continue;
    }
    if (isSeparatorLine(line, 0)) continue;
    const cells = splitCells(line);
    if (cells.length === 0) continue;
    const idCell = cells[colIndex.id] || cells[0] || '';
    if (!/^AC-\d{3}-\d{2}$/i.test(idCell)) continue;
    rows.push({ id: idCell, cells, line });
  }

  return { ok: true, header: headerCells, colIndex, rows };
}

/**
 * 校验范围内/范围外实质内容
 * @param {string} scopeBody
 * @param {string} relPath
 * @param {import('../reporter.mjs').Reporter} reporter
 */
function validateScopeContent(scopeBody, relPath, reporter) {
  const inMatch = scopeBody.match(/范围内[：:]\s*(.+)/);
  const outMatch = scopeBody.match(/范围外[：:]\s*(.+)/);
  if (!inMatch || isPlaceholder(inMatch[1])) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-SCOPE',
      file: relPath,
      message: '「## 范围提示」须含非空「范围内：…」（禁止占位符）。',
    });
  }
  if (!outMatch || isPlaceholder(outMatch[1])) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-SCOPE',
      file: relPath,
      message: '「## 范围提示」须含非空「范围外：…」（禁止占位符）。',
    });
  }
}

/**
 * 校验元数据版本/状态有值且合法
 * @param {string} content
 * @param {string} relPath
 * @param {import('../reporter.mjs').Reporter} reporter
 */
function validateMetaFields(content, relPath, reporter) {
  const ver = content.match(/-\s*版本[：:]\s*(\S+)/);
  if (!ver || isPlaceholder(ver[1])) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-F003',
      file: relPath,
      message: 'REQ 须含「- 版本：」且冒号后有实质值（如 1.0）。',
    });
  }

  const st = content.match(/-\s*状态[：:]\s*(\S+)/);
  if (!st || isPlaceholder(st[1])) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-F003',
      file: relPath,
      message: 'REQ 须含「- 状态：」且冒号后有实质值。',
    });
  } else if (!STATUS_ENUM.test(st[1].trim())) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-F003',
      file: relPath,
      message: `状态「${st[1]}」非法；只能是：草稿|已确认|变更中|已实现|已废弃。`,
    });
  }
}

/**
 * 校验 AC 表结构与单元格内容
 * @param {string} acSection
 * @param {string} relPath
 * @param {import('../reporter.mjs').Reporter} reporter
 */
function validateAcTableStrict(acSection, relPath, reporter) {
  const parsed = parseAcMarkdownTable(acSection);
  if (!parsed.ok) {
    if (parsed.error === 'REQ-AC-分隔线') {
      reporter.add({
        severity: 'error',
        rule: 'REQ-AC-分隔线',
        file: relPath,
        message:
          'AC 表头下一行必须是 Markdown 分隔线（如 `|---|---|…|`），列数与表头一致；省略分隔线一律失败。',
      });
      return;
    }
    reporter.add({
      severity: 'error',
      rule: 'REQ-AC-表头',
      file: relPath,
      message:
        'AC 表头须含完整列：AC ID · 场景 · Given · When · Then · 观测面 · AC 测试方法 · 状态。',
    });
    return;
  }

  const { header, colIndex, rows } = parsed;
  const colCount = header.length;

  if (!rows || rows.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-AC-空表',
      file: relPath,
      message: 'AC 表须至少含一条数据行（如 `AC-001-01`）。',
    });
    return;
  }

  for (const row of rows) {
    if (row.cells.length !== colCount) {
      reporter.add({
        severity: 'error',
        rule: 'REQ-AC-列对齐',
        file: relPath,
        message: `${row.id} 行列数 ${row.cells.length} ≠ 表头 ${colCount}；禁止少列/多列。`,
      });
      continue;
    }

    const requiredKeys = ['scene', 'given', 'when', 'then', 'observe'];
    for (const key of requiredKeys) {
      const cell = row.cells[colIndex[key]] ?? '';
      if (isPlaceholder(cell)) {
        reporter.add({
          severity: 'error',
          rule: 'REQ-AC-空单元格',
          file: relPath,
          message: `${row.id} 的「${key}」列为空或占位符；须填实质内容。`,
        });
      }
    }

    const observe = (row.cells[colIndex.observe] ?? '').trim();
    if (observe && !isPlaceholder(observe) && !OBSERVE_ENUM.test(observe)) {
      reporter.add({
        severity: 'error',
        rule: 'REQ-AC-观测面值',
        file: relPath,
        message: `${row.id} 观测面「${observe}」非法；只能是 API|UI|规则|人工。`,
      });
    }

    const status = (row.cells[colIndex.status] ?? '').trim();
    if (status && !isPlaceholder(status) && !AC_STATUS_OK.test(status)) {
      reporter.add({
        severity: 'error',
        rule: 'REQ-AC-状态值',
        file: relPath,
        message: `${row.id} 状态「${status}」非法；允许：⬜|✅|PASS|FAIL|BLOCKED|（③ 后填）。`,
      });
    }
  }
}

/**
 * 校验 REQ 文档格式（最严谨：结构+内容+Markdown 表，全部 error 硬挡）
 */
function validateReqFile(projectRoot, filePath, content, reporter) {
  const relPath = rel(projectRoot, filePath);
  const baseName = path.basename(filePath);

  if (baseName === 'README.md' || baseName.startsWith('_')) return;

  // —— 文件名 ——
  const fileIdMatch = baseName.match(/^(REQ-\d+)-.+\.md$/);
  if (!fileIdMatch) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-F001',
      file: relPath,
      message: 'REQ 文件名必须为 REQ-XXX-名称.md（须含名称后缀，禁止 REQ-001.md）。',
    });
  }

  // —— 标题：必须有实质名称（禁止 \s 跨行把下一节当名称）——
  const titleMatch = content.match(/^#\s*\[(REQ-\d+)\][ \t]+(\S[^\r\n]*)$/m);
  const titleName = titleMatch ? titleMatch[2].trim() : '';
  if (!titleMatch || isPlaceholder(titleName)) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-F002',
      file: relPath,
      line: findLine(content, /^#/),
      message: 'REQ 标题须为 `# [REQ-XXX] 需求名称`（方括号后必须有实质名称，且不得换行续写）。',
    });
  } else if (fileIdMatch && fileIdMatch[1] !== titleMatch[1]) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-F-ID对齐',
      file: relPath,
      message: `文件名 ID「${fileIdMatch[1]}」与标题「${titleMatch[1]}」不一致。`,
    });
  }

  // —— 元数据 ——
  validateMetaFields(content, relPath, reporter);

  // —— 范围提示 ——
  const scopeBody = extractSection(content, /^##\s*范围提示/m);
  if (!scopeBody) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-SCOPE',
      file: relPath,
      message: 'REQ 须含「## 范围提示」节（范围内/范围外，供 sol 提炼边界）。',
    });
  } else {
    validateScopeContent(scopeBody, relPath, reporter);
  }

  // —— 验收标准 + Markdown 表 ——
  const acSection = extractSection(content, /^##\s*验收标准/m);
  if (!acSection) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-F004',
      file: relPath,
      message: 'REQ 缺少「## 验收标准（AC）」节。',
    });
  } else {
    validateAcTableStrict(acSection, relPath, reporter);
  }

  // —— 正文过短 ——
  const compact = content.replace(/\s/g, '');
  if (compact.length < 200) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-BODY-过短',
      file: relPath,
      message: `REQ 正文过短（去空白后 ${compact.length} < 200）；禁止只有标题+空表。`,
    });
  }

  // —— 占位符（必填区） ——
  const requiredBlob = [
    scopeBody || '',
    acSection || '',
    titleMatch ? titleMatch[2] : '',
  ].join('\n');
  if (/……|待填|\bTODO\b|\bTBD\b|占位|(^|\s)示例(\s|$)|(^|\s)xxx(\s|$)/i.test(requiredBlob)) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-PLACEHOLDER',
      file: relPath,
      message: '必填区禁止占位符（…… / 待填 / TODO / 示例 / xxx / 占位）。',
    });
  }

  // —— 禁止 BDD 双写 ——
  if (/^##\s*BDD\s*验收场景/m.test(content)) {
    reporter.add({
      severity: 'error',
      rule: 'REQ-F006',
      file: relPath,
      message: '禁止双写「## BDD 验收场景」→ 合并进 AC 表（AC 表即 BDD）。',
    });
  }

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
 * 是否为需校验的 UID 文档
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

  if (!/^#\s*\[UID-\d+\]\s+\S/m.test(content)) {
    reporter.add({
      severity: 'error',
      rule: 'UID-F001',
      file: relPath,
      message: 'UID 标题应为 `# [UID-XXX] 页面名` 格式（须有实质名称）。',
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

  const protoMatches = [...content.matchAll(/原型图[：:]\s*`?([^`\n\s]+\.(?:png|jpe?g|webp|gif))`?/gi)];
  for (const protoMatch of protoMatches) {
    const protoRel = protoMatch[1].trim();
    const protoAbs = path.isAbsolute(protoRel) ? protoRel : path.join(projectRoot, protoRel);
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
 * sol-confirm 前至少一份 REQ 已确认/已实现
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
    const text = readText(f) || '';
    return /状态：\s*(已确认|已实现)/.test(text);
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
      const text = readText(file) || '';
      const m = text.match(/状态：\s*(\S+)/);
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
 * 是否已在 todo 声称开发/测试完成
 * @param {string} projectRoot
 */
function todoClaimsDevOrTestDone(projectRoot) {
  const todo = readText(path.join(projectRoot, 'atlas', 'todo.md')) || '';
  return (
    /开发实现\s*✅/.test(todo) ||
    /^\s*-\s+\[[xX]\].*开发实现/m.test(todo) ||
    /测试验收\s*✅/.test(todo) ||
    /^\s*-\s+\[[xX]\].*测试验收/m.test(todo)
  );
}

/**
 * AC「测试方法」不得仍是「（③ 后填）」
 * - 默认：仅当 todo 已标开发/测试完成时检查（write-code 全链）
 * - force：dev-complete / test-entry 收口闸门无条件检查（禁止未回填却进收口）
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ force?: boolean }} [opts]
 */
export function validateReqAcBackfill(projectRoot, reporter, opts = {}) {
  if (!opts.force && !todoClaimsDevOrTestDone(projectRoot)) return;

  const reqRoot = path.join(projectRoot, 'atlas', 'requirements');
  if (!exists(reqRoot)) return;

  const reason = opts.force
    ? '收口闸门（dev-complete/test-entry）要求 AC 已回填'
    : '流程进度已标开发/测试完成';

  for (const file of collectFiles(reqRoot, '.md')) {
    if (file.includes(`${path.sep}ui${path.sep}`)) continue;
    if (!/^REQ-\d+-.+\.md$/.test(path.basename(file))) continue;
    const text = readText(file) || '';
    const acRows = [...text.matchAll(/^\|\s*AC-\d+/gm)];
    if (acRows.length === 0) continue;
    const pending = (text.match(/（③\s*后填）/g) || []).length;
    if (pending >= Math.ceil(acRows.length / 2)) {
      reporter.add({
        severity: 'error',
        rule: 'REQ-AC-未回填',
        file: rel(projectRoot, file),
        message: `${reason}，但 AC 表仍有 ${pending}/${acRows.length} 条「（③ 后填）」——须回填 AC 测试方法与状态。`,
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
