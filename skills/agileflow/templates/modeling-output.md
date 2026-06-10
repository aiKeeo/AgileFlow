# 数据建模模板

## AskQuestion 确认（草稿后必须执行）

```
title: "数据建模确认"
questions:
  - id: "confirm_aggregates"
    prompt: "以下聚合边界是否正确？\n\n（列出聚合根名称及一句话职责）"
    options:
      - { id: "yes", label: "正确，继续" }
      - { id: "adjust", label: "需要调整聚合边界" }

  - id: "confirm_state_machines"
    prompt: "状态机与禁止流转规则是否正确？（如无状态机选「不适用」）"
    options:
      - { id: "yes", label: "正确" }
      - { id: "na", label: "不适用（无状态实体）" }
      - { id: "revise", label: "需要修改" }

  - id: "confirm_invariants"
    prompt: "关键业务不变量是否完整？（如：已支付不可改地址）"
    options:
      - { id: "complete", label: "完整，确认领域规则" }
      - { id: "missing", label: "有遗漏，我补充说明" }
```

## 002-data-model.md 结构

文档头部：

```markdown
- 状态：草稿 | 已确认
- 关联需求：REQ-001, REQ-002
```

章节：DDD 领域模型 → 领域规则（不变量/状态机/值对象）→ ER 图 → 表结构 → 模型→表映射 → SQL（`sql/init.sql`）
