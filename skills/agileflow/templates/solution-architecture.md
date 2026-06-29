# architecture.md 模板（specs/solution/）

> 技术栈、架构、测试依赖、可观测性、验证命令合并在一份文档。
> **技术栈须来自 [solution-tech-askquestion.md](solution-tech-askquestion.md) 用户选择或仓库实际栈，禁止直接抄下方示例值。**
> 可观测性细则见 [observability-logging.md](observability-logging.md)。

```markdown
# 架构与实现

## 技术栈

| 层 | 选型 | 说明 |
|----|------|------|
| 语言 | TypeScript | … |
| 框架 | NestJS | … |
| 数据库 | PostgreSQL | 见 model/physical-model.md |

## 系统架构图（ASCII）

```
[Client] → [API] → [order-service] → [DB]
```

## 文件结构

```
src/modules/order/
src/modules/payment/
```

## 追溯矩阵

| REQ | 功能ID | 接口ID | 聚合 | 模块 |
|-----|--------|--------|------|------|
| REQ-001 | F-001 | API-001 | Order | order-service |

---

## 测试依赖与环境

> 跑测试/验收需要的外部依赖；L3 mock、L5 真连。

### 依赖清单

| 依赖 | 类型 | L3 策略 | L5 策略 | 配置方式 |
|------|------|---------|---------|----------|
| PostgreSQL | 数据库 | 内存/testcontainers | Docker | DATABASE_URL=... |
| 微信支付 | 第三方 | mock | 沙箱 | humanTodo #N |

### 环境变量

- 测试：`.env.test`；禁止硬编码生产密钥

### 本地验证一条命令

`docker compose up -d && npm test`

### Mock 与真连

- L3 mock：支付 API
- L5 真连：支付沙箱（缺密钥 → humanTodo）

---

## 可观测性

| 项 | 选型 |
|----|------|
| 日志框架 | pino |
| 日志目录 | logs/ |
| traceId | HTTP 入站生成 |

### REQ→event 映射表

| REQ | 场景 | event 名 | level | 关键字段 |
|-----|------|----------|-------|----------|
| REQ-001 | 场景1 | order.created | INFO | orderId, userId |

---

## L1–L5 验证命令

| 层 | 命令 | 通过标准 |
|----|------|----------|
| L1 | `npm run lint` | 无 error |
| L2 | `npm run build` | 成功 |
| L3 | `npm test` | 全过 |
| L4 | `npm run test:cov` | 变更模块 ≥80%（严谨） |
| L5 | `npm run test:e2e` | 核心冒烟通过 |
```

## 方案自检表

| 检查项 | 不通过则 |
|--------|----------|
| `features/` 覆盖所有已确认 REQ | 退回阶段 1 |
| 每个 feature 有 `## 边界` | 补边界节 |
| 有暴露面的功能有对应 `contracts/` 文件 | 补契约或改暴露面为「无」 |
| `architecture.md`（全局唯一）含测试依赖 + L1–L5 | 禁止进阶段 4 |
| `architecture.md` 技术栈与用户 AskQuestion 一致 | 退回重问或改 architecture |
| `todo.md` 开发任务关联功能/契约 ID | 补任务 |

## 开发任务写入 todo.md（阶段 3 第 8 步）

**禁止**在 solution/ 下另建 tasks.md。拆解后直接写入 `specs/todo.md`：

```markdown
## 开发任务

### T-001：[BE] 创建 orders 表（30min）— F-001
- [ ] **① 构思落盘** → `specs/dev/T-001-orders表-BE.md`
- [ ] **② 按 五、核心流程 写码**
- [ ] **③ 对照 REQ 验收 AC**

### T-002：[BE] 实现创建订单 API（2h）— F-001 / API-001
- [ ] **① 构思落盘** → `specs/dev/T-002-创建订单API-BE.md`
- [ ] **② 按 五、核心流程 写码**
- [ ] **③ 对照 REQ 验收 AC**
```

规则：每项 ≤4h；必须关联功能 ID；实现接口的任务须关联接口 ID；**每 T-xxx 必须含 ①②③ 三步子项与 dev 路径**（见 [todo.md](todo.md)）。
