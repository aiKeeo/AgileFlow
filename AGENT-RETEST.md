# AgileFlow · Agent 复测手册

改完 `skills/agileflow` 之后，用真实 Agent 冒烟：看它能不能**只靠 skill 自己跑通**，而不是靠你嘴喂流程。

复测只按 **谁决策** 拆两套。sol/dev 质量线、①②③、可运行证据、AC 回填两边相同；差别只在令柱（问不问人、考官要不要扮用户）。

---

## 你怎么用（一句话）

对当前会话说：

> 按 `AGENT-RETEST.md` 做一次复测，模式 `<ai|user>`。

未指定时默认 `ai`。

---

## 两套区别

| 模式 | 被试开场 | 考官 | 停点期望 | 「继续/答卡」 |
|------|---------|------|---------|--------------|
| **A · ai**（AI 自主） | 「什么都别问我 你定」 | 只开被试 Task | 应自治做到交付 | **算失败**（`GATE_AUTONOMY`） |
| **B · user**（用户决策） | 「我来决策」（**不**写别问我） | 被试 + **user-sim** | 缺口/确认/闸门等须问人 | **不算失败**；sim 逐轮答 |

---

## 总则（两套共用）

### 1. 准备空目录

例如：`~/code/af-retest-<ai|user>-YYYYMMDD`。

### 2. prepare（推荐）

```bash
NODE="/Users/fangtong.nan/Desktop/Cursor.app/Contents/Resources/app/resources/helpers/node"
SKILL="/Users/fangtong.nan/AgileFlow/skills/agileflow"
WORK="<复测项目根>"
MODE="<ai|user>"

$NODE "$SKILL/scripts/agent-retest/prepare.mjs" \
  --skill-root "$SKILL" --work-root "$WORK" --mode "$MODE"
```

把打印出的全文原样发给被试 Task。

### 3. 开被试 Task

- 类型：`generalPurpose`，后台跑
- prompt = prepare 输出（一个字都不要加）

### 4. 打分

```bash
CONTINUES=<人工续跑次数，没有就 0>
USER_SIM_ROUNDS=<user-sim 答卡轮数，ai 模式填 0>

$NODE "$SKILL/scripts/agent-retest/score.mjs" \
  --root "$WORK" --skill-root "$SKILL" \
  --mode "$MODE" --continues "$CONTINUES" --user-sim-rounds "$USER_SIM_ROUNDS"
```

- exit 0 → 过；非 0 → 看 `$WORK/atlas/logs/agent-retest-score.json`
- **靠改被试提示来「测过」= 无效复测**
- 脚本硬检 `AF_DECIDE` 与 mode 一致

### 5. 铁律

| 可以 | 不可以 |
|------|--------|
| 给被试 skill 路径 + 用户原话 + 落盘目录 | 教被试怎么写 ①、怎么过闸门 |
| user 下用 user-sim 答卡续跑 | 答卡时夹带流程教学 |
| 用 `score.mjs --mode …` 收场 | 听 Agent 说「完成了」就算过 |

### 6. 派活台账（ORCH）

正式复测须满足：

- `atlas/agileflow-dispatch.json` 每条 entry 含宿主 Subagent/Task 返回的 **`subagentId`**（非空字符串）
- `role=dev` 的 entry 另须合法 **`taskId`**（如 `T-001`）
- **`degraded-single-session` 禁止**用于正式复测（仅无 Subagent 宿主专项测试可用；滥用 = 流程违规）
- CLI 无法证明 Task 真被调用 → 考官须**人工抽查**会话是否真开 Subagent，而非主线程写盘后补假账

`score.mjs` 的 `ORCH` 项会检 `subagentId` / dev `taskId`；`dev-complete` / `test-entry` 闸门亦做台账溯源审计。

---

## A · ai（AI 自主）

```
请使用本机 AgileFlow skill（目录：`<SKILL>`，入口 `SKILL.md`）执行：

/agileflow 做一个减肥小程序
java21 springboot3.5.5 taro4 +react +vite
什么都别问我 你定

在目录 `<WORK>` 落盘（已有内容可接着做）。严格按该 skill 自行推进，直到开发完毕。
```

中途停等人说「继续」= 失败信号：记 `continues`+1；捞盘 `resume` 只发「继续」；打分 `--mode ai --continues N`。

---

## B · user（用户决策）

```
请使用本机 AgileFlow skill（目录：`<SKILL>`，入口 `SKILL.md`）执行：

/agileflow 做一个减肥小程序
java21 springboot3.5.5 taro4 +react +vite
我来决策

在目录 `<WORK>` 落盘（已有内容可接着做）。严格按该 skill 自行推进，直到开发完毕。
```

**必开 user-sim**（见下）。打分 `--mode user --continues N --user-sim-rounds R`。

---

## user-sim 铁律（仅 user）

| 角色 | Task | 职责 |
|------|------|------|
| **被试** | `generalPurpose` 后台 | skill 路径 + 用户原话 + 落盘目录 |
| **user-sim** | `generalPurpose` | 模仿用户答 AskQuestion / 闸门 |

prompt：`skills/agileflow/tools/agent-retest/USER-SIM.prompt.md`。

每轮：考官转发被试停点原文 → user-sim 只回选项/原话 → 考官 `resume` 被试（不夹带教学）。

可答：启动卡、缺口、确认、技术栈、阶段闸门、并行卡、F 里程碑。  
禁止：教流程、闸门名、atlas。  
剧本：认技术栈；需求/方案「确认继续」；并行「可以并行」；不选「重选契约/暂停」除非记失败。

---

## 和静态测试的关系

- `cd skills/agileflow && npm run test:validate` → fixture / 文档一致性（必跑）
- 本手册 → 真实 Agent 端到端（慢；`ai` / `user` 各跑一套）
