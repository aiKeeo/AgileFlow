# 入口意图识别与阶段路由

> **启用 Agileflow 时**，必须先执行本章，再读取**一个**对应 `phases/xx.md` + 该 phase **显式链接**的 `templates/*`。禁止预读其他 phase；禁止跳过识别直接写代码或写文档。

## 何时启用

**一条判定**：用户要你**交付/改动可运行产物**（产品、功能、模块、接口…——**用用户原话理解，不套关键词表**）→ **启用**；先 `atlas/` 流程，**禁止直接 Write 业务源码**。

| 启用 | 不启用 |
|------|--------|
| 用户用自然语言描述要做啥（具体业务由用户说） | 纯解释、答疑、概念问题 |
| `@agileflow`、`继续 agileflow` | 单文件 ≤20 行、hotfix、明确说不走流程 |
| 前缀 `init:` `req:` `mod:` `sol:` `dev:` `tests:` / `test:`（含分层） | code review |

首条回复：`📍 Agileflow …`。  
**无 env / `AF_FLOW`·`AF_DECIDE` 为 pending** → 先发[流程启动卡](../templates/stage-delegation.md#流程启动卡首启强制) → **停**（禁止本条落盘）。  
契约已确认且 `AF_DECIDE=ai` → 按阶段落盘 → **审阅闸门 → 停**。`user_decide` 或需求不清 → 澄清卡 → 停。详见 [SKILL 裁决表](../SKILL.md#裁决表冲突时以此为准)。

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
| `tests:` | `atlas/tests/` | 5 验收（全量） |
| `test:` | `atlas/tests/` + 分层子命令 | 5 验收 **或** 指定层（见下） |

别名：`model:` = `mod:`（只认当前前缀表，不必另记）。  
**`test:` 分层**：裸 `test:` / `tests:` = 全量阶段 5；`test:smoke` / `test:smoke-be` / `test:unit` 等 = **只跑该层**（见 [test: 分层](#test-分层可指定层--单端)）。

**格式**：`sol: 设计退款` → 进 solution/ 方案设计。

**多前缀消息**：用户一条消息含多个前缀（如"req: 设计登录 dev: 实现登录"）时，按前缀出现顺序处理，每个前缀独立路由。禁止同回复跨阶段——须逐阶段落盘→闸门→停；第一个前缀阶段完成后，第二个前缀在下一条回复处理。

**空前缀**：用户只发 `sol:` 或 `dev:` 无内容时 → 进入该阶段但 AskQuestion「请描述本次{阶段名}的具体内容」→ 停止。

带前缀即启用 Agileflow；每阶段结束须**停**：**user_decide** → 阶段闸门；**AI自主** → 审阅闸门（可选 skip_review）。禁止写无条件「每阶段都要 AskQuestion 澄清卡」。

### `test:` 分层（可指定层 / 单端）

> **记法**：`test:` + 层名。可全量、可分层、可单端。权威执行 → [05-testing](05-testing.md#test-分层入口) · [测试流水线 CLI 对照](../templates/l1-l5-pipeline.md#cli-短名--中文全称)。

| 用户写 | Agent 跑什么 | 产出 / 证据 |
|--------|--------------|-------------|
| **`tests:`** / **`test:`**（无后缀） | **全量阶段 5**：测试入场门禁 → AC验收归档 → 全量回归 | `atlas/tests/` 报告 |
| **`test:unit`** / **`test:l3`** | **AC 单测**（阶段 4 ③ 已有的 `test/ac` 等） | 终端绿 + 可选记入 `atlas/logs/` |
| **`test:l1`** / **`test:lint`** | 仅静态检查 | 终端 |
| **`test:l2`** / **`test:build`** | 仅构建 | 终端 |
| **`test:smoke`** | **两端功能冒烟**（存在端）：= `smoke-be` +（有 FE 时）`smoke-fe` | `atlas/logs/*smoke*` + 摘要 |
| **`test:smoke-be`** | **仅 BE 冒烟**：启动/health + 主路径 API | `atlas/logs/be-smoke.*` 或终端记录 |
| **`test:smoke-fe`** | **仅 FE 冒烟**：通用 Playwright | `atlas/logs/fe-smoke.*` |
| **`test:pixel-fe`** | **FE 像素对比**（有原型图时）：截图 vs 原型 | `atlas/tests/fe-pixel/report.json` |
| **`test:5-0`** | 仅测试入场门禁（CLI 短名） | 写入 tests README 或 logs |
| **`test:5a`** / **`test:5b`** | 仅 AC验收归档 / 仅全量回归（须已过测试入场） | 验收报告 / README |

**规则**：

1. 分层命令 **不自动**跑完整 AC验收/全量回归，除非用户写的是裸 `test:` / `tests:`  
2. `test:smoke` = 有啥跑啥（无 BE 跳过 be；无 FE 跳过 fe），**禁止**对不存在的端硬跑  
3. 分层跑完：证据落盘；**AskQuestion** 是否继续全量 `tests:` / 修失败 / 暂停 → 停  
4. 可运行闸门 / 演示前可用 `test:smoke*` / `test:pixel-fe`（有原型）点名复验

**任务编排（默认串行）**：阶段 3 写 todo 开发任务 + 功能依赖表；阶段 4 **先 TodoWrite 展开每个 T 的①②③**，再主 Agent 逐项构思落盘→开发→可运行闸门→AC验收。「全部开发」= 展开清单后串行连做，**≠** 启 Task/Subagent 批量写码。用户显式「并行开发 / 同时开发 FE+BE / 多 subagent」时 → [parallel-orchestration.md](parallel-orchestration.md)（须并行启动卡且每 T 已有合规①）。

## §atlas/ 结构

> **`atlas/`** = 流程文档的**根容器**，不是「把一切揉成一份」。  
> 子目录按阶段**物理隔离**：需求归 `requirements/`、模型归 `model/`、方案归 `solution/`、构思归 `dev/`、验收归 `tests/`。  
> **禁止**：把不同阶段产物写进同一文件；把多份独立功能糊成一份「总览 REQ」冒充完成；向用户编造「历史目录 / 旧名迁移 / 为什么要集中」之类解释——只陈述下表约定。

```
atlas/
├── init/                      # init: 仅 brownfield
│   ├── codebase/p1-{端}.md    # 模式 B：§一~§四（首次 init 须问 A/B）
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
│   └── fe-pixel/              # 像素对比（配置+结果）
│       ├── pages.json
│       ├── report.json
│       ├── summary.md
│       └── artifacts/
├── logs/                      # 冒烟/编译等运行证据
├── glossary.md                # 术语唯一权威（req/init refresh 追加；见裁决表）
├── debt.md                    # 技术债看板（阶段 4 首次记待回溯/事后补写时建；阶段 5 须清零）
├── todo.md · humanTodo.md · active-edits.md（按需；active-edits 仅并行启用时建）
```

- 各目录下 `temp/` 放临时稿（见 §TEMP）
- 无独立前缀：`todo.md` / `humanTodo.md` / `active-edits.md` 随 req/sol/dev 阶段更新
- **业务源码**写在工程正常位置（如 `src/`、`miniprogram/`），**不**塞进 `atlas/`

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

**用户坚持跳过 init 的处理**（brownfield 项目用户显式要求跳过时）：
1. AskQuestion：「检测到已有代码库。跳过 init 可能导致写法锚点缺失。确认跳过？」
2. 用户确认 → 在 todo.md 标注 `init: 用户跳过（风险已知）`
3. 后续 dev 阶段写法锚点检查：无 init/code-patterns 时标注 `⚠️ 无写法锚点（init 被跳过）`，不阻塞但提示风险
4. **禁止静默跳过——必须留痕**

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
- 仍遵守 ① 构思落盘 → ② 按 **## 做法** 写码 → ③ 对照 REQ 验收 AC（② 可精简但 **## 做法** 仍须逐步）；纯 refactor 无 AC 变更可豁免 ③
- **禁止**在正式目录用 `TEMP-` 前缀命名（统一用 `temp/` 子目录）

### temp / 快速通道硬禁（防止「自称小改动」）

命中**任一** → **禁止** `dev/temp/`、**禁止**快速通道豁免，必须走正式 req→sol→`### T`+①②③：

| 禁入条件 |
|----------|
| 用户已启用 Agileflow / `@agileflow` / 正在交付 MVP·新系统 |
| 涉及 API / DB / 权限 / 支付 / 多模块 / 跨 ≥2 文件 / 预估 >20 行 |
| `atlas/todo` 已有正式开发任务或已确认 solution |
| 用户说「只看成品 / 直接全开发」但 scope 是产品功能（非单行 typo） |

**灰色地带**（Agent 想自称微型改动但不确定）→ **必须 AskQuestion**：「走完整流程 / 确认属微型豁免」；禁止自行判豁免后开写。  
`temp/` 文件 **不计入** `dev/T-*.md` 与 T 头等式；**禁止**用 temp 顶替正式①后标「开发实现 ✅」。

---

## §建模按需判定（阶段 2 非必经）

Agent 先按条件表**建议**「跳过 / 增量 / 全量」，再按下方规则问人或落盘。**禁止**自行静默跳过。

### 建议「跳过」的条件（须**全部**满足）

- 已有 `atlas/model/README.md` 为 **已确认**
- 本次工作**不引入**新聚合根/实体/值对象
- **不改变**实体间关系（基数、归属、外键）
- **不新增/修改**领域规则、状态机、存储结构

### 跳过须用户确认（堵静默）

建议跳过时，**落盘前**必须 AskQuestion → **停**（除非用户本轮原话已含「跳过建模 / 不用建模 / 模型不用改」）：

```yaml
title: "建模判定确认"
questions:
  - id: modeling_action
    prompt: |
      建议【跳过】阶段 2（自检：无新实体/无关系变更/无新规则/无存储结构变更）。
      覆盖依据预览：{文件路径 §章节}
      请确认：
    options:
      - id: skip_confirm
        label: "确认跳过（写建模判定，进方案）"
      - id: do_incremental
        label: "仍要增量建模"
      - id: do_full
        label: "仍要全量建模"
```

| 选项 | 下条动作 |
|------|----------|
| skip_confirm | 落盘「建模判定：跳过」+ todo `⏭️` → 可进阶段 3 |
| do_incremental / do_full | 进阶段 2 对应路径 |

**跳过确认后必须落盘「建模判定」**（禁止只口头跳过）：

```markdown
📋 建模判定：跳过
- 已确认 model：atlas/model/README.md（v{x}）
- 覆盖依据：{本次改动点} → 已由 {实际存在的文件：model-overview.md §x 或 domain-model.md §x / …} 覆盖
- 自检四项：无新实体 ✅ / 无关系变更 ✅ / 无新规则 ✅ / 无存储结构变更 ✅
- 用户确认：AskQuestion skip_confirm | 原话「{摘录}」
```

缺「覆盖依据」、四项未勾、或**无用户确认** → **禁止跳过**，须进阶段 2（增量或全量）。

> **覆盖依据校验（Agent 自检）**：写入覆盖依据前，Agent 须先 Read 引用的文件路径，确认文件存在且引用的章节存在。引用不存在的文件/章节 = 跳过判定无效，须进阶段 2。

**必须进入或增量更新 model/**（**不问「能否跳过」**，直接进阶段 2），当**任一**命中：

- 新实体或新聚合根
- 实体关系变化（1:N→N:M、新增外键、拆分表）
- 新业务规则/状态机/不变量
- 持久化层结构变化（新表、改字段、改索引）
- 首个 REQ 且尚无 model/（首次需完整建模）
- **greenfield 且有 DB/持久化**（禁止「无 model 就跳过」）
- **model/README.md 状态为「草稿」**（须完成确认或更新后才能跳过）

**增量更新**：只改**实际存在**的文件章节（快速→`model-overview.md`；严谨→对应五件套）；改完结束闸门 → 停止。

**阶段前缀 `mod:`**（=`model:`）：强制进入阶段 2；AskQuestion 提供跳过/增量/全量。

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
| **微型改动** | **同时**满足：单文件 ≤20 行；无 API/DB/权限/支付；**且**未命中下方「豁免边界」 | 改代码 → **静态检查+AC单测** → 更新 todo | 灰色地带须 AskQuestion |
| **Hotfix** | 用户**原话**含 hotfix / 紧急修复（Agent 不得自行贴标签）**且未命中豁免边界** | **静态检查+AC单测**；核心路径再加 **冒烟** | ❌ |
| **快速通道** | 用户说快速改 / 不走流程 **且** 确属微型改动 | 微型改动 + 不写 REQ/model/solution | 灰色地带须 AskQuestion |

### 豁免声明（强制 · 堵静默逃逸）

走豁免时，**本回复首行**必须含：`豁免：问答` / `豁免：微型` / `豁免：hotfix` / `豁免：快速通道`。  
**禁止**不声明就当豁免开写。灰区（想自称微型但不确定）→ **必须 AskQuestion**，禁止自行判豁免。

**快速通道边界**：「不走流程」仅微型改动。MVP/多模块/API·DB / 已启用 Agileflow 交付 → **禁止** temp/快速通道（见 [temp 硬禁](#temp--快速通道硬禁堵自称小改动)）。  
「可压缩」**仅指** AskQuestion 停点次数，以及快速模式下非关键段落可标 **待补齐**（`##` 标题仍须按风险档位齐全），**不指**跳阶段、**不指**省略标题、**不指**把 todo/①②③压成摘要或空壳。

> **「快速模式」≠「快速通道」**：快速模式仍按序 req→mod→sol→dev，todo 仍详细。  
> 「用户不用管」→ **AI 自主**，不是快速通道、也不是跳阶段。

**豁免边界（任一命中走完整流程）**：API/DB/权限、支付/敏感数据、多模块、用户要求完整流程、跨 2+ 文件或 >20 行、**用户说只看成品/直接开发但 scope 为新系统 MVP**、`@agileflow` / 已有正式 solution·todo。

**禁止**：Agent 把 MVP 功能拆成「多次 ≤20 行」连环豁免。

豁免只更新 `atlas/todo.md`；不生成 REQ/model/solution 文档。测试层见 [l1-l5-pipeline.md](../templates/l1-l5-pipeline.md)。  
> 豁免声明 = **C 档纪律**（脚本不扫聊天）；不声明仍属违规。

---

## 模式判定（快速 / 严谨）

**权威** → [flow-modes.md](../templates/flow-modes.md)（**快速仍按序走完阶段、todo 仍详细**；风险维度→分档：精简/标准/完整；「全部做」只催进度不切模式）。

| 条件 | 动作 |
|------|------|
| 无 env / `AF_FLOW=pending` / `AF_DECIDE=pending` | **流程启动卡**（模式+决策权）→ 停；见 [stage-delegation](../templates/stage-delegation.md#流程启动卡首启强制) |
| 用户原话已同时点明两边 | 写入 env 后进阶段；首行声明依据 |
| 仅点明一边 | 仍发启动卡；已点明项可预填 |
| env 已是 `fast`/`strict` + `ai`/`user` | 首行声明；**禁止**再静默改模式 |

「后面都你定 / 不用问我」→ **决策：AI自主**，**不要**解读为可跳过 req/sol；若模式仍 pending → 启动卡只问模式或合并问清。

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
| 这阶段你定 / 后面都你定 / 不审了继续 | ai_decide / global / skip_review |
| 这阶段我来 | user_decide |
| 重选模式 / 换流程 / 重开启动卡 / 重新选决策权 | **契约重选** → pending + 流程启动卡 |

### 用户描述需求（最常见入口）

用户**用原话**说要做啥 → **阶段 1**（须先过流程契约）：

| 状态 | 本回复做什么 |
|------|--------------|
| **契约未确认**（无 env / pending） | **流程启动卡** → 停。**禁止**落盘 REQ |
| **`AF_DECIDE=ai`（已确认）** | **直接落盘** REQ(+UID) + README + todo → **审阅闸门** → 停 |
| **`AF_DECIDE=user`** | 需求澄清卡（快速+完整 PRD 可跳过）→ 停 → 下条写 REQ |

**禁止**：契约未确认就落盘；已确认 AI自主却只问不写；user_decide 用聊天追问代替卡片；同回复写码。

### 硬规则：不可跳阶段（豁免与前缀单阶段模式除外）

| 目标阶段 | 最低前置条件 | 不满足时 |
|----------|--------------|----------|
| **0 init** | brownfield 判定 | greenfield → 跳过，进阶段 1 |
| 1 需求 | greenfield **或** brownfield 且 init 已确认（或本轮将完成 init） | brownfield → 阶段 0 |
| 2 建模 | ≥1 个 REQ「已确认」 | 退回阶段 1 或 AskQuestion |
| 3 方案 | model **已确认或按需跳过**（见 [建模按需判定](#建模按需判定阶段-2-非必经)） | 无 model 且需建模 → 阶段 2；否则 AskQuestion |
| 4 开发 | solution 已确认 **且** brownfield 时 init 已确认 **或** TEMP/dev 快速通道 | 退回阶段 3 / init / TEMP |
| 5 测试 | 开发任务已完成（或用户明确只验部分） | 提示先开发或 AskQuestion |

**按需跳过建模**：建议跳过时须 [用户确认](#跳过须用户确认堵静默)（卡或原话）；阶段 3 前置不要求 model 已确认，但首行须标注 `建模：跳过/增量/全量` 且跳过须有确认留痕。

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

| 场景 | 动作 |
|------|------|
| **`init:` / `init: refresh data`** | 阶段 0 → 读 00-project-init + init-doc → AskQuestion → 停止 |
| **`req: 新需求…`** | greenfield/brownfield 均阶段 1；brownfield 无 init 时 AskQuestion 先 init 或 req |
| **`dev: 实现某功能`** | brownfield：init 已确认 + solution → 阶段 4；无 REQ → `dev/temp/` |
| **`dev: 只写思路`** | 阶段 4 步骤 ① 构思落盘 → AskQuestion 是否进入 ② → 停止 |
| **`sol:`** | 阶段 3 方案；建模按需 |
| **`tests: 验收 REQ-001`** / **`test:`**（无后缀） | 全量阶段 5 |
| **`test:smoke`** | 两端冒烟（G3）；有 FE 含 Playwright |
| **`test:smoke-be`** | 仅 BE 冒烟 |
| **`test:smoke-fe`** | 仅 FE Playwright 冒烟 |
| **`test:pixel-fe`** | FE 像素对比（有原型；见 [fe-pixel-compare](../templates/fe-pixel-compare.md)） |
| **`test:unit`** / **`test:l3`** | 仅单测 / AC 自动化 |
| 纯解释、无交付物 | 豁免，不启用阶段 |
| 改一行 bug | 豁免：静态检查+AC单测 |
| 新项目 **greenfield** / 用户发需求 | **先**流程启动卡（除非原话已点明模式+决策）→ 答完再阶段 1：`ai` 落盘+审阅；`user`→需求卡 |
| 阶段闸门选「是，继续」 | **下条回复**落盘下一阶段（model/solution/dev） |
| 接手 **brownfield** / 无 atlas/init | 阶段 0 → **先问写法锚点模式 A/B** → 落盘 init → 确认卡 → 停止 |
| 有 todo、用户说「继续 agileflow」 | 读建议阶段 → 读对应 phase；**默认不读** parallel-orchestration |
| 用户指定阶段且前置满足 | 直接进该 phase |
| 用户指定阶段但前置不满足 | AskQuestion：补前置 or 豁免 |
| 意图模糊 | AskQuestion 阶段确认卡片 |
| 「这阶段你定 / 不用问我 / 全自动」 | 当阶段 **ai_decide** → [stage-delegation.md](../templates/stage-delegation.md) |
| 「重选模式 / 换流程 / 重开启动卡」 | **契约重选** → [stage-delegation](../templates/stage-delegation.md#契约重选旧项目--已确认后想改) |
| 「后面都你定」 | **ai_decide_global** → 写 todo 决策委派 |
| 「不审了继续 / 跳过审阅」 | 审阅闸门 **skip_review_continue** |
| 「这阶段我来决策」 | 覆盖全局 → **user_decide** |
| 审阅闸门选「重选流程契约」 | 同契约重选 |
| 仅维护 todo/humanTodo | [task-tracking.md](task-tracking.md) |
| 改已确认/已实现 REQ | [change-management.md](change-management.md) |

---

## 进入阶段后的行为

1. 输出阶段声明行（含 `模式` + `决策`；见 [SKILL.md 首行声明](../SKILL.md#首行声明)）
2. **契约检查**：无 env / pending → [流程启动卡](../templates/stage-delegation.md#流程启动卡首启强制) → 停。已确认后：`ai` → 跳过阶段决策权卡直接落盘 → 审阅闸门；`user` → 澄清卡链（[stage-delegation](../templates/stage-delegation.md)）
3. **只读一个 phase 文件**（init → `00-project-init.md`；变更 → `change-management.md`；开发 → `04-development.md`）
4. **允许共读**：该 phase 文内显式链接的 `templates/*`
5. **阶段 4 必读共读**（与 [SKILL 加载表](../SKILL.md#加载) 一致）：[dev-quickstart.md](../templates/dev-quickstart.md) + [04-development.md](04-development.md) + exemplar（按端）+ [todo.md TodoWrite](../templates/todo.md#todowrite-强制展开防漏①--最高优先级)；F/MVP 切片齐时另读 [askquestion-gate 阶段性卡](../templates/askquestion-gate.md#阶段性确认卡阶段-4-内--mvp--f-xxx-切片强制)
6. **阶段 0/1–4 产出完成** → user_decide：阶段闸门；ai_decide：审阅闸门 → **停止**
7. 并行仅显式要求时读 [parallel-orchestration.md](parallel-orchestration.md)（须并行启动卡）
