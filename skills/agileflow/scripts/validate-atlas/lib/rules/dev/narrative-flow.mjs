/**
 * FE/MP/BE 统一叙述五段式 dev 校验
 */
import { DEV_MIN_STEPS } from '../../phase-spec.mjs';
import { isCodeAnchor } from './steps.mjs';

/** BE 端 dev 文件 */
export function isBeDev(filePath, content) {
  if (/-BE\.md$/i.test(filePath || '')) return true;
  if (/端：\*\*BE\*\*/.test(content)) return true;
  return /\[BE\]/i.test((content || '').slice(0, 800));
}

/** FE 或 MP 端 dev 文件 */
export function isFeOrMpDev(filePath, content) {
  if (/-(?:FE|MP)\.md$/i.test(filePath || '')) return true;
  if (/端：\*\*(?:FE|MP)\*\*/.test(content)) return true;
  return /\[(?:FE|MP)\]/i.test((content || '').slice(0, 800));
}

function headingRegex(heading) {
  const esc = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${esc}(?:\\s|$|#|[（(：:])`, 'm');
}

/**
 * @param {string} content
 * @param {string} heading
 */
export function extractDevSectionBody(content, heading) {
  const regex = headingRegex(heading);
  const match = content.match(regex);
  if (!match || match.index === undefined) return null;
  const rest = content.slice(match.index + match[0].length);
  const next = rest.search(/^## /m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

/**
 * @param {string} implBody
 * @returns {Array<{ title: string, body: string }>}
 */
function parseImplBlocks(implBody) {
  if (!implBody) return [];
  const matches = [...implBody.matchAll(/^###\s+(.+)$/gm)];
  return matches.map((m, i) => {
    const start = m.index ?? 0;
    const rest = implBody.slice(start + m[0].length);
    const next = rest.search(/^###\s+/m);
    const body = (next === -1 ? rest : rest.slice(0, next)).trim();
    return { title: m[1].trim(), body };
  });
}

export const NarrativeIssueType = {
  FLOW_ENTRY: 'flowEntry',
  FLOW_MIN: 'flowMin',
  FLOW_ANCHOR: 'flowAnchor',
  EDGE_EMPTY: 'edgeEmpty',
  IMPL_BLOCK: 'implBlock',
  IMPL_FIELDS: 'implFields',
  IMPL_ANCHOR: 'implAnchor',
};

/**
 * @param {string} content - 全文
 * @returns {Array<{ type: string, message: string }>}
 */
export function validateNarrativeFlow(content) {
  const issues = [];
  const minSteps = DEV_MIN_STEPS;

  const flowBody = extractDevSectionBody(content, '## 主流程') ?? '';
  if (!/>\s*入口[：:]\s*\S/m.test(flowBody)) {
    issues.push({
      type: NarrativeIssueType.FLOW_ENTRY,
      message: '「## 主流程」须以 `> 入口：…` 声明触发事件。',
    });
  }

  const numberedSteps = flowBody.match(/^\d+\.\s+\S/gm) ?? [];
  if (numberedSteps.length < minSteps) {
    issues.push({
      type: NarrativeIssueType.FLOW_MIN,
      message: `「## 主流程」须至少 ${minSteps} 条编号步骤（当前 ${numberedSteps.length}）。`,
    });
  }

  if (!isCodeAnchor(flowBody)) {
    issues.push({
      type: NarrativeIssueType.FLOW_ANCHOR,
      message: '「## 主流程」须含代码落点（`handler()` / `Service.method` / `path/`）。',
    });
  }

  const edgeBody = extractDevSectionBody(content, '## 边界') ?? '';
  if (!/^-\s+\S/m.test(edgeBody)) {
    issues.push({
      type: NarrativeIssueType.EDGE_EMPTY,
      message: '「## 边界」须至少一条 `- **场景**：…` 边界说明。',
    });
  }

  const implBody = extractDevSectionBody(content, '## 实现说明') ?? '';
  const blocks = parseImplBlocks(implBody);
  const newChangeBlocks = blocks.filter((b) => /【(?:新写|改动)/.test(b.title));

  if (newChangeBlocks.length < 1) {
    issues.push({
      type: NarrativeIssueType.IMPL_BLOCK,
      message: '「## 实现说明」须至少一个 `### … 【新写|改动】` 块。',
    });
  }

  for (const block of newChangeBlocks) {
    if (!/\*\*目的\*\*/.test(block.body)) {
      issues.push({
        type: NarrativeIssueType.IMPL_FIELDS,
        message: `实现说明块「${block.title.slice(0, 40)}」须含 **目的**。`,
      });
    }
    if (!/\*\*(?:做什么|怎么做)\*\*/.test(block.body)) {
      issues.push({
        type: NarrativeIssueType.IMPL_FIELDS,
        message: `实现说明块「${block.title.slice(0, 40)}」须含 **做什么** 或 **怎么做**。`,
      });
    }
  }

  if (!isCodeAnchor(implBody)) {
    issues.push({
      type: NarrativeIssueType.IMPL_ANCHOR,
      message: '「## 实现说明」须含代码落点（`path/` / `Class.method`）。',
    });
  }

  return issues;
}
