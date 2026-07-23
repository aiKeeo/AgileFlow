请使用本机 AgileFlow skill（目录：`{{SKILL_ROOT}}`，入口 `SKILL.md`）执行：

/af
/af-research 做一个每日饮水打卡小程序，先按 flow 从调研门牌进入；什么都别问我 你定

在目录 `{{WORK_ROOT}}` 落盘（已有内容可接着做）。严格按该 skill 自行推进，直到开发完毕。

硬约束：每个 /af* 步完成后先 `npx @agileflow/cli log --door … --summary … --route … --root {{WORK_ROOT}}`，再跑 gate；禁止空 logs/。
