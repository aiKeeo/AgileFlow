/**
 * FE/MP/BE 统一叙述五段式 dev 校验（完整质量线 · 防假厚）
 *
 * 厚度规则 SSOT → templates/dev-granularity.md
 */
import { DEV_MIN_STEPS } from '../../phase-spec.mjs';
import { isCodeAnchor } from './steps.mjs';

/** 主流程最多步数 */
export const DEV_MAX_FLOW_STEPS = 8;

/** 边界最少条数 */
export const DEV_MIN_EDGE_ITEMS = 2;

/** 逻辑块「怎么做」最少编号步 */
export const DEV_MIN_HOWTO_STEPS = 2;

/** 空话/假厚禁用词（出现在怎么做里且无真实分支信号则挡） */
const HOITO_FLUFF_RE =
  /处理逻辑|实现功能|完成处理|按需实现|业务逻辑|相关逻辑|等等|TODO|待定/;

/**
 * 可执行语义：分支箭头或明确结局（错误码/抛错/返回/UI 反馈）
 * 禁止只有「1. 处理 2. 返回」而无 → / 码 / 抛 / toast 等
 */
const HOWTO_BRANCH_RE = /→|=>|->|若\s|如果|否则|失败|成功|空\s|null\b/i;
const HOWTO_OUTCOME_RE =
  /\b[45]\d{2,4}\b|AC-\d|throw|抛|toast|return|返回|null\b|空[态值行]|setData|showModal|reLaunch|navigate|回滚|rollback|禁用|release|释放|insert|update|save|find|写入|追加|注册|配置|组装|映射|渲染|校验|调\s*`|调用|exit\s*0|编译/i;

/** BE 端 */
export function isBeDev(filePath, content) {
  if (/-BE\.md$/i.test(filePath || '')) return true;
  if (/端：\*\*BE\*\*/.test(content)) return true;
  return /\[BE\]/i.test((content || '').slice(0, 800));
}

/** FE 或 MP 端 */
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
  return matches.map((m) => {
    const start = m.index ?? 0;
    const rest = implBody.slice(start + m[0].length);
    const next = rest.search(/^###\s+/m);
    const body = (next === -1 ? rest : rest.slice(0, next)).trim();
    return { title: m[1].trim(), body };
  });
}

/**
 * 壳层块：纯配置/样式/标记/纯 DTO/模块装配——允许短「怎么做」
 * @param {string} title
 */
export function isShellImplBlock(title) {
  const t = title || '';
  if (/\.(wxml|wxss|css|scss|less|sass|html|json)\b/i.test(t)) return true;
  if (/\bapp\.json\b/i.test(t)) return true;
  if (/\benums?\./i.test(t)) return true;
  if (/\.(?:module|config)\.(?:ts|js|kt)\b/i.test(t)) return true;
  if (/(?:Dto|Entity|VO|PO|DO)\.(?:java|ts|kt)\b/i.test(t) && !/(Service|Controller|Mapper|Handler|Repository)/i.test(t)) {
    return true;
  }
  return false;
}

/**
 * 抽出所有「怎么做」正文（含「怎么做 — method」多段）
 * @param {string} body
 */
export function extractHowtoText(body) {
  if (!body) return '';
  const parts = [...body.matchAll(/\*\*怎么做(?:\s*[—–\-]\s*[^*]+)?\*\*[：:]?/g)];
  if (parts.length === 0) return '';
  const chunks = [];
  for (let i = 0; i < parts.length; i++) {
    const start = (parts[i].index ?? 0) + parts[i][0].length;
    const end = i + 1 < parts.length ? (parts[i + 1].index ?? body.length) : body.length;
    let slice = body.slice(start, end);
    const nextField = slice.search(/\n-\s*\*\*(?!怎么做)/);
    if (nextField !== -1) slice = slice.slice(0, nextField);
    chunks.push(slice);
  }
  return chunks.join('\n');
}

/**
 * @param {string} body
 */
export function countHowtoNumberedSteps(body) {
  const howto = extractHowtoText(body);
  if (!howto) return 0;
  return (howto.match(/^\s*\d+\.\s+\S/gm) ?? []).length;
}

/**
 * 逻辑块怎么做是否具备可执行语义（防编号凑形）
 * 硬规则：至少一条编号步含「→」分支箭头；且不得只有空话词而无箭头。
 * @param {string} body
 */
export function howtoHasExecutableSemantics(body) {
  const howto = extractHowtoText(body);
  if (!howto.trim()) return false;
  const numbered = howto.match(/^\s*\d+\.\s+.+$/gm) ?? [];
  if (numbered.length < DEV_MIN_HOWTO_STEPS) return false;
  const hasArrow = numbered.some((line) => /→|=>|->/.test(line));
  if (!hasArrow) return false;
  // 整段只有空话、没有结局信号 → 仍挡
  if (HOITO_FLUFF_RE.test(howto) && !HOWTO_OUTCOME_RE.test(howto)) return false;
  return true;
}

/**
 * 从摘要「做」提取应在实现说明出现的标识（反引号路径/类名、CamelCase 组件名）
 * @param {string} doLine
 */
export function extractDoIdentifiers(doLine) {
  if (!doLine) return [];
  const ids = new Set();
  for (const m of doLine.matchAll(/`([^`]+)`/g)) {
    const raw = m[1].trim();
    if (!raw) continue;
    ids.add(raw);
    const base = raw.split('/').pop()?.replace(/\.[a-z]+$/i, '');
    if (base) ids.add(base);
  }
  for (const m of doLine.matchAll(
    /\b([A-Z][A-Za-z0-9]*(?:Service|Controller|Repository|Mapper|Handler|Util|Adapter|Module|Filter)?)\b/g,
  )) {
    ids.add(m[1]);
  }
  for (const m of doLine.matchAll(/\b((?:pages|services|repositories|components|utils)\/[A-Za-z0-9_./-]+)/g)) {
    ids.add(m[1]);
  }
  return [...ids].filter((x) => x.length >= 2);
}

