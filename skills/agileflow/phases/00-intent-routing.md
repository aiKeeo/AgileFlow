# 入口意图识别与阶段路由

> **启用 Agileflow 时**，必须先执行本章，再读取**一个**对应 `phases/xx.md` + 该 phase **显式链接**的 `templates/*`。禁止预读其他 phase；禁止跳过识别直接写代码或写文档。

## 何时启用

**一条判定**：用户要你**交付/改动可运行产物**（产品、功能、模块、接口…——**用用户原话理解，不套关键词表**）→ **启用**；先 `atlas/` 流程，**禁止直接 Write 业务源码**。

| 启用 | 不启用 |
|------|--------|
| 用户用自然语言描述要做啥（具体业务由用户说） | 纯解释、答疑、概念问题 |
| `@agileflow`、`继续 agileflow` | 单文件 ≤20 行、hotfix、明确说不走流程 |
| 前缀 `init:` `req:` `mod:` `sol:` `dev:` `tests:` | code review |

首条回复：`📍 Agileflow …` + AskQuestion（决策权或需求澄清）→ **停止**。细则见各 phase，本章不重复列动词/形态清单。

---

## 目录前缀（最高优先级）

> **记法**：前缀 = `atlas/` 子目录缩写 + `:`。与文件夹一一对应。

| 前缀 | 目录 | 阶段 |
|------|------|------|
| **`init:`** | `atlas/init/` | **0 项目盘点（仅 brownfield）** |
| `req:` | `atlas/requirements/` | 1 需求 |
| `mod:` | `atlas/model/` | 2 建模（按需） |
| `sol:` | `atlas/solution/` | 3 方案 |
| `dev:` | `atlas/dev/` | 4 开发 |
| `tests:` | `atlas/tests/` | 5 验收 |

兼容：`test:`→`tests:`，`model:`→`mod:`（旧写法，不必记）。

**格式**：`sol: 设计退款` → 进 solution/ 方案设计。

带前缀即启用 Agileflow；每阶段结束 AskQuestion → 停止。

**任务编排（默认串行）**：阶段 3 写 todo 开发任务 + 功能依赖表；阶段 4 **先 TodoWrite 展开每个 T 的①**，再主 Agent 逐项构思落盘→开发→AC验收。「全部开发」= 展开清单后串行连做，**≠** 启 Task/Subagent 批量写码。用户显式「并行开发 / 同时开发 FE+BE / 多 subagent」时 → [parallel-orchestration.md](parallel-orchestration.md)（须每 T 已有合规①）。

## §atlas/ 结构

> **命名**：根目录 **`atlas/`**（项目图谱）— 存放 Agileflow 全流程交付文档；前缀 `init:`/`req:`/… 对应其下子目录，**勿**再用 `spec/`、`specs/` 等旧名。

```
atlas/
├── init/                      # init: 仅 brownfield
│   ├── codebase/p1-{端}.md    # 模式 B 默认：§一~§四
│   ├── p0-business.md … data/
├── solution/
│   ├── architecture.md
│   └── code-patterns-{端}.md  # greenfield 模式 B 🌱
├── conventions/               # 模式 A 可选；默认不建
├── requirements/ … model/ … dev/ … tests/
├── todo.md · humanTodo.md · active-edits.md（按需）
```

- 各目录下 `temp/` 放临时稿（见 §TEMP）
- 无独立前缀：`todo.md` / `humanTodo.md` / `active-edits.md` 随 req/sol/dev 阶段更新

---

## init 判定（brownfield / greenfield）

> 细则：[00-project-init.md](00-project-init.md)

| 类型 | 判定（任一） | init |
|------|--------------|------|
| **brownfield** | 已有业务源码 / migration / 可运行应用；用户说接手、二次开发 | **须 init** |
| **greenfield** | 从零、新系统、脚手架、完整交付（无既有业务代码）；空仓库新建 | **禁止 init** |

