<!--
  DevFlow - 人机协同的 AI 开发流程
  https://github.com/yourusername/devflow
-->

<p align="center">
  <img src="https://img.shields.io/badge/BDD%20→%20DDD%20→%20SDD%20→%20TDD-8A2BE2" alt="BDD→DDD→SDD→TDD" />
  <img src="https://img.shields.io/badge/1小时-全栈应用-brightgreen" alt="1小时全栈应用" />
  <img src="https://img.shields.io/badge/人工闸门-强制-blue" alt="人工闸门强制" />
  <img src="https://img.shields.io/badge/Cursor-Agent就绪-orange" alt="Cursor Agent就绪" />
</p>

<h1 align="center">DevFlow</h1>
<p align="center">
  <strong>让 AI 不再跳过设计、测试和你的审批。<br />在每个阶段都要你说“是”。</strong>
</p>

<p align="center">
  <a href="#-快速开始">快速开始</a> •
  <a href="#-为什么是devflow">为什么是 DevFlow？</a> •
  <a href="#-五个阶段">五个阶段</a> •
  <a href="#-技能列表">技能列表</a> •
  <a href="#-工作原理">工作原理</a> •
  <a href="README.md">English</a>
</p>

---

## 🧠 什么是 DevFlow？

**DevFlow 是一个有人工闸门的 AI 开发流程**，将模糊需求转化为生产就绪的代码，同时防止 AI 跳过设计、测试和你的审批。

它集成了 **BDD、DDD、SDD 和 TDD**，形成线性的、阶段闸门式流程：

```
需求澄清 → 数据建模 → 方案设计 → 开发实现 → 测试验收
```

在每个阶段结束时，DevFlow 使用 `ask_followup_question` **停下来并等待你的确认**。没有意外，没有“魔法跳跃”。

## 🚀 快速开始

### 1. 安装技能
将 `skills/` 文件夹复制到你的 Cursor 工作区：

```bash
cp -r skills/ .cursor/skills/
```

### 2. 启动流程
在 Cursor 中输入：

```
/dev-flow 帮我开发一个用户登录认证系统
```

### 3. 跟随闸门
在每个阶段回答几个问题。大约 **一小时后**，你将拥有：

- ✅ 清晰的需求（含 Given‑When‑Then 场景）
- ✅ 领域模型和数据库表结构
- ✅ API 契约和任务拆解
- ✅ 经过测试的后端 + 前端代码
- ✅ 交付报告

> **真实案例** – 从空白项目到可运行的全栈应用，约 60 分钟。

## 🔥 为什么是 DevFlow？

大多数 AI 工具太“着急” – 它们直接跳到代码，忽略领域逻辑，跳过测试，产出“能跑就行”的一次性产物。

**DevFlow 完全不同。**

| 痛点 | DevFlow 的解法 |
|------|----------------|
| AI 不理解领域就写代码 | **DDD** – 聚合根、不变量、状态机 |
| 没有统一的行为理解 | **BDD** – 每个需求都有 Given‑When‑Then |
| 没有设计，只有随机文件 | **SDD** – 编码前先约定 API 和原子任务 |
| 零测试，无法维护 | **TDD** – 红绿重构，严谨模式核心覆盖率 100% |
| AI 自己做决定不问你 | **强制人工闸门** – 每个阶段后必须你点“继续” |
| 外部依赖阻塞流程 | `specs/humanTodo.md` – AI 主动暂停并等待你的输入 |

### 📋 时刻清楚当前状态 – 不再迷路

两个文件让你和 AI 始终对齐：

| 文件 | 作用 | 谁更新 | 示例 |
|------|------|--------|------|
| `specs/todo.md` | **任务跟踪** – 哪些已完成、下一步做什么、流程进度 | AI 自动更新（每个任务/阶段后） | `- [x] 需求澄清`<br>`- [ ] 数据建模` |
| `specs/humanTodo.md` | **人类依赖** – API 密钥、审批、外部配置 | AI 写入，你勾选完成 | `⬜ 提供微信支付商户号`<br>`⬜ 确认订单取消规则` |

**不再靠猜。**  
- 卡住了？查看 `humanTodo.md` – AI 甚至会**主动暂停并提醒你**完成待办事项。  
- 休息后想继续？打开 `todo.md` – 你一眼就能看到下一个阶段或任务是什么。

> 这让 AI 从“黑盒”变成了**透明的队友**。

## 📐 五个阶段

