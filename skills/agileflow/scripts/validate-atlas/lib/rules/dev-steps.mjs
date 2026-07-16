/**
 * 解析 ## 步骤：流程表（S1…）或 #### 小节
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
    /`[^`]+\([^)]*\)`/.test(text)
  );
}

/**
 * 流程表行：| **S1** | 动作 | 输入→输出 | 注意点 |
 * @param {string} stepsSection
 */
export function collectFlowTableSteps(stepsSection) {
  if (!stepsSection) return [];
  const rows = [];
  const re = /^\|\s*\*{0,2}S(\d+)\*{0,2}\s*\|([^|\n]*)\|([^|\n]*)\|([^|\n]*)\|/gm;
  let m;
  while ((m = re.exec(stepsSection)) !== null) {
    const row = m[0];
    rows.push({
      id: `S${m[1]}`,
      action: m[2].trim(),
      io: m[3].trim(),
      note: m[4].trim(),
      row,
      hasAnchor: isCodeAnchor(row),
    });
  }
  return rows;
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
 * @param {string} stepsSection
 * @returns {{ mode: 'flow'|'hash'|'none', count: number, flow: ReturnType<typeof collectFlowTableSteps>, hash: ReturnType<typeof collectHashStepBlocks> }}
 */
export function resolveDevSteps(stepsSection) {
  const flow = collectFlowTableSteps(stepsSection);
  const hash = collectHashStepBlocks(stepsSection);
  if (flow.length > 0) {
    return { mode: 'flow', count: flow.length, flow, hash };
  }
  if (hash.length > 0) {
    return { mode: 'hash', count: hash.length, flow, hash };
  }
  return { mode: 'none', count: 0, flow, hash };
}
