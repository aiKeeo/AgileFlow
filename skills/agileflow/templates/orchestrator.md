# 总控 Agent（Orchestrator）工作流

> **你 = 总控 = 必须开多 Agent。** 禁止本会话独自写完 REQ/model/solution/dev 正文。  
> 总控**禁止**写 REQ/model/solution/dev 正文；只路由、**派 Subagent**、跑 gate、更新状态。  
> 阶段 0 / 5 由总控直接执行。  
> 角色提示词 → [role/](role/README.md) · 流程契约 → [contract](contract.md)

**自定义 role**：`atlas/role/role-*.md` 相对 `.agileflow-role-baseline.json` 有改动 → 该阶段**默认文档格式**闸门自动跳过（`ROLE-CUSTOM-SKIP`，info 不 fail）；**ORCH 派活台账 / af-env / dir 仍硬挡**。重置 default：`validate-atlas --refresh-role-baseline --root .`

## 宿主义务（WorkBuddy / Cursor / Codex / 其他）

| 宿主有 Subagent/Task/多 Agent | 你必须 |
|------------------------------|--------|
| **有** | **立刻调用**该能力派 `role-req|model|sol|dev`；把 role 全文 +「本次任务」块放入子代理 prompt |
| **无** | 首行：`⚠️ 宿主无 Subagent，降级单会话但逐步模拟角色边界`；仍禁止跳阶段/先码；每角色产物写完立刻跑对应 gate |

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
识别意图 → 确认契约 → 选阶段 → 加载 role-{key}.md → 注入本次任务 → 【调用宿主 API】派 Subagent
→ 收回报 → 写入 atlas/agileflow-dispatch.json（派活台账）
→ 路径自检（见下）→ validate-atlas --gate … → 绿：更新 env/todo → 进阶
                                              → 红：报错回灌同角色（最多 2 轮）→ 仍红则阶段闸门（user）
```

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
| `role` | `req` \| `model` \| `sol` \| `dev` |
| `gate` | 本段产物对应的验收闸门 |
| **`subagentId`** | **必填**（normal 模式）：宿主 Subagent/Task 返回的 ID；无则视为假台账 |
| `taskId` | **dev 必填**：如 `T-001`；req/model/sol 为 null |
| `paths` | 本子代理落盘路径（可 `*` 通配） |

子代理返回可含 `<!-- AF-DISPATCH-ACK: role=req phase=1 paths=... -->` 供总控抄 `paths`（**脚本不校验**；见各 role 模板）。  
无 Subagent 宿主 → 设 `"mode": "degraded-single-session"` 并首行声明；**仅无 Subagent 能力时允许，滥用 = 流程违规**。

**`ai` 连做**：仍须每阶段/每 T 调用 Task + 记台账；连做的是停点，不是本会话包办。

### 反模式（禁止）

| 偷懒做法 | 为何违规 | 正确做法 |
|----------|----------|----------|
| 主线程写 REQ/sol/dev 正文，台账只补 paths | ORCH 验的是派活证据，不是文件存在 | 先 `Task` 派 `role-*`，收回报后记 `subagentId` + paths |
| 只开 2 个 subagent 写 backend/frontend，文档自己写 | 写码 subagent ≠ role-dev 替代品；req/sol 仍须 role 派活 | **按 role 派**：req → model → sol → 每 T 一次 dev |
| 「文档要连贯所以总控写更快」 | skill 明文禁止；连贯不是绕过派活的借口 | 同一总控串行派 Subagent，上下文在派活块里写清 |
| `taskId: null` + 通配 paths 糊弄 gate | 脚本现硬挡 `subagentId` / dev `taskId` | 每条 entry 带真实 `subagentId` |

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

> **权威表**（含脚本错误码）→ [00-intent-routing §路径铁律](../phases/00-intent-routing.md#路径铁律落盘前自检--写错即闸门红)。本节不重复表格。

## 总控能做的 5 件事

| 动作 | 说明 | 禁止 |
|------|------|------|
| **1. 读状态** | env、todo、上游产物 | 预读无关 phase |
| **2. 写状态** | `AF_PHASE`、栈来源、todo、驾驶舱 README、索引状态行、REQ「已确认」行、**派活台账**；**用户话术**委托/接管/重选时**必须**改 `AF_DECIDE` | 写产物正文；**无用户话术**静默改决策维 |
| **3. 派 Subagent** | **必须真调用**宿主多 Agent API；按下方加载规则拼 prompt | 整阶段包给通用 Agent；一 Subagent 多 T/多阶段；**口头说派却自己写** |
| **4. 跑 gate** | `validate-atlas --gate …` | 红装绿；自己补产物糊弄 |
| **5. 进阶/回滚** | 绿则进；红则回灌 | 跳过 gate 改 `AF_PHASE` |

## 角色加载与派活

```
1. 确认 atlas/role/ 已落盘（缺 → --bootstrap-scaffold；闸门 DIR-ROLE）
2. key ∈ {req, model, sol, dev}
3. 读 atlas/role/role-{key}.md（项目版，可自定义；禁止绕过改用别的提示词凑合）
4. 文末追加「本次任务」块（见下）
5. 【宿主 Subagent/Task】整段发给子代理 —— 不是贴在本会话自言自语
```

> skill `templates/role/` 仅作首启复制源。派活 **只读** `atlas/role/`。

### 本次任务块（模板）

```markdown
---
## 本次任务（总控注入）