| 阶段 | 技能 | 产出 | 人工闸门 |
|------|------|------|----------|
| 1. **需求澄清** | `product-requirement` | `REQ-*.md`（BDD 场景） | ✅ 必须确认 |
| 2. **数据建模** | `data-modeling` | 领域模型、ER 图、`sql/init.sql` | ✅ 必须确认 |
| 3. **技术方案** | `solution-design` | API 契约、任务清单（`todo.md`） | ✅ 必须确认 |
| 4. **开发实现** | `development` | `src/`、`tests/`（TDD 驱动） | ✅ 必须确认 |
| 5. **测试验收** | `testing` | 测试报告、交付报告 | – 流程结束 |

> **没有你的明确“是”，任何阶段都不能开始。**  
> AI 在物理上无法跳过 – 它必须调用 `ask_followup_question` 并停下来。

## 🧩 技能列表

| 技能 | 职责 |
|------|------|
| `dev-flow` | 编排 5 阶段流程，强制闸门，维护 `todo.md` 和 `humanTodo.md` |
| `product-requirement` | 编写带 BDD 场景的 REQ‑*.md，版本追踪 |
| `data-modeling` | 产出领域模型（聚合、不变量）、ER 图、SQL DDL |
| `solution-design` | 编写技术方案、API 契约、原子任务 |
| `development` | 实现代码（快速模式或严格 TDD），更新任务状态 |
| `testing` | 运行所有测试，对照 BDD 场景验收，产出交付报告 |
| `task-tracking` | 维护 `specs/todo.md` 和 `specs/humanTodo.md` |

所有技能都是**原子的**、**自包含的**，专为 Cursor 的 Agent 模式设计。

## 🎬 工作原理（最小示例）

```text
用户: /dev-flow 做一个简单的登录页
─────────────────────────────────────────────
✅ 阶段1完成 → REQ-001-login.md
⏸️   DevFlow: “是否继续进入【数据建模】？” [是] [否]

用户点击“是”
─────────────────────────────────────────────
✅ 阶段2完成 → 领域模型 (User), ER 图
⏸️   DevFlow: “是否继续进入【技术方案】？” [是] [否]

用户点击“是”
─────────────────────────────────────────────
✅ 阶段3完成 → API 规范 (POST /login), 任务列表
⏸️   DevFlow: “是否继续进入【开发实现】？” [是] [否]

用户点击“是”
─────────────────────────────────────────────
✅ 阶段4完成 → src/ + tests/（TDD）
⏸️   DevFlow: “是否继续进入【测试验收】？” [是] [否]

用户点击“是”
─────────────────────────────────────────────
✅ 阶段5完成 → 测试通过，交付报告生成。
🎉 流程结束。
```

### 👤 当 humanTodo.md 有待办事项时的行为

```text
📋 humanTodo.md 中有未完成事项：
   ⬜ 提供 Stripe API 密钥
⏸️ DevFlow: “等待人类任务。完成后回复‘已处理’。”
```

## 📁 运行 DevFlow 后的项目结构

```
specs/
├── requirements/            # REQ-*.md (BDD 场景)
├── 002-data-model.md        # 领域模型、ER、SQL
├── 003-solution.md          # API 契约、架构
├── 004-test-report.md       # 测试结果
├── delivery-report.md       # 最终交付摘要
├── todo.md                  # 原子任务列表（自动更新）
├── humanTodo.md             # 人类待办（API 密钥、审批…）
sql/
└── init.sql                 # 数据库 DDL
src/                         # 生成的应用程序代码
tests/                       # 单元和集成测试
```

## ❓ 常见问题

### DevFlow 只支持 Cursor 吗？
它为 **Cursor（Agent 模式）** 设计，因为用到了 `ask_followup_question`。但技能可以适配其他支持类似工具调用的 AI 编程助手。

### 我能跳过闸门吗？
**不能。** AI 被明确指示 **永远** 不能在不调用 `ask_followup_question` 的情况下继续。提示词层面就强制了这一点。你始终掌握控制权。

### DevFlow 和 `agents-setup` 或 `cursor-team-kit` 有什么不同？
那些提供了许多独立技能。DevFlow 是一个**单一的、有观点的流程**，将它们串联起来，并强制了人工闸门和 BDD→DDD→SDD→TDD 方法论。

### 如果我已经有现成的需求文档怎么办？
你可以跳过阶段 1，手动放入你自己的 `REQ-*.md` 文件，然后从阶段 2 开始。

## 🤝 贡献

欢迎贡献新的技能、改进现有技能或更好的闸门机制。请开 Issue 或 PR。

## 📄 许可证

MIT © aikeeeo

---

<p align="center">
  为那些希望 AI 成为队友而非脱缰野马的开发者而构建。
</p>
```
