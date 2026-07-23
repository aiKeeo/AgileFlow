# 方案设计核心模板（atlas/solution/）

> **格式模板**：示例域名（订单/登录等）仅演示章节结构，落盘时替换为当前项目。
> **四要素**：① 功能（含边界） ② **契约/接口文档**（按需，集中放 `contracts/`） ③ 架构（全局一份） ④ 任务（**`atlas/todo.md` 根**，禁止 `solution/todo.md`）
> **质量同质**：`ai` / `user` **同质**——禁止因决策权薄写 F、契约、architecture、todo。要加速 → [并行](../phases/04-development.md#并行阶段-4)。对照 → [dev](dev.md) · [contract](contract.md)

## 颗粒度铁律（开发要看得清）

| 产物 | 必须写到 | **禁止**（模糊/偷懒） |
|------|----------|------------------------|
| **F 边界** | **做**=AC Then 并集可对照；**不做**=范围外∪无 AC；暴露面编号齐全 | 「做登录相关」「等」「视情况」；空「不做」 |
| **contracts/API** | 路径/方法/鉴权/请求字段类型/响应/错误码表 | 「见代码」「大致 JSON」「字段待定」当已确认 |
| **contracts/UI** | 路由 + §字段绑定（页面控件↔请求/响应字段↔接口） | 只写「登录页」无绑定行；粘贴 UID 整图 |
| **architecture** | 技术栈来源、模块、本地启动/验证命令 | 「常规 Spring 分层」无命令；无模块边界 |
| **todo T 头** | `### T-xxx：[端] 简述 — F-xxx` + ①②③ 路径 | 扁平 `- [ ] 做登录`；多端塞一个 T |

**开发者打开 F/契约后应能直接动手**，不必再猜「做多少、接口长什么样」。

## contracts/ 是干嘛的（保留的理由）

> **暴露面文档库**——所有 HTTP 接口、页面规格、定时任务、事件消息的**详细规格集中在这里**，方便查阅和对照，不必在 feature 里翻长段 JSON。

| 目录 | 回答 | 谁来看 |
|------|------|--------|
| `features/` | 这个功能**做什么**、**边界**、暴露面链接 | 开发日常打开 |
| **`contracts/`** | 暴露面**完整规格**（入参/出参/路由/错误码） | 改接口时 drill-down |
| `architecture.md` | 全局技术栈、怎么跑 | 新人/oncall |

**好找**：`README.md` 有「契约清单」索引；按 `API-001`、`UI-002` 编号；`_common.md` 放鉴权、错误格式等通用约定。

**分工**：feature 头部写 `- **暴露面**：API-001, UI-001` 并链到 contracts；**不在 feature 里重复粘贴完整请求体**——详情只在 contracts/ 维护一份（单一来源）。

**何时才建文件**：有对外暴露（API/UI/JOB/EVT）才建；暴露面「无」的功能**没有**对应 contract 文件。

**禁止**：`contracts/API.md` / `UI.md` 单文件揉全部接口（`SOL-C001-FAT`）；`atlas/solution/todo.md`（todo 只在 `atlas/todo.md`）。

> **门牌**：用户说 `/af-sol` = 进入方案步，**不是**建 `atlas/sol/`。目录名永远是 `atlas/solution/`。见 [atlas-structure 路径铁律](../phases/atlas-structure.md#路径铁律落盘前自检--写错即闸门红)。
> 技术栈 AskQuestion（写 architecture 前）：[contract.md](contract.md)

## 目录结构

```
atlas/solution/
├── README.md              # 索引 + 状态
├── features/              # 每功能一文件（含 §边界）
├── contracts/             # 【接口/暴露面文档库】API、UI、JOB、EVT 详细规格
│   ├── _common.md         # HTTP 通用约定（鉴权、错误格式）
│   ├── API-001-创建订单.md
│   ├── UI-001-下单页.md
│   └── JOB-001-日终对账.md
├── architecture.md        # 【全局唯一】技术栈、模块一览、测试层命令（不写代码模板）
└── code-patterns-{端}.md    # greenfield 模式 B 🌱：§一~§四（见 code-conventions.md）
```

**无** `boundaries.md`——边界写在各 `features/F-xxx.md` 的 `## 边界` 节。

**无** 每功能一份架构——`architecture.md` 全项目共享，仅维护一份。

## README.md 模板

```markdown
# 方案设计（Solution）

- 状态：草稿 | 已确认
- 关联需求：REQ-001, REQ-002
- 关联模型：[atlas/model/README.md](../model/README.md)
- 全局架构：[architecture.md](architecture.md)

## 功能清单

| 功能ID | 文档 | 关联 REQ | 暴露面 | 优先级 |
|--------|------|----------|--------|--------|
| F-001 | [F-001-创建订单.md](features/F-001-创建订单.md) | REQ-001 | API-001, UI-001 | P0 |

## 契约清单（接口文档索引 — 有暴露面才列）

| 契约ID | 类型 | 文档 | 关联功能 | 一句话 |
|--------|------|------|----------|--------|
| API-001 | HTTP | [API-001-创建订单.md](contracts/API-001-创建订单.md) | F-001 | POST 创建订单 |
| UI-001 | 前端 | [UI-001-下单页.md](contracts/UI-001-下单页.md) | F-001 | 下单页路由与交互 |

## AC → 主 T（每条 AC 唯一主责；文件不合）

| AC ID | 观测面 | 主 T | 建议测法 |
|-------|--------|------|----------|
| AC-001-01 | API | T-001 | ② UT + ③ 薄 ac |
| AC-001-03 | 规则 | T-001 | ② UT（主证据） |
| AC-001-04 | UI | T-002 | ② 前端单测 |

## 开发者一览（人扫）

| 问 | 答 |
|----|-----|
| 要做啥 | … |
| 不做啥 | …（← REQ 范围外 / 无 AC） |
| 动手顺序 | T-001 → T-002（独立 dev 文件） |

## 开发任务

见 [atlas/todo.md](../todo.md)
```

## 从 REQ 提炼功能与边界（强制）

> F **禁止**凭空编边界。AC 颗粒度与挂 T → [../phases/05-testing.md](../phases/05-testing.md)。

| F 字段 | 提炼规则 |
|--------|----------|
| **做** | = 关联 REQ 全部 AC 的 Then 并集（压成 1–3 句业务话） |
| **不做** | = REQ「范围提示·范围外」∪ 故事邻域但**无任何 AC**覆盖的能力 |
| **暴露面** | 观测面含 API→API-xxx；含 UI→UI-xxx |
| **回溯** | 正文须含 `← REQ-xxx · AC-xxx-01～nn`（可写在标题下或边界首行） |

**禁止**：与本 REQ 无关、且未出现在范围提示/AC 的「不做」注水。

## features/F-xxx-{名}.md 模板

```markdown
# [F-001] {功能名}

- 关联 REQ：REQ-001
- ← REQ-001 · AC-001-01～…
- 优先级：P0
- **暴露面**：API-001, UI-001 → 详情见 [contracts/](../contracts/)
- depends_on：—

## 说明

{一句话，← 用户故事}

## 边界

**做**：{可对 AC Then}（← AC-…）
**不做**：{范围外}（← REQ）
**约定**：{关键约束}
```

- `暴露面：无` → 纯 FE 样式/refactor，**不建** UI/API 契约
- 有 API → 只建 `contracts/API`；**F 上不加**绑定节
- 有 UI 且调 API → 建 `contracts/UI`，**§字段绑定** 写在这里
- **禁止** F `## 联调卡` / `## 字段绑定` / `## 验收要点` / 编号主路径（行为见 REQ AC）

## 暴露面类型（contracts/，按需）

| 前缀 | 类型 | 何时写 |
|------|------|--------|
| 无 | — | 纯 FE 样式、refactor 等；feature 标「暴露面：无」 |
| API- | HTTP | 对外 REST/RPC |
| UI- | 前端 | 页面/组件规格 |
| JOB- | 后台 | 定时/异步任务 |
| EVT- | 事件 | 发布/订阅 |

## contracts/API-xxx.md（HTTP 接口文档）

```markdown
# [API-001] {接口名}

- 关联功能：[F-001](../features/F-001-{名}.md)
- 类型：HTTP {METHOD}
- 路径：`/api/{resource}`
- 鉴权：{见 _common 或 无}

## 请求体

`{ … }`

## 响应

**{code}** `{ … }`

## 错误码

| HTTP | code | 说明 |
|------|------|------|
| {n} | {CODE} | {说明} |
```

> 开发、联调、写 AC 验收测试时**直接打开本文件**，不必翻 feature 或源码。

## contracts/UI-xxx.md / JOB-xxx.md / EVT-xxx.md

**UI-xxx 来源**：读 REQ 阶段 [UID](../../requirements/ui/) → 写**技术增量**（路由、组件树、API 绑定）。**线框唯一权威在 UID**；本文件**禁止粘贴** UID 整图。样式以用户 sol 阶段确认为准。

```markdown
# [UI-001] {页面名}

- 关联功能：[F-001](../features/F-001-{名}.md)
- 关联 UID：[UID-001](../../requirements/ui/UID-001-{名}.md)
- 路由：`/{path}`
- 样式状态：⬜ 待定 | ✅ 已确认

## 布局

→ [UID-001](../../requirements/ui/UID-001-{名}.md)（线框唯一权威；禁止粘贴整图）

## 组件树
（由 UID 展开为技术组件名）

## 字段绑定

> 行为见 REQ AC；接口形状见 API。

| 页面上 | 请求字段 | 接口 |
|--------|----------|------|
| {控件} | `{field}` | API-001 … |

### 读出（本页）
| 页面上 | 响应字段 | 来源 |
| `token` | `token` | API-001 200 响应 → 存 storage |
```

## contracts/JOB-xxx.md（定时/异步任务）

```markdown
# [JOB-001] 日终对账

- 关联功能：[F-001](../features/F-001-订单.md)
- 触发：cron `0 2 * * *` | 手动：`POST /admin/jobs/reconcile`
- 幂等键：`jobRunId` / 业务日期

## 输入
| 项 | 说明 |
|----|------|
| bizDate | 对账业务日 |

## 输出
| 项 | 说明 |
|----|------|
| reconciledCount | 成功对账笔数 |

## 失败与重试
| 场景 | 处理 |
|------|------|
| 部分失败 | 记录失败明细，可重跑 |
| 重复触发 | 幂等键去重 |
```

## contracts/EVT-xxx.md（事件消息）

```markdown
# [EVT-001] order.paid

- 关联功能：[F-001](../features/F-001-订单.md)
- 方向：发布 | 订阅
- Topic/Exchange：`order.events`

## Payload
| 字段 | 类型 | 说明 |
|------|------|------|
| orderNo | string | 订单号 |
| paidAt | datetime | 支付时间 |

## 消费方
| 订阅方 | 处理 |
|--------|------|
| InventoryService | 扣减预留库存 |
```

## architecture.md（全局唯一）

```markdown
# 项目架构

> 全项目共享，不按功能拆分。阶段 3 首次创建，后续增量追加章节。

## 技术栈
## 模块划分 / 架构图
## 目录结构
## test/ac/ 与测试层
## 可观测性
## 测试层验证命令
```

## AskQuestion 确认方案

```
title: "方案设计确认"
questions:
  - id: "confirm_features"
    prompt: "功能清单是否完整？各功能 §边界 是否清晰？"
  - id: "confirm_contracts"
    prompt: "契约（contracts/）是否正确？无暴露面的功能应无契约文件"
  - id: "confirm_architecture"
    prompt: "全局 architecture.md 是否认可？"
```
