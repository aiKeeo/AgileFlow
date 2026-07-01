# AskQuestion 规范

> 阶段 1–4 结束时**必须读本文件**并调用 **`AskQuestion` 工具**。

## 阶段完成硬规则（最高优先级）

**阶段 0 / 1–4 的本阶段产出完成后：**

1. **必须**调用 `AskQuestion` 工具，弹出[阶段闸门](#阶段闸门模板)小卡片
2. **立即停止生成**——本回复不得再写下一阶段文档、不得写码、不得总结后继续
3. **禁止**用聊天文字代替小卡片（「是否继续？」「接下来做方案吗？」均违规）
4. **禁止**假设用户同意、禁止引用上一轮「是，继续」跳过**新阶段**的闸门

| 可省略（仅阶段**内**） | **不可省略** |
|------------------------|--------------|
| 并行模式批次 B dev 审阅、批次间进度卡（用户「只看成品」且仍在阶段 4 内） | **阶段 1–4 收尾的阶段闸门** |
| 重复的方案确认（用户已在本轮明确「不要停」且**仍在同一阶段**） | 阶段 1 入口需求卡片、阶段 3 技术栈 AskQuestion |

**阶段 5 完成后**不再 AskQuestion。

---

## 工具说明

Cursor 结构化提问工具名：**`AskQuestion`**。

| 场景 | AskQuestion |
|------|-------------|
| **阶段 0/1–4 结束** | ✅ **必须** |
| 阶段 1 入口 / REQ 草稿确认 | ✅ **必须** |
| 阶段 3 写 architecture 前技术栈 | ✅ **必须** |
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

## 阶段内其他 AskQuestion

| 职责 | 阶段 | 模板 |
|------|------|------|
| init 确认 | 0 | [init-doc.md](init-doc.md#init-确认-askquestion) |
| init 增量 refresh | 0 / 4 / 5 | [init-doc.md](init-doc.md#init-增量-refresh-askquestion) |
| 需求收集/确认 | 1 | [requirement-askquestion.md](requirement-askquestion.md) |
| 建模确认 | 2 | [modeling-output.md](modeling-output.md) |
| 技术栈 | 3 | [solution-tech-askquestion.md](solution-tech-askquestion.md) |
| 方案确认 | 3 | [solution-core.md](solution-core.md) |
| 变更影响/是否实现 | 变更 | [req-change-askquestion.md](req-change-askquestion.md) |

子步骤 AskQuestion 完成后，若**本阶段已结束** → 仍须再发**阶段闸门** → 停止。

## 并行模式批次审阅（可选，默认不走）

仅用户显式并行时见 [parallel-orchestration.md](../phases/parallel-orchestration.md)。  
批次审阅**不能替代**阶段 4 全部完成后的**阶段闸门**。

## AskQuestion 不可用时的降级

输出编号选项（1. 是，继续 / 2. 否，暂停）→ **停止**，等用户回复数字。

## 禁止行为

- ❌ 阶段完成却不弹小卡片
- ❌ 自然语言代替 AskQuestion
- ❌ 未问技术栈就写 architecture.md
- ❌ humanTodo 阻塞时 tests 标 PASS
