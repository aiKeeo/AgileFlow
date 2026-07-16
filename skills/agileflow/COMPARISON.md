# AgileFlow vs The World

> 选型指南：看懂 AgileFlow 在同类工具中的位置，以及什么时候该用它、什么时候不该用。

---

## 一句话定位

| 工具 | 最适合谁 | 一句话 |
|------|----------|--------|
| **AgileFlow** | 1-2 人全栈快速交付 | 把 BDD/DDD/SDD/TDD 拧成一根管线，阶段闸门 + 验证脚本确保每步不跑偏 |
| **Spec Kit** | 团队、多工具切换 | 可移植的 Markdown 规格层，跟任何 AI 编码工具搭配 |
| **BMAD** | 大团队、合规项目 | 模拟完整敏捷团队，12+ 角色协作，重文档重规划 |
| **Superpowers** | 重度 TDD 信仰者 | 14 个技能把软件工程纪律焊死在 AI 上，铁律不可绕过 |
| **OpenSpec** | 存量项目迭代 | 轻量的 delta-spec 只记变更不重写，天然适合改已有代码 |

---

## 全维度对比

| 维度 | AgileFlow | Spec Kit | BMAD | Superpowers | OpenSpec |
|------|:---:|:---:|:---:|:---:|:---:|
| **GitHub Stars** | 新项目 | ~69k | ~49k | ~150k | ~57k |
| **方法论** | BDD→DDD→SDD→TDD | SDD | 多角色 Agile | 技能驱动 | SDD (delta-spec) |
| **流程阶段** | 5 + 豁免/init | 6 | 12+ | 7 | 4 |
| **快速通道** | ✅ 豁免/微型 | ⚠️ 可跳 clarify | ⚠️ Quick Flow 仍重 | ❌ 无 | ✅ /opsx:ff |
| **风险分档** | ✅ 精简/标准/完整 | ❌ | ❌ | ❌ | ❌ |
| **自动验证** | ✅ 8 闸门脚本 | ⚠️ /validate | ❌ | ❌ | ⚠️ /opsx:verify |
| **TDD 强制** | 严谨模式强制 | 建议 | 模块级 | 铁律不可绕过 | 可选 |
| **Code Review** | ❌ | ❌ | ⚠️ 模块级 | ✅ 双阶段 | ❌ |
| **Brownfield** | ✅ init: 全扫描 | ⚠️ | ⚠️ | ❌ | ✅ 核心卖点 |
| **Subagent 隔离** | ⚠️ 并行可选 | ⚠️ | ✅ 角色 | ✅ 每任务 | ❌ |
| **变更多项目并行** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **文档语言** | ✅ 中英双语 | 仅英文 | 仅英文 | 仅英文 | 仅英文 |
| **入门难度** | 高 | 低 | 高 | 高 | 中 |
| **安装** | git clone | npx specify init | npx bmad-method | 插件市场 | npm install -g |
| **许可证** | MIT | MIT | MIT | MIT | MIT |

---

## 各竞品深度分析

### GitHub Spec Kit

**核心思路**：规格是第一公民，写在 Markdown 里，提交到 Git 里，换什么 AI 工具都能读。

**工作流**：`constitution` → `/specify` → `/clarify` → `/plan` → `/tasks` → `/implement`

**优势**：
- 上手最快：`npx specify init` → 开始用
- 工具无关：Copilot、Cursor、Claude Code、Gemini CLI 都能跑
- 69k stars 的生态最大

**劣势**：
- 没有领域建模，表结构和 API 对不上的风险大
- 自动验证很弱
- 只有 SDD 一种方法论，没有 BDD/DDD/TDD 的内置支持

**vs AgileFlow**：Spec Kit 更适合「团队已有明确的开发规范、只需要一个规格层来做 AI 协作」的场景。AgileFlow 更适合「一个人或两个人从零到交付，需要完整方法论支撑」的场景。

---

### BMAD Method (Breakthrough Method for Agile AI-Driven Development)

**核心思路**：模拟一整个敏捷团队，每个角色（分析师、PM、架构师、开发、QA）是一个独立的 AI Agent，产出各自的版本化文档。

**工作流**：Phase 1 规划（Analyst → PM → UX → Architect → PO）→ Phase 2 开发（SM → Dev → QA → PR Review）

**优势**：
- 文档产出最丰富（PRD、架构图、sprint stories、测试计划）
- 适合合规要求高的行业
- 角色隔离防止上下文污染

**劣势**：
- 一个 CRM Dashboard 小功能用了 5.5 小时（vs OpenSpec 12 分钟）
- Token 消耗巨大：实际使用约 31,667 tokens/次，大项目 $800-2000+/月/人
- Brownfield 支持弱（Issues #446, #563）
- 小功能也走重流程

**vs AgileFlow**：BMAD 是给「需要合规文档、多人协作、大项目」的团队用的。AgileFlow 是给「要快、要可控、要轻」的个人或小团队用的。**如果你在纠结 BMAD 还是 AgileFlow：觉得 5.5 小时做一个登录太慢了 → 选 AgileFlow。**

---

### Superpowers

**核心思路**：把软件工程纪律焊死在 AI 上。不是建议，是铁律。不是「请写测试」，是「没测试就写代码 → 删掉重来」。

**工作流**：Brainstorming → Git Worktree → Writing Plans → Subagent Dev → TDD → Code Review → Finishing

**优势**：
- 铁律（Iron Law）机制：用绝对化语言堵死 AI 的所有「合理化」借口
- Subagent 隔离上下文，防止越写越偏
- 双阶段 Code Review（规格合规 + 代码质量）
- v6.1 成熟度高，150k stars

