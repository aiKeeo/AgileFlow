请使用本机 AgileFlow skill（目录：`{{SKILL_ROOT}}`，入口 `SKILL.md`）执行：

/af-revise 把 REQ-001 的 AC-001-01 从「仅微信退款」扩展为「支持微信和支付宝退款」。什么都别问我，你定

在目录 `{{WORK_ROOT}}` 落盘（已有确认 REQ + 方案）。严格按 change-management L2 流程：先影响分析卡，再更 REQ，再同步 sol。

硬约束：每个 /af* 步完成后先 `npx @agileflow/cli log --door … --summary … --route … --root {{WORK_ROOT}}`，再跑 gate；禁止空 logs/。
