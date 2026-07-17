# 入口意图识别与阶段路由

> **启用 Agileflow 时**，必须先执行本章，再读取**一个**对应 `phases/xx.md` + 该 phase **显式链接**的 `templates/*`。禁止预读其他 phase；禁止跳过识别直接写代码或写文档。

## 何时启用

**一条判定**：用户要你**交付/改动可运行产物**，或**为交付做的调研/探索**（——**用用户原话理解，不套关键词表**）→ **启用**；先走路由（含探索支路），**禁止直接 Write 业务源码**（探索亦禁）。

| 启用 | 不启用 |
|------|--------|
| 用户用自然语言描述要做啥（具体业务由用户说） | 纯解释、答疑、概念问题（无交付意图） |
| `@agileflow`、`继续 agileflow` | 单文件 ≤20 行、hotfix、明确说不走流程 |
| 前缀 `init:` `explore:` `req:` `mod:` `sol:` `dev:` `tests:` / `test:`（含分层） | 纯 code review（无改动交付） |
| **探索**：调研/找瓶颈/不知道做什么（见①.5） | — |

首条回复：`📍 Agileflow …`。  
**无 env / `AF_FLOW`·`AF_DECIDE` 为 pending**：  
- **探索支路（①.5）**：可先做只读分析 + 选项卡（**禁止**写 env/REQ/业务源码）；用户选定要进正式阶段时，若仍 pending → **再发启动卡** → 停。  
- **正式阶段落盘**（req/mod/sol/dev/tests）：必须先发[流程启动卡](../templates/stage-delegation.md#流程启动卡首启强制) → **停**（禁止本条写 env/阶段产物）。  
契约已确认且 `AF_DECIDE=ai` → 按阶段落盘 → **审阅闸门 → 停**。`user_decide`：信息充分则少问/跳过澄清，否则缺口卡 → 停。详见 [SKILL 裁决表](../SKILL.md#裁决表冲突时以此为准)。

## 识别顺序（固定 5 步）

```
① 豁免判定 → ①.5 探索判定 → ② 读取项目状态 → ③ 解析用户意图 → ④ 前置校验 & 确认 → 进入目标阶段
```

### ①.5 探索判定（入口支路，非正式阶段）

> **真空**：用户说「想优化但不知道瓶颈」时，**禁止**直接进 `req:`（req 假设已知道做什么）。  
> 探索 = 正式五阶段之前的**支路**；不建第 0 套产物体系。

| 命中（例） | 未命中 |
|------------|--------|
| 调研 / 分析瓶颈 / 不知道做什么 / 有哪些方案 / `explore:` | 已说清要交付的功能 |
| 「优化一下不知从哪下手」「先看看代码再决定」 | 豁免微型改动 / 纯概念问答 |

**命中后：**

1. 首行：`📍 Agileflow | 探索模式 | …`  
2. 读相关代码/日志/atlas（若有）→ **发现摘要 + 2～4 个可选方向**（各 1 行利弊）  
3. AskQuestion 选方向（或「再探一层」）→ **停**  
4. 用户选定 → 若仍无契约 → **启动卡** → 停；已有契约 → 再路由 `req:` / `sol:` / `dev:` / 豁免  

**禁止**：探索阶段写 env、写 REQ、写业务源码；把探索当跳过①②③的借口。  
可选：`atlas/logs/explore-YYYYMMDD.md` 记结论（不强制；**不算**正式阶段落盘）。

### 纠偏话术（路由）

> 权威阶梯 → [change-management §纠偏阶梯](change-management.md#纠偏阶梯全阶段)。命中下表 → **先纠偏**，禁止假装继续写码。

| 用户原话（例） | 优先判定 |
|----------------|----------|
| 需求不对 / 改 REQ / 场景要变 / AC 错了 | **L2**（已确认 REQ）或阶段 1（草稿） |
| 方案重来 / 推倒重做方案 / 栈选错了 | **L3** → 回阶段 3（或 L2 若仅改局部 feature） |
| 回建模 / 模型不对 / 表结构错了 | **L2** 或 **L3** → 回阶段 2（整体错用 L3） |
| 这块设计错了 / 做法要换 | 开发中 → **L0**（细节）或回 ①（根本）或 **L1/L2**（动 model/sol/AC） |
| 平台不对（如小程序改 App） | **L3** → 回阶段 1 |

本回复首行：`纠偏：L{n} → {目标}`；L2/L3 更新 `atlas/README.md`。

---

## 目录前缀（最高优先级）

> **记法**：前缀 = `atlas/` 子目录缩写 + `:`。与文件夹一一对应。

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

别名：`model:` = `mod:`（只认当前前缀表，不必另记）。  
**`test:` 分层**：裸 `test:` / `tests:` = 全量阶段 5；`test:smoke` / `test:smoke-be` / `test:unit` 等 = **只跑该层**（见 [test: 分层](#test-分层可指定层--单端)）。

**格式**：`sol: 设计退款` → 进 solution/ 方案设计。

**多前缀消息**：用户一条消息含多个前缀（如"req: 设计登录 dev: 实现登录"）时，按前缀出现顺序处理，每个前缀独立路由。禁止同回复跨阶段——须逐阶段落盘→闸门→停；第一个前缀阶段完成后，第二个前缀在下一条回复处理。

**空前缀**：用户只发 `sol:` 或 `dev:` 无内容时 → 进入该阶段但 AskQuestion「请描述本次{阶段名}的具体内容」→ 停止。

带前缀即启用 Agileflow；每阶段结束须**停**：**user_decide** → 阶段闸门；**AI自主** → 审阅闸门（可选 skip_review）。禁止写无条件「每阶段都要 AskQuestion 澄清卡」。

### `test:` 分层（可指定层 / 单端）

> **记法**：`test:` + 层名。可全量、可分层、可单端。
> 完整分层对照表 → [05-testing §test 分层入口](05-testing.md#test-分层入口) · [CLI 对照](../templates/l1-l5-pipeline.md#cli-短名--中文全称)。
> 路由侧仅记：裸 `test:` / `tests:` = 全量阶段 5；`test:smoke*` / `test:unit` / `test:l1-l4` = 只跑该层。
> 分层跑完须 AskQuestion 是否继续全量；禁止对不存在的端硬跑。

**任务编排（默认串行）**：阶段 3 写 todo 开发任务 + 功能依赖表；阶段 4 **先 TodoWrite 展开每个 T 的①②③**，再主 Agent 逐项构思落盘→开发→可运行闸门→AC验收。「全部开发」= 展开清单后串行连做，**≠** 启 Task/Subagent 批量写码。用户显式「并行开发 / 同时开发 FE+BE / 多 subagent」时 → [parallel-orchestration.md](parallel-orchestration.md)（须并行启动卡且每 T 已有合规①）。

## §atlas/ 结构

> **`atlas/`** = 流程文档的**根容器**，不是「把一切揉成一份」。  
> 子目录按阶段**物理隔离**：需求归 `requirements/`、模型归 `model/`、方案归 `solution/`、构思归 `dev/`、验收归 `tests/`。  
> **禁止**：把不同阶段产物写进同一文件；把多份独立功能糊成一份「总览 REQ」冒充完成；向用户编造「历史目录 / 旧名迁移 / 为什么要集中」之类解释——只陈述下表约定。

```
atlas/
├── README.md                  # 人类驾驶舱（强制；见 templates/atlas-readme.md）
├── init/                      # init: 仅 brownfield
│   ├── codebase/p1-{端}.md
│   ├── p0-business.md … data/
├── requirements/              # req: 需求 REQ + 按需 ui/UID
├── model/                     # mod: 数据建模（与 REQ 分文件）
├── solution/                  # sol: 方案
│   ├── architecture.md
│   └── code-patterns-{端}.md  # greenfield 模式 B 🌱
├── conventions/               # 模式 A 可选；默认不建
├── dev/                       # dev: 每任务一份构思 T-xxx（不放业务源码）
├── tests/
│   ├── README.md · REQ-*-验收报告.md
│   └── fe-pixel/
├── logs/
├── glossary.md
├── debt.md
├── todo.md · humanTodo.md · active-edits.md（按需）
```

- **`atlas/README.md`**：人先读；每阶段结束更新（[atlas-readme](../templates/atlas-readme.md)）
- 各目录下 `temp/` 放临时稿（见 §TEMP）
- 无独立前缀：`todo.md` / `humanTodo.md` / `active-edits.md` 随 req/sol/dev 阶段更新
- **业务源码**写在工程正常位置（如 `src/`、`miniprogram/`），**不**塞进 `atlas/`
- **只链不抄**：验收/线框/API 各有唯一权威，见 SKILL 裁决表

---

## init 判定（brownfield / greenfield）

> 细则：[00-project-init.md](00-project-init.md)  
> **脚本权威**：`scripts/validate-atlas/lib/brownfield.mjs`（看**源码文件**，不看空目录名）

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

**init 过期检测**：阶段 4 入口对比 `init/codebase/` 文件修改时间与 `src/` 下业务源码修改时间。src/ 更新晚于 init → AskQuestion「检测到 init 可能过期（代码变更晚于文档）。是否 refresh init？(是→增量 refresh / 否→继续 / 查看变更)」。

### §dev 入口分支

| 情况 | 动作 |
|------|------|
| 有已确认 REQ + solution | 正常阶段 4 三步序（构思落盘→开发→AC验收） |
| 用户只要「写 dev 思路 / 构思落盘」 | 仅 ① → **AskQuestion 是否进入 ② 写码** → 停止 |
| **无关联 REQ**（小工具、重构、探活） | 用 **`temp/` 子目录**，见 §TEMP |
| solution 未确认但用户 insist | AskQuestion：补 sol:（**新系统/多 T/有 API·DB → 禁止** `dev/temp/` 与快速通道） |

---

## §TEMP 临时目录

与已有 REQ/F/API **无明确关联**的工作 → 放各目录 **`temp/` 子目录**，与正式文档物理隔离。仍遵守 ①→②→③（② 按 `## 步骤` 写码，可精简但须逐步；③ 对照 REQ AC 验收；纯 refactor 无 AC 变更可豁免 ③）。转正移出 `temp/`。

**命名**：`{NNN}-{简述}.md`（dev 含端：`{NNN}-{简述}-{FE|BE|FULL}.md`）；NNN 三位递增。**禁止**在正式目录用 `TEMP-` 前缀命名（统一用 `temp/` 子目录）。

命中[豁免边界](#①-豁免判定最先做)（§①）→ **禁止** `dev/temp/`、**禁止**快速通道。灰色地带须 AskQuestion；`temp/` 不计入 T 头等式。

---

## §建模按需判定（阶段 2 非必经）

> 建模跳过/增量/全量的条件判定与确认卡 → [02-modeling §建模按需判定](02-modeling.md#建模按需判定)。路由侧仅记：跳过须落盘建模判定（`user` 须确认；`ai` 自检齐可快路径同条进 sol），禁止无判定静默跳过。

---

## ① 豁免判定（最先做）

命中下表 → 走豁免，**不进入流程**；未命中 → 继续 **①.5 探索判定**，再 ②。

| 豁免类型 | 触发条件 | 执行方式 | AskQuestion |
|----------|----------|----------|-------------|
| **纯问答** | 仅解释，无代码/文档变更 | 直接回答 | ❌ |
| **微型改动** | **同时**满足：单文件 ≤20 行；无 API/DB/权限/支付；**且**未命中下方「豁免边界」 | 改代码 → **静态检查+相关单测** → 更新 todo | 灰色地带须 AskQuestion |
| **Hotfix** | 用户**原话**含 hotfix / 紧急修复（Agent 不得自行贴标签）**且未命中豁免边界** | **静态检查+相关单测**；核心路径再加 **冒烟** | ❌ |
| **快速通道** | 用户说快速改 / 不走流程 **且** 确属微型改动 | 微型改动 + 不写 REQ/model/solution | 灰色地带须 AskQuestion |

### 豁免声明（强制 · 堵静默逃逸）

走豁免时，**本回复首行**必须含：`豁免：问答` / `豁免：微型` / `豁免：hotfix` / `豁免：快速通道`。  
**禁止**不声明就当豁免开写。灰区（想自称微型但不确定）→ **必须 AskQuestion**，禁止自行判豁免。

**快速通道边界**：「不走流程」仅微型改动。MVP/多模块/API·DB / 已启用 Agileflow 交付 → **禁止** temp/快速通道（见上方 [豁免边界](#①-豁免判定最先做)）。  
「可压缩」**仅指** AskQuestion 停点次数，以及快速模式下是否**推并发**；**不指**跳阶段、**不指**薄写 sol/dev、**不指**「待补齐」代替正文、**不指**把 todo/①②③压成摘要或空壳。

> **「快速模式」≠「快速通道」**：快速仍按序 req→mod→sol→dev；sol/dev 与严谨同质；要加速走并发。  
> 「用户不用管」→ **AI 自主**，不是快速通道、也不是跳阶段、也不是薄文档。

**豁免边界（任一命中走完整流程）**：API/DB/权限、支付/敏感数据、多模块、用户要求完整流程、跨 2+ 文件或 >20 行、**用户说只看成品/直接开发但 scope 为新系统 MVP**、`@agileflow` / 已有正式 solution·todo。

**禁止**：Agent 把 MVP 功能拆成「多次 ≤20 行」连环豁免。

豁免只更新 `atlas/todo.md`；不生成 REQ/model/solution 文档。测试层见 [l1-l5-pipeline.md](../templates/l1-l5-pipeline.md)。  
> 豁免声明 = **C 档纪律**（脚本不扫聊天）；不声明仍属违规。

---

## 模式判定（快速 / 严谨）

**权威** → [flow-modes.md](../templates/flow-modes.md)（**快速仍按序走完阶段；sol/dev 同质；加速靠并发**；风险维度→分档：精简/标准/完整；「全部做」只催进度不切模式）。

路由侧仅记：pending → 启动卡；已确认 → 首行声明，禁止静默改模式。用户说「你定/别问我/不想自己决策」且未说严谨 → **委托交付 `fast+ai`**（可跳启动卡）；「后面都你定」→ `AF_DECIDE=ai` + 默认 fast。详见 [stage-delegation §委托交付](../templates/stage-delegation.md#委托交付fastai用户不想自己决策)。

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
| **流程状态（机器权威）** | `atlas/agileflow.env` | `AF_PHASE`/`AF_FLOW`/`AF_DECIDE`/`AF_TIER`/`AF_STACK_SOURCE`；与产物不一致 → 先改 env 再进阶；模板 → [agileflow.env](../templates/agileflow.env) |
| **会话续作 checkpoint** | `atlas/todo.md` →「## 进行中」/ checkpoint 行 | **跨会话权威**：当前 T + ①/②/③；新聊天先读此处再 TodoWrite |
| **项目盘点** | `atlas/init/README.md` | brownfield 不存在/未确认 → 阶段 0；greenfield 忽略；「已确认」→ 可进后续 |
| 流程进度 | `atlas/todo.md` →「流程进度」区 | 哪几阶段已 ✅（须与 `AF_PHASE` 对齐） |
| 需求 | `atlas/requirements/REQ-*.md` | 有文件但「草稿」→ 阶段 1 未完成；「已确认」→ 可进阶段 2 |
| 建模 | `atlas/model/README.md` | 不存在或「草稿」→ 阶段 2；「已确认」→ 可进阶段 3 |
| 方案 | `atlas/solution/README.md` | 不存在或「草稿」→ 阶段 3；「已确认」且开发任务未清空 → 阶段 4 |
| **写法锚点** | `init/codebase/p1-frontend|backend.md` 或 `solution/code-patterns-*`（**资产索引靠前**） | 模式 B；dev 先查库存再抄 §三 |
| 开发 | `atlas/todo.md` →「开发任务」| 有未完成任务 → 阶段 4；全部 ✅ 且测试未 ✅ → 阶段 5 |
| 验收 | `atlas/tests/README.md` | 已有 PASS → 交付已完成，问用户要维护还是新需求 |

**推导「建议阶段」** = 2.0 定类型后，取第一个未完成的前置阶段（0→1→2→3→4→5）。

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
| 5 | 说写码/实现但无 REQ/solution | **产品功能** → 退回阶段 1 或 3（禁止 temp）；**探活/单文件重构** → `dev/temp/`；灰区 AskQuestion |
| 6 | 改已确认 REQ | [change-management](change-management.md) |
| 7 | 说不清 | AskQuestion 选阶段 |

**催进度** ≠ 跳过流程：详见 [SKILL 反模式](../SKILL.md#反模式催进度时仍禁止)。仍逐 T ①→②→可运行闸门→③；禁止合并 todo；高风险任务走完整档。

### 决策委派话术（→ [stage-delegation.md](../templates/stage-delegation.md)）

| 用户说 | 动作 |
|--------|------|
| 你定 / 别问我 / 不想自己决策 / 你看着办（首启，未说严谨） | **委托交付** `fast+ai`；写 env → 可跳启动卡 |
| 这阶段你定 / 后面都你定 / 不审了继续 | ai_decide / global / skip_review |
| 这阶段我来 | user_decide |
| 重选模式 / 换流程 / 重开启动卡 / 重新选决策权 | **契约重选** → pending + 流程启动卡 |

### 用户描述需求（最常见入口）

用户**用原话**说要做啥 → **阶段 1**（须先过流程契约）：

> 契约未确认 → 启动卡 → 停；`ai` → 落盘 REQ + 审阅闸门 → 停；`user` → 需求澄清卡 → 停。
> **禁止**：契约未确认就落盘；AI自主只问不写；user_decide 用聊天追问代替卡片；同回复写码。详见 [01-requirement](01-requirement.md)。

### 硬规则：不可跳阶段（豁免与前缀单阶段模式除外）

| 目标阶段 | 最低前置条件 | 不满足时 |
|----------|--------------|----------|
| **0 init** | brownfield 判定 | greenfield → 跳过，进阶段 1 |
| 1 需求 | greenfield **或** brownfield 且 init 已确认（或本轮将完成 init） | brownfield → 阶段 0 |
| 2 建模 | ≥1 个 REQ「已确认」 | 退回阶段 1 或 AskQuestion |
| 3 方案 | model **已确认或按需跳过**（见 [建模按需判定](02-modeling.md#建模按需判定)） | 无 model 且需建模 → 阶段 2；否则 AskQuestion |
| 4 开发 | solution 已确认 **且** brownfield 时 init 已确认 **或** TEMP/dev 快速通道 | 退回阶段 3 / init / TEMP |
| 5 测试 | 开发任务已完成（或用户明确只验部分） | 提示先开发或 AskQuestion |

**按需跳过建模**：建议跳过时须 [用户确认](02-modeling.md#建模按需判定)（卡或原话）；阶段 3 前置不要求 model 已确认，但首行须标注 `建模：跳过/增量/全量` 且跳过须有确认留痕。

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

用户描述想法、发 PRD → **阶段 1** → 先确认流程契约（启动卡或原话已点明）→ 再按 [01-requirement](01-requirement.md)：`ai` 落盘+审阅闸门；`user`→需求卡→停→下条写 REQ。

**user_decide 且用户已答卡** → **本条回复必须**写 REQ（[01 第 2 步](01-requirement.md#第-2-步生成需求草稿)）；禁止只寒暄。

**禁止**：契约未确认就写 REQ；已确认 AI自主却只问不写；user_decide 答完后仍不写 REQ；greenfield 创建 `atlas/init/`。

---

## 路由决策表（速查）

> 通用路由见 [§目录前缀](#目录前缀最高优先级) / [§test:分层](#test-分层可指定层--单端) / [①豁免判定](#①-豁免判定最先做) / [init 判定](#init-判定brownfield--greenfield) / [§dev入口分支](#dev-入口分支) / [§决策委派话术](#决策委派话术-stage-delegationmd) / [change-management](change-management.md)

| 场景 | 动作 |
|------|------|
| **`test:smoke-be`** | 仅 BE 冒烟 |
| **`test:smoke-fe`** | 仅 FE Playwright 冒烟 |
| **`test:pixel-fe`** | FE 像素对比（有原型；见 [fe-pixel-compare](../templates/fe-pixel-compare.md)） |
| **`test:unit`** / **`test:l3`** | 仅单测 / AC 自动化 |
| 仅维护 todo/humanTodo | [task-tracking.md](task-tracking.md) |

---

## 进入阶段后的行为

进入阶段后：① 输出 [声明行](../SKILL.md#首行声明) → ② 契约检查（[SKILL 裁决表](../SKILL.md#阶段机制)）→ ③ 只读一个 phase + 链接 templates（[SKILL 加载表](../SKILL.md#加载)）→ ④ 产出完成 → 闸门 → 停
