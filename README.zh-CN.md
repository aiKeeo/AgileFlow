# AgileFlow

[English](README.md) | **中文**

# 对话关掉以后，你手里还剩什么？

普通 AI 编程：**关掉窗口 = 交付物蒸发**——代码散在 diff 里，验收标准在聊天记录里，谁也说不清「做完没有」。

**AgileFlow 让流程本身变成产品。**
你说一句人话，走完一轮，仓库里留下一套能 Review、能审计、能交接的 **`atlas/` 证据包**——不是聊天记录的附属品。

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](skills/agileflow/SKILL.md)
[![npm](https://img.shields.io/badge/npm-%40agileflow%2Fcli-cb3837.svg)](https://www.npmjs.com/package/@agileflow/cli)
[![Gates](https://img.shields.io/badge/validate--atlas-9%20hard%20gates-brightgreen.svg)](skills/agileflow/templates/validate-atlas-gate.md)

```bash
npx @agileflow/cli init          # 约 1 分钟
/af 做一个待办清单 API，今天就要    # 然后说人话
```

---

## 你实际会经历什么

| 时刻 | 你做什么 | 系统给你什么 |
|------|----------|--------------|
| **开场** | 打 `/af` + 想做的事 | 自动判定：快捷修 bug？探索？还是完整交付主链 |
| **定调** | 说「你定」或「我来」 | `AF_DECIDE=ai` 少停点连做；`user` 每阶段你点头——**文档厚度不变** |
| **推进** | 看着进度往前走 | 总控只路由；Subagent 写 REQ / 方案 / 代码；台账记下谁干了啥 |
| **卡关** | 想先码后补？ | **闸门红 = 进不去**。`write-code` 不过，不许写业务码 |
| **收工** | 打开 `atlas/` | REQ、方案、构思、`## 结果` 运行证据、验收报告——齐 |
| **改天** | 只说 `/af` 或「继续」 | 读 `todo.md` 断点续跑，不用复述背景 |

**体感一句话**：像带了一个会落盘、会过闸门、会交接的交付搭档——不是只会在对话框里「写完了」的助手。

---

## 我们打的四张牌（别人难抄）

### 1. 「做完」由脚本说了算，不是 AI 嘴上说了算

9 道硬闸门（`validate-atlas`）。勾了 checkbox 却没文件？红。想跳过方案直接写码？红。
「完成」= `exit 0`，能进 CI——口头 done 无效。

### 2. 一句话入口：`/af` 自动路由

懒得记阶段命令？`/af 修登录 bug` → 快捷轨；`/af 做一个退款 API` → 需求主链；只发 `/af` → 读进度接着干。
Power user 仍可 `/af-req` `/af-sol` `/af-dev` 直达。

### 3. 「你定」= 加速，≠ 偷工

说「别问我」「直接做完」→ AI 少停、同会话连做。
**照样**走 req→sol→dev→test，照样写满 `atlas/`。加速靠少问人 + 并发，不是少写文档、不是跳阶段。

### 4. 交出去的是证据包，不只是仓库

| 别人交 | 你交 |
|--------|------|
| 一堆代码 + 「测过了」 | `atlas/`：需求怎么验、方案边界、每任务运行证据、逐 REQ 签收报告 |
| 聊天里的验收标准 | REQ 里的 BDD AC（下游只引用，权威唯一） |
| 「好像派过 Subagent」 | `agileflow-dispatch.json` 台账（谁、哪一步、哪个 task） |

关掉 IDE 也能交接；内审能回答「这条需求怎么证明做完了」。

---

## 30 秒上手

```bash
npx @agileflow/cli init
# → ~/.cursor|claude|qoder|agents|codebuddy/skills/（agileflow + /af* 门牌）
```

在 Cursor / Claude / Qoder / Codex / WorkBuddy 里：

```
/af 做一个用户登录 API
```

| 你只记一个 | 作用 |
|------------|------|
| **`/af` + 人话** | 自动匹配模式并执行 |
| `/af` | 断点续跑 |
| `/af-fix` … `/af-test` | 快捷轨或指定阶段 |

> 请用 **`npx @agileflow/cli`**，不要用裸命令 `npx agileflow`（npm 上另有无关同名包）。细则 → [QUICKSTART.md](skills/agileflow/QUICKSTART.md)。

---

## 主链一眼看懂

```
想法 ──▶ req ──▶ model? ──▶ sol ──▶ dev(①构思②写码③证据) ──▶ test
              │                │         │
              ▼                ▼         ▼
           BDD 验收         契约/边界   ## 结果 真跑过
```

方法论对应 **BDD → DDD → SDD → TDD**，重点是**可追踪的阶段产物**，不是为仪式而仪式。

思想 → [majorflow.md](majorflow.md) · 执行 → [SKILL.md](skills/agileflow/SKILL.md)

---

## 打开 `atlas/`，你看见的是这个

```
atlas/
├── requirements/REQ-*.md       ← 验收权威（Given/When/Then）
├── solution/                   ← 架构 · 契约 · 功能边界
├── dev/T-*.md                  ← 每任务构思 + ## 结果（命令与 exit code）
├── tests/REQ-*-验收报告.md     ← PASS / FAIL / BLOCKED-HUMAN
├── todo.md                     ← 进度条；关掉对话也能续
├── humanTodo.md                ← 只有人能办的事（缺密钥不冒充交付）
└── agileflow-dispatch.json     ← 派活台账（可审计）
```

这就是和「聊完就散」的最大差别：**产物在磁盘上，流程可回放。**

---

## 和 OpenSpec / Superpowers 差在哪一层

三者都让 AI 别瞎写码——**层不同**：

| | OpenSpec | Superpowers | **AgileFlow** |
|---|----------|-------------|---------------|
| 管什么 | Spec 怎么演进 | 计划怎么执行（TDD） | **交付包齐不齐、证据在不在** |
| 「完成」 | 偏自觉 / 软校验 | Skill + Review | **CLI 硬挡，exit 0 才进阶** |
| 你带走 | `specs/` 活文档 | 计划 + 代码纪律 | **整包 `atlas/` + 签收报告 + 台账** |

| 你的场景 | 更合适 |
|----------|--------|
| 成熟仓、小步增量、Spec 长期演进 | OpenSpec |
| 个人/小队、强 TDD、Subagent 长跑 | Superpowers |
| **要交接、要内审、要签收、要演示且留文档** | **AgileFlow** |
| 改一行 bug / 纯答疑 | 裸 AI 或 AF 豁免/快捷轨 |

更细维度表与指标（9 闸门 · 63+ fixture · 40+ 规则）→ 文末附录。

---

## 适合谁 · 不适合谁

**你会爽，如果……**

- 接包 / 乙方：客户要的不只是能跑，还要「怎么验、验过没」
- Tech Lead：要分工 Review（需求/方案/开发分区），不能全堆在聊天里
- 合规 / 内审：要 REQ→实现→验收全链，防 AI 空勾 checkbox
- 从零 MVP：既要今天能演示，又要明天能交给别人接着干

**你会觉得重，如果……**

- 只想改一行文案、问概念题——用裸 AI 或 `/af-fix` / 豁免路径即可
  （主链偏重是刻意的：交付证据不是可选项。）

---

## 安装

**推荐 — 用户级（一次装全宿主）：**

```bash
npx @agileflow/cli init
```

**项目级：**

```bash
cd YOUR_PROJECT
npx @agileflow/cli init --root . --tools cursor
# 可选：--tools cursor,claude,codex,workbuddy,qoder
npx @agileflow/cli gate --bootstrap-scaffold --root .
```

| 宿主 | 用户级 | 项目级 |
|------|--------|--------|
| Cursor | `~/.cursor/skills/` | `.cursor/skills/` |
| Claude Code | `~/.claude/skills/` | `.claude/skills/` |
| Codex | `~/.agents/skills/` | `.agents/skills/` |
| WorkBuddy / CodeBuddy | `~/.codebuddy/skills/` | `.codebuddy/skills/` |
| Qoder | `~/.qoder/skills/` | `.qoder/skills/` |

`phases/*` 相对 **agileflow skill 根**（常与门牌同级），不是空工作区根。改 `flow.yaml` 后：`npx @agileflow/cli update --step-skills-only --root .`

闸门示例：

```bash
npx @agileflow/cli gate --gate write-code --root .
```

---

## 仓库结构

```
AgileFlow/
├── majorflow.md
├── AGENT-RETEST.md
├── README.md / README.zh-CN.md
└── skills/agileflow/            # npm @agileflow/cli
    ├── SKILL.md · phases/ · templates/
    ├── cli/ · bin/
    └── scripts/validate-atlas/
```

---

## License

MIT — 欢迎 Issue / PR。

---

<details>
<summary><b>附录：完整对比表与可量化指标</b></summary>

### 维度对比

| 维度 | 裸 AI | [OpenSpec](https://openspec.dev) | [Superpowers](https://github.com/obra/superpowers) | **AgileFlow** |
|------|:-----:|:--------------------------------:|:--------------------------------------------------:|:-------------:|
| 结构化阶段 | ❌ | ⚠️ OPSX 流体 | ✅ 脑暴→计划→执行 | ✅ **req→model→sol→dev→test** |
| 机器硬挡 | ❌ | ❌ 软校验 | ❌ 无统一闸门 | ✅ **9 闸门** |
| 勾选=有文件有证据 | ❌ | ⚠️ 自觉 | ⚠️ Review | ✅ **硬检** |
| 企业交付追溯 | ❌ | ⚠️ Spec Delta | ⚠️ 计划+Review | ✅ **AC 回填 + 验收报告** |
| 分工 Review | ❌ | ⚠️ | ⚠️ | ✅ **五区隔离** |
| CI 完成判定 | ❌ | ❌ | ❌ | ✅ **exit 0** |
| 外部依赖阻塞 | ❌ | ❌ | ❌ | ✅ **humanTodo** |
| 断点续跑 | ❌ | ✅ | ⚠️ | ✅ **todo + env** |
| 派活可审计 | ❌ | ❌ | ✅ | ✅ **dispatch 台账** |
| 「你定」vs「我来」 | — | — | — | ✅ **AF_DECIDE** |
| 简单 CRUD 含文档 | 常无文档 | 较快 | 1–3h | **~1h 含完整 atlas** |

### 指标

| 指标 | 数值 |
|------|------|
| 硬挡闸门 | **9** |
| 校验 fixture | **63+** |
| 规则模块 | **40+** |
| 阶段 playbook | **8** |
| 端到端复测 | [AGENT-RETEST.md](AGENT-RETEST.md) |

</details>
