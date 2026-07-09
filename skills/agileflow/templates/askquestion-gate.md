# AskQuestion 规范

> 阶段 1–4 结束时**必须读本文件**并调用 **`AskQuestion` 工具**。

## 「停止」的准确含义（必读）

| 说法 | 含义 |
|------|------|
| **AskQuestion 后停止** | **本回复到此结束**，不在**同一条回复**里继续写下一阶段文档或写码 |
| **不是** | 永久不写文档；以后用户回答了也不写 |
| **用户回答/点选之后** | Agent **下一条回复必须**执行该阶段后续步骤（写 REQ、写 model、写 solution、写 dev…） |

**示例（阶段 1）**：
1. 回复 A：AskQuestion 需求卡片 → **停止**（不写 REQ）
2. 用户选完
3. 回复 B：**必须**写 `atlas/requirements/REQ-*.md` 草稿（禁止只寒暄）
4. 回复 B 末：AskQuestion 确认草稿 → **停止**
5. 用户确认 → 标已确认 → AskQuestion 阶段闸门 → **停止**
6. 用户选「是，继续」→ 回复 C：**必须**读 `02-modeling.md` 或 `03-solution-design.md` 并**落盘**

## 阶段完成硬规则（最高优先级）

**阶段 0 / 1–4 的本阶段产出完成后：**

