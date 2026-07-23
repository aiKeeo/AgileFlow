请使用本机 AgileFlow skill（目录：`{{SKILL_ROOT}}`，入口 `SKILL.md`）执行：

/af 做一个减肥小程序
java21 springboot3.5.5 taro4 +react +vite
我来决策

在目录 `{{WORK_ROOT}}` 落盘（已有内容可接着做）。严格按该 skill 自行推进，直到开发完毕。

硬约束：
- `AF_DECIDE=user` 时按停点问人；仍须每步留痕（`ai`/`user` 都不免）
- 每个 flow 步完成后先 `npx @agileflow/cli log --door /af-req|mod|sol|dev… --summary … --route … --root {{WORK_ROOT}}`，再跑对应 gate（仅入口 `/af` 一行不够）
- 禁止只建空 atlas/logs/；漏写显式 log 时 gate 必须失败，不得自动补
