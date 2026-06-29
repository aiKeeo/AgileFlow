# 方案设计核心模板（specs/solution/）

> **四要素**：① 功能（含边界） ② **契约/接口文档**（按需，集中放 `contracts/`） ③ 架构（全局一份） ④ 任务（todo.md）

## contracts/ 是干嘛的（保留的理由）

> **暴露面文档库**——所有 HTTP 接口、页面规格、定时任务、事件消息的**详细规格集中在这里**，方便查阅和对照，不必在 feature 里翻长段 JSON。

| 目录 | 回答 | 谁来看 |
|------|------|--------|
| `features/` | 这个功能**做什么**、边界、验收 | 产品/全栈看业务 |
| **`contracts/`** | 这个暴露面**长什么样**（入参/出参/路由/错误码） | **开发/联调/写测试时直接打开** |
| `architecture.md` | 全局技术栈、怎么跑 | 新人/oncall |

**好找**：`README.md` 有「契约清单」索引；按 `API-001`、`UI-002` 编号；`_common.md` 放鉴权、错误格式等通用约定。

**分工**：feature 头部写 `- **暴露面**：API-001, UI-001` 并链到 contracts；**不在 feature 里重复粘贴完整请求体**——详情只在 contracts/ 维护一份（单一来源）。

**何时才建文件**：有对外暴露（API/UI/JOB/EVT）才建；暴露面「无」的功能**没有**对应 contract 文件。
> **前缀**：用户说 `sol:` = 本目录。见 [00-intent-routing 目录前缀](../phases/00-intent-routing.md#目录前缀最高优先级)。
> 技术栈 AskQuestion（写 architecture 前）：[solution-tech-askquestion.md](solution-tech-askquestion.md)

## 目录结构

```
specs/solution/
├── README.md              # 索引 + 状态
├── features/              # 每功能一文件（含 §边界）
├── contracts/             # 【接口/暴露面文档库】API、UI、JOB、EVT 详细规格
│   ├── _common.md         # HTTP 通用约定（鉴权、错误格式）
│   ├── API-001-创建订单.md
│   ├── UI-001-下单页.md
│   └── JOB-001-日终对账.md
└── architecture.md        # 【全局唯一】技术栈、架构、L1–L5、可观测性
```

**无** `boundaries.md`——边界写在各 `features/F-xxx.md` 的 `## 边界` 节。

**无** 每功能一份架构——`architecture.md` 全项目共享，仅维护一份。

## README.md 模板

```markdown
# 方案设计（Solution）

- 状态：草稿 | 已确认
- 关联需求：REQ-001, REQ-002
- 关联模型：[specs/model/README.md](../model/README.md)
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

## 开发任务

见 [specs/todo.md](../todo.md)
```

## features/F-xxx-{名}.md 模板

```markdown
# [F-001] 创建订单

- 关联 REQ：REQ-001
- 关联聚合：Order
- 优先级：P0
- **暴露面**：API-001, UI-001 → 详情见 [contracts/](../contracts/)
- depends_on：—

## 说明

用户选择商品并提交，生成待支付订单。

## 边界

**本功能做**：选商品、提交、生成待支付订单
**本功能不做**：支付、退款、物流
**模块约束**：order 模块不直接调支付渠道

## 验收要点

- Given 库存充足 When 提交 Then 返回 orderId
```

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
# [API-001] 创建订单

- 关联功能：[F-001](../features/F-001-创建订单.md)
- 类型：HTTP POST
- 路径：`/api/orders`
- 鉴权：登录用户（见 [_common.md](_common.md)）

## 请求体

`{ "items": [{ "skuId": "string", "quantity": 1 }], "idempotencyKey": "string" }`

## 响应

**201** `{ "orderId": "uuid", "status": "pending_payment" }`

## 错误码

| HTTP | code | 说明 |
|------|------|------|
| 409 | OUT_OF_STOCK | 库存不足 |
```

> 开发、联调、写 AC 验收测试时**直接打开本文件**，不必翻 feature 或源码。

## contracts/UI-xxx.md / JOB-xxx.md / EVT-xxx.md

**UI-xxx 来源**：读 REQ 阶段 [UID](../../requirements/ui/) → 转写为技术契约（路由、组件、状态、绑定的 API-xxx）。**UID 有的结构与交互必须保留**；样式以用户 sol 阶段确认为准。

```markdown
# [UI-001] 登录页

- 关联功能：[F-001](../features/F-001-登录.md)
- 关联 UID：[UID-001](../../requirements/ui/UID-001-登录页.md)
- 路由：`/login`
- 样式状态：⬜ 待定 | ✅ 已确认（用户 / humanTodo）

## 组件树
（由 UID「关键组件与交互」节展开，补技术细节）

## 数据与 API
| 动作 | 契约 |
|------|------|
| 提交登录 | [API-001](API-001-登录.md) |
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
## test/ac/ 与 L1–L5
## 可观测性
## L1–L5 验证命令
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

## 正误示例

**✅** 边界写在 F-001 的 `## 边界`  
**✅** 全项目一份 architecture.md  
**❌ 单独建 boundaries.md**  
**❌ 每个 F 一份 architecture-xxx.md**
