import path from 'node:path';
import { collectFiles, exists, readText } from './fs-utils.mjs';
import { isModelingSkipped } from './modeling-skip.mjs';

const ENV_REL = 'atlas/agileflow.env';

const ALLOWED = {
  AF_PHASE: new Set(['0', '1', '2', '3', '4', '5']),
  AF_DECIDE: new Set(['ai', 'user', 'pending']),
  AF_TIER: new Set(['full']),
  AF_STACK_SOURCE: new Set(['pending', 'ai_record', 'askquestion', 'user_said', 'repo']),
};

const REQUIRED_KEYS = Object.keys(ALLOWED);

/**
 * 解析 KEY=VALUE 行（忽略空行与 # 注释）
 * @param {string} raw
 * @returns {Record<string, string>}
 */
export function parseEnvText(raw) {
  /** @type {Record<string, string>} */
  const out = {};
  if (!raw) return out;
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    out[key] = value;
  }
  return out;
}

/**
 * 读取并规范化 agileflow.env
 * @param {string} projectRoot
 * @returns {{ ok: true, state: AfState } | { ok: false, missing: true } | { ok: false, errors: string[] }}
 */
export function loadAfEnv(projectRoot) {
  const filePath = path.join(projectRoot, 'atlas', 'agileflow.env');
  if (!exists(filePath)) {
    return { ok: false, missing: true };
  }
  const raw = readText(filePath) || '';
  const map = parseEnvText(raw);
  /** @type {string[]} */
  const errors = [];

  for (const key of REQUIRED_KEYS) {
    if (!map[key]) {
      errors.push(`缺少 ${key}`);
      continue;
    }
    if (!ALLOWED[key].has(map[key])) {
      errors.push(`${key}=${map[key]} 非法（允许：${[...ALLOWED[key]].join('|')}）`);
    }
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    state: {
      phase: map.AF_PHASE,
      decide: /** @type {'ai'|'user'|'pending'} */ (map.AF_DECIDE),
      tier: /** @type {'full'} */ ('full'),
      stackSource: /** @type {AfStackSource} */ (map.AF_STACK_SOURCE),
      file: ENV_REL,
    },
  };
}

/**
 * README 是否已确认
 * @param {string} content
 */
function isConfirmed(content) {
  const text = content || '';
  // 优先匹配元数据行；避免正文「确认后标已确认」误伤
  if (/[-*]\s*状态[：:]\s*已确认/.test(text)) return true;
  const head = text.split('\n').slice(0, 40).join('\n');
  return /状态[：:]\s*已确认/.test(head);
}

/**
 * 是否仍有未完成的开发 T（有合法头且非全部父任务勾完的粗检）
 * @param {string} todo
 */
