---
name: agileflow
description: >-
  走规范交付流程：先按模板把需求/方案/任务/dev构思写进 atlas/，再写码和验收。
  阶段4/「全部开发」必须先TodoWrite展开每个T的①构思条目再逐条做；禁止一条Todo多T、禁止跳过①。
  触发：用户描述要做的东西、@agileflow、继续 agileflow、或 req:/mod:/sol:/dev:/tests:/init: 前缀。
version: 9.3.0
---

# Agileflow

## 硬约束（最高优先级）

### 「停止」≠ 不写文档

| ❌ | ✅ |
|----|-----|
| AskQuestion 后永远不写 | **停止=结束本回复**；用户答后**下条必须落盘** |
| 阶段完成=聊过了 | **`atlas/` 已写出** + 结束闸门 |

```
req → REQ+UID → 闸门
mod → model/ → 闸门
sol → solution/+todo → 闸门
dev →【TodoWrite 展开每 T 的①】→ 逐条完成①→②→③ → 闸门
tests → 5-0 → 5A → 5B
```

「继续」= 进入下一阶段并落盘，禁止只回「好的」。

### TodoWrite 强制展开（防漏① · 记不住就靠清单）

> **规范记不住 → 把每个 T 的构思写成 Todo 条目，一个个勾。** 细则 → [todo.md](templates/todo.md#todowrite-强制展开防漏①--最高优先级)

| 时机 | 必须 | 禁止 |
|------|------|------|
| 进阶段 4 / 「全部开发」/ 恢复开发 | **先** `TodoWrite`：每个 T ≥1 条「① 构思→atlas/dev/T-xxx…」；推荐每 T 三条①②③ | 一条 Todo 覆盖多 T；只建 T-001 就写全量代码 |
| 勾① completed | 对应 `atlas/dev/T-xxx-*.md` 已存在且闸门 A 过 | 空勾①；合并 `T-002~018` |
| 开始② | 该 T 的①已 completed | ①还 pending 就 Write 业务源码 |

「全部开发」= **按 TodoWrite 从上到下做完**；≠ 跳过清单出代码。

### 「直接全开发 / 全部做」≠ 跳过 / 压缩 / 空壳 / Subagent 外包

| 用户说 | ❌ | ✅ |
|--------|----|----|
| 直接全实现 / 全部开发 / yes_all | 先码后补；摘要/空壳；**派 Subagent 一次写完 BE+FE**；合并 todo 洗 ✅；**不建 TodoWrite①就开写** | **先 TodoWrite 展开每 T 的①** → 主 Agent 串行逐条：exemplar→dev→A→①→B→②→③ |
| 全部做 / 连续做 | 合并 `T-002~T-018`；跳过①；当成「连进=可压缩」 | 任务间连续；**每 T 仍完整**；T 头≥3 → 强制严谨；**连续做 ≠ 连进模式** |
| 只看成品 | 测试绿就标开发 ✅ | `dev` 数 = T 头数 **且** 每个 T 的 TodoWrite① 均为 completed |

催进度**不豁免**①。**「全部开发」≠ 并行许可**（见 [parallel-orchestration](phases/parallel-orchestration.md)）。

### 禁止用 Task/Subagent 绕过阶段 4（最高优先级）

| 禁止 | 说明 |
|------|------|
| 未显式「并行/subagent」就启 Task 写业务源码 | 「全部开发」只触发**串行**逐 T |
| Subagent 无 `atlas/dev/T-xxx.md` 就 Write 业务源码 | 先由**主 Agent**写该 T 的①并过闸门 A、勾① |
| Subagent 写① / 创建 dev | ① 只属主 Agent；Subagent 仅②→③ |
| 一个 Subagent 领多个 T / 「全部 API」/ 「全部前端」 | 1 Task = 1 T |
| 主 Agent 自己不写①，整包外包阶段 4 | 违规 |

**显式并行例外**：用户原话含「并行/subagent」时，允许批次 B 先齐多 T 的①再并行②——这是 A1/R10 的唯一例外，细则 → [parallel-orchestration](phases/parallel-orchestration.md) · [04 A1](phases/04-development.md)。

权威执行清单 → [dev-quickstart](templates/dev-quickstart.md)。

### A. 阶段结束 → AskQuestion 结束闸门 → 本回复停止

| 时机 | 必须 | 禁止 |
|------|------|------|
| 0/1–4 产出完成 | 结束闸门 → 停 | 自然语言问继续；同回复跨阶段 |
| 决策权未设 | 决策权卡（全局 AI自主则跳过） | 未明就假定 |

| 阶段 | 必须落盘 |
|------|----------|
| 1 | REQ(+UID)+README+todo |
| 2 | model/ |
| 3 | features(+contracts)+architecture+todo（**每 T 单独一行，禁止合并**） |
| 4 | **逐 T** 合规 dev① + 源码② + test/ac③；**dev 文件数须 = T 头数**（`^#{2,4} T-\d+`） |
| 5 | **5-0**（存在端：编译→探针→冒烟）过后再 5A/5B；`atlas/tests/` 报告 |

### B. 阶段 4（唯一执行清单）

→ **[dev-quickstart.md](templates/dev-quickstart.md)**  
细则 → [04-development.md](phases/04-development.md)

```
【默认·串行】主 Agent：
0. TodoWrite 展开：每个 T 至少一条「① 构思→atlas/dev/T-xxx…」（推荐①②③）
1. 取下一条未完成的① → Read exemplar → 写该 T 完整 dev →【A】→ 勾①
2. 【B】→ ② → ③ → 下一条
禁止：未展开 TodoWrite 就写码；Subagent 批量写码；合并 todo；dev 数 < T 头数却标开发 ✅
```

标「开发实现 ✅」前须自检：`dev` 数 = T 头数 **且** 每个 T 的 TodoWrite① completed（补盘 ⚠️ 不计正式①）。

---

## 模式 + 决策

| 维度 | 文件 |
|------|------|
| 快速/严谨 | [flow-modes.md](templates/flow-modes.md)（**T≥3 或 BE+FE → 强制严谨**） |
| 用户/AI自主 | [stage-delegation.md](templates/stage-delegation.md)（全局 AI自主跳过决策权卡） |

## 加载

| 场景 | 必读 |
|------|------|
| 启用 | [00-intent-routing](phases/00-intent-routing.md) + flow-modes + stage-delegation |
| 当前阶段 | **一个** `phases/xx.md` + 文内 templates |
| `dev:` | **[dev-quickstart](templates/dev-quickstart.md)** + exemplar（按端）；04 按需 |
| 阶段结束 | [askquestion-gate](templates/askquestion-gate.md) |

禁止预读无关 phase。

## 术语

| 说法 | 意思 |
|------|------|
| atlas/ | 全流程文档 |
| ①②③ | 构思→写码→验 AC |
| 空壳标题 | 有 `## 一、`～`## 九、` 但五无类/方法做法 |
| FE 字段映射 | `### 3.2` 契约字段=API 英文名 |
| 写法锚点 | codebase p1 / code-patterns |

## 阶段路由

| 阶段 | 文件 |
|------|------|
| 0–5 / 变更 | [00-project-init](phases/00-project-init.md) … [05-testing](phases/05-testing.md) · [change-management](phases/change-management.md) |

## 铁律

1. 大阶段结束 → 结束闸门 → 停  
2. greenfield 不做 init  
3. 逐 T：先 TodoWrite 展开① → A→勾①→B→②→③；禁合并/摘要/空壳/批量①  
4. AC 只在 REQ  
5. T 头≥3 或 BE+FE → 强制严谨  
6. 补盘/空壳不勾①，父任务不洗 ✅  
7. ① 只属主 Agent；显式并行才允许多 T 先齐①再并行②  
8. 「全部开发」前必须 TodoWrite 为每个 T 建①条目；禁止一条 Todo 多 T 

首行：`📍 Agileflow | 模式：{快速/严谨} | 决策：{用户/AI自主} | 阶段：{N} | …`