1. **必须**调用 `AskQuestion` 工具，弹出[阶段闸门](#阶段闸门模板)小卡片
2. **立即停止生成**——本回复不得再写下一阶段文档、不得写码、不得总结后继续
3. **禁止**用聊天文字代替小卡片（「是否继续？」「接下来做方案吗？」均违规）
4. **禁止**假设用户同意、禁止引用上一轮「是，继续」跳过**新阶段**的闸门

| 可省略（仅阶段**内**） | **不可省略** |
|------------------------|--------------|
| 并行模式批次 B dev 审阅、批次间进度卡（用户「只看成品」且仍在阶段 4 内） | **阶段结束时的闸门**（AI 自主用[审阅闸门](stage-delegation.md#审阅闸门ai-自主专属)，用户决策用[阶段闸门](#阶段闸门模板)） |
| **快速模式**：阶段内确认可与闸门合并（见 flow-modes；**须先落盘**） | **阶段入口决策权卡**（仅 todo 未设全局 AI自主时；见 stage-delegation） |
| **AI 自主**：阶段内需求卡/技术栈卡/草稿确认卡 | **AI 自主落盘 + 审阅闸门**（用户可不审直接继续） |
| 重复的方案确认（用户已在本轮明确「不要停」且**仍在同一阶段**） | 严谨 + 用户决策：阶段 3 技术栈 AskQuestion |

**阶段 5 完成后**不再 AskQuestion。

---

## 工具说明

Cursor 结构化提问工具名：**`AskQuestion`**。

| 场景 | AskQuestion |
|------|-------------|
| **阶段入口** | ✅ 决策权卡（**仅未设全局 AI自主**）→ [stage-delegation](stage-delegation.md) |
| **阶段 0/1–4 结束（用户决策）** | ✅ **阶段闸门** |
| **阶段结束（AI 自主）** | ✅ **审阅闸门**（含跳过审阅继续） |
| 阶段 1 入口 / REQ 草稿确认 | ✅ **仅 user_decide 时** |
| 阶段 3 写 architecture 前技术栈 | ✅ **仅 user_decide 时** |
| 聊天式「是否继续」 | ❌ **禁止** |

## 通用规则

- 调用 AskQuestion 后 → **停止生成**，等用户点选
- ❌ 未 AskQuestion 就进入下一阶段
- ❌ AskQuestion 后同一回复继续产出
- ❌ 一个回复连续完成两个阶段（豁免除外）

## 阶段闸门模板

```
title: "开发流程确认"
questions:
  - id: "continue_next_stage"
    prompt: "{当前阶段名}已完成。是否继续进入【{下一阶段名}】阶段？"
    options:
      - id: "yes"
        label: "是，继续"
      - id: "no"
        label: "否，暂停"
```

| 当前阶段 | 下一阶段名 |
|----------|-----------|
| 项目盘点（init） | 需求澄清（或用户指定 sol/dev） |
| 需求澄清 | 数据建模（或按需→方案设计） |
| 数据建模 | 方案设计 |
| 方案设计 | 开发实现 |
| 开发实现 | 测试验收（tests:） |

前缀单阶段模式：选项须含「暂停（本次仅完成本阶段）」——仍须 **AskQuestion**，不可静默结束。

## 决策委派与闸门对照

| 决策权 | 阶段结束用什么卡 |
|--------|------------------|
| **用户决策** | [阶段闸门](#阶段闸门模板)（是否继续下一阶段） |
| **AI 自主** | [审阅闸门](stage-delegation.md#审阅闸门ai-自主专属)（确认 / **不审继续** / 调整 / 暂停） |

AI 自主时审阅闸门**替代**草稿确认 + 阶段闸门（一步完成确认与是否继续）。

## 模式差异（AskQuestion 次数）

| 阶段 | 快速 | 严谨 |
|------|------|------|
| 1 req | 需求卡 → 写 REQ → **确认+闸门 1 卡** | 需求卡 → 写 REQ → 确认 → 闸门 |
| 3 sol | 技术栈 → **落盘** architecture+todo → 确认+继续合并卡 | 技术栈 → 落盘 → 方案确认 → 闸门 |
| **+ AI 自主** | 决策权卡 → 落盘 → **审阅闸门 1 卡**（可跳过审阅） | 同左 |

细则 → [flow-modes.md](flow-modes.md) · [stage-delegation.md](stage-delegation.md)

## 阶段内其他 AskQuestion

| 职责 | 阶段 | 模板 |
|------|------|------|
| init 确认 | 0 | [init-askquestion.md](init-askquestion.md#init-确认阶段-0-收尾) |
| init 增量 refresh | 0 / 4 / 5 | [init-askquestion.md](init-askquestion.md#init-增量-refreshreq-开发完毕后) |
| 需求收集/确认 | 1 | [requirement-askquestion.md](requirement-askquestion.md) |
| 建模确认 | 2 | [modeling-output.md](modeling-output.md) |
| 技术栈 | 3 | [solution-tech-askquestion.md](solution-tech-askquestion.md) |
| 方案确认 | 3 | [solution-core.md](solution-core.md) |
| 变更影响/是否实现 | 变更 | [req-change-askquestion.md](req-change-askquestion.md) |

子步骤 AskQuestion 完成后：

- **user_decide** 且本阶段已结束 → 发**阶段闸门**（快速模式可与确认合并，见 flow-modes）→ 停止
- **ai_decide** → **审阅闸门**已含确认+是否继续，**不再**单独发阶段闸门

## 并行模式批次审阅（可选，默认不走）

仅用户显式并行时见 [parallel-orchestration.md](../phases/parallel-orchestration.md)。  
批次审阅**不能替代**阶段 4 全部完成后的**阶段闸门**。

## AskQuestion 不可用时的降级

输出编号选项（1. 是，继续 / 2. 否，暂停）→ **停止**，等用户回复数字。

## 禁止行为

- ❌ **只 AskQuestion 不落盘**（用户已回答后仍不写 REQ/model/solution/dev）
- ❌ 用户选「是，继续」后只文字回复、不写下一阶段文件
- ❌ 阶段完成却不弹小卡片
- ❌ 自然语言代替 AskQuestion
- ❌ 未问技术栈就写 architecture.md（**user_decide** 时）
- ❌ humanTodo 阻塞时 tests 标 PASS
- ❌ **AI 自主但不落盘**
- ❌ 用户选「不审继续」后只寒暄不写下一阶段