function hasOpenDevTasks(todo) {
  if (!todo) return false;
  const headers = [...todo.matchAll(/^#{3,4}\s+T-\d+/gm)];
  if (headers.length === 0) return false;
  // 任一 ① 未勾 → 仍在开发
  if (/-\s+\[\s\]\s+\*\*①/.test(todo) || /-\s+\[\s\]\s+①/.test(todo)) return true;
  // 有头但看不到已勾完的粗信号 → 视为仍有开放任务
  if (!/-\s+\[[xX]\]\s+\*\*③/.test(todo) && !/-\s+\[[xX]\]\s+③/.test(todo)) return true;
  return /-\s+\[\s\]\s+\*\*[②③]/.test(todo) || /-\s+\[\s\]\s+[②③]/.test(todo);
}

/**
 * 从产物推断「建议阶段」（与 intent-routing 同序，供一致性核对）
 * @param {string} projectRoot
 * @param {boolean} brownfield
 * @returns {string}
 */
export function inferPhaseFromArtifacts(projectRoot, brownfield) {
  const atlas = path.join(projectRoot, 'atlas');
  if (!exists(atlas)) return brownfield ? '0' : '1';

  if (brownfield) {
    const initReadme = readText(path.join(atlas, 'init', 'README.md'));
    if (!initReadme || !isConfirmed(initReadme)) return '0';
  }

  const reqRoot = path.join(atlas, 'requirements');
  const reqFiles = exists(reqRoot)
    ? collectFiles(reqRoot, '.md').filter((f) => {
        const base = path.basename(f);
        return base.startsWith('REQ-') && !f.includes(`${path.sep}ui${path.sep}`);
      })
    : [];
  if (reqFiles.length === 0) return '1';
  const anyReqConfirmed = reqFiles.some((f) => /状态[：:]\s*(已确认|已实现)/.test(readText(f) || ''));
  if (!anyReqConfirmed) return '1';

  // 未正式跳过建模：无 model 或未确认 → 停在 2（堵静默跳过却 infer 到 3）
  if (!isModelingSkipped(projectRoot)) {
    const modelReadme = readText(path.join(atlas, 'model', 'README.md'));
    if (!modelReadme || !isConfirmed(modelReadme)) return '2';
  }

  const solReadme = readText(path.join(atlas, 'solution', 'README.md'));
  if (!solReadme || !isConfirmed(solReadme)) return '3';

  // 方案未拆盘：仍停在 3（堵只确认 README、无 architecture/features 却宣称进开发）
  const archPath = path.join(atlas, 'solution', 'architecture.md');
  if (!exists(archPath)) return '3';
  const featRoot = path.join(atlas, 'solution', 'features');
  const featFiles = exists(featRoot)
    ? collectFiles(featRoot, '.md').filter((f) => /^F-\d+-.+\.md$/.test(path.basename(f)))
    : [];
  if (reqFiles.length > 0 && featFiles.length === 0) return '3';

  const todo = readText(path.join(atlas, 'todo.md')) || '';
  if (hasOpenDevTasks(todo)) return '4';

  const testsReadme = readText(path.join(atlas, 'tests', 'README.md')) || '';
  if (!/\bPASS\b/.test(testsReadme)) return '5';
  return '5';
}

/**
 * 是否应执行「dev 文件数 = T 头数」（仅阶段 4/5）
 * @param {string} phase
 */
export function shouldCheckDevCount(phase) {
  return phase === '4' || phase === '5';
}

/**
 * user 决策下技术栈来源是否已落地
 * @param {string} stackSource
 */
export function isUserStackSettled(stackSource) {
  return stackSource === 'askquestion' || stackSource === 'user_said' || stackSource === 'repo';
}

/**
 * 校验 agileflow.env：存在性、枚举、与产物阶段一致、按决策权卡技术栈来源
 * @param {string} projectRoot
 * @param {import('./reporter.mjs').Reporter} reporter
 * @param {{ brownfield?: boolean, gatePhase?: string, requireEnv?: boolean }} [opts]
 * @returns {AfState | null}
 */
export function validateAfEnv(projectRoot, reporter, opts = {}) {
  const requireEnv = opts.requireEnv !== false;
  const loaded = loadAfEnv(projectRoot);

  if (!loaded.ok && loaded.missing) {
    if (requireEnv) {
      reporter.add({
        severity: 'error',
        rule: 'AF-ENV-000',
        file: ENV_REL,
        message:
          '缺少 atlas/agileflow.env。从 skill templates/agileflow.env 复制后由 AI 维护；不过闸门禁止进阶。',
      });
    }
    return null;
  }

  if (!loaded.ok) {
    for (const msg of loaded.errors || []) {
      reporter.add({
        severity: 'error',
        rule: 'AF-ENV-001',
        file: ENV_REL,
        message: msg,
      });
    }
    return null;
  }

  const state = loaded.state;
  const inferred = inferPhaseFromArtifacts(projectRoot, Boolean(opts.brownfield));
  let blocked = false;

  // 首启契约未确认：禁止用 pending 冒充已问过用户
  if (state.decide === 'pending') {
    blocked = true;
    reporter.add({
      severity: 'error',
      rule: 'AF-ENV-BOOT',
      file: ENV_REL,
      message:
        'AF_DECIDE 仍为 pending → 须先 AskQuestion「流程启动卡」（谁决策），用户选定后再写入 ai|user；禁止静默默认。',
    });
  }

  // 声称阶段必须与产物推断一致（不过 → 报错并写出应改成的值）
  if (state.phase !== inferred) {
    blocked = true;
    reporter.add({
      severity: 'error',
      rule: 'AF-ENV-PHASE',
      file: ENV_REL,
      message: `AF_PHASE=${state.phase} 与产物推断阶段 ${inferred} 不一致 → 更新 AF_PHASE=${inferred} 后再跑闸门（禁止虚假进度）。`,
    });
  }

  // 开发/测试完成闸门：AF_PHASE 必须等于闸门 phase（禁止用 phase=3 混过 dev-complete）
  const gatePhase = opts.gatePhase;
  if (gatePhase === '4' || gatePhase === '5') {
    if (state.phase !== gatePhase) {
      blocked = true;
      reporter.add({
        severity: 'error',
        rule: 'AF-ENV-GATE',
        file: ENV_REL,
        message: `闸门 phase=${gatePhase} 要求 AF_PHASE=${gatePhase}（当前 ${state.phase}）→ 先更新 env 再跑本闸门。`,
      });
    }
  } else if (gatePhase && gatePhase !== 'all' && state.phase !== gatePhase) {
    const claimed = Number(state.phase);
    const gate = Number(gatePhase);
    if (Number.isFinite(claimed) && Number.isFinite(gate) && Math.abs(claimed - gate) >= 2) {
      blocked = true;
      reporter.add({
        severity: 'error',
        rule: 'AF-ENV-GATE',
        file: ENV_REL,
        message: `当前闸门 phase=${gatePhase}，但 AF_PHASE=${state.phase} 跨度过大 → 按序推进并更新 env，禁止跳阶段。`,
      });
    }
  }

  const solExists = exists(path.join(projectRoot, 'atlas', 'solution'));
  if (Number(state.phase) >= 3 && solExists) {
    const stackOk = validateStackSourceForDecide(projectRoot, state, reporter);
    if (!stackOk) blocked = true;
  }

  if (!blocked) {
    reporter.add({
      severity: 'info',
      rule: 'AF-ENV-OK',
      file: ENV_REL,
      message: `af-env phase=${state.phase} decide=${state.decide} tier=${state.tier} stack=${state.stackSource} infer=${inferred}`,
    });
  }

  return state;
}

/**
 * architecture 是否含正式「## 技术栈」节（禁止靠正文偶然出现「技术栈」三字过关）
 * @param {string} arch
 */
function hasTechStackSection(arch) {
  // 不用 \b：JS 默认词界不含中文，会误杀「## 技术栈」
  return /^##\s*技术栈(?:\s|$)/m.test(arch || '');
}

/**
 * 按 AF_DECIDE 卡住技术栈来源（落盘证据，不验 AskQuestion 工具调用）
 * @param {string} projectRoot
 * @param {AfState} state
 * @param {import('./reporter.mjs').Reporter} reporter
 * @returns {boolean} 是否全部通过
 */
function validateStackSourceForDecide(projectRoot, state, reporter) {
  const solReadme = readText(path.join(projectRoot, 'atlas', 'solution', 'README.md')) || '';
  const arch = readText(path.join(projectRoot, 'atlas', 'solution', 'architecture.md')) || '';
  const hasAiRecord =
    /##\s*AI\s*决策记录/.test(solReadme) || /##\s*AI\s*决策记录/.test(arch);
  const hasStackTable = hasTechStackSection(arch);
  let ok = true;

  // pending 由 AF-ENV-BOOT 处理，此处不再冒充 ai 路径
  if (state.decide === 'pending') {
    return true;
  }

  if (state.decide === 'user') {
    if (state.stackSource === 'pending') {
      ok = false;
      reporter.add({
        severity: 'error',
        rule: 'AF-STACK-USER',
        file: ENV_REL,
        message:
          'AF_DECIDE=user 且 AF_STACK_SOURCE=pending → 须先 AskQuestion 技术栈卡（solution-tech），写入 architecture 后设 AF_STACK_SOURCE=askquestion|user_said|repo。',
      });
      return false;
    }
    if (!isUserStackSettled(state.stackSource)) {
      ok = false;
      reporter.add({
        severity: 'error',
        rule: 'AF-STACK-USER',
        file: ENV_REL,
        message: `user 模式下 AF_STACK_SOURCE=${state.stackSource} 非法 → 仅允许 askquestion|user_said|repo（禁止用 ai_record 冒充已问）。`,
      });
    }
    if (!hasStackTable) {
      ok = false;
      reporter.add({
        severity: 'error',
        rule: 'AF-STACK-ARCH',
        file: 'atlas/solution/architecture.md',
        message: 'user 决策已选栈，但 architecture.md 缺少「## 技术栈」节。',
      });
    }
    return ok;
  }

  // AI自主：允许 ai_record | repo | user_said | askquestion（后者须有技术栈节，防空挂）
  if (state.stackSource === 'pending') {
    reporter.add({
      severity: 'error',
      rule: 'AF-STACK-AI',
      file: ENV_REL,
      message:
        'AF_DECIDE=ai 且 AF_STACK_SOURCE=pending → AI 须自定技术栈，写入「AI 决策记录」+ architecture「## 技术栈」，并设 AF_STACK_SOURCE=ai_record。',
    });
    return false;
  }

  const aiAllowed = new Set(['ai_record', 'repo', 'user_said', 'askquestion']);
  if (!aiAllowed.has(state.stackSource)) {
    ok = false;
    reporter.add({
      severity: 'error',
      rule: 'AF-STACK-AI',
      file: ENV_REL,
      message: `ai 模式下 AF_STACK_SOURCE=${state.stackSource} 非法。`,
    });
  }

  if (state.stackSource === 'ai_record' && !hasAiRecord) {
    ok = false;
    reporter.add({
      severity: 'error',
      rule: 'AF-STACK-AI',
      file: 'atlas/solution/README.md',
      message:
        'AF_STACK_SOURCE=ai_record 但 solution/README 或 architecture 无「## AI 决策记录」→ 补决策表（含技术栈+依据）。',
    });
  }

  if (!hasStackTable) {
    ok = false;
    reporter.add({
      severity: 'error',
      rule: 'AF-STACK-ARCH',
      file: 'atlas/solution/architecture.md',
      message: '阶段≥3 须在 architecture.md 含「## 技术栈」节。',
    });
  }

  return ok;
}

/**
 * @typedef {'pending'|'ai_record'|'askquestion'|'user_said'|'repo'} AfStackSource
 */

/**
 * @typedef {Object} AfState
 * @property {string} phase
 * @property {'ai'|'user'|'pending'} decide
 * @property {'full'} tier
 * @property {AfStackSource} stackSource
 * @property {string} file
 */
