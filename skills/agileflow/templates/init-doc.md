# init 文档模板（atlas/init/）

> 阶段流程：[00-project-init.md](../phases/00-project-init.md)  
> **仅 brownfield（已有代码/可运行应用）**；纯从零新建系统 **不建 init/**。

## 阅读优先级（P0 / P1）

| 标签 | 含义 | 典型文件 |
|------|------|----------|
| **P0** | 不读完不宜动手：业务是谁、解决什么、能否跑通、仓库 | `p0-business.md`、`p0-repository.md`、`p0-environment.md` |
| **P1** | 写业务代码前必读：栈、架构、代码结构、现有数据 | `p1-*.md`、`codebase/`、`data/` |

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
- 架构：{摘要} → [p1-architecture.md](p1-architecture.md)

## 怎么跑

{启动命令与依赖摘要；详见 p0-environment.md；无运行时写一句说明}

## 数据概览（有 data/ 时）

{一行关系摘要，链到 data/relations/}

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
| [p1-architecture.md](p1-architecture.md) | 架构与模块 | ✅ |
| [codebase/p1-backend.md](codebase/p1-backend.md) | 后端结构 | ✅ |

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

## p1-architecture.md

```markdown
> **P1** · 架构与模块 · 最后验证：{{日期}}

# 架构与模块

## 总体形态
- 类型：{单体 / 微服务 / 前后端分离 / …}
- 模块划分：{简述}

## 分层约定（后端示例）
| 层 | 路径 | 职责 |
|----|------|------|
| 入口 | `{controller/}` | API |
| 业务 | `{service/}` | 逻辑 |
| 数据 | `{repository/}` | 持久化 |

## 与 model/ 的分工
- **init/**：现有 as-is 盘点
- **model/**：REQ 驱动的 to-be 设计；实现落地后再 refresh init
```

---

## codebase/p1-{端或模块名}.md

```markdown
> **P1** · 代码结构 · {backend|frontend|服务名} · 最后验证：{{日期}}

# {端/模块} 代码结构

## 根路径
`{相对路径}`

## 目录含义
| 路径 | 职责 |
|------|------|
| `{path}` | {说明} |

## 入口
- {main / App / 路由入口文件}

## 类似功能参考（可选）
- {已有功能} → `{路径}`（新功能可先对照此写法）
```

---

## data/entities/p1-{实体名}.md

```markdown
> **P1** · 实体 · {EntityName} · 来源：{migration/Entity 路径}

# {EntityName}（{表名}）

## 关键字段
| 字段 | 类型 | 说明 |
|------|------|------|
| id | {type} | 主键 |
| {status} | {type} | {含义；术语见 glossary 若有} |

## 关联
- 关系 → [../relations/p1-{名}.md](../relations/p1-{名}.md)
- 状态 → [../state-machines/p1-{名}.md](../state-machines/p1-{名}.md)（有则链）

## 代码映射
- `{Entity 类路径}`
```

---

## data/relations/p1-{关系名}.md

```markdown
> **P1** · 关系 · {A} → {B} · 最后验证：{{日期}}

# {A} → {B}

- **类型**：{N:1 / 1:N / N:M}
- **字段**：{from.field → to.field}
- **约束**：{非空 / 唯一 / …}
- **说明**：{业务含义}
- **中间表**（N:M 时）：{表名}
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
        label: "是，刷新 codebase/ 或 architecture"
      - id: "yes_env"
        label: "是，刷新 p0-environment / p1-tech-stack"
      - id: "yes_full"
        label: "是，全量重扫 init"
      - id: "no"
        label: "否，本次跳过"
```

确认后更新 README「刷新记录」+ 相关文件首行「最后验证」日期。