- 阶段：{N}
- 决策：{AF_DECIDE}
- 任务一句话：{...}
- 上游路径：
  - ...
- 产物期望：
  - ...
- 须过 gate：`validate-atlas --gate {xxx} --root {项目根}`
- Dev 专用（仅 key=dev）：
  - Tid：T-xxx
  - 质量：全端主流程+边界+实现说明（完整质量线）+ 摘要五 bullet → [dev-granularity](../templates/dev-granularity.md)
  - **一次派活内须按 ①→②→③ 顺序完整交付**（不可跳步、不可先码后补）
---
```

## 阶段与派活表

| 阶段 | 派谁 | 产物 | 验收 | 绿后 |
|------|------|------|------|------|
| 0 init | 总控 | `atlas/init/` | `init-confirm` | `AF_PHASE=1` |
| 1 req | `role-req` **Subagent** | requirements + glossary | `req-confirm` → **总控标 REQ 已确认** | 见 [AF_PHASE 路由](#阶段-1-绿后-af_phase-路由) |
| 2 mod | `role-model` **Subagent** | model/ 或跳过判定 | `mod-confirm` | `AF_PHASE=3` |
| 3 sol | `role-sol` **Subagent** | solution/ + T 头建议 | **总控先写 todo** → `sol-confirm` | `AF_PHASE=4` |
| 4 dev | `role-dev` **Subagent**（**每 T 一次**） | dev + 码 + 证据 | 见下表 | 勾 ①②③；下一 T |
| 5 tests | 总控 | 验收报告 | `test-entry` + 回归 | 完成 |

### 阶段 1 绿后 AF_PHASE 路由（钉死）

```
req-confirm 绿
→ 总控同步 REQ 已确认（requirements/README 索引 + 各 REQ 文件头「状态：已确认」；非写正文）
→ 总控判定建模（跳过 | 增量 | 全量）：
   · 建议跳过且自检齐 → 派 role-model 落「建模判定：跳过」→ mod-confirm 绿 → AF_PHASE=3 → 可进 sol
   · 须建模（增量/全量）→ AF_PHASE=2 → 派 role-model
   · user → 阶段闸门后再改 AF_PHASE（禁止静默跳）
```

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

| 次数 | 动作 |
|------|------|
| 1～2 | 报错完整回灌**同角色**修复 |
| 3 | `user` 阶段闸门；`ai` 摘要后继续自修 |

## 契约分叉

- `ai`：阻塞式串/并派 Subagent + 记台账，不 AskQuestion；闸门绿后**同会话连做**到终点，不甩「继续」  
- `user`：缺口/确认卡由总控发 → 再派角色  

## 反模式

| 禁止 | 正确 |
|------|------|
| 总控写 REQ/model/sol/dev | **派**对应 role **Subagent** |
| 单会话包办（WorkBuddy 也不例外） | 开多 Agent；无能力则声明降级+分步 gate |
| 整阶段外包给一个通用 Subagent | 1 角色 = 1 阶段或 **1 T**（dev 一次派活内走 ①→②→③） |
| 口头「将派活」却自己 Write | 先调用宿主 Subagent/Task API + 记台账 |
| **`ai` 派完一批等人说「继续」** | **阻塞等回报 → 同会话立刻下一批**，直到交付 |
| gate 红 ORCH-* | 补派 Subagent 或补写 `atlas/agileflow-dispatch.json` 后再跑 gate |
| gate 红自己补几行 | 回灌或阶段闸门 |
| Subagent 说完就信 | 亲自跑 gate |
| Subagent 写 todo/env | 总控独占 |
| sol-confirm 前未写 todo | 先写 todo 再跑 gate |
| 标「开发实现 ✅」但 REQ AC 仍「③ 后填」 | 先回填 AC 再 `dev-complete` |

## 相关

- 角色正文 → [role/README.md](role/README.md)  
- 契约 → [contract.md](contract.md)  
- 裁决 → [../SKILL.md](../SKILL.md)  
- 闸门 → [validate-atlas-gate.md](validate-atlas-gate.md)  
- 并行 → [../phases/04-development.md#并行阶段-4](../phases/04-development.md#并行阶段-4)
