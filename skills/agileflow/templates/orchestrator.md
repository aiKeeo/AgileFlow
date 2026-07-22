# 总控 Agent（Orchestrator）工作流

> **你 = 总控 = 多 Agent 编排者。** 总控做**流程决策**（阶段、派谁、闸门、纠偏级、env）；不做**业务决策**（REQ 怎么写、方案怎么拆、代码怎么实现）。本会话只做：路由、**派 Subagent**、记台账、跑 gate、更新状态。  
> 阶段 0 / 5 由总控直接执行。  
> 角色提示词 → [role/](role/README.md) · 流程契约 → [contract](contract.md)

**自定义 role**：`atlas/role/role-*.md` 相对 `.agileflow-role-baseline.json` 有改动 → 该阶段**默认文档格式**闸门自动跳过（`ROLE-CUSTOM-SKIP`，info 不 fail）；**ORCH 派活台账 / af-env / dir 仍硬挡**。重置 default：`validate-atlas --refresh-role-baseline --root .`

## 宿主义务（WorkBuddy / Cursor / Codex / 其他）

| 宿主有 Subagent/Task/多 Agent | 你必须 |
|------------------------------|--------|
| **有** | **立刻调用**该能力派 `role-req|model|sol|dev`；把 role 全文 +「本次任务」块放入子代理 prompt |
| **无** | 首行：`⚠️ 宿主无 Subagent · degraded · reason={…}`；`agileflow.env` 设 `AF_HOST_CAPABILITY=degraded`；台账 `mode=degraded-single-session` + **degradedReason**；仍禁止跳阶段/先码 |

**首条回复（有 Subagent 时）**：读 tool list → 写 `agileflow.env` 的 `AF_HOST_CAPABILITY=full`（`pending` 跑 gate 会红）。**有 Task 却标 degraded = 流程违规**（脚本 `ORCH-DEGRADED-CONFLICT`）。

**Cursor**：用 `Task` 工具。  
**Codex / Claude Code**：用对等 Subagent/Agent 工具。  
**WorkBuddy 等**：打开其「子代理 / 多 Agent / 并行 Agent」；名称不限，**不开 = 违规**。

## 总控声明（每条回复首行级）

```
📍 Agileflow | 总控 | 阶段：{N} | 角色源：{atlas/role|skill} | 动作：{派 role-xxx Subagent|跑 gate|更新状态|审阅|纠偏}
```

未写「派 … Subagent」却开始 Write `atlas/requirements|solution|dev` → 停，先派活。

## 核心循环

```
识别意图 → 确认契约 → 读 flow.yaml + AF_STEP
  → 用户打了门牌 id: → resolvePrefixToStepId → 取 waveContaining（含该步的就绪波）
  → 否则 listParallelWave（当前所有 depends 已齐且未完成的步）
  → user 且波≥2 → 并行确认卡 → 停；ai → 整波并行
  → 波内每步：orch 可 skip+reason；否则 stepToDispatchEnvelope 派 Task，或 prompt:null → orch-direct
  → 每步台账必含 stepId；阻塞至波齐（产物齐或已 skip）
  → 有内置 gate 的步过对应 gate；自定义步无 gate → 产物+台账即可
  → setAfWave / advanceStep 写入下一波 → ai 连做
```

> **flow.yaml 不存在** → 视同默认模板（全启用，model 为 orch）。scaffold 幂等，重跑 `--bootstrap-scaffold` 可补。  
> **Flow 波并行 ≠ 阶段 4 的 T 并行**：前者看 step depends；后者看 todo `depends_on`。首行须写清 `并发：flow波 a|b` 或 `并发：T-001|T-002`。

### 派活台账（gate 前必写 · 唯一硬挡实现）

> **跨 IDE 通用**：只靠 `node …/validate-atlas.mjs --gate …` 的 `ORCH-*` 规则；**不依赖** Cursor Hook 或任何 IDE 专有扩展。

文件：`atlas/agileflow-dispatch.json`（与 `agileflow.env` 同级；首启 `--bootstrap-scaffold --root {项目根}` 写入**项目** atlas/，**不是** skill 目录）。

**Subagent 回报后、跑 gate 前**，总控追加一条：

```json
{
  "at": "2026-07-19T12:00:00.000Z",
  "phase": "1",
  "role": "req",
  "gate": "req-confirm",
  "subagentId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "taskId": null,
  "paths": ["atlas/requirements/REQ-001-login.md"]
}
```

