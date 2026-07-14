# architecture.md 模板（atlas/solution/）

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

> 跑测试/验收需要的外部依赖；AC单测 mock、冒烟真实连接。

### 依赖清单

| 依赖 | 类型 | AC单测策略 | 冒烟策略 | 配置方式 |
|------|------|------------|----------|----------|
| PostgreSQL | 数据库 | 内存/testcontainers | Docker | DATABASE_URL=... |
| 微信支付 | 第三方 | mock | 沙箱 | humanTodo #N |

### 环境变量

- 测试：`.env.test`；禁止硬编码生产密钥

### 本地验证一条命令

`docker compose up -d && npm test`

### Mock 与真实连接

- AC单测 mock：支付 API
- 冒烟真实连接：支付沙箱（缺密钥 → humanTodo）

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

## 测试层验证命令

| 测试层 | 命令 | 通过标准 |
|--------|------|----------|
| **静态检查** | `npm run lint` | 无 error |
| **构建** | `npm run build` | 成功 |
| **AC单测** | `npm test` | 全过 |
| **集成/覆盖率** | `npm run test:cov` | 快速：出报告即可；严谨：变更模块 ≥80% |
| **冒烟** | `npm run test:e2e` | 核心冒烟通过 |
```

## 方案自检表

| 检查项 | 不通过则 |
|--------|----------|
| `features/` 覆盖所有已确认 REQ | 退回阶段 1 |
| 每个 feature 有 `## 边界` | 补边界节 |
| 有暴露面的功能有对应 `contracts/` 文件 | 补契约或改暴露面为「无」 |
| `architecture.md`（全局唯一）含测试依赖 + 测试层命令（静态检查→构建→…） | 禁止进阶段 4 |
| `architecture.md` 技术栈与用户 AskQuestion 一致 | 退回重问或改 architecture |
| `todo.md` 开发任务关联功能/契约 ID | 补任务 |

## 开发任务写入 todo.md（阶段 3 第 8 步）

**禁止**在 solution/ 下另建 tasks.md。拆解后直接写入 `atlas/todo.md`：

```markdown
## 开发任务

### T-001：[BE] 创建 orders 表（30min）— F-001
- [ ] **① 构思落盘** → `atlas/dev/T-001-orders表-BE.md`
- [ ] **② 按 ## 做法 写码**
- [ ] **③ 对照 REQ 验收 AC**

### T-002：[BE] 实现创建订单 API（2h）— F-001 / API-001
- [ ] **① 构思落盘** → `atlas/dev/T-002-创建订单API-BE.md`
- [ ] **② 按 ## 做法 写码**
- [ ] **③ 对照 REQ 验收 AC**
```

规则：每项 ≤4h；必须关联功能 ID；实现接口的任务须关联接口 ID；**每 T-xxx 必须含 ①②③ 三步子项与 dev 路径**；阶段 4 入口须 **TodoWrite 为每个 T 展开①②③三条**（见 [todo.md](todo.md#todowrite-强制展开防漏①--最高优先级)）。

### 阶段 3 结束前自检（不通过禁止标方案已确认 / 禁止进阶段 4）

| 检查项 | 检查 | 不通过 |
|--------|------|--------|
| **T 头格式** | 每个任务是 **`### T-xxx` 或 `#### T-xxx` 标题行**（可带 `[BE]`/`[FE]`）；**`## T-` 不算合法 T 头** | 只有 `- [ ] T-001 …` 扁平一行；或 `## T-001` |
| **①②③ 三步** | 每个 T 头下有 **① 构思落盘**（含 `atlas/dev/T-xxx` 路径）+ **②** + **③** 三行 | 缺任一步；无 dev 路径 |
| **质量门槛冻结区** | `todo`「开发任务」上方已含 **① 质量门槛**冻结表（读过范例～字面量校验 + 机械 grep；**禁止改写成项目自定义规则**） | 阶段 3 未写入 / 被改写成非 grep 门槛 |
| **禁止合并多 T** | 禁止用「后端全部 / 前端全部」一条代替多 T | 合并多 T |
| **禁止分组冒充 T 头** | 分组标题（如 `### 后端`）**不算** T 头；T 头必须形如 `### T-001` | 用分组冒充任务 |

```markdown
❌ 阶段 3 禁止写出（扁平列表反模式）
### 后端 — 全部 ✅
- [x] T-001 后端脚手架
- [x] T-002 认证 API
（无 ①②③、无 per-T dev 路径 → 阶段 4 会跳过构思直接写码）
```
