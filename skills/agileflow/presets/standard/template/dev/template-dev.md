---
target: dev/T-*.md
summaryBullets: 本T,做,不做,上游,AC
forbidden: "## 范围,## 异常,## AC,## 联调卡"
changeLabel: 涉及改动
---

# [T-001] 任务名 — 构思 [BE]

> **标准/完整**：用流程表（S1…）。**精简**：可用 #### + **涉及改动**/**改**。  
> 注意点/改 须含代码落点。`ai` 自主不减完整档流程表厚度。  
> 例子 → skill `examples/dev-reuse-examples.md`

- 档位：标准 · depends_on：无

## 摘要

- **本 T**：…
- **做**：扩 `XxxService`；`YyyController` 不动；…
- **不做**：…
- **上游**：…
- **AC**：…

## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | … | a → b | 继续走 `JwtFilter` — … |
| **S2** | … | … | 在 `XxxService` 上加 `foo` — 空→404 |
| **S3** | … | … | 在 `XxxService` 上加 `bar` — 幂等 200 |

## 结果

| 项 | 证据 |
