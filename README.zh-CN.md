# AgileFlow

[English](README.md) | **中文**

<br>

<p align="center">
  <strong>关掉对话以后，你手里还剩什么？</strong>
</p>

<p align="center">
普通 AI 编程：关掉窗口 = 交付物蒸发。<br>
代码在 diff 里，验收在聊天记录里，谁也说不清「做完没有」。
</p>

<p align="center">
  <b>AgileFlow 让流程本身变成产品。</b><br>
  说一句人话，走完一轮——仓库里留下能 Review、能审计、能交接的 <code>atlas/</code> 证据包。
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@agileflow/cli"><img src="https://img.shields.io/npm/v/@agileflow/cli.svg?style=flat-square&color=cb3837" alt="npm"></a>
  <a href="skills/agileflow/templates/validate-atlas-gate.md"><img src="https://img.shields.io/badge/gates-9%20hard-brightgreen?style=flat-square" alt="gates"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license"></a>
  <img src="https://img.shields.io/badge/hosts-Cursor%20%7C%20Claude%20%7C%20Codex%20%7C%20Qoder%20%7C%20WorkBuddy%20%7C%20CodeBuddy-111?style=flat-square" alt="hosts">
</p>

<p align="center">
<pre>
npx @agileflow/cli init
/af 做一个待办清单 API，今天就要
</pre>
</p>

---

## 30 秒上手

```bash
# 1. 装一次（用户级，全宿主）
npx @agileflow/cli init

# 2. 在 Cursor / Claude / Codex / Qoder / WorkBuddy / CodeBuddy 里说：
/af 做一个用户登录 API
```

完了。AI 自动选轨、落盘、写码、过闸门。你只需在启动时选「你定」或「我来」。

| 你只记一个 | 作用 |
|------------|------|
| **`/af` + 人话** | 自动匹配：快捷修 bug / 探索 / 完整交付 |
| `/af` | 读进度，断点续跑 |
| `/af-req` … `/af-test` | Power user 直达阶段 |

> 请用 **`npx @agileflow/cli`**，不要用裸命令 `npx agileflow`（npm 上另有无关同名包）。

---

## 体感：一次会话长什么样

```
你   /af 做一个退款 API，今天要演示
AI   → 判定：完整交付主链
     → 问：你定，还是我来？（文档厚度不变）
你   你定
AI   → Subagent 写 REQ（BDD AC）
     → 方案 + 契约落盘
     → 闸门 write-code 绿灯后写码
     → 每任务留下 ## 结果（真跑过的命令）
     → 验收报告 PASS / FAIL
你   打开 atlas/ —— 证据包齐了，可以交接
```

改天只说 `/af` 或「继续」——读 `todo.md`，不用复述背景。

---

## 为什么难抄：四张牌

### 1. 「做完」由脚本说了算

9 道硬闸门（`validate-atlas`）。勾了 checkbox 却没文件？红。想跳过方案直接写码？红。

**完成 = `exit 0`。** 口头 done 无效，能进 CI。

### 2. 一个入口：`/af`

懒得记阶段命令？

- `/af 修登录 bug` → 快捷轨  
- `/af 做一个退款 API` → 需求主链  
- 只发 `/af` → 接着干  

### 3. 「你定」= 加速，≠ 偷工

少问人、同会话连做——**照样**走 req→sol→dev→test，**照样**写满 `atlas/`。  
加速靠少停 + 并发，不是少写文档、不是跳阶段。

### 4. 交出去的是证据包

| 别人交 | 你交 |
|--------|------|
| 一堆代码 +「测过了」 | `atlas/`：怎么验、边界、运行证据、签收报告 |
| 聊天里的验收标准 | REQ 里的 BDD AC（权威唯一） |
| 「好像派过 Subagent」 | `agileflow-dispatch.json` 台账 |

关掉 IDE 也能交接。内审能回答：**这条需求，怎么证明做完了？**

---

## 主链一眼看懂

```text
想法 ──▶ req ──▶ model? ──▶ sol ──▶ dev（构思 → 写码 → 证据）──▶ test
           │                  │              │
           ▼                  ▼              ▼
        BDD 验收           契约 / 边界     ## 结果 真跑过
```

对应 **BDD → DDD → SDD → TDD**。重点是可追踪的阶段产物，不是为仪式而仪式。

思想 → [majorflow.md](majorflow.md) · 执行 → [SKILL.md](skills/agileflow/SKILL.md) · 上手细节 → [QUICKSTART.md](skills/agileflow/QUICKSTART.md)

---

## 打开 `atlas/`，你看见的是这个

