/**
 * 解析 ## 步骤 的三种写法：原子步骤表（S1… + 8 字段规格表）、流程表（S1… 5 列）、#### 小节。
 *
 * 原子步骤表（推荐）：每 `#### S1：步骤名` 下跟 `| 字段 | 内容 |` 表，含 8 个必填字段。
 * 流程表（兼容旧）：5 列扁平表 `| 步骤 | 目的 | 动作 | 输入→输出 | 注意点 |`。
 * #### 小节（精简档）：按「用户 / 系统 / 改」三段描述。
 *
 * 所有解析结果都会交给 index.mjs 的 runQualityChecks 做 A 档硬挡判断。
 */

/**
 * 反引号内须含 `.` / `/` / `()`（Class.method / path/ / func()）
 * 禁单单词反引号（如 `Service` / `todo`）——堵假落点
 * @param {string} text
 */
export function isCodeAnchor(text) {
  return (
    /`[^`]*[.][^`]*`/.test(text) ||
    /`[^`]*\/[^`]*`/.test(text) ||
    /`[^`]+([^)]*)`/.test(text)
  );
}

/**
 * 原子步骤表 8 个必填字段
 */
export const ATOM_REQUIRED_FIELDS = [
  '执行角色',
  '触发条件',
  '输入数据',
  '处理逻辑',
  '调用依赖',
  '异常处理',
  '输出数据',
  '状态变更',
];

/**
 * 统计一行 markdown 表格的内容列数（按 | 分割，过滤空单元）。
 * @param {string} line
 */
function countTableColumns(line) {
  return line.split('|').filter((s) => s.trim() !== '').length;
}

/**
 * 检测流程表头，返回预期列数。
 * 表头行：以 | 开头，包含「步骤」，不含 S1 等步骤编号。
 * @param {string} stepsSection
 * @returns {{ cols: 4 | 5 | 0 }}
 */
function detectFlowTableHeader(stepsSection) {
  const lines = stepsSection.split('\n');
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (!trimmed.startsWith('|')) continue;
    if (!line.includes('步骤')) continue;
    if (/\*\*S\d+\*\*/.test(line)) continue; // 数据行不是表头
    const cols = countTableColumns(line);
    if (cols >= 4) return { cols };
  }
  return { cols: 0 };
}

function parseFlowRow5(m) {
  return {
    id: `S${m[1]}`,
    format: 5,
    purpose: m[2].trim(),
    action: m[3].trim(),
    io: m[4].trim(),
    note: m[5].trim(),
    row: m[0],
    hasAnchor: isCodeAnchor(m[0]),
    hasPurpose: m[2].trim().length > 0,
  };
}

function parseFlowRow4(m) {
  return {
    id: `S${m[1]}`,
    format: 4,
    purpose: '',
    action: m[2].trim(),
    io: m[3].trim(),
    note: m[4].trim(),
    row: m[0],
    hasAnchor: isCodeAnchor(m[0]),
    hasPurpose: false,
  };
}

/**
 * 流程表行（5 列，v9.16+）：| **S1** | 目的 | 动作 | 输入→输出 | 注意点 |
 * 兼容旧 4 列（无目的）：| **S1** | 动作 | 输入→输出 | 注意点 |
 *
 * 解析时先按表头声明的列数匹配；数据行与表头列数不一致时，视为 malformed。
 * @param {string} stepsSection
 * @returns {{ rows: Array, malformed: Array }}
 */
export function collectFlowTableSteps(stepsSection) {
  if (!stepsSection) return { rows: [], malformed: [] };

  const header = detectFlowTableHeader(stepsSection);
  const expectedCols = header.cols;
  const rows = [];
  const malformed = [];

  const re5 = /^\|\s*\*{0,2}S(\d+)\*{0,2}\s*\|([^|\n]*)\|([^|\n]*)\|([^|\n]*)\|([^|\n]*)\|/;
  const re4 = /^\|\s*\*{0,2}S(\d+)\*{0,2}\s*\|([^|\n]*)\|([^|\n]*)\|([^|\n]*)\|/;
  const lines = stepsSection.split('\n');

  for (const line of lines) {
    if (!line.trimStart().startsWith('|')) continue;
    if (!/^\|\s*\*{0,2}S\d+\*{0,2}/.test(line.trimStart())) continue; // 只处理第一列是 S1/S2… 的数据行

    const cols = countTableColumns(line);

    if (expectedCols > 0 && cols !== expectedCols) {
      malformed.push({
        row: line.trim(),
        reason: `表头声明 ${expectedCols} 列，数据行为 ${cols} 列；5 列格式：| 步骤 | 目的 | 动作 | 输入→输出 | 注意点 |。`,
      });
      continue;
    }

    if (cols >= 5) {
      const m = line.match(re5);
      if (m) rows.push(parseFlowRow5(m));
    } else if (cols === 4) {
      const m = line.match(re4);
      if (m) rows.push(parseFlowRow4(m));
    } else {
      malformed.push({
        row: line.trim(),
        reason: `数据行列数异常（${cols} 列），仅支持 4 列或 5 列。`,
      });
    }
  }

  rows.sort((a, b) => parseInt(a.id.slice(1)) - parseInt(b.id.slice(1)));
  return { rows, malformed };
}

/**
 * #### 步骤块
 * @param {string} stepsSection
 */
export function collectHashStepBlocks(stepsSection) {
  if (!stepsSection) return [];
  const matches = [...stepsSection.matchAll(/^#### .+$/gm)];
  return matches.map((m) => {
    const start = m.index ?? 0;
    const rest = stepsSection.slice(start + m[0].length);
    const next = rest.search(/^#### /m);
    const body = (next === -1 ? rest : rest.slice(0, next)).trim();
    return { heading: m[0], body };
  });
}

/**
 * 解析原子步骤表中的 | 字段 | 内容 | 行。
 * @param {string} body — #### 块的 body 文本
 * @returns {{ fields: Map<string, string>, hasAtomTable: boolean }}
 */
export function parseAtomFields(body) {
  const fields = new Map();
  const lines = body.split('\n');
  let hasAtomTable = false;

  for (const line of lines) {
    const trimmed = line.trimStart();
    if (!trimmed.startsWith('|')) continue;
    // 跳过表头分隔行 |---|---|
    if (/^\|[-\s|:]+\|?\s*$/.test(trimmed)) continue;
    // 跳过表头行 | 字段 | 内容 |
    if (/字段.*内容/.test(trimmed) && !ATOM_REQUIRED_FIELDS.some((f) => trimmed.includes(f))) {
      hasAtomTable = true;
      continue;
    }
    // 解析 | 执行角色 | xxx | 格式
    const m = trimmed.match(/^\|\s*([^|\n]+?)\s*\|\s*([^|\n]*?)\s*\|/);
    if (!m) continue;
    const fieldName = m[1].trim();
    const fieldValue = m[2].trim();
    // 检查是否是 8 个必填字段之一
    if (ATOM_REQUIRED_FIELDS.includes(fieldName)) {
      fields.set(fieldName, fieldValue);
      hasAtomTable = true;
    }
  }
  return { fields, hasAtomTable };
}

/**
 * 收集原子步骤块：#### 块中含 | 字段 | 内容 | 规格表的。
 * @param {string} stepsSection
 * @returns {Array<{ heading: string, body: string, fields: Map<string, string>, missingFields: string[], hasAnchor: boolean }>}
 */
export function collectAtomStepBlocks(stepsSection) {
  if (!stepsSection) return [];
  const hashBlocks = collectHashStepBlocks(stepsSection);
  const atomBlocks = [];

  for (const block of hashBlocks) {
    const { fields, hasAtomTable } = parseAtomFields(block.body);
    if (!hasAtomTable) continue;

    const missingFields = ATOM_REQUIRED_FIELDS.filter((f) => !fields.has(f));
    // 检查"调用依赖"字段是否含代码落点（"无"及其变体视为合法）
    const depValue = fields.get('调用依赖') || '';
    const hasAnchor = isCodeAnchor(depValue) || /^无[。；,，\s]*(?:外部调用.*)?$/.test(depValue) || /^无外部调用/.test(depValue);

    atomBlocks.push({
      heading: block.heading,
      body: block.body,
      fields,
      missingFields,
      hasAnchor,
    });
  }
  return atomBlocks;
}

/**
 * @param {string} stepsSection
 * @returns {{ mode: 'atom'|'flow'|'hash'|'none', count: number, flow: ReturnType<typeof collectFlowTableSteps>['rows'], hash: ReturnType<typeof collectHashStepBlocks>, atom: ReturnType<typeof collectAtomStepBlocks>, malformed: Array }}
 */
export function resolveDevSteps(stepsSection) {
  const { rows: flow, malformed } = collectFlowTableSteps(stepsSection);
  const atom = collectAtomStepBlocks(stepsSection);
  const hash = collectHashStepBlocks(stepsSection);
  if (atom.length > 0) {
    return { mode: 'atom', count: atom.length, flow, hash, atom, malformed };
  }
  if (flow.length > 0) {
    return { mode: 'flow', count: flow.length, flow, hash, atom, malformed };
  }
  if (hash.length > 0) {
    return { mode: 'hash', count: hash.length, flow, hash, atom, malformed };
  }
  return { mode: 'none', count: 0, flow, hash, atom, malformed };
}