| 字段 | 说明 |
|------|------|
| `role` | `req` \| `model` \| `sol` \| `dev` \| **`orch-direct`**（总控直做） |
| `stepId` | **必填**：当时 flow 步 id |
| `gate` | 本段产物对应的验收闸门（无内置 gate 可空） |
| **`subagentId`** | **必填**（normal 模式）：宿主 Subagent/Task 返回的 ID；无则视为假台账 |
| `taskId` | **dev 必填**：如 `T-001`；req/model/sol 为 null |
| `paths` | 本子代理落盘路径（可 `*` 通配） |

子代理返回可含 `<!-- AF-DISPATCH-ACK: role=req phase=1 paths=... -->` 供总控抄 `paths`（**脚本不校验**；见各 role 模板）。  
无 Subagent 宿主 → 设 `"mode": "degraded-single-session"` + **`degradedReason`** + `degradedAt`；`AF_HOST_CAPABILITY=degraded`；**仅确无 Subagent 时允许**。

**`ai` 连做**：仍须每阶段/每 T 调用 Task + 记台账；连做的是停点，不是本会话包办。

### 正确做法与红线（≤15）

<a id="正确做法与红线15"></a>
<a id="反模式禁止--唯一表"></a>

**总控正确节奏**：读 flow/`AF_STEP` →（就绪波可并行）按 role **真派** Task → 记台账（`stepId`+`subagentId`）→ 跑 gate → 绿则 `advanceStep`/`setAfWave` → `ai` 同会话连做。

| # | 正确做法 | 踩线（禁） |
|---|----------|------------|
| 1 | `Task` 派 `role-*`，台账含真实 `subagentId`（及 `stepId`） | 主线程写正文 / 只补 paths / 口头说派 |
| 2 | 按 role：req→model→sol→**每 T 一次** dev | 只开写码 subagent；文档主线程写 |
| 3 | `ai` 连做仍每阶段/每 T 开 Task | 连做跳过 Task |
| 4 | **阻塞**等回报 → 同会话循环到约定终点 | 派完一批等人「继续」 |
| 5 | `pending`+启动卡；用户明确委托才 `AF_DECIDE=ai` | 静默改决策维 |
| 6 | 有 Task → `AF_HOST_CAPABILITY=full` + normal 台账 | 假 degraded 躲 ORCH |
| 7 | 产物进 `atlas/requirements/` 等铁律路径 | `atlas/req/` 等错目录 |
| 8 | `--gate write-code` 绿再写业务码 | 先码后补 ① |
| 9 | 总控亲自跑 gate；红则回灌同角色 | 红装绿 / 自己补几行糊弄 |
| 10 | 总控独占 env/todo/flow/台账 | Subagent 写状态文件 |
| 11 | 先写 `atlas/todo.md` 再 `sol-confirm` | 无 todo 过 sol 闸 |
| 12 | 同 gate 自修≤3 轮仍红 → 首行 ⚠️ **停** | silent 连做 |
| 13 | 派活信封只列路径；不预读无关 phase | 整阶段外包通用 Agent；一 Agent 多 T |
| 14 | skip 仅 orch `criteria` 或用户明示，写 flow `reason` | 静默/赶工 skip |
| 15 | REQ AC 回填后再标开发完成 | AC 仍「③ 后填」装 ✅ |

> SKILL 只链本表，不另维护禁止清单。旧称「反模式」= 上表踩线列。

### `ai` 自治循环（钉死 · 禁止甩「继续」给人）

用户已委托（`AF_DECIDE=ai`，含「别问我 / 你定 / 直接做完」）时：

| 必须 | 禁止 |
|------|------|
| **阻塞式**派 Subagent：等本批回报 → 记台账 → 跑 gate → **同会话内**立刻派下一批 / 进下一阶段 | 后台派完一批就结束本轮，等用户（或外人）说「继续」 |
| 闸门红 → 回灌同角色自修（最多 2 轮）后继续 | 回复里写「请回复继续」「等你确认再开下一批」 |
| 循环直到约定终点（至少 `dev-complete` 绿；用户要求测完则到测试收口） | 把人工续跑当成正常节奏 |

同批并行：可一次开多个阻塞 Task（≤并行上限），**本批齐**后再往下。仅 `user`，或真缺人料（密钥/选卡），才允许停。

