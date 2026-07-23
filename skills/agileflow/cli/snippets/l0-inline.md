## L0 摘要（flow 步 · 受 flow.yaml 管理）

- 本步须在 `atlas/flow.yaml` 的 `steps` 中启用；`stepId` 用 canonical id
- 总控只路由：派 Subagent 写正文；记台账；跑 gate；改 env/todo/flow
- 先落盘再进阶；`ai` 连做仍每阶段/每 T 真派 Task
- 目录 `atlas/requirements/`（非 `req/`）；写业务码前 `write-code` 绿
- 红闸门不准装绿；同 gate 自修≤3 轮仍红则停
- 仅总控改 `atlas/flow.yaml`；角色禁改