**劣势**：
- **没有快速通道**：改一行 typo 也要 brainstorming → design → plan → TDD
- 没有自动验证脚本（全靠 Agent 自觉）
- Brownfield 是明显短板
- 94% 的 PR 被拒绝，社区参与门槛极高
- 仅英文

**vs AgileFlow**：Superpowers 适合「我认可 TDD、Code Review 全部流程，不需要走捷径」的开发者。AgileFlow 适合「我要快的时候能快（豁免/快速）、要严谨的时候能严（严谨+L4/L5）」的灵活需求。**核心差异：Superpowers 是一套「不允许抄近道」的纪律体系，AgileFlow 是「根据风险自动选道」的智能路由体系。**

---

### OpenSpec

**核心思路**：轻量级的规格层，delta-spec 只记录 ADDED/MODIFIED/REMOVED，不重写整份文档。人和 AI 在动手前对齐。

**工作流**：`/opsx:new` → `/opsx:ff`（生成 proposal+spec+design+tasks）→ `/opsx:apply` → `/opsx:verify` → `/opsx:archive`

**优势**：
- Delta-spec 模型天然适合改已有代码
- 上手最快：`npm install -g` → `openspec init` → 3 分钟
- 多变更并行管理：多个 `changes/xxx/` 同时进行，归档自动冲突检测
- /opsx:verify 三维度验证（完备性/正确性/连贯性）
- /opsx:explore 探索模式，适合需求不明确时先调研

**劣势**：
- 流程约束弱：AI 可以不按 tasks 顺序做
- 没有 TDD 内置
- 没有领域建模阶段（表结构和 API 对不上的风险）
- 没有自动化测试管线（L1-L5 分层验收）
- 人类决策权模糊：发现设计缺陷时应该怎么办？

**vs AgileFlow**：OpenSpec 是一个「轻量规格层」，AgileFlow 是一个「完整工程管线」。如果你只需要让 AI 照着规范写代码，OpenSpec 够用了。如果你需要从需求到验收的完整闭环 + 自动验证 + 风险分档 → AgileFlow。

---

## 选型决策树

```
你的场景是什么？
│
├─ 只改已有项目的几十行代码，不需要建模 → OpenSpec
│
├─ 从零做新项目，1-2 人，想快但不想乱 → AgileFlow（快速模式）
│
├─ 从零做新项目，要考虑支付/权限/合规 → AgileFlow（严谨模式）或 BMAD
│
├─ 我信仰 TDD，任何代码都必须先写测试 → Superpowers
│
├─ 团队 5+ 人，需要规格文档在 Git 里长期维护 → Spec Kit
│
├─ 需要合规文档、PRD、架构图给审计看 → BMAD
│
└─ 中文团队、国内业务、小程序/全栈 → AgileFlow（唯一中英双语）
```

---

## AgileFlow 独有优势（竞品做不到的）

1. **验证脚本管线（8 闸门）**：不是「AI 自觉检查」，而是脚本 exit 0 才算过。Spec Kit 的 /validate 和 OpenSpec 的 /opsx:verify 都是轻量检查，没有 AgileFlow 这种硬阻断级别的自动化验证。

2. **BDD→DDD→SDD→TDD 四合一**：没有任何竞品同时覆盖这四种方法论。BMAD 侧重 SDD+Agile，Superpowers 侧重 TDD+Review，OpenSpec 只有 SDD。

3. **风险分档（精简/标准/完整）**：小功能不背重流程。这也是独有功能——Superpowers 和 BMAD 所有任务走同样流程。

4. **Brownfield init 全量扫描**：不仅仅是「接入已有项目」，而是系统化扫描代码约定、存量架构、写法锚点。OpenSpec 的 brownfield 指的是 delta-spec（改已有代码时不重写文档），不包含初始化扫描。

5. **人类驾驶舱（atlas/README.md）+ humanTodo**：人类一眼看到「现在到哪了 / 卡在哪 / 需要我做什么」。竞品只有进度列表，没有这种为人类设计的实时状态面板。

6. **中英双语 + 中文优先**：唯一一个以中文为第一语言的同类工具。

---

## AgileFlow 应向竞品学习的地方

| 借鉴来源 | 学什么 | 优先级 |
|----------|--------|:------:|
| Superpowers | Iron Law 话术模式（关键约束用绝对化语言） | 低（已有裁决表） |
| Superpowers | Subagent 上下文隔离机制 | **高** |
| Superpowers | 双阶段 Code Review | **高** |
| OpenSpec | Delta-Spec 增量变更模型 | **高** |
| OpenSpec | 多变更并行管理 + 归档冲突检测 | 中 |
| OpenSpec | /opsx:explore 探索/调研模式 | **高** |
| OpenSpec | 3 分钟上手（npm install） | 中 |
| Spec Kit | 工具无关的安装方式（不只是 git clone） | 中 |
| BMAD | 角色化 Agent（复杂项目可按需要启用） | 低 |

---

## 总结

AgileFlow 在 **方法论完整性**、**自动验证**、**风险分档**、**Brownfield 支持**、**中文生态** 五个维度上是同类的唯一解。在 **入门体验**、**Subagent 机制**、**Code Review**、**增量变更** 上还有追赶空间。

如果你是一个人 or 两个人做全栈，想快但不想乱——选 AgileFlow。
如果你认 TDD 是信仰，任何妥协都不能接受——选 Superpowers。
如果你只需要一个轻量规格层来对齐需求——选 OpenSpec。
