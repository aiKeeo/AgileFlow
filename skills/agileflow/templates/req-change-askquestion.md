# 需求变更 AskQuestion 模板

## 影响分析（REQ 改完后第一步）

先输出「变更影响摘要」，再调用：

```
title: "REQ-{XXX} 变更影响确认"
questions:
  - id: "impact_model"
    prompt: "本次需求变更，数据建模（atlas/model/）是否需要修改？\n\nAI 判断：{是/否/不确定} — {一句话理由}"
    options:
      - { id: "yes", label: "是，需要改 model/" }
      - { id: "no", label: "否，model 不用动" }
      - { id: "unsure", label: "不确定，按你的摘要建议改" }

  - id: "impact_solution"
    prompt: "方案（atlas/solution/）是否需要修改？\n\n涉及：features/（含§边界）/ contracts/ / architecture.md"
    allow_multiple: true
    options:
      - { id: "features", label: "功能 features/（含边界）" }
      - { id: "contracts", label: "契约 contracts/" }
      - { id: "architecture", label: "全局架构 architecture.md" }
      - { id: "none", label: "都不需要改" }

  - id: "impact_tasks"
    prompt: "开发任务（atlas/todo.md）是否需要增删改？"
    options:
      - { id: "add", label: "是，新增任务" }
      - { id: "modify", label: "是，修改已有任务" }
      - { id: "remove", label: "是，删除过时任务" }
      - { id: "no", label: "否，任务不变" }

  - id: "impact_dev"
    prompt: "功能思路（atlas/dev/）是否需要更新？"
    options:
      - { id: "yes", label: "是，更新实现思路" }
      - { id: "no", label: "否" }
      - { id: "na", label: "尚未有 dev 文档" }
```

**调用后立即停止**，等用户勾选后再改文档。

---

## 是否实现（文档改完后第二步）

```
title: "REQ-{XXX} 变更 — 是否进入开发"
questions:
  - id: "implement_now"
    prompt: "相关文档已更新。\n\n待开发任务：\n{列出 todo 中与本 REQ 相关的新/改任务}\n\n是否现在开始实现？"
    options:
      - { id: "yes", label: "是，进入开发实现（阶段 4）" }
      - { id: "no", label: "否，仅更新文档，暂不开发" }
      - { id: "partial", label: "部分实现（我下轮指定范围）" }
```

**调用后立即停止**。

- 选「是」→ 读 `04-development.md`，首行声明阶段 4
- 选「否」→ 更新 todo 变更历史，流程结束
- 选「部分」→ 请用户说明范围后再进阶段 4

---

## 影响摘要输出格式（AskQuestion 前必写）

```markdown
## {REQ-XXX} 变更影响摘要

**变更内容**：（用户改了什么）

**可能影响**（AI 初判）：
| 层级 | 文件 | 可能改动 |
|------|------|----------|
| model | domain-rules.md | … |
| solution | contracts/API-002-xxx.md | … |
| todo | 开发任务 | 新增 T-00X |
| dev | F-00X-*.md | 规则推导需更新 |

**建议勾选**：model ✅ | solution: features+interfaces | tasks: 新增 | dev: 更新
```

---
