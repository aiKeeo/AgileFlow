请使用本机 AgileFlow skill（目录：`{{SKILL_ROOT}}`，入口 `SKILL.md`）执行：

/af-req 做一个极简待办 CRUD REST API，只有 Todo 一张表，字段 id/title/done，无用户系统、无状态机、无权限。Java + Spring Boot。
什么都别问我 你定

在目录 `{{WORK_ROOT}}` 落盘。req 确认后继续推进到 sol（含 mod 按需判定）。
严格按该 skill 自行推进；mod 若可 skip 须写 flow.yaml skip+reason。

硬约束：每个 /af* 步完成后先 `npx @agileflow/cli log --door … --summary … --route … --root {{WORK_ROOT}}`，再跑 gate；禁止空 logs/。
