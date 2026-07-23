# Agent 复测场景（已合并到主手册）

**请只看仓库根目录：[AGENT-RETEST.md](../../../../AGENT-RETEST.md)**

## 分区与编号

| 分区 | 编号 | 条数 | 测什么 |
|------|------|------|--------|
| **A** 静态 | A1～A3 | 3 | validate / cli / docs |
| **B** 路由冒烟 | B1～B13 | 13 | `/af` 自动路由、显式门牌、探索、多意图 |
| **E** 指令行为 | E1～E17 | 17 | 快捷 + init + flow 步 + 升级 + alias + 留痕 |
| **F** CLI 管线 | F1～F5 | 5 | 自定义步、skip、保留字、多宿主 init |
| **C** 编排 | C1～C2 | 2 | custom-flow / parallel-flow |
| **D** 全栈 E2E | D1～D2 | 2 | ai 自治 / user 答卡 |
| **G** 决策契约 | G1～G4 | 4 | 接管、重选、并行卡、栈卡 |
| **H** 纠偏变更 | H1～H3 | 3 | L0 / L1 / L2 |
| **R** Runtime v2 | R1～R11 | 11 | Run、回执、**禁向前 rewind**、**force+reason** |
| **合计** | | **60 个编号场景** | |

## 治本（必读）

复测红了 → 先读手册文首 **「复测铁律：红了必须治本」**：取证 events → 归类产品洞/执行偏差 → **改 AgileFlow 代码+单测** → 再重跑。禁止只靠重跑 Agent 或手工救场宣称通过。

## prepare 场景

| `--scenario` | 手册 | 说明 |
|--------------|------|------|
| `slimtrack`（默认） | D1 | 减肥小程序全栈；score **默认 AF_COMMANDS + RUNTIME_*** |
| `custom-flow` | C1 | research / ux-spike / preflight |
| `parallel-flow` | C2 | af-research ∥ af-competitor |
| `model-skip` | E17 | 瘦需求 mod skip |
| `change-l2` | H3 | `/af-revise`；score 按快捷留痕 |

> **Runtime**：改 Run/gate/step-sync → R1～R6 + **R10、R11**；改 artifact → R7；改 validator CLI → R8、R9。