```text
atlas/
├── requirements/REQ-*.md     # 验收权威（Given / When / Then）
├── solution/                 # 架构 · 契约 · 功能边界
├── dev/T-*.md                # 每任务构思 + ## 结果（命令与 exit code）
├── tests/REQ-*-验收报告.md   # PASS / FAIL / BLOCKED-HUMAN
├── todo.md                   # 进度条；关掉对话也能续
├── humanTodo.md              # 只有人能办的事（缺密钥不冒充交付）
└── agileflow-dispatch.json   # 派活台账（可审计）
```

**产物在磁盘上，流程可回放**——这就是和「聊完就散」的差别。

---

## 和 OpenSpec / Superpowers 差在哪一层

三者都让 AI 别瞎写码——**管的层不同**：

| | OpenSpec | Superpowers | **AgileFlow** |
|---|----------|-------------|---------------|
| 管什么 | Spec 怎么演进 | 计划怎么执行（TDD） | **交付包齐不齐、证据在不在** |
| 「完成」 | 软校验 | Skill + Review | **CLI 硬挡，`exit 0` 才进阶** |
| 你带走 | `specs/` | 计划 + 代码纪律 | **整包 `atlas/` + 签收 + 台账** |

| 你的场景 | 更合适 |
|----------|--------|
| 成熟仓、小步增量、Spec 长期演进 | OpenSpec |
| 个人 / 小队、强 TDD、Subagent 长跑 | Superpowers |
| **要交接、要内审、要签收、要演示且留文档** | **AgileFlow** |
| 改一行 bug / 纯答疑 | 裸 AI，或 `/af-fix` |

完整对比与指标 → 文末附录。

---

## 适合谁 · 不适合谁

**你会爽，如果……**

- **接包 / 乙方**：客户要的不只是能跑，还要「怎么验、验过没」
- **Tech Lead**：需求 / 方案 / 开发分区 Review，不能全堆在聊天里
- **合规 / 内审**：REQ → 实现 → 验收全链，防 AI 空勾 checkbox
- **从零 MVP**：今天能演示，明天能交给别人接着干

**你会觉得重，如果……**

只想改一行文案、问概念题——用裸 AI 或 `/af-fix` 即可。  
主链偏重是刻意的：**交付证据不是可选项。**

---

## 安装

**推荐 — 用户级（一次装全宿主）**

```bash
npx @agileflow/cli init
```

**项目级**

```bash
cd YOUR_PROJECT
npx @agileflow/cli init --root . --tools cursor
# 可选：--tools cursor,claude,codex,workbuddy,codebuddy,qoder
npx @agileflow/cli gate --bootstrap-scaffold --root .
```

| 宿主 | 用户级 | 项目级 |
|------|--------|--------|
| Cursor | `~/.cursor/skills/` | `.cursor/skills/` |
| Claude Code | `~/.claude/skills/` | `.claude/skills/` |
| Codex | `~/.agents/skills/` | `.agents/skills/` |
| WorkBuddy | `~/.workbuddy/skills/` | `.workbuddy/skills/` |
| CodeBuddy | `~/.codebuddy/skills/` | `.codebuddy/skills/` |
| Qoder | `~/.qoder/skills/` | `.qoder/skills/` |

> WorkBuddy / CodeBuddy 目录不同；`--tools workbuddy` 或 `codebuddy` 会**两边都装**。

改 `flow.yaml` 后刷新门牌：

```bash
npx @agileflow/cli update --step-skills-only --root .
```

闸门示例：

```bash
npx @agileflow/cli gate --gate write-code --root .
```

---

## 仓库结构

```text
AgileFlow/
├── majorflow.md                 # 方法论
├── AGENT-RETEST.md              # 端到端复测手册
├── README.md / README.zh-CN.md
└── skills/agileflow/            # npm: @agileflow/cli
    ├── SKILL.md · phases/ · templates/
    ├── cli/ · bin/
    └── scripts/validate-atlas/
```

---

## License

MIT — 欢迎 [Issue](https://github.com/aiKeeo/AgileFlow/issues) / PR。

---

<details>
<summary><b>附录：完整对比表与可量化指标</b></summary>

### 维度对比

| 维度 | 裸 AI | [OpenSpec](https://openspec.dev) | [Superpowers](https://github.com/obra/superpowers) | **AgileFlow** |
|------|:-----:|:--------------------------------:|:--------------------------------------------------:|:-------------:|
| 结构化阶段 | ❌ | ⚠️ OPSX 流体 | ✅ 脑暴→计划→执行 | ✅ **req→model→sol→dev→test** |
| 机器硬挡 | ❌ | ❌ 软校验 | ❌ 无统一闸门 | ✅ **9 闸门** |
| 勾选 = 有文件有证据 | ❌ | ⚠️ 自觉 | ⚠️ Review | ✅ **硬检** |
| 企业交付追溯 | ❌ | ⚠️ Spec Delta | ⚠️ 计划 + Review | ✅ **AC 回填 + 验收报告** |
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
