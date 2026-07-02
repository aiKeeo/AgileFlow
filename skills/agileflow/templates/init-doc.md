# init 文档模板（atlas/init/）

> 阶段流程：[00-project-init.md](../phases/00-project-init.md)  
> **仅 brownfield（已有代码/可运行应用）**；纯从零新建系统 **不建 init/**。

## 阅读优先级（P0 / P1）

| 标签 | 含义 | 典型文件 |
|------|------|----------|
| **P0** | 不读完不宜动手：业务是谁、解决什么、能否跑通、仓库 | `p0-business.md`、`p0-repository.md`、`p0-environment.md` |
| **P1** | 写业务代码前必读：栈、代码结构（含架构模块）、现有数据 | `p1-tech-stack.md`、`codebase/`、`data/` |

- **没有就不建文件**（不写 N/A、不建空目录）
- **多个实体/关系/状态机 → 多个 `p1-*.md` 文件**，不要合并成大文档后再拆
- **术语**：≤8 个放 `p0-business.md`；**>8 或跨多域** → `glossary/p0-{域}.md`（按领域拆，**禁止**一词一文件）
- 文件名前缀 `p0-` / `p1-` 用于排序；文内首行须带 `> **P0** · …` 或 `> **P1** · …`

---

## README.md（必有，无前缀）

```markdown
# 项目初始化（init）

- **项目**：{项目名}
- **类型**：brownfield（已有代码盘点 · as-is）
- **状态**：草稿 | 已确认
- **最后更新**：{{日期}}

## 业务与用户（摘要）

- **解决什么问题**：{一句话}
- **目标用户**：{角色/人群}
- **核心流程**：{1~3 条 as-is 主流程}
- **核心术语**：{2~3 个最关键的} → 完整见 [p0-business.md](p0-business.md) / [glossary/](glossary/)（有则列）
- 详见 [p0-business.md](p0-business.md)

## 技术摘要
- 技术栈：{摘要} → [p1-tech-stack.md](p1-tech-stack.md)
- 架构与代码：{摘要} → [codebase/p1-{端}.md](codebase/p1-backend.md)（§一 含模块一览）

## 怎么跑

{启动命令与依赖摘要；详见 p0-environment.md；无运行时写一句说明}

## 数据概览（有 data/ 时）

{一句话：谁拥有什么数据} → [data/README.md](data/README.md)（实体是干什么的）· [data/relations/](data/relations/)（表怎么连）

## 实体从哪查（有 data/ 时）

| 我想知道… | 看哪 |
|-----------|------|
| 表/实体是**干什么的**、用户操作产生什么数据 | [data/README.md](data/README.md) → [data/entities/](data/entities/) |
| 某张表**字段**与 **API** | `data/entities/p1-{名}.md` |
| 表与表**什么关系** | [data/relations/](data/relations/) |
| **代码怎么写** | [codebase/p1-{端}.md](codebase/p1-backend.md) §三 |

## 代码结构 + 写法

→ [codebase/p1-{端}.md](codebase/p1-backend.md)（§一目录 · §二规范 · §三模板）

## P0 — 开工前必读

| 文档 | 说明 | 状态 |
|------|------|------|
| [p0-business.md](p0-business.md) | 业务、用户、核心流程 | ✅ / ⬜ |
| [p0-repository.md](p0-repository.md) | 仓库与分支 | ✅ / ⬜ |
| [p0-environment.md](p0-environment.md) | 启动与依赖 | ✅ / ⬜ |

### glossary/（术语多时有则列）

| 文档 | 说明 | 状态 |
|------|------|------|
| [p0-order-domain.md](glossary/p0-order-domain.md) | 订单域术语 | ✅ |

> 无 git / 无运行时：p0-repository / p0-environment 可省略；**p0-business 必建**。

## P1 — 写码前必读

| 文档 | 说明 | 状态 |
|------|------|------|
| [p1-tech-stack.md](p1-tech-stack.md) | 技术栈 | ✅ |
| [codebase/p1-{端}.md](codebase/p1-backend.md) | 架构·目录·写法·模板（**不单建 architecture**） | ✅ |

### data/entities/（有则列）

| 文档 | 状态 |
|------|------|
| [p1-order.md](data/entities/p1-order.md) | ✅ |

### data/relations/（有则列）

| 文档 | 状态 |
|------|------|
| [p1-order-user.md](data/relations/p1-order-user.md) | ✅ |

### data/state-machines/（有则列）

| 文档 | 状态 |
|------|------|
| [p1-order-status.md](data/state-machines/p1-order-status.md) | ✅ |

## 刷新记录

| 时间 | 范围 | 触发原因 |
|------|------|----------|
| {{日期}} | 全量 | 首次 init |
```

---

## p0-business.md（brownfield 必建）

> 从现有仓库 **推断 as-is 业务**，不是写新需求。无文档时仍建本文件，标明「未找到」并记录推断依据。

```markdown
> **P0** · 业务与用户 · 最后验证：{{日期}}

# 业务与用户

## 项目解决什么问题
{从 README/docs/现有 REQ 等摘录或归纳}

## 目标用户 / 角色
| 角色 | 说明 | 来源 |
|------|------|------|
| {例：买家} | {…} | {README / 路由菜单 / 实体 User} |

## 核心业务场景（as-is）
1. {例：用户浏览商品 → 下单 → 支付}
2. {…}

## 实体 ↔ 功能对照（一眼看懂）

> **目的**：接手人不用先看 SQL 就能知道「用户干啥 → 存哪张表」。细节见 [data/entities/](data/entities/)。

| 用户/界面在… | 干什么 | 后端实体/表 | 文档 |
|--------------|--------|-------------|------|
| {登录页} | {微信登录} | `users` | [p1-user.md](data/entities/p1-user.md) |
| {订单列表} | {下单} | `orders` | [p1-order.md](data/entities/p1-order.md) |

> 无前端路由时：从 Controller 路径、模块包名、AC 测试名推断「这个功能对应哪张表」。

## 核心术语（≤8 个放此处）

| 术语 | 含义 | 备注 |
|------|------|------|
| {SKU} | {库存单位} | {易与 SPU 混淆} |

> 术语 **>8 个**或 **跨多个业务域** → 本节只保留 3~5 个最关键的，其余拆到 [glossary/](glossary/)（见下）。

## 信息来源
- [ ] 根目录 README.md
- [ ] docs/ / wiki 链接
- [ ] atlas/requirements/ 已有 REQ
- [ ] 前端路由 / 菜单 / 页面标题
- [ ] 后端包名、模块名、Entity 命名
- [ ] 用户口述（init 确认前补充）

## 未找到 / 待补充
- {仓库无产品文档时列出；init AskQuestion 前请用户确认或补充}
```

---

## glossary/（术语较多时按需建目录）

**何时建**：术语 >8、有多业务域、或有大量缩写/内部黑话/易混淆词。

**拆分规则**：**按领域/模块一个文件**，如 `p0-order-domain.md`、`p0-payment-domain.md`；**禁止**一词一文件。

```markdown
> **P0** · 术语 · {订单域} · 最后验证：{{日期}}

# {订单域} 术语

| 术语 | 含义 | 代码/表中的对应 | 易混淆 |
|------|------|-----------------|--------|
| 预占库存 | 下单未支付时锁定库存，不实际扣减 | `InventoryService.reserve()` | ≠ 扣减库存 |
| 大单 | 内部指金额 >10w 的 B 端订单 | `orders.type=BULK` | ≠ 普通零售单 |
| OMS | 订单管理系统 | 模块 `order-service` | — |

## 相关
- 业务背景 → [../p0-business.md](../p0-business.md)
- 实体 → [../data/entities/p1-order.md](../data/entities/p1-order.md)
```

**扫描术语的来源**：README  glossary、docs/、注释中的 `@deprecated` 说明、Enum 注释、PRD/已有 REQ 术语表、前端 i18n key 的 zh 文案、接口字段 comment。

---

## p0-repository.md（有 git 才建）

```markdown
> **P0** · 仓库与分支 · 最后验证：{{日期}}

# 仓库与分支

## 远程仓库
- 地址：{origin url}

## 分支策略
- 策略：{Git Flow / Trunk / 其他}
- 主分支：{main/master}
- 开发分支：{develop / 无}

## 常用操作
- 拉取：`git pull origin {branch}`
- 当前工作分支建议：从 `{base}` 拉 `feature/{名}`
```

---

## p0-environment.md（能跑 / 需跑才建）

```markdown
> **P0** · 环境与跑通 · 最后验证：{{日期}}

# 环境与跑通

## 环境要求
| 依赖 | 版本/说明 |
|------|-----------|
| {Node/JDK/…} | {版本} |

## 启动命令
| 端 | 命令 | 端口 |
|----|------|------|
| {后端} | `{命令}` | {端口} |

## 依赖服务
- {MySQL / Redis / …}：{连接说明或配置文件路径}

## 部署与验证环境
- 测试环境：{URL 或「无」}
- 验证方式：{如何确认服务正常，非本次需求 AC}

## 阻塞点（可选）
- [ ] {未解决的环境问题}
```

---

## p1-tech-stack.md

```markdown
> **P1** · 技术栈 · 最后验证：{{日期}}

# 技术栈

## 后端（无则整节删除）
| 类别 | 选型 | 版本 |
|------|------|------|
| 语言 | {Java} | {21} |
| 框架 | {Spring Boot} | {3.x} |
| 构建 | {Maven} | — |
| ORM | {MyBatis/JPA} | — |

## 前端（无则整节删除）
| 类别 | 选型 | 版本 |
|------|------|------|
| 框架 | {React} | {18} |
| 构建 | {Vite} | — |
| 包管理 | {pnpm} | — |

## 来源
- {package.json / pom.xml / go.mod 路径}
```

---

---

## codebase/p1-{端或模块名}.md

> **init 不单独建 `p1-architecture.md`**——总体形态、模块一览、目录树、写法、模板 **全在本文件**。  
> greenfield 的 to-be 全局架构仍在 `atlas/solution/architecture.md`（与 init 无关）。

**模式 B（默认）** — 四段式单文件：

```markdown
> **P1** · {端}代码 · 架构+目录+写法 · 最后验证：{{日期}}

# {端}代码

## 一、架构与目录

### 1.1 总体形态
- 类型：{单体 / 微服务 / …}
- API 前缀 / 鉴权：{如 /api/v1 · JWT}

### 1.2 业务模块一览
| 模块 | 包/路径 | 职责 |
|------|---------|------|
| {auth} | `{path}` | {…} |

### 1.3 目录树
{src 结构}

### 1.4 入口与配置
- 启动类 / 端口 / 公开路径 / 测试入口

## 二、写法规范

> 逐项摘录，禁止写「遵循最佳实践」。完整检查表 → [init-scan-checklist.md §二](init-scan-checklist.md#步骤-5--codebasep1-端md)。

### 2.1 分层与命名（后端示例）
| 层 | 包路径 | 类名示例 |
|----|--------|----------|
| Controller | `{实际路径}` | `{真实类名}` |
| Service | `{实际路径}` | `{真实类名}` |

### 2.2 统一响应与异常
- 成功结构：`{摘录字段，如 code/data/message}`
- 成功调用：`{摘录 1 行，如 ApiResponse.ok(...)}`
- 业务异常：`{类名 + 抛法 + 典型 code}`

### 2.3 校验 / 鉴权 / 分页 / 事务
| 项 | 本项目写法 |
|----|------------|
| 校验 | `{如 @Valid @RequestBody + DTO 字段注解}` |
| 当前用户 | `{如 AuthContext.requireUserId()}` |
| 分页 | `{page 从 1 还是 0；Repository 写法}` |
| 事务 | `{@Transactional 在哪一层}` |

### 2.4 HTTP 与主键
- 创建：`{201 + 路径}` · 删除：`{204}` · 幂等：`{200/201 规则}`
- 主键：`{UUID/自增}` · 工厂：`{Entity.createNew 等}`

### 2.5 模块参考（抄作业）
| 场景 | 参考 |
|------|------|
| 标准 CRUD | `{module/路径}` |
| 分页列表 | `{类:行号}` |
| 幂等/upsert | `{类:行号}` |

### 2.6 前端（有则写，无则删节）
- UI 库、请求 import、Hook、样式文件命名、types 目录

## 三、代码模板

> 每节须：**参考 path:行号** · **适用** · **禁止偏离** · **真实代码块**。见 [init-scan-checklist §三](init-scan-checklist.md#三-代码模板每类-必含)。

### 3.1 分页列表
{…}

### 3.2 详情
{…}

### 3.3 创建/更新
{…}

### 3.4 幂等/状态变更（无则写「暂无」）
{…}

## 四、新功能自检（≥6 条，项目特定）
- [ ] {如：新接口路径在 /api/v1 下}
- [ ] {如：返回 ApiResponse，不裸返 Entity}
- [ ] …

## 与 model/ 的分工
- init/codebase：as-is 怎么写 · model/：to-be 设计
```

**模式 A** — codebase 仅 §一目录，模板在 `atlas/conventions/`（用户显式要求时）。

---

---

## data/ 目录：实体是干什么的？

> **init 的 data/ 不是 ER 图堆砌**，而是回答：**用户在系统里做什么 → 数据存哪 → 和别的数据什么关系**。  
> AI 写码前读 entities 才能懂业务字段含义；读 relations 才能懂 join/外键约束。

| 文件 | 回答什么 | 不写什么 |
|------|----------|----------|
| `data/README.md` | 主流程 ↔ 实体总览；推断依据 | 字段明细、Controller 模板 |
| `data/entities/p1-*.md` | **这张表干什么**、用户怎么用、相关 API、关键字段 | 怎么写 Service（→ codebase §三） |
| `data/relations/p1-*.md` | 谁和谁 1:N、唯一约束、业务含义 | 重复贴实体业务描述 |
| `p0-business.md` §实体对照 | P0 速查表：页面/功能 → 表 | 不替代 entities 详情 |

**扫描实体文档时必写「业务用途」**，禁止只列字段表。  
**完成度检查** → [init-scan-checklist.md §步骤 6](init-scan-checklist.md#步骤-6--data-实体文档)

---

## data/README.md（有持久化时建议建）

```markdown
> **P1** · 数据域总览 · 最后验证：{{日期}}

# 数据域：实体是干什么的？

> 用户在 {小程序/Web/…} 里做什么 → 后端存哪张表。

## 推断依据（这些表是干啥的从哪看出来）

| 来源 | 例子 |
|------|------|
| README / 产品描述 | 「体重记录、打卡」 |
| Controller / 路由 | `POST /diet-records` = 饮食记录 |
| migration 注释 | `V4__goals.sql`「每用户一条目标」 |
| 模块包名 | `module/checkin` = 打卡域 |
| AC / 验收测试 | `Ac003DietTest` = 饮食已实现 |

## 主流程 ↔ 实体（简图）

\`\`\`text
{登录} → User
{设目标} → Goal
{记饮食} → DietRecord
\`\`\`

## 实体索引（详情点进 entities/）

| 实体/表 | 一句话：干什么 | 文档 |
|---------|----------------|------|
| **User** | 微信登录后的「是谁」 | [p1-user.md](entities/p1-user.md) |
| **Order** | 用户下的购买单 | [p1-order.md](entities/p1-order.md) |

## 相关

- 业务背景 → [../p0-business.md](../p0-business.md)
- 代码怎么写 → [../codebase/p1-{端}.md](../codebase/p1-backend.md)
```

---

## data/entities/p1-{实体名}.md

> **每个实体文件必须先回答「干什么、谁用、产生数据的动作是什么」**，再写字段。

```markdown
> **P1** · 实体 · {EntityName} · 来源：{migration/Entity 路径} · 最后验证：{{日期}}

# {EntityName}（{表名}）

## 业务用途

{1~3 句：**这张表在业务里是干什么的**。例：「用户每天称体重记一条；同日期重复提交则覆盖。」}

## 用户 / 界面里怎么用

| {页面/功能} | 用户操作 | 写入/更新的数据 |
|-------------|----------|-----------------|
| {体重页} | 输入 kg 保存 | `weight_records` 一行 |

> 无前端时：从 API + AC 测试 + 模块名推断。

## 相关 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/...` | {创建/更新…} |
| GET | `/api/v1/...` | {查询…} |

## 和其他实体的关系

- {例：归属 User，见 [../relations/p1-user-records.md](../relations/p1-user-records.md)}
- {例：被 Goal 读取算进度}

## 推断依据

- {README / Controller 注释 / migration / Ac00xTest / 前端路由}

## 关键字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | {type} | 主键 |
| {status} | {type} | {业务含义，非仅类型} |

## 代码映射

- `{Entity 类路径}`
- `{主要 Service}`
```

**禁止**：只有字段表、没有「业务用途」和「用户怎么用」的实体文档。

---

## data/relations/p1-{关系名}.md

```markdown
> **P1** · 关系 · {A} → {B} · 最后验证：{{日期}}

# {A} → {B}

**一句话**：{业务上为什么是这个关系。例：「一个用户有多条饮食记录，按 user_id 归属。」}

- **类型**：{N:1 / 1:N / N:M}
- **字段**：{from.field → to.field}
- **约束**：{非空 / 唯一 / …}
- **业务规则**：{例：每用户每天一条打卡}
- **实体详情** → [../entities/p1-{a}.md](../entities/p1-{a}.md)
```

---

## data/state-machines/p1-{名}.md

```markdown
> **P1** · 状态机 · {所属实体/流程} · 最后验证：{{日期}}

# {名称}

## 枚举
| 值 | 含义 |
|----|------|
| {0} | {待支付} |

## 流转
{待支付} → {已支付} → …

## 所属实体
- [../entities/p1-{名}.md](../entities/p1-{名}.md)
```

---

## init 落盘自检（AskQuestion 前必过）

> 全量勾选 → [init-scan-checklist.md §落盘自检](init-scan-checklist.md#init-落盘自检askquestion-前须全-)

**任一项未 ✅ → 不得弹出下方 init 确认卡片。**

---

## init 确认 AskQuestion

```
title: "init 项目盘点确认"
questions:
  - id: "init_confirm"
    prompt: "init 文档已落盘（atlas/init/）。请确认："
    options:
      - id: "confirmed"
        label: "已确认，可进入后续流程（req/sol/dev）"
      - id: "draft"
        label: "先保持草稿，我要补充"
      - id: "refresh_partial"
        label: "部分不准，指定范围 refresh（回复说明范围）"
```

---

## init 增量 refresh AskQuestion（REQ 开发完毕后）

```
title: "init 增量刷新"
questions:
  - id: "init_refresh"
    prompt: "REQ-{编号} 开发已完成。是否增量更新 atlas/init/（同步 as-is）？"
    options:
      - id: "yes_business"
        label: "是，刷新 p0-business / glossary（业务或术语变更）"
      - id: "yes_data"
        label: "是，刷新 data/（表/实体/关系/状态机变更）"
      - id: "yes_codebase"
        label: "是，刷新 init/codebase/（含架构模块与 §三模板）"
      - id: "yes_conventions"
        label: "是，刷新 atlas/conventions/（仅模式 A 项目）"
      - id: "yes_env"
        label: "是，刷新 p0-environment / p1-tech-stack"
      - id: "yes_full"
        label: "是，全量重扫 init"
      - id: "no"
        label: "否，本次跳过"
```

确认后更新 README「刷新记录」+ 相关文件首行「最后验证」日期。
