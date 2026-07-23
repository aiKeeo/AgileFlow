# Agent 复测工具

**场景清单（话术 + 预期）** → 仓库根 [AGENT-RETEST.md](../../../../AGENT-RETEST.md)（**60 个编号场景**，含 P0/P1/P2 分层；红了先读手册「治本」节）

## 场景索引（简表）

| 分区 | 编号 | P0 必跑 |
|------|------|---------|
| A 静态 | A1～A3 | 全部 |
| B 路由 | B1～B13 | B1、B2、B3、B6、B8 |
| E 行为 | E1～E17 | E1、E7、E13、**E16** |
| F CLI | F1～F5 | F1、F2 |
| C 编排 | C1～C2 | — |
| D 全栈 | D1～D2 | 发版 |
| G 决策 | G1～G4 | G1（改 contract 时） |
| H 纠偏 | H1～H3 | H3（改 change 时） |

## 文件

| 文件 | 用途 |
|------|------|
| `PROMPT.ai.md` | D1 全栈 · 你定 |
| `PROMPT.user.md` | D2 全栈 · 我来决策 |
| `PROMPT.ai.custom-flow.md` | C1 自定义 flow |
| `PROMPT.ai.parallel-flow.md` | C2 并行波 |
| `PROMPT.ai.model-skip.md` | E17 mod skip |
| `PROMPT.ai.change-l2.md` | H3 REQ 变更 |
| `USER-SIM.prompt.md` | D2 / G3 / G4 假用户答卡 |
| `scenarios/` | prepare 预置 flow / fixture |
| [SCENARIOS.md](./SCENARIOS.md) | 分区说明与 prepare 映射 |

## 命令

```bash
SKILL=/path/to/skills/agileflow

# 全栈（D1）
node "$SKILL/scripts/agent-retest/prepare.mjs" --work-root ~/code/af-test --mode ai

# 自定义 flow（C1）
node "$SKILL/scripts/agent-retest/prepare.mjs" --work-root ~/code/af-test --mode ai --scenario custom-flow

# 并行波（C2）
node "$SKILL/scripts/agent-retest/prepare.mjs" --work-root ~/code/af-test --mode ai --scenario parallel-flow

# mod skip（E17）
node "$SKILL/scripts/agent-retest/prepare.mjs" --work-root ~/code/af-test --mode ai --scenario model-skip

# L2 变更（H3）
node "$SKILL/scripts/agent-retest/prepare.mjs" --work-root ~/code/af-test --mode ai --scenario change-l2

# 打分（全栈默认硬检 AF_COMMANDS + Runtime；ai 必须显式传 continues）
node "$SKILL/scripts/agent-retest/score.mjs" --root ~/code/af-test --mode ai --continues 0
node "$SKILL/scripts/agent-retest/score.mjs" --root ~/code/af-test --mode ai --check-af-commands
```