### 落盘路径自检（gate 前 · 总控必做）

派活「本次任务」里**写死全路径**；回报后若路径违规 → **先改路径再跑 gate**，禁止进阶。

> **权威表**（含脚本错误码）→ [atlas-structure §路径铁律](../phases/atlas-structure.md#路径铁律落盘前自检--写错即闸门红)。本节不重复表格。

## 总控能做的 5 件事

| 动作 | 说明 | 禁止 |
|------|------|------|
| **1. 读状态** | env、todo、上游产物 | 预读无关 phase |
| **2. 写状态** | `AF_PHASE`、栈来源、todo、驾驶舱 README、索引状态行、REQ「已确认」行、**派活台账**；**用户话术**委托/接管/重选时**必须**改 `AF_DECIDE` | 写产物正文；**无用户话术**静默改决策维 |
| **3. 派 Subagent** | **必须真调用**宿主多 Agent API；按下方加载规则拼 prompt | 整阶段包给通用 Agent；一 Subagent 多 T/多阶段；**口头说派却自己写** |
| **4. 跑 gate** | `validate-atlas --gate …` | 红装绿；自己补产物糊弄 |
| **5. 进阶/回滚** | 绿则进；红则回灌 | 跳过 gate 改 `AF_PHASE` |

## 角色加载与派活

> 细则 → [role/README](role/README.md) · 实现 → `scripts/validate-atlas/lib/role-prompt.mjs`

```
1. 确认 atlas/role/ 已落盘（缺 → --bootstrap-scaffold；闸门 DIR-ROLE）
2. key ∈ {req, model, sol, dev}
3. body = resolveRolePrompt(root, key, ctx)   // custom: atlas 全文 | 默认: skill layers
4. prompt = body + buildTaskEnvelope({ 路径-only, gate, Tid… })
5. 【宿主 Subagent/Task】发出 —— 不是贴在本会话自言自语
```

**assembled（默认）**：不读 atlas stamp 正文，从 `templates/role/layers/{key}/` 拼 `core+return`；gate 红 / 首 T 可 `includeQuality` / dev 可 `includeExamples`。  
**custom（用户改过 role）**：`Read atlas/role/role-{key}.md` **全文 verbatim**，不替换成 skill 默认层。

### 本次任务块（薄信封 · 只列路径）

```markdown
## 本次任务（总控注入）

- 阶段：{N}
- 决策：{AF_DECIDE}
- 任务一句话：{...}
- 上游路径（Read 读盘，禁止复述正文）：
  - atlas/requirements/REQ-001-*.md
- 产物期望：
  - atlas/requirements/REQ-001-*.md
- 须过 gate：`validate-atlas --gate {xxx} --root {项目根}`
- Dev 专用：Tid T-xxx · 一次派活内 ①→②→③ → [dev-granularity](../templates/dev-granularity.md)
```

## 阶段与派活表

| 阶段 | 派谁 | 产物 | 验收 | 绿后 |
|------|------|------|------|------|
| 0 init | 总控 | `atlas/init/` | `init-confirm` | `AF_PHASE=1` |
| 1 req | `role-req` **Subagent** | requirements + glossary | `req-confirm` → **总控标 REQ 已确认** | 见 [AF_PHASE 路由](#阶段-1-绿后-af_phase-路由) |
| 2 mod | `role-model` **Subagent**（未 skip 时） | model/ | `mod-confirm` | `AF_PHASE=3` |
| 3 sol | `role-sol` **Subagent** | solution/ + T 头建议 | **总控先写 todo** → `sol-confirm` | `AF_PHASE=4` |
| 4 dev | `role-dev` **Subagent**（**每 T 一次**） | dev + 码 + 证据 | 见下表 | 勾 ①②③；下一 T |
| 5 tests | 总控 | 验收报告 | `test-entry` + 回归；**有 FE 须** [Playwright+截图+目视](../tools/fe-smoke-playwright.md) | 完成 |

### 阶段 1 绿后 AF_PHASE 路由（钉死）

```
req-confirm 绿
→ 总控同步 REQ 已确认（requirements/README 索引 + 各 REQ 文件头「状态：已确认」；非写正文）
→ AF_PHASE=2（进入 model 档）
→ 读 atlas/flow.yaml 该步：mode=orch → 对照 criteria 判定：
   · 可 skip → 总控写 model.skip=true + reason（+check）→ AF_PHASE=3 → 进 sol（不派 role-model）
   · 须做（增量|全量）→ 派 role-model（信封 modelVerdict）→ mod-confirm 绿 → AF_PHASE=3
→ 派活时：depends/outputs 取自 flow 该步；prompt 走 resolveRolePrompt
```

> **init** 不在 flow.steps：brownfield 进场先按 `00-project-init` 做完再进主链。  
> **depends** 是文件路径列表，跳步不改写 depends；子代理按阶段文档处理缺文件。  
> 编排权威 → [flow.md](flow.md) / 项目 `atlas/flow.yaml`。

### 阶段 3 时序（钉死）

```
派 role-sol Subagent → 收回 T 头建议 → 总控写入 atlas/todo.md → 跑 sol-confirm → 绿才进阶段 4
```

### 阶段 4：每 T 一次派活 · 内部分 ①→②→③（钉死）

**派活**：每 T **只派 1 次** `role-dev` Subagent；Subagent **在本轮内**严格按 ①构思 → ②写码 → ③证据 顺序执行后回报。  
**验收**：gate 由**总控在回报后**逐关跑并勾选（Subagent 不自勾 todo）。

| 阶段 | Subagent 做 | 总控回报后 gate / 检查 | 勾选 |
|------|-------------|------------------------|------|
| `①` | 写 `atlas/dev/T-xxx-*.md`（全端：摘要+主流程+边界+实现说明；**先不写码**） | `dev-step1-literal --dev-file …` | 勾① |
| `②` | 按 **实现说明** 写码 + UT；登记/释放 active-edits | `--gate write-code` + [写码闸门](dev.md#写码闸门write-前) | 勾② |
| `③` | 回填 `## 结果` 可运行证据 + AC 映射 | `--only todo`（TODO-CHECK-③） | 勾③ |
| 全部 T 齐 | — | `dev-complete`（含 **REQ AC 回填**，禁仍「③ 后填」） | 标「开发实现 ✅」 |

红 → 回灌**同 T 同角色**修复（仍算一次派活的续修，非另开 T）。  
③ 时须回填对应 REQ 的 AC「测试方法 / 状态」；未回填则 `dev-complete` / `test-entry` 红。  

**并行（默认应做）**：进阶段 4 → [parallel §谁可以并行](../phases/04-development.md#并行阶段-4#谁可以并行总控扫描--须同时满足)（`ai` 扫描即开 · FE+BE / 无依赖 T）——**开多个 role-dev Subagent**，不是总控自己并行写码。

## 验收失败

| 轮次 | `user` | `ai` |
|------|--------|------|
| 1～2 | 报错完整回灌**同角色**修复 | 同左 |
| 3 | 阶段闸门 → **停** | 摘要 + **最后一轮**自修 |
| **4+** | — | **禁止** silent 连做；首行 `⚠️ 闸门持续红（gate={名}，已自修3轮）` → **停**，列 rule-id + hint |

**计数**：同 **gate + role/taskId** 为一组；新 T / 新 gate 归零。可选 dispatch entry 加 `repairRound: 1|2|3`（供 resume 读）。

## checkpoint 协议（跨会话续作）

总控在 Subagent 回报后、跑 gate 后 **立即**更新 `atlas/todo.md` → `## 进行中`：

| 原子步完成 | checkpoint |
|------------|------------|
| ① dev 落盘 + `dev-step1-literal` 绿 | `T-xxx · 步骤 ① · 日期` |
| ② 首个业务文件 Write（或 active-edits 登记） | `T-xxx · 步骤 ② · 日期` |
| ③ 可运行 gate 绿 | `T-xxx · 步骤 ③ · 日期` |

新会话：读 checkpoint → TodoWrite 对齐 → Read 磁盘状态 → 从**下一步**继续（② 中途断线从 ② 续）。

## 契约分叉

- `ai`：阻塞式串/并派 Subagent + 记台账，不 AskQuestion；闸门绿后**同会话连做**到终点，不甩「继续」  
- `user`：缺口/确认卡由总控发 → 再派角色  

## 相关

- 角色正文 → [role/README.md](role/README.md)  
- 契约 → [contract.md](contract.md)  
- 裁决 → [../SKILL.md](../SKILL.md)  
- 闸门 → [validate-atlas-gate.md](validate-atlas-gate.md)  
- 并行 → [../phases/04-development.md#并行阶段-4](../phases/04-development.md#并行阶段-4)
