---
name: agileflow
description: >-
  走规范交付流程：先按模板把需求/方案/任务/dev构思写进 atlas/（禁止摘要版与空壳标题），再写码和验收；避免 Agent 直接开写或批量跳过①。
  触发：用户描述要做的东西、@agileflow、继续 agileflow、或 req:/mod:/sol:/dev:/tests:/init: 前缀。
version: 9.0.0
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
dev →【逐 T】完整①→②→③ → 闸门
tests → 验收报告
```

「继续」= 进入下一阶段并落盘，禁止只回「好的」。

### 「直接全开发 / 全部做」≠ 跳过 / 压缩 / 空壳

| 用户说 | ❌ | ✅ |
|--------|----|----|
| 直接全实现 / 直接全开发 | 先码后补；摘要版；**空壳九标题**；批量写完所有 dev 再写码 | **逐 T**：Read exemplar→完整模板→闸门A→①→闸门B→②→③ |
| 全部做 / 连续做 | 合并 todo；压缩七段 | 任务间连续；**每 T 仍完整**；T≥3 或 BE+FE → **强制严谨** |
| 只看成品 | 12 行冒充① | 不可少结束闸门；不可空壳 |

催进度**不豁免**①，也**不豁免**模板完整度与五可执行检查。权威 → [dev-quickstart](templates/dev-quickstart.md)。

### A. 阶段结束 → AskQuestion 结束闸门 → 本回复停止

| 时机 | 必须 | 禁止 |
|------|------|------|
| 0/1–4 产出完成 | 结束闸门（阶段闸门或审阅闸门）→ 停 | 自然语言问继续；同回复跨阶段 |
| 决策权未设 | 决策权卡（全局 AI自主则跳过） | 未明就假定 |

| 阶段 | 必须落盘 |
|------|----------|
| 1 | REQ(+UID)+README+todo |
| 2 | model/（严谨五件套；快速可 overview） |
| 3 | features(+contracts)+architecture+todo |
| 4 | **逐 T** 合规 dev① + 源码② + test/ac③ |
| 5 | tests/ 报告 |

### B. 阶段 4（唯一执行清单）

→ **[dev-quickstart.md](templates/dev-quickstart.md)**（闸门 A0–A5 / B1–B4）  
细则 → [04-development.md](phases/04-development.md) · 按端 exemplar

```
Read exemplar → 写 1 个 T 完整 dev →【A】→ 勾① →【B】→ ② → ③
禁止：批量写完多份 dev 再写码；空壳标题；摘要版
```

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
3. 逐 T：A→①→B→②→③；禁合并/摘要/空壳/批量①  
4. AC 只在 REQ  
5. T≥3 或 BE+FE → 强制严谨  
6. 补盘/空壳不勾①，父任务不洗 ✅  

首行：`📍 Agileflow | 模式：{快速/严谨} | 决策：{用户/AI自主} | 阶段：{N} | …`
