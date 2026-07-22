# 入口意图识别与阶段路由

> **启用 Agileflow 时**，必须先执行本章，再读取**一个**对应 `phases/xx.md` + 该 phase **显式链接**的 `templates/*`。禁止预读其他 phase；禁止跳过识别直接写代码或写文档。

## 何时启用

**一条判定**：用户要你**交付/改动可运行产物**，或**为交付做的调研/探索**（——**用用户原话理解，不套关键词表**）→ **启用**；先走路由（含探索支路），**禁止直接 Write 业务源码**（探索亦禁）。

| 启用 | 不启用 |
|------|--------|
| 用户用自然语言描述要做啥（具体业务由用户说） | 纯解释、答疑、概念问题（无交付意图） |
| `@agileflow`、`继续 agileflow` | 纯解释、答疑（无交付意图） |
| 前缀 `init:` `explore:` `req:` `mod:` `sol:` `dev:` `tests:` / `test:`（含分层） | 纯 code review（无改动交付） |
| 前缀 `fix:` `refactor:` `tweak:` `perf:` `chore:` `ut:` `revise:`（快捷指令） | — |
| **探索**：调研/找瓶颈/不知道做什么（见①.5） | — |

首条回复：`📍 Agileflow …`。  
**无 env / `pending`**：  
- **探索支路（①.5）**：只读分析 + 选项卡（禁写 env/REQ/源码）；选定进正式阶段 → **仍须契约**（默认启动卡问人；明确委托才 `AF_DECIDE=ai` 可跳）。  
- **正式阶段落盘**：未确认契约 → **pending + [启动卡](../templates/contract.md#71-流程启动卡)→停**；仅话术明确让 AI 自己干 → 写 `AF_DECIDE=ai` 可跳。  
已确认：`ai` 连做 / `user` 闸门停。详见 [SKILL 裁决表](../SKILL.md#裁决表冲突时以此为准)。

## 识别顺序（固定 6 步）

```
① 豁免判定（纯问答） → ①.2 快捷指令判定 → ①.5 探索判定 → ② 读取项目状态 → ③ 解析用户意图 → ④ 前置校验 & 确认 → 进入目标阶段
```

### ①.5 探索判定（入口支路，非正式阶段）

> **真空**：用户说「想优化但不知道瓶颈」时，**禁止**直接进 `req:`（req 假设已知道做什么）。  
> 探索 = 正式五阶段之前的**支路**；不建第 0 套产物体系。

| 命中（例） | 未命中 |
|------------|--------|
| 调研 / 分析瓶颈 / 不知道做什么 / 有哪些方案 / `explore:` | 已说清要交付的功能 |
| 「优化一下不知从哪下手」「先看看代码再决定」 | 豁免微型改动 / 纯概念问答 |

**命中后：**

1. 首行：`📍 Agileflow | 探索模式 | 轮次 {1|2}/2 | …`  
2. 读相关代码/日志/atlas（若有）→ **发现摘要 + 2～4 个可选方向**（各 1 行利弊）  
3. AskQuestion 选方向（或「再探一层」，**最多 2 轮**）→ **停**  
4. 第 3 次仍「再探」→ 必须选方向进正式阶段 **或** 首行声明探索结束  
5. 用户选定 → 若仍无契约 → **启动卡** → 停；已有契约 → 再路由 `req:` / `sol:` / `dev:` / 豁免  

**禁止**：探索阶段写 env、写 REQ、写业务源码；把探索当跳过①②③的借口。  
可选：`atlas/logs/explore-YYYYMMDD.md` 记结论（不强制；**不算**正式阶段落盘）。

### 纠偏话术（路由）

> 权威阶梯 → [change-management §纠偏阶梯](change-management.md#纠偏阶梯全阶段)。命中下表 → **先纠偏**，禁止假装继续写码。

| 用户原话（例） | 优先判定 |
|----------------|----------|
| 需求不对 / 改 REQ / 场景要变 / AC 错了 | **L2**（已确认 REQ）或阶段 1（草稿） |
| 方案重来 / 推倒重做方案 / 栈选错了 | **L3** → 回阶段 3（或 L2 若仅改局部 feature） |
| 回建模 / 模型不对 / 表结构错了 | **L2** 或 **L3** → 回阶段 2（整体错用 L3） |
| 这块设计错了 / 做法要换 | → [change-management §影响面判定](change-management.md#影响面判定) |
| 平台不对（如小程序改 App） | **L3** → 回阶段 1 |

本回复首行：`纠偏：L{n} → {目标}`；L2/L3 更新 `atlas/README.md`。

---

## 目录前缀（最高优先级）

> **记法**：前缀 = 门牌 + `:`。  
> **内置**：下表（与 atlas 目录对应）。  
> **自定义**：当前项目 `atlas/flow.yaml` 的 `steps[].id`（总控每次读 flow 收集，如 `research:`）。打门牌 = 进入该步所在**就绪波**并往下（`ai` 整波可并行；`user` 波≥2 须并行确认）。  
> **优先级**：快捷指令（fix/revise…）→ **flow 门牌**（内置+自定义 id）→ 其它意图。

| 前缀 | 目录 | 阶段 |
|------|------|------|
| **`init:`** | `atlas/init/` | **0 项目盘点（仅 brownfield）** |
| **`explore:`** | （可选）`atlas/logs/explore-*.md` | **探索支路**（见①.5；非正式阶段） |
| `req:` | `atlas/requirements/` | 1 需求 |
| `mod:` | `atlas/model/` | 2 建模（按需） |
| `sol:` | `atlas/solution/` | 3 方案 |
| `dev:` | `atlas/dev/` | 4 开发 |
| `tests:` | `atlas/tests/` | 5 验收（全量） |
| `test:` | `atlas/tests/` + 分层子命令 | 5 验收 **或** 指定层（见下） |
| `fix:` `refactor:` `tweak:` `perf:` `chore:` `ut:` | （无 atlas 产物） | 快捷·零文档 |
| `revise:` | 更新已有 atlas 段落 | 快捷·修订 |

别名：`model:` = `mod:`。自定义 id 不可占用上表快捷保留字（脚本 `FLOW-ID-RESERVED`）。  
**`test:` 分层**：裸 `test:` / `tests:` = 全量阶段 5；`test:smoke` / `test:smoke-be` / `test:unit` 等 = **只跑该层**（见 [test: 分层](#test-分层可指定层--单端)）。

**格式**：`sol: 设计退款` → 进 solution/ 方案设计。

**多前缀消息**：一条消息含多个前缀时按出现顺序处理，每个前缀独立路由。**`ai`**：可同条按序落盘→过闸→连做。**`user`**：逐阶段落盘→闸门→停。

**空前缀**：用户只发 `sol:` 或 `dev:` 无内容时 → 进入该阶段但 AskQuestion「请描述本次{阶段名}的具体内容」→ 停止。

带前缀即启用 Agileflow；阶段结束按契约：**user** → 阶段闸门→停；**`ai`+闸门绿** → 免发卡 → **可连做**。禁止写无条件「每阶段都要 AskQuestion 澄清卡」。

### `test:` 分层（可指定层 / 单端）

> **记法**：`test:` + 层名。可全量、可分层、可单端。
> 完整分层对照表 → [05-testing §test 分层入口](05-testing.md#test-分层入口) · [CLI 对照](05-testing.md#cli-短名-中文全称)。
> 路由侧仅记：裸 `test:` / `tests:` = 全量阶段 5；`test:smoke*` / `test:unit` / `test:l1-l4` = 只跑该层。
> 分层跑完须 AskQuestion 是否继续全量；禁止对不存在的端硬跑。

## §atlas/ 结构与路径

→ **[atlas-structure.md](atlas-structure.md)**（目录树 · 路径铁律 · `agileflow-dispatch.json` · TEMP 规则 · **唯一 SSOT**）。本文件只处理路由，不重复 atlas 布局。

---

## init 判定（brownfield / greenfield）

> 细则：[00-project-init.md](00-project-init.md)  
> **脚本权威**：[`brownfield.mjs`](../scripts/validate-atlas/lib/brownfield.mjs) — 业务根下存在 ≥1 个非配置业务源码文件（`.ts/.java/…`）。**Monorepo**：按**本次交付目标 package/app 根**判定；空 package 对该 package 用 greenfield 写法锚点，整仓仍可能是 brownfield。

| 类型 | 判定（任一） | init |
|------|--------------|------|
| **brownfield** | `src/apps/…` 等目录下**已有** `.ts/.java/…` 业务文件；或已有 `atlas/init/`；用户说接手、二次开发 | **须 init** |
| **greenfield** | 空仓 / 仅空脚手架目录（空 `packages/`、空 `src/` **不算** brownfield）；从零新建 | **禁止 init** |

**顺序铁律**：**先扫仓库判 brownfield/greenfield，再读 `atlas/`。**  
**禁止**把「没有 `atlas/`」当成 greenfield——老仓无 atlas 仍是 brownfield，须阶段 0。

**greenfield** → 跳过阶段 0，从阶段 1 `req:` 开始。  
**brownfield 且 `atlas/init/` 不存在或未确认** → 进 `dev:`/`sol:` 前先 **init:** 或自动进入阶段 0。

REQ/model **设计阶段**只改 `model/`，**不**改 init；**实现落地后**按 [init refresh](00-project-init.md#增量-refreshreq-开发完毕后) 增量更新。

### init 自动触发（brownfield）

满足 **全部** → 建议阶段 **0**：

1. brownfield 判定通过
2. `atlas/init/` 不存在 **或** `README.md` 状态非「已确认」
3. 用户意图为 `dev:` / `sol:` / 「继续 agileflow」且含写码/方案，或首次接手

**不自动 init**：greenfield；豁免；用户明确「跳过 init / 熟悉项目」。

**用户坚持跳过 init** → [处理细则](00-project-init.md#用户跳过-init-处理)（AskQuestion 确认 + 留痕；禁止静默跳过）。

**init 过期检测**（针对**已落地**的历史变更；设计阶段 model 变更不算过期）：阶段 4 入口对比 `init/codebase/` 与 `src/` 业务源码 mtime。`src/` 晚于 init → AskQuestion「init 可能过期…是否 refresh？」（否→继续；是→见 [init refresh](00-project-init.md#增量-refreshreq-开发完毕后)）。

### §dev 入口分支

| 情况 | 动作 |
|------|------|
| 有已确认 REQ + solution | 正常阶段 4 三步序（构思落盘→开发→AC验收） |
| 用户只要「写 dev 思路 / 构思落盘」 | 仅 ① → **AskQuestion 是否进入 ② 写码** → 停止 |
| **无关联 REQ**（小工具、重构、探活） | **未启用 AF** 时用 **`temp/`**；**已启用 AF** → 禁止 temp，须正式 REQ/sol |
| solution 未确认但用户 insist | AskQuestion：补 sol:（**新系统/多 T/有 API·DB → 禁止** `dev/temp/` 与微型豁免） |

---

## §TEMP 与 temp/ 规则

→ [atlas-structure §TEMP](atlas-structure.md#temp-临时目录)（已启用 AF 时禁止 temp 写码）。

---

## §建模按需判定（阶段 2 非必经）

> 建模步为 `mode: orch`：总控到步时对照 `atlas/flow.yaml` 的 `criteria` 判定做或 skip。skip 须总控写 `flow.yaml` skip+reason；禁止无判定静默跳过。细则 → [flow 约定](../templates/flow.md) · [02-modeling](02-modeling.md#建模按需判定)。

---

## ① 豁免判定（最先做）

> **🔴 已启用 AgileFlow**（存在 `atlas/agileflow.env` 或 `atlas/requirements/`）→ **微型/hotfix 不适用**，任何写码须 `--gate write-code` 绿；`ai` 决策只少停点，文档仍须先行。

命中下表 → 走豁免，**不进入流程**；未命中 → 继续 **①.5 探索判定**，再 ②。

| 豁免类型 | 触发条件 | 执行方式 | AskQuestion |
|----------|----------|----------|-------------|
| **纯问答** | 仅解释，无代码/文档变更 | 直接回答 | ❌ |
| **微型改动** | **未启用 AF** 且 **同时**满足：本会话**仅一次**豁免声明；**单文件**；无 API/DB/权限/支付/新依赖/跨模块；未命中豁免边界 | 改代码 → **静态检查+相关单测** | 灰色地带须 AskQuestion |
| **Hotfix** | **未启用 AF** 且用户**原话**含 hotfix / 紧急修复（Agent 不得自行贴标签）且未命中豁免边界 | **静态检查+相关单测**；核心路径再加 **冒烟** | ❌ |

### 豁免声明（强制 · 堵静默逃逸）

> 🔴 **本回复首行必须含豁免声明**：`豁免：问答` / `豁免：微型` / `豁免：hotfix`。  
> ❌ **禁止不声明就当豁免开写**。灰区（想自称微型但不确定）→ **必须 AskQuestion**，禁止自行判豁免。

**🔴 微型豁免边界**：「不走流程」仅微型改动。MVP/多模块/API·DB / 已启用 Agileflow 交付 → **禁止** temp/微型豁免（见上方 [豁免边界](#①-豁免判定最先做)）。  
🟠 **「可压缩」仅指**：AskQuestion 停点次数，以及 `ai` 下是否**推并发**；**不指**跳阶段、**不指**薄写 sol/dev。详见 [contract §1 铁律](../templates/contract.md#1-env)。

> 🔵 「用户不用管」→ **AI 自主**，不是跳阶段、也不是薄文档。

**🔴 豁免边界（任一命中走完整流程）**：API/DB/权限、支付/敏感数据、多模块、用户要求完整流程、跨 2+ 文件或 >20 行、**用户说只看成品/直接开发但 scope 为新系统 MVP**、已存在 Agileflow 正式产物（REQ/solution/todo 已确认，或 `@agileflow` / `atlas/agileflow.env` 已启用交付流程）。

**判定透明化（强制）**：命中或未命中豁免时，首行须一句说明——`豁免：{类型}（依据：{为何}）` 或 `须完整流程（依据：{触边界项}）`。禁止静默判豁免。

**三条可记规则**（边界简记）：① 动 API/DB/多文件 → 完整流程；② **已启用 AF** → 禁止微型/hotfix，写码前 `write-code`；③ 未启用 AF 且单文件微型 → 可豁免（**同一会话第二次微型意图 → 须完整流程**）。

❌ **禁止**：Agent 把 MVP 功能拆成多次微型豁免声明。

豁免只更新 `atlas/todo.md`；不生成 REQ/model/solution 文档。测试层见 [05-testing.md](05-testing.md)。  
> 豁免声明 = **流程纪律**（`write-code` 扫磁盘硬挡 AF 项目；聊天豁免声明仍须首行声明）。不声明仍属违规。

---

<a id="quick-commands-routing"></a>

## ①.2 快捷指令判定（已启用 AF 亦有效）

> 权威细则 → [quick-commands.md](quick-commands.md)（SSOT）。本节只做路由入口。

| 前缀 | 模式 | 路由 |
|------|------|------|
| `fix:` `refactor:` `tweak:` `perf:` `chore:` `ut:` | 零文档 | → [quick-commands §零文档层](quick-commands.md#zero-doc-flow) |
| `revise:` | 修订 | → [quick-commands §修订层](quick-commands.md#revise-flow) |

**命中即短路**：不继续 ②③④，不读 phase 文件，不过契约，不跑 write-code 闸门。
**未命中**：继续 ①.5 探索判定 → ② → ③ → ④（现有流程不变）。

**与豁免的关系**：快捷指令 ≠ 豁免。豁免仅"未启用 AF"；快捷指令**任何状态**均可用。
**与完整前缀的关系**：`fix:` 等与 `req:`/`sol:`/`dev:` 互斥——一条消息只走一层。

---

## 决策权判定

**权威** → [contract.md](../templates/contract.md)（`ai` 仍按序走完阶段；sol/dev 同质；加速靠少停 + 并发）。

路由侧：无契约 → **默认问人（启动卡）**；话术明确委托 → `AF_DECIDE=ai` 可跳；原话点明决策权 → 按原话写。详见 [contract](../templates/contract.md)。

---

## ② 读取项目状态（判断「当前在哪」）

**必须按下面顺序**（先仓后 atlas）：

### 2.0 仓库类型（先做）

1. 扫业务根是否有源码文件 → **brownfield** 或 **greenfield**（规则见上节；空目录 ≠ brownfield）  
2. **仅当** greenfield **且** 无 `atlas/` → 可称「全新交付起点」→ 建议阶段 1  
3. **brownfield 且无 `atlas/init`（或未确认）** → 建议阶段 **0**（即使完全没有 `atlas/`）  
4. 再进入下表读 atlas 进度

### 2.1 atlas 进度（后做）

| 检查项 | 路径 | 状态含义 |
|--------|------|----------|
| **流程编排（做不做）** | `atlas/flow.yaml` | 哪些步 skip / 启用；推导建议阶段时**跳过 skip 步**；不存在 → 视同默认模板（全启用） |
| **流程状态（机器权威）** | `atlas/agileflow.env` | `AF_PHASE`/`AF_DECIDE`/`AF_TIER`/`AF_STACK_SOURCE`；与产物不一致 → 先改 env 再进阶；模板 → [agileflow.env](../templates/agileflow.env) |
| **会话续作 checkpoint** | `atlas/todo.md` →「## 进行中」/ checkpoint 行 | **跨会话权威**：当前 T + ①/②/③；新聊天先读此处再 TodoWrite |
| **项目盘点** | `atlas/init/README.md` | brownfield 不存在/未确认 → 阶段 0；greenfield 忽略；「已确认」→ 可进后续 |
| 流程进度 | `atlas/todo.md` →「流程进度」区 | 哪几阶段已 ✅（须与 `AF_PHASE` 对齐） |
| 需求 | `atlas/requirements/REQ-*.md` | 有文件但「草稿」→ 阶段 1 未完成；「已确认」→ 可进阶段 2 |
| 建模 | `atlas/model/README.md` | flow skip → 跳过；不存在或「草稿」→ 阶段 2；「已确认」→ 可进阶段 3 |
| 方案 | `atlas/solution/README.md` | 不存在或「草稿」→ 阶段 3；「已确认」且开发任务未清空 → 阶段 4 |
| **写法锚点** | `init/codebase/p1-frontend|backend.md` 或 `solution/code-patterns-*`（**资产索引靠前**） | 模式 B；dev 先查库存再抄 §三 |
| 开发 | `atlas/todo.md` →「开发任务」| 有未完成任务 → 阶段 4；全部 ✅ 且测试未 ✅ → 阶段 5 |
| 验收 | `atlas/tests/README.md` | 已有 PASS → 交付已完成，问用户要维护还是新需求 |

**推导「建议阶段」** = 2.0 定类型后，读 `flow.yaml` 跳过 skip 步，取第一个未完成的启用步。

示例：
- 有已确认 REQ、flow.yaml model skip → 建议阶段 **3**（跳过 2）
- 有已确认 REQ、model 未确认且未 skip → 建议阶段 **2**
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
| 5 | 说写码/实现但无 REQ/solution | **已启用 AF** → 退回阶段 1/3 + `write-code`；**未启用 AF** 探活/单文件 → `dev/temp/` |
| 6 | 改已确认 REQ | [change-management](change-management.md) |
| 7 | 说不清 | AskQuestion 选阶段 |

**催进度** ≠ 跳过流程：详见 [红线](../templates/orchestrator.md#正确做法与红线15)。仍逐 T ①→②→可运行闸门→③；禁止合并 todo；质量条不降。

### 决策委派话术

→ **[contract §3 话术表](../templates/contract.md#3-话术表必须看上下文)**（**唯一 SSOT**）。本文件只处理路由与阶段跳转，不重复话术表。

### 用户描述需求（最常见入口）

用户**用原话**说要做啥 → **阶段 1**（须先过流程契约）：

> 契约未确认 → **默认启动卡问人**（保持 pending）；明确委托才 `AF_DECIDE=ai`；其后按契约连做或停。
> **禁止**：契约未确认就落盘；AI自主只问不写；`user` 用聊天追问代替卡片；`user` 同回复写码；`ai` 连做时跳过闸门。详见 [01-requirement](01-requirement.md)。

### 硬规则：不可跳阶段（豁免与前缀单阶段模式除外）

| 目标阶段 | 最低前置条件 | 不满足时 |
|----------|--------------|----------|
| **0 init** | brownfield 判定 | greenfield → 跳过，进阶段 1 |
| 1 需求 | greenfield **或** brownfield 且 init 已确认（或本轮将完成 init） | brownfield → 阶段 0 |
| 2 建模 | ≥1 个 REQ「已确认」 | 退回阶段 1 或 AskQuestion |
| 3 方案 | model **已确认或 flow.yaml skip**（见 [建模按需判定](#建模按需判定阶段-2-非必经)） | 无 model 且未 skip → 阶段 2；否则 AskQuestion |
| 4 开发 | solution 已确认 **且** brownfield 时 init 已确认 | 退回阶段 3 / init |
| 5 测试 | 开发任务已完成（或用户明确只验部分） | 提示先开发或 AskQuestion |

**按需跳过建模**：总控到 `AF_PHASE=2` 时对照 `flow.yaml` criteria 判定；skip 则写 `flow.yaml` skip+reason（不派 model）；须做则派 `prompt: model`。进 sol 前置：model 已确认 **或** flow.yaml skip。

用户**明确要求跳过**（如「不要文档直接写」）→ **未启用 AF** 时走 [① 豁免判定](#①-豁免判定最先做)；**已启用 AF** → 须完整流程 + `write-code`。

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
  `📍 Agileflow | 决策：{AI全权/我来} | 阶段：{N}-{名称} | 依据：{用户原话或 todo 状态}`

### 全新项目 / 用户发来需求

用户描述想法 → 阶段 1：契约（启动卡或原话）→ [01-requirement](01-requirement.md)。

**user_decide 且用户已答卡** → **本条回复必须**写 REQ（[01 第 2 步](01-requirement.md#第-2-步生成需求草稿)）；禁止只寒暄。

**禁止**：契约未确认就写 REQ；已确认 AI自主却只问不写；user_decide 答完后仍不写 REQ；greenfield 创建 `atlas/init/`。

---

## 路由决策表（速查）

> 通用路由见 [§目录前缀](#目录前缀最高优先级) / [§test:分层](#test-分层可指定层--单端) / [①豁免判定](#①-豁免判定最先做) / [init 判定](#init-判定brownfield--greenfield) / [§dev入口分支](#dev-入口分支) / [§决策委派话术](#决策委派话术) / [change-management](change-management.md)

| 场景 | 动作 |
|------|------|
| **`test:smoke-be`** | 仅 BE 冒烟 |
| **`test:smoke-fe`** | 仅 FE Playwright 冒烟 + 截图 + AI 目视（有 FE 强制；见 [fe-smoke-playwright](../tools/fe-smoke-playwright.md)） |
| **`test:pixel-fe`** | FE 像素对比（有原型；见 [fe-pixel-compare](../templates/../tools/fe-pixel-compare.md)） |
| **`test:unit`** / **`test:l3`** | 仅单测 / AC 自动化 |
| 仅维护 todo/humanTodo | [todo.md](../templates/todo.md) · [human-todo.md](../templates/human-todo.md) |

---

## 进入阶段后的行为

进入阶段后：① 声明行 → ② 契约检查 → ③ 只读一个 phase + 其 templates → ④ 落盘 → 闸门 → **`ai` 连做 / `user` 停**（[SKILL 裁决表](../SKILL.md#裁决表冲突时以此为准)）
