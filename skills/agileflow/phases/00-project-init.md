# 阶段 0：项目盘点（init — 仅 brownfield）

> 文档模板：[templates/init-doc.md](../templates/init-doc.md)  
> 路由与触发：[00-intent-routing.md](00-intent-routing.md#init-判定brownfield--greenfield)

## 本阶段做什么

对 **已有代码 / 可运行应用** 的仓库做 **as-is 盘点**，落盘 `atlas/init/`。  
回答：**业务给谁用、解决什么、核心流程是什么；怎么跑；代码与现有数据长什么样**。

**不回答**：本次任务、AC、接口设计、改动决策（分别在 requirements / solution / dev）。

## 何时执行 / 何时跳过

| 执行 init ✅ | 跳过 init ❌ |
|--------------|--------------|
| **brownfield**：已有业务源码、migration、可运行应用 | **greenfield**：纯从零、新系统、空仓库脚手架、用户明确「不需要 init」 |
| 用户前缀 `init:` | 仅 Skill/文档仓库且用户只做流程验证（可选 init，非强制） |
| 首次接触 brownfield 且 `atlas/init/` 不存在 | REQ/model 仅设计阶段（只改 model/，**不**改 init） |
| `init: refresh …` 增量/全量刷新 | 豁免：纯答疑、review、hotfix |

**铁律**：greenfield **禁止**创建 `atlas/init/`；brownfield 在进 **dev:/sol:** 前 **须** 有已确认或进行中的 init（见路由硬规则）。

---

## 目录结构（按需创建，无则不建）

```
atlas/init/
├── README.md                 # 必有：业务摘要 + P0/P1 索引 + 刷新记录
├── p0-business.md            # brownfield 必建：业务、用户、核心流程、核心术语（≤8）
├── p0-repository.md          # 有 git
├── p0-environment.md         # 有运行时/依赖
├── glossary/                 # 术语 >8 或跨域时按需建
│   └── p0-{域}.md            # 按领域拆分，禁止一词一文件
├── p1-tech-stack.md
├── p1-architecture.md
├── codebase/
│   └── p1-{端或模块}.md      # 有几端/几模块几个文件
└── data/                     # 有持久化
    ├── entities/
    │   └── p1-{实体}.md
    ├── relations/
    │   └── p1-{关系}.md
    └── state-machines/
        └── p1-{状态机}.md    # 无状态机则整目录不存在
```

命名与文内标签 → [init-doc.md](../templates/init-doc.md)。

---

## 执行流程

```
① brownfield 判定 → ② 扫描仓库（由外到内）→ ③ 按模板落盘 → ④ AskQuestion 确认 → 停止
```

### ① brownfield 判定

命中 **任一** → brownfield，须 init：

- 存在业务源码目录（如 `src/`、`apps/`、`server/`、`internal/` 等 **且含业务逻辑**）
- 存在 DB migration / DDL / ORM Entity / Prisma schema
- 存在可运行应用配置（`docker-compose`、`application.yml` + 主入口）
- 用户明确「已有项目」「接手」「二次开发」

命中 **全部** → greenfield，**跳过本阶段**：

- 用户明确：从零、新系统、脚手架、完整交付（无既有业务代码）
- 仓库无上述业务资产，仅将新建 atlas/ 与源码

**歧义** → AskQuestion：brownfield（须 init）/ greenfield（跳过 init）。

### ② 扫描仓库（读清楚，固定顺序）

| 顺序 | 读什么 | 提取什么 | 落盘 |
|------|--------|----------|------|
| 1 | 根 **README**、`docs/`、`atlas/requirements/` 已有 REQ、前端路由/菜单、模块/Entity 命名、Enum 注释、i18n | 解决什么问题、目标用户、as-is 核心流程；**术语**（≤8→p0-business，>8→glossary/） | **`p0-business.md`（必建）** + **`glossary/`（按需）** |
| 2 | `git remote`、分支 | 仓库、分支策略 | `p0-repository.md`（无 git 跳过） |
| 3 | docker-compose、`.env.example`、启动脚本 | 启动命令、依赖、端口 | `p0-environment.md` |
| 4 | package.json / pom.xml / go.mod 等 | 语言、框架、版本 | `p1-tech-stack.md` |
| 5 | 顶层目录、模块划分 | 单体/微服务、分层 | `p1-architecture.md` |
| 6 | `src/` 等结构、入口文件 | 分层路径、参考实现 | `codebase/p1-*.md` |
| 7 | migration、Entity、schema | 表、字段、FK、status 枚举 | `data/entities/`、`relations/`、`state-machines/` |
| 8 | — | 汇总索引；README「业务与用户」从 p0-business 摘要 | `README.md`（最后写） |

**业务扫描须读尽以下来源（有则读，无则跳过并在 p0-business 标注）**：

- 根 README、docs/、CHANGELOG 产品向描述
- 已有 `atlas/requirements/REQ-*.md`（仅摘业务价值/用户角色，不抄 AC）
- 前端：路由表、菜单配置、页面 title
- 后端：包名、模块划分、Controller/Service 命名
- 数据：Entity 名、核心表 — 辅助理解领域
- **术语**：docs 词汇表、代码 Enum/常量注释、字段 comment、内部 wiki 缩写表

**术语落盘判定**：

| 数量/情况 | 落盘位置 |
|-----------|----------|
| ≤8 个 | 全部写在 `p0-business.md`「核心术语」表 |
| >8 或跨订单/支付/库存等多域 | `p0-business` 只留 3~5 个总览词 + 建 `glossary/p0-{域}.md` |

**仓库完全无业务描述** → 仍建 `p0-business.md`，「未找到/待补充」列出；**AskQuestion 确认前**提示用户口述或贴文档链接补全（**含易混淆的内部术语**）。

**禁止**：扫描阶段写任务/AC；无状态机仍建 `state-machines/`；合并多实体为一个 `entities.md`；跳过 p0-business。

### ③ 落盘

- 严格按 [init-doc.md](../templates/init-doc.md) 模板
- 每个文件首行：`> **P0** · …` 或 `> **P1** · …`
- `README.md` 状态先标 **草稿**

### ④ AskQuestion 确认

弹出 [init 确认卡片](../templates/init-doc.md#init-确认-askquestion) → **停止**。

- 用户选「已确认」→ `README.md` 状态改 **已确认**
- 选「保持草稿」→ 维持草稿，不进入后续 dev
- 选「部分 refresh」→ 下轮按范围重扫

**init 不是 Agileflow 主阶段 1–4**，但完成时 **必须 AskQuestion**，禁止同回复进入 `req:` / `dev:` 写码。

---

## 增量 refresh（REQ 开发完毕后）

**时机**（满足 **任一** 后 AskQuestion，不自动静默改 init）：

1. 该 REQ 关联 **全部** 开发任务步骤 **③ ✅**（`atlas/todo.md`）
2. 阶段 5 **5A** 该 REQ 验收报告完成且 REQ 标 **已实现**

**前提**：本次实现已改变 as-is（新表/新实体/新目录/环境变更等）。仅改文案/UI 样式且无结构变化 → 可 AskQuestion 后选「跳过」。

**方式**：

| 用户 / 选项 | 动作 |
|-------------|------|
| `init: refresh business` | 重读 README/docs/REQ/路由，更新 `p0-business.md`、`glossary/` + README 摘要 |
| `init: refresh data` | 重扫 migration + Entity，增删改 `data/**/p1-*.md` |
| `init: refresh codebase` | 重扫目录结构，更新 `codebase/`、`p1-architecture.md` |
| `init: refresh environment` | 更新 `p0-environment.md`、`p1-tech-stack.md` |
| `init:` 或 `init: refresh` | 全量重扫 |
| [增量 refresh 卡片](../templates/init-doc.md#init-增量-refresh-askquestion) | 按用户选择范围执行 |

**禁止**：REQ/model **设计阶段**更新 init（to-be 只写 model/）；实现未落地前 refresh init。

每次 refresh 后：

1. 更新受影响文件 + 首行「最后验证」日期
2. `README.md` 追加「刷新记录」行
3. 可选：状态改回 **已确认**

---

## 与 model/ 的分工

| | init/ | model/ |
|---|-------|--------|
| 语义 | as-is 现有 | to-be 设计 |
| 时机 | 接手 / 实现后 refresh | REQ 确认后建模 |
| 实体 | 从代码/DB 扫出 | 从需求设计 |

---

## 前置 / 后置

| | |
|---|---|
| **前置** | brownfield 判定通过 |
| **后置** | init 已确认 → 可进入阶段 1 `req:` 或 brownfield 下直接 `sol:`/`dev:`（须满足各阶段前置） |

---

## 首行声明

`📍 Agileflow | 模式：{快速/严谨} | 阶段：0-项目盘点 | 入口：init:{全量|refresh 范围} | init：atlas/init/`

refresh 时加：`操作：{全量|增量 data|…} | 触发：{首次|REQ-xxx 开发完毕}`

---

## 禁止行为

- ❌ greenfield 创建 `atlas/init/`
- ❌ 跳过 **p0-business.md**（brownfield 必建）
- ❌ init 写任务、AC、open-questions、decisions、接口设计
- ❌ REQ 设计阶段改 init
- ❌ 扫描未落盘就写业务代码
- ❌ init 确认后同回复进入 dev 写码
- ❌ 无 git/无 DB 仍建 p0-repository / data/ 占位文件