/**
 * @param {string} line
 */
function edgeHooksFlow(line) {
  return /第\s*\d+\s*步/.test(line) || /`[^`]+\([^`]*\)`/.test(line) || /内\s*[：:]/.test(line);
}

/**
 * 边界须写出「怎么处理」（错误码 / UI / 动作），禁止只写场景名
 * @param {string} line
 */
function edgeHasHandling(line) {
  return (
    /→|=>|->/.test(line) ||
    /\b[45]\d{2,4}\b/.test(line) ||
    /toast|return|抛|throw|禁用|引导|空态|modal|不调|不跳|AC-\d/i.test(line)
  );
}

export const NarrativeIssueType = {
  FLOW_ENTRY: 'flowEntry',
  FLOW_MIN: 'flowMin',
  FLOW_MAX: 'flowMax',
  FLOW_ANCHOR: 'flowAnchor',
  EDGE_EMPTY: 'edgeEmpty',
  EDGE_MIN: 'edgeMin',
  EDGE_HOOK: 'edgeHook',
  EDGE_HANDLE: 'edgeHandle',
  IMPL_BLOCK: 'implBlock',
  IMPL_FIELDS: 'implFields',
  IMPL_HOWTO: 'implHowto',
  IMPL_HOWTO_SEM: 'implHowtoSem',
  IMPL_ANCHOR: 'implAnchor',
  DO_ALIGN: 'doAlign',
};

/**
 * @param {string} content
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
      message: `「## 主流程」须至少 ${minSteps} 条编号步骤（当前 ${numberedSteps.length}）。见 dev-granularity §主流程。`,
    });
  } else if (numberedSteps.length > DEV_MAX_FLOW_STEPS) {
    issues.push({
      type: NarrativeIssueType.FLOW_MAX,
      message: `「## 主流程」最多 ${DEV_MAX_FLOW_STEPS} 步（当前 ${numberedSteps.length}）；过长请拆 T 或把细节下沉到实现说明。`,
    });
  }

  if (!isCodeAnchor(flowBody)) {
    issues.push({
      type: NarrativeIssueType.FLOW_ANCHOR,
      message: '「## 主流程」须含代码落点（`handler()` / `Service.method` / `path/`）。',
    });
  }

  const edgeBody = extractDevSectionBody(content, '## 边界') ?? '';
  const edgeItems = edgeBody.match(/^-\s+\S.+$/gm) ?? [];
  if (edgeItems.length === 0) {
    issues.push({
      type: NarrativeIssueType.EDGE_EMPTY,
      message: '「## 边界」须至少一条 `- **场景**：…` 边界说明。',
    });
  } else if (edgeItems.length < DEV_MIN_EDGE_ITEMS) {
    issues.push({
      type: NarrativeIssueType.EDGE_MIN,
      message: `「## 边界」须 ≥${DEV_MIN_EDGE_ITEMS} 条（当前 ${edgeItems.length}）；每条挂「第 N 步」并写清怎么处理。见 dev-granularity §边界。`,
    });
  } else {
    const hooked = edgeItems.filter((line) => edgeHooksFlow(line));
    if (hooked.length < DEV_MIN_EDGE_ITEMS) {
      issues.push({
        type: NarrativeIssueType.EDGE_HOOK,
        message:
          '「## 边界」每条须挂钩主流程：写「第 N 步 …」或 `` `handler()` 内 …``。禁止「注意错误处理」空话。',
      });
    }
    const handled = edgeItems.filter((line) => edgeHasHandling(line));
    if (handled.length < DEV_MIN_EDGE_ITEMS) {
      issues.push({
        type: NarrativeIssueType.EDGE_HANDLE,
        message:
          '「## 边界」每条须写清怎么处理（`→` 错误码 / toast / return / 空态等）。禁止只写场景名。见 dev-granularity §边界。',
      });
    }
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
    const label = block.title.slice(0, 40);
    if (!/\*\*目的\*\*/.test(block.body)) {
      issues.push({
        type: NarrativeIssueType.IMPL_FIELDS,
        message: `实现说明块「${label}」须含 **目的**。`,
      });
    }
    if (!/\*\*做什么\*\*/.test(block.body)) {
      issues.push({
        type: NarrativeIssueType.IMPL_FIELDS,
        message: `实现说明块「${label}」须含 **做什么**（方法/职责索引）。`,
      });
    }
    if (!/\*\*怎么做/.test(block.body)) {
      issues.push({
        type: NarrativeIssueType.IMPL_FIELDS,
        message: `实现说明块「${label}」须含 **怎么做**（逻辑块编号 ≥${DEV_MIN_HOWTO_STEPS}，且含 → 分支或错误码/返回/toast）。`,
      });
    } else if (!isShellImplBlock(block.title)) {
      const howtoCount = countHowtoNumberedSteps(block.body);
      if (howtoCount < DEV_MIN_HOWTO_STEPS) {
        issues.push({
          type: NarrativeIssueType.IMPL_HOWTO,
          message: `实现说明块「${label}」为逻辑块：**怎么做** 须 ≥${DEV_MIN_HOWTO_STEPS} 条编号步骤。壳层(wxml/json/css/Dto)可一行。`,
        });
      } else if (!howtoHasExecutableSemantics(block.body)) {
        issues.push({
          type: NarrativeIssueType.IMPL_HOWTO_SEM,
          message: `实现说明块「${label}」怎么做假厚：每条逻辑块须有编号步含「条件 → 动作」（箭头 →）。禁止「1.处理逻辑 2.返回结果」。见 dev-granularity §实现说明。`,
        });
      }
    }
  }

  if (!isCodeAnchor(implBody)) {
    issues.push({
      type: NarrativeIssueType.IMPL_ANCHOR,
      message: '「## 实现说明」须含代码落点（`path/` / `Class.method`）。',
    });
  }

  // 摘要「做」↔ 实现说明标题对齐（至少命中一个标识）
  const summary = extractDevSectionBody(content, '## 摘要') ?? '';
  const doMatch = summary.match(/-\s*\*\*做\*\*[：:]\s*(.+)/);
  if (doMatch && newChangeBlocks.length >= 1) {
    const ids = extractDoIdentifiers(doMatch[1]);
    if (ids.length >= 1) {
      const titleBlob = newChangeBlocks.map((b) => b.title).join('\n');
      const hit = ids.some((id) => titleBlob.toLowerCase().includes(id.toLowerCase()));
      if (!hit) {
        issues.push({
          type: NarrativeIssueType.DO_ALIGN,
          message: `摘要「做」点名的类/路径（如 ${ids.slice(0, 3).join('、')}）须在「## 实现说明」的 ### 标题中出现至少一处。`,
        });
      }
    }
  }

  return issues;
}