**greenfield** → 跳过阶段 0，从阶段 1 `req:` 开始。  
**brownfield 且 `atlas/init/` 不存在或未确认** → 进 `dev:`/`sol:` 前先 **init:** 或自动进入阶段 0。

REQ/model **设计阶段**只改 `model/`，**不**改 init；**实现落地后**按 [init refresh](00-project-init.md#增量-refreshreq-开发完毕后) 增量更新。

### init 自动触发（brownfield）

满足 **全部** → 建议阶段 **0**：

1. brownfield 判定通过
2. `atlas/init/` 不存在 **或** `README.md` 状态非「已确认」
3. 用户意图为 `dev:` / `sol:` / 「继续 agileflow」且含写码/方案，或首次接手

**不自动 init**：greenfield；豁免；用户明确「跳过 init / 熟悉项目」。

### §dev 入口分支

| 情况 | 动作 |
|------|------|
| 有已确认 REQ + solution | 正常阶段 4 三步序（构思落盘→开发→AC验收） |
| 用户只要「写 dev 思路 / 构思落盘」 | 仅 ① → **AskQuestion 是否进入 ② 写码** → 停止 |
| **无关联 REQ**（小工具、重构、探活） | 用 **`temp/` 子目录**，见 §TEMP |
| solution 未确认但用户 insist | AskQuestion：补 sol:（**新系统/多 T/有 API·DB → 禁止** `dev/temp/` 与快速通道） |

---

## §TEMP 临时目录

与已有 REQ/F/API **无明确关联**的工作 → 放各目录 **`temp/` 子目录**，与正式文档物理隔离。

| 目录 | 路径 | 命名 | 示例 |
|------|------|------|------|
| 需求 | `atlas/requirements/temp/` | `{NNN}-{简述}.md` | `001-缓存优化.md` |
| 建模 | `atlas/model/temp/` | `{NNN}-{简述}.md` | `001-草稿模型.md` |
| 方案 | `atlas/solution/features/temp/` | `{NNN}-{简述}.md` | `001-临时功能.md` |
| 开发 | `atlas/dev/temp/` | `{NNN}-{简述}-{FE\|BE\|FULL}.md` | `001-探活接口-BE.md` |
| AC 测试 | `test/ac/temp/` | `temp{NNN}_*` | `temp001_smoke` |

**规则**：
- NNN 三位递增；各 `temp/README.md`（或父目录 README §临时区）登记序号与说明
- 状态标 **临时**；转正 → 移出 `temp/` 合并进正式 REQ/F/dev，或删除
- 仍遵守 ① 构思落盘 → ② 按 **五** 写码 → ③ 对照 REQ 验收 AC（② 可精简但 **五** 仍须逐步）；纯 refactor 无 AC 变更可豁免 ③
- **禁止**在正式目录用 `TEMP-` 前缀命名（统一用 `temp/` 子目录）

---

## §建模按需判定（阶段 2 非必经）

**默认跳过阶段 2**，直接进入阶段 3，当**全部**满足：

- 已有 `atlas/model/README.md` 为 **已确认**
- 本次工作**不引入**新聚合根/实体/值对象
- **不改变**实体间关系（基数、归属、外键）
- **不新增/修改**领域规则、状态机、存储结构

**必须进入或增量更新 model/**，当**任一**命中：

- 新实体或新聚合根
- 实体关系变化（1:N→N:M、新增外键、拆分表）
- 新业务规则/状态机/不变量
- 持久化层结构变化（新表、改字段、改索引）
- 首个 REQ 且尚无 model/（首次需完整建模）

**增量更新**：只改受影响的 `domain-model.md` / `entity-relations.md` 等章节，不必重写全套；改完 AskQuestion 确认 → 停止。

**阶段前缀 `mod:`**（或旧 `model:`）：强制进入阶段 2；AskQuestion 提供跳过/增量/全量。

---

## 识别顺序（固定 4 步）

```
① 豁免判定 → ② 读取项目状态 → ③ 解析用户意图 → ④ 前置校验 & 确认 → 进入目标阶段
```

---

## ① 豁免判定（最先做）

命中下表 → 走豁免，**不进入流程**；未命中 → 继续 ②。

| 豁免类型 | 触发条件 | 执行方式 | AskQuestion |
|----------|----------|----------|-------------|
| **纯问答** | 仅解释，无代码/文档变更 | 直接回答 | ❌ |
| **微型改动** | 单文件 ≤20 行；无 API/DB/权限/支付变更 | 改代码 → **L1+L3** → 更新 todo | ❌ |
| **Hotfix** | 用户说 hotfix / 紧急修复 | **L1+L3**；核心路径 **L1–L3+L5 冒烟** | ❌ |
| **快速通道** | 用户说快速改 / 不走流程 | 微型改动 + 不写 REQ/model/solution | ❌ |

**快速通道边界**：「不走流程」仅微型改动。MVP/多模块/API·DB → **禁止** temp/快速通道。  
「可压缩」**仅指** AskQuestion 次数与快速模式下二四六七可省略，**不指**把五压成摘要或空壳标题。

**豁免边界（任一命中走完整流程）**：API/DB/权限、支付/敏感数据、多模块、用户要求完整流程、跨 2+ 文件或 >20 行、**用户说只看成品/直接开发但 scope 为新系统 MVP**。

豁免只更新 `atlas/todo.md`；不生成 REQ/model/solution 文档。L1–L5 见 [l1-l5-pipeline.md](../templates/l1-l5-pipeline.md)。

---

## 模式判定（快速 / 严谨）

**权威** → [flow-modes.md](../templates/flow-modes.md)（多模块/DB/权限 → **强制严谨**；「全部做」只催进度不切模式）。

进入阶段后首行声明 `模式：快速|严谨` 与 `决策：用户|AI自主`；无法判断 → AskQuestion。

---

## ② 读取项目状态（判断「当前在哪」）

按顺序检查仓库与 `atlas/`（不存在则视为**全新项目**）：

| 检查项 | 路径 | 状态含义 |
|--------|------|----------|
| **项目盘点** | `atlas/init/README.md` | 不存在 → brownfield 须阶段 0；greenfield 忽略；「已确认」→ 可进后续 |
| 流程进度 | `atlas/todo.md` →「流程进度」区 | 哪几阶段已 ✅ |
| 需求 | `atlas/requirements/REQ-*.md` | 有文件但「草稿」→ 阶段 1 未完成；「已确认」→ 可进阶段 2 |
| 建模 | `atlas/model/README.md` | 不存在或「草稿」→ 阶段 2；「已确认」→ 可进阶段 3 |
| 方案 | `atlas/solution/README.md` | 不存在或「草稿」→ 阶段 3；「已确认」且开发任务未清空 → 阶段 4 |
| **写法锚点** | `init/codebase/p1-*.md` 或 `solution/code-patterns-*.md` | 模式 B 默认；dev 对齐 §三 |
| 开发 | `atlas/todo.md` →「开发任务」| 有未完成任务 → 阶段 4；全部 ✅ 且测试未 ✅ → 阶段 5 |
| 验收 | `atlas/tests/README.md` | 已有 PASS → 交付已完成，问用户要维护还是新需求 |

**推导「建议阶段」** = 第一个未完成的前置阶段（流水线顺序 1→2→3→4→5）。

示例：
- 有已确认 REQ、model 未确认 → 建议阶段 **2**
- solution 已确认、开发任务剩 3 项 → 建议阶段 **4**
- todo 显示「开发实现 ✅、测试验收 ⬜」→ 建议阶段 **5**

---

## ③ 解析意图（看用户想干什么，不靠关键词表）

| 优先级 | 规则 | 目标 |
|--------|------|------|
| 1 | 有目录前缀 | 以前缀为准（见上表） |
| 2 | 用户指定阶段（「写需求」「别开发只出方案」） | 该阶段 |
| 3 | 有 `atlas/` 且说继续/下一步 | ② 建议阶段 |
| 4 | **用户描述要做的东西**（任何具体业务表述） | **阶段 1** |
| 5 | 说写码/实现但无 REQ/solution | 退回阶段 3 或 `dev/temp/` |
| 6 | 改已确认 REQ | [change-management](change-management.md) |
| 7 | 说不清 | AskQuestion 选阶段 |

**催进度** ≠ 跳过流程：详见 [SKILL 反模式表](../SKILL.md)。仍逐 T ①→②→③；禁止合并 todo；多模块强制严谨。

### 决策委派话术（→ [stage-delegation.md](../templates/stage-delegation.md)）

| 用户说 | 动作 |
|--------|------|
| 这阶段你定 / 后面都你定 / 不审了继续 | ai_decide / global / skip_review |
| 这阶段我来 | user_decide |

### 用户描述需求（最常见入口）

用户**用原话**说要做啥 → **阶段 1** → 决策权或需求 AskQuestion → 停止 → 下条落盘 REQ。**禁止**因「描述已够细」跳过 AskQuestion 或直接写码。

### 硬规则：不可跳阶段（豁免与前缀单阶段模式除外）

| 目标阶段 | 最低前置条件 | 不满足时 |
|----------|--------------|----------|
| **0 init** | brownfield 判定 | greenfield → 跳过，进阶段 1 |
| 1 需求 | greenfield **或** brownfield 且 init 已确认（或本轮将完成 init） | brownfield → 阶段 0 |
| 2 建模 | ≥1 个 REQ「已确认」 | 退回阶段 1 或 AskQuestion |
| 3 方案 | model **已确认或按需跳过**（见 [建模按需判定](#建模按需判定阶段-2-非必经)） | 无 model 且需建模 → 阶段 2；否则 AskQuestion |
| 4 开发 | solution 已确认 **且** brownfield 时 init 已确认 **或** TEMP/dev 快速通道 | 退回阶段 3 / init / TEMP |
| 5 测试 | 开发任务已完成（或用户明确只验部分） | 提示先开发或 AskQuestion |

**按需跳过建模**：阶段 3 前置不要求 model 已确认，但 Agent 须在首行声明标注 `建模：跳过/增量/全量`。

用户**明确要求跳过**（如「快速通道 / 不要文档直接写」）→ 走 [① 豁免判定](#①-豁免判定最先做)，不算跳阶段。

### 意图与状态不一致时

**必须 AskQuestion**，不可 silent 选阶段：

```
title: "Agileflow 阶段确认"
questions:
  - id: "target_phase"
    prompt: "检测到你希望【{用户意图}】，当前项目进度：{流程进度摘要}。\n请选择本次要从哪个阶段开始："
    options:
      - { id: "phase_0", label: "阶段 0：项目盘点（init，brownfield）" }
      - { id: "phase_1", label: "阶段 1：需求澄清" }
      - { id: "phase_2", label: "阶段 2：数据建模" }
      - { id: "phase_3", label: "阶段 3：方案设计（sol:）" }
      - { id: "phase_4", label: "阶段 4：开发实现" }
      - { id: "phase_5", label: "阶段 5：测试验收" }
      - { id: "full_flow", label: "从阶段 1 走完整流程" }
      - { id: "resume", label: "从当前进度继续（建议：阶段 {N}）" }
```

- 仅当用户意图**唯一且前置已满足**时，可省略此卡片，但须在回复**首行声明**：
  `📍 Agileflow | 模式：{快速/严谨} | 阶段：{N}-{名称} | 依据：{用户原话或 todo 状态}`

### 全新项目 / 用户发来需求

用户描述想法、发 PRD → **阶段 1** → **决策权卡**（用户已说「你定」或 todo 全局 AI自主 可跳过）→ 按 [01-requirement](01-requirement.md) 分支落盘。

**用户回答后下一条回复**：**必须**执行 [01-requirement 第 2 步](01-requirement.md#第-2-步生成需求草稿仅用户回答第-1-步之后) 写 REQ 落盘。

**禁止**：只问不写；认为「用户说够了」跳过 AskQuestion；用户答完后仍不写 REQ。

---

## 路由决策表（速查）

| 场景 | 动作 |
|------|------|
| **`init:` / `init: refresh data`** | 阶段 0 → 读 00-project-init + init-doc → AskQuestion → 停止 |
| **`req: 新需求…`** | greenfield/brownfield 均阶段 1；brownfield 无 init 时 AskQuestion 先 init 或 req |
| **`dev: 实现某功能`** | brownfield：init 已确认 + solution → 阶段 4；无 REQ → `dev/temp/` |
| **`dev: 只写思路`** | 阶段 4 步骤 ① 构思落盘 → AskQuestion 是否进入 ② → 停止 |
| **`sol:`** | 阶段 3 方案；建模按需 |
| **`tests: 验收 REQ-001`** | 阶段 5 |
| 纯解释、无交付物 | 豁免，不启用阶段 |
| 改一行 bug | 豁免 L1+L3 |
| 新项目 **greenfield** / 用户发需求 | 阶段 1 → AskQuestion → **用户答后下条回复写 REQ** |
| 阶段闸门选「是，继续」 | **下条回复**落盘下一阶段（model/solution/dev） |
| 接手 **brownfield** / 无 atlas/init | 阶段 0 → init 落盘 → AskQuestion → 停止 |
| 有 todo、用户说「继续 agileflow」 | 读建议阶段 → 读对应 phase；**默认不读** parallel-orchestration |
| 用户指定阶段且前置满足 | 直接进该 phase |
| 用户指定阶段但前置不满足 | AskQuestion：补前置 or 豁免 |
| 意图模糊 | AskQuestion 阶段确认卡片 |
| 「这阶段你定 / 不用问我 / 全自动」 | 当阶段 **ai_decide** → [stage-delegation.md](../templates/stage-delegation.md) |
| 「后面都你定」 | **ai_decide_global** → 写 todo 决策委派 |
| 「不审了继续 / 跳过审阅」 | 审阅闸门 **skip_review_continue** |
| 「这阶段我来决策」 | 覆盖全局 → **user_decide** |
| 仅维护 todo/humanTodo | [task-tracking.md](task-tracking.md) |
| 改已确认/已实现 REQ | [change-management.md](change-management.md) |

---

## 进入阶段后的行为

1. 输出阶段声明行（含 `模式` + `决策`；见 [SKILL.md 首行声明](../SKILL.md#首行声明)）
2. **阶段入口**：`todo` 未设全局 AI自主 → 决策权卡；**已全局 AI自主 → 跳过**，直接落盘（[stage-delegation](../templates/stage-delegation.md)）
3. **只读一个 phase 文件**（init → `00-project-init.md`；变更 → `change-management.md`）
4. **允许共读**：该 phase 文内显式链接的 `templates/*`
5. 阶段 4 额外共读 [dev-quickstart.md](../templates/dev-quickstart.md)
6. **阶段 0/1–4 产出完成** → user_decide：阶段闸门；ai_decide：审阅闸门 → **停止**
7. 并行仅显式要求时读 [parallel-orchestration.md](parallel-orchestration.md)

## 正误示例

**✅ 用户**：「继续 agileflow」→ todo 方案 ⬜ → 建议阶段 3 → 读 03-solution-design.md

**❌ 用户**：提出**新建产品**需求 → Agent **直接写业务源码**（须启用 Agileflow：决策权/需求 AskQuestion → 落盘 REQ → 禁止先写码）

**❌ 用户**：发来 PRD/长需求 → 未 AskQuestion 直接写 REQ（须先决策权或澄清卡 → 停止）

**❌ 用户**：方案设计写完 → 直接写业务源码（须结束闸门 → 用户选继续 → 下条回复再进阶段 4）
