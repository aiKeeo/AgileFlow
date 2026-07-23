## L0 摘要（flow 步 · 受 flow.yaml 管理）

- 本步须在 `atlas/flow.yaml` 的 `steps` 中启用；`stepId` 用 canonical id
- 总控只路由：有 Task → 派 Subagent；无 Task → `degraded` + `af-allow-degraded.md` + orch-direct 台账（**质量不降级**）
- 先落盘再进阶；`ai` 连做仍每阶段/每 T 真派 Task（或 degraded 直做并记账）
- 目录 `atlas/requirements/`（非 `req/`）；写业务码前 `write-code` 绿
- 红闸门不准装绿；同 gate 自修≤3 轮仍红则停
- 仅总控改 `atlas/flow.yaml`；角色禁改
- **收尾留痕（强制）**：本步完成后先显式执行 `npx @agileflow/cli log --door {本门牌} --summary … --route … --root .`（**本步门牌**；仅入口 `/af` 一行不够）。`AF_DECIDE=ai` 只免 AskQuestion，**不免留痕**；gate 不自动补。
- **闸门结果以 CLI 退出码与最终尾标为准**：有 current Run 时还须 `agileflow run gate-status --gate {gate} --root .` 为 `PASS (pass)`；禁止读取 legacy MD 冒充当前证明。
- **前进靠回执**：离开本步前须本步 confirm 已 PASS；**前进用 advance/step sync，禁止 rewind 跳到更后步**
- **REQ 硬指标**：`REQ-TITLE-SUBSTANCE` / `REQ-SCOPE-MINLEN` / `REQ-AC-MIN-ROWS` / `REQ-AC-CELL-MINLEN`（禁标题 `666`、禁自创大纲冒充）
