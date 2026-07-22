# AgileFlow — AI Agent Skill

[English](README.md) | **中文**

> **流程本身就是产品。** 面向需要**可交付、可审计、可交接**的团队——把想法落成带证据链的成品，不是聊天记录里的一堆代码。

[![Version](https://img.shields.io/badge/version-9.31.0-blue.svg)](skills/agileflow/SKILL.md)
[![Enterprise Ready](https://img.shields.io/badge/Enterprise-可交付证据链-green.svg)](#企业级可交付)

---

## 一句话

常见 AI 编程产出的是**代码**；企业交付要的是**证据包**——需求怎么验收、谁派的活、跑过什么、卡在哪、能不能签单。

AgileFlow：**每一阶段都有标准产物 + 脚本可验**，REQ→实现→验收报告全链可追溯。个人快启依然可用（`AF_DECIDE=ai` ~1h），但设计重心在**团队能 Review、能审计、能交接**。

---

## 企业级可交付

OpenSpec 擅长 **Spec 活文档**；Superpowers 擅长 **个人/小队的 TDD 执行**。AgileFlow 擅长 **按阶段交出可签收的交付物**——适合外包收尾、内审、合规留痕、多人分工 Review。

| 交付物 | 企业用途 |
|--------|----------|
| `REQ-*.md` + BDD AC | 需求基线；验收唯一权威，下游只引用 |
| `solution/` 契约 + `F-*.md` | 架构/接口/边界分工审阅，开发前对齐 |
| `dev/T-*.md` + `## 结果` | 每任务设计说明 + **可运行证据**，非空勾 checkbox |
| `tests/REQ-*-验收报告.md` | 逐 REQ 签收：PASS / FAIL / `BLOCKED-HUMAN` |
| `agileflow-dispatch.json` | Subagent 派活台账（`subagentId` / `taskId`），过程可审计 |
| `humanTodo.md` | 外部依赖显式列出，未齐不冒充交付 |
| `validate-atlas`（9 闸门） | 可接入 CI：`exit 0` 才允许进阶，防「口头完成」 |

**一句话差异**：OpenSpec 管「规格怎么演进」；Superpowers 管「怎么按计划写码」；AgileFlow 管 **「交付包齐不齐、证据在不在、链断没断」**。

---

## 竞品对比

与 **[OpenSpec](https://openspec.dev)**、**[Superpowers](https://github.com/obra/superpowers)** 同场——三者都让 AI 别乱写，定位不同：

| | **OpenSpec** | **Superpowers** | **AgileFlow** |
|---|-------------|-----------------|---------------|
| **定位** | 个人/团队 **Spec 层**（brownfield 增量） | 个人/小队 **执行层**（TDD + Subagent） | **交付层**（五阶段证据包 + 硬挡） |
| **一句话** | 轻量 Spec 驱动，先对齐再写码 | 脑暴→计划→Subagent 执行 | 每阶段标准产物，脚本验齐才放行 |
| **强项** | Delta Spec、`/opsx:*` 流体工作流 | TDD 强制、每任务双轮 Review | 9 闸门、AC 全链、验收报告、派活台账 |
| **取舍** | 无硬闸门，verify 软校验 | 无统一 CLI 挡，偏执行纪律 | 更重；简单 hotfix 不适用 |

### 维度对比（含裸 AI 基线）

| 维度 | 裸 AI 对话 | [OpenSpec](https://openspec.dev) | [Superpowers](https://github.com/obra/superpowers) | **AgileFlow** |
|------|:----------:|:--------------------------------:|:--------------------------------------------------:|:-------------:|
| 结构化阶段（想法→交付） | ❌ | ⚠️ OPSX 流体（explore→propose→apply→verify） | ✅ 脑暴→计划→Subagent 执行 | ✅ **req→model→sol→dev→test** |
| 机器硬挡（CLI 不过 = 不能进阶） | ❌ | ❌ `/opsx:verify` 软校验 | ❌ Skill + Review，无统一闸门 | ✅ **`validate-atlas` 9 闸门** |
| 勾选 / 任务完成 = 有文件有证据 | ❌ | ⚠️ `tasks.md` 靠自觉 | ⚠️ 计划任务 + Review | ✅ **`TODO-CHECK-*` 硬检** |
| 企业交付 / 合规追溯 | ❌ | ⚠️ Spec Delta，无验收报告链 | ⚠️ 计划 + Review | ✅ **REQ AC 回填 + 逐 REQ 验收报告 + `req-trace`** |
| 分工 Review（按角色审文档） | ❌ | ⚠️ proposal/design 可拆 | ⚠️ 计划为主 | ✅ **requirements / model / solution / dev / tests 五区隔离** |
| 可接入 CI 的完成判定 | ❌ | ❌ | ❌ | ✅ **`validate-atlas` exit 0** |
| 外部依赖阻塞显式化 | ❌ | ❌ | ❌ | ✅ **`humanTodo` + `BLOCKED-HUMAN`** |
| 断点续跑 | ❌ | ✅ `changes/` 变更文件夹 | ⚠️ 依赖会话/计划文件 | ✅ **`todo.md` + `agileflow.env`** |
| Subagent 派活可审计 | ❌ | ❌ | ✅ 每任务派发 + 合规/质量 Review | ✅ **`agileflow-dispatch.json`（含 subagentId）** |
| TDD / 测试纪律 | ❌ | ⚠️ 非核心 | ✅ **RED-GREEN-REFACTOR 强制** | ✅ ③ 验 AC + 可运行证据进 `## 结果` |
| BDD / DDD / SDD 全链 | ❌ | ⚠️ 偏 SDD + Spec Delta | ⚠️ 偏计划 + TDD | ✅ **REQ→model→sol→dev 分工落盘** |
| Brownfield 增量变更 | ❌ | ✅ **强项**（Spec 与代码同仓） | ⚠️ | ✅ `init` 盘点 + 写法锚点 |
| 「你定」vs「我来」 | — | — | — | ✅ **`AF_DECIDE=ai/user`** |
| 上手成本 | 零 | **低**（`openspec init` + 斜杠命令） | **低**（Cursor `/plugin-add superpowers`） | **中**（装 Skill + 说一句话） |
| 简单 CRUD 典型耗时 | 30min–2h（常缺文档） | **较快**（轻量、少闸门） | 1–3h（脑暴+计划开销） | **~1h（含完整 atlas）** |
| 可交接 / 可审计 | 低 | 高（`specs/`） | 中（计划 + 代码） | **最高**（完整证据包 + 台账 + 闸门日志） |

### 怎么选

| 你的场景 | 更合适 |
|----------|--------|
| 成熟代码库、小步增量、Spec 长期演进 | **OpenSpec** |
| 个人/小队、强 TDD、Subagent 长跑写码 | **Superpowers** |
| **外包交付、内审留痕、多人分工 Review、要签收报告** | **AgileFlow** |
| 从零 MVP 但要能演示 **且** 能交接文档 | **AgileFlow** |
| 改一行 bug、纯答疑 | 三者都偏重 → 裸 AI 或 AF 豁免 |

### 可量化指标（AgileFlow 本体）

| 指标 | 数值 | 含义 |
|------|------|------|
| 硬挡闸门 | **9** | `init`→`req`→`mod`→`sol`→`dev`→`test` 全链，`write-code` 防跳阶段写码 |
| 校验 fixture | **63+** | 正负向回归，CI `npm run test:validate` |
| 规则模块 | **40+** | 字面量构思、假勾选、UID 断链、派活台账等 |
| 阶段指令 | **8** | `phases/` 含路由、变更、五阶段 |
| dev 质量线 | **1 档（full）** | 五段式构思 + 逻辑块编号，AI 自主不减厚 |
| 端到端复测 | **ai + user** | [AGENT-RETEST.md](AGENT-RETEST.md) 真实 Agent 冒烟 |

### AgileFlow 独特点（企业交付向）

1. **交付物齐全才可放行** — 不是聊完就算完；9 个闸门 + 63+ fixture，「完成」可脚本判定、可进 CI。
2. **验收权威在 REQ** — BDD AC 全链回填到验收报告，审计时能回答「这条需求怎么证明做完了」。
3. **过程可审计** — 派活台账记 `subagentId`；`AF_DECIDE=user` 时阶段闸门支持治理流程。
4. **人机边界清楚** — `humanTodo` + `BLOCKED-HUMAN`，缺密钥/缺拍板不会误标 PASS。
5. **个人快、企业严** — `ai` 模式压缩摩擦；`user` 模式适合支付/权限/合规敏感场景。

> 若你只想改一行 bug 或纯答疑，AgileFlow 过重——那是刻意设计，不是缺陷。

---

## 主链

```
req → model（按需）→ sol → dev（①②③）→ test
```

| 阶段 | 产出什么 |
|------|----------|
| **req** | 一功能一 REQ，Given/When/Then 验收标准 |
| **model** | 复杂才加重建模；简单场景可跳过，但须留判定 |
| **sol** | 边界、契约、架构、`todo.md` 里的开发任务 |
| **dev** | 每任务构思文件、业务代码、`## 结果` 里的运行证据 |
| **test** | 整批可交证明——不是「单测绿了就算完」 |

方法论对应 **BDD → DDD → SDD → TDD**，重点是**可追踪的阶段**，不是为仪式而仪式。

核心思想 → [majorflow.md](majorflow.md)。执行细则 → [SKILL.md](skills/agileflow/SKILL.md)。

---

## 两种协作方式

| | **`AF_DECIDE=ai`** | **`AF_DECIDE=user`** |
|---|-------------------|----------------------|
| 你怎么说 | 「你定」「别问我」 | 「我来决策」 |
| 摩擦 | 少澄清卡、少阶段停顿 | 阶段闸门，你点头才往下走 |
| 适合 | Demo、CRUD、内部工具 | 支付、权限、核心业务 |
| 不变的东西 | 完整主链、`atlas/` 落盘、①②③、可运行证据 | 同上 |

> **「你定」≠ 跳阶段。** 是少问人，不是薄文档、不是空勾 checkbox、不是先码后补构思。

---

## 为什么敢信产出

三层加固，防 AI 幻觉、不听指挥、假装完成：

| 柱 | 管什么 |
|----|--------|
| **形** | `atlas/` 按阶段写对；勾选对得上真实文件（`validate-atlas` 硬挡） |
| **令** | 你定方向，AI 执行——启动卡、阶段闸门、`todo.md` 断点续跑 |
| **跑** | 编译 / 启动 / 冒烟证据写在 dev 构思里——脚本验形，**证据要你跑** |

缺密钥、缺环境？`humanTodo.md` 列出只有人能办的事。未齐 → **`BLOCKED-HUMAN`**，不会误标「已交付」。

---

## `atlas/` 里有什么

```
atlas/
├── requirements/REQ-*.md      # BDD + 可选 UID
├── model/                     # DDD（或跳过判定）
├── solution/                  # 架构、契约、功能边界
├── dev/T-*.md                 # 每任务 ① 构思
├── tests/                     # 逐 REQ 验收报告
├── todo.md                    # 流程进度 + 任务 ①②③
├── humanTodo.md               # 需要你帮忙的事
└── agileflow-dispatch.json    # 派活台账
```

关掉对话回来，说 **「继续 agileflow」**——AI 读 `todo.md` 接着干，不用重复解释。

---

## 适合谁

| 你 | 什么时候用 |
|----|-----------|
| **企业 Tech Lead / 交付负责人** | 要分工 Review、阶段闸门、签收报告，不能只要代码 |
| **合规 / 内审 / 质量管理** | 要 REQ→实现→验收全链留痕，防 AI 空跑勾选 |
| **接包 / 乙方交付** | 交的不只是仓库，还有 `atlas/` 证据包 |
| **创业者 / 独立开发者** | 也要可演示 **且** 能交给下一个人接着干 |

**更适合企业级交付**；纯个人玩票、改一行 hotfix → 过重，用裸 AI 或 AF 豁免。

---

## 安装

```bash
git clone https://github.com/aiKeeo/AgileFlow.git
cp -r AgileFlow/skills/agileflow YOUR_PROJECT/.cursor/skills/
```

| 工具 | 项目内 | 全局 |
|------|--------|------|
| **Cursor** | `.cursor/skills/agileflow` | `~/.cursor/skills/agileflow` |
| **Claude Code** | `.claude/skills/agileflow` | `~/.claude/skills/agileflow` |
| **Trae** | `.trae/skills/agileflow` | `~/.trae/skills/agileflow` |

手把手步骤 → [QUICKSTART.md](skills/agileflow/QUICKSTART.md)

---

## 使用

```
走 agileflow，做一个待办清单 API，今天就要上线
```

```
继续 agileflow
```

指定阶段：`写需求` / `做数据建模` / `出技术方案` / `按方案开发` / `跑验收测试`

---

## 仓库结构

```
AgileFlow/
├── majorflow.md           # 核心思想
├── AGENT-RETEST.md        # Agent 复测手册
├── README.md / README.zh-CN.md
└── skills/agileflow/      # Skill 本体（SKILL.md、phases/、templates/、scripts/）
```

---

## License

MIT — 欢迎 Issue / PR。
