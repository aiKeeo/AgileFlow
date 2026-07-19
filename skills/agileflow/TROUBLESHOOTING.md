# Agileflow 排障（短表）

> 闸门报错 / AI 卡住时先查本表。细则 → [validate-atlas-gate](templates/validate-atlas-gate.md) / [SKILL 裁决表](SKILL.md)。  
> 脚本报错行末含 `💡 白话 · 谁修`；下表 **谁修**：`AI`=说继续即可 · `你`=需选卡/提供资源 · `双方`=配合。

## 高频（置顶）

| 问题 | 白话 | 谁修 | 怎么做 |
|------|------|------|--------|
| 闸门红 / `[SOL-*]` | 方案或契约文档不合规 | AI | 贴完整报错；说「继续」让 AI 修 |
| 闸门红 / `[DEV-*]` `[TODO-CHECK-*]` | dev 文档薄/缺证据/勾了但没文件 | AI | 让 AI 补 dev + 真跑命令写 `## 结果` |
| 闸门红 / `[REQ-*]` | 需求缺 AC/UID/范围 | AI | 说「继续」补 REQ |
| `AF-ENV-BOOT` | 还没选连做/严谨 | 你 | 答启动卡或说「重选模式」 |
| AI 不写文件、像卡住 | 在等你点审阅/阶段闸门卡 | 你 | 点「继续」；要全自动→「后面都你定」 |
| `fast+ai` 却每阶段停 | Agent 误用旧纪律 | AI | 提醒按委托**连做**；仍须闸门绿 |
| 总控包办 REQ/sol/dev / 未开 Subagent | 口头派活或连做误读 | AI | 查是否真派 Subagent；补派 + 记 `atlas/agileflow-dispatch.json`；无 Subagent 宿主才可用 `degraded-single-session`（滥用=违规） |
| `ORCH-NO-DISPATCH` / `ORCH-DISPATCH-MISMATCH` | 无台账或未覆盖产物路径 | AI | 派 Subagent（Cursor=Task）对应 role → 收回报写台账 → 重跑 gate |
| 改了 `atlas/role/` 仍被 REQ-*/DEV-* 挡 | baseline 未更新或 role 未判 custom | AI | 确认 `.agileflow-role-baseline.json` 存在；自定义后应见 `ROLE-CUSTOM-SKIP`；恢复默认闸门 → `--refresh-role-baseline` |

## 全表

| 问题 | 常见原因 | 谁修 | 怎么做 |
|------|----------|------|--------|
| `TODO-CHECK-*` | 勾了①②③但无合规 dev 或无可运行证据 | AI | 先落盘 `dev/T-*.md` 并真跑命令，再勾 |
| `REQ-UID-断链` | REQ 链了 UID，`ui/` 空或不存在 | AI | 先写满 UID，再标 REQ 已确认 |
| `REQ-AC-观测面值` / `REQ-AC-表头` / `REQ-AC-空单元格` | AC 表格式不对或空格 | AI | 按 [05-testing](phases/05-testing.md) 补列 |
| `SOL-F-REQ-TRACE` | F 无 `← REQ-…` 回溯 | AI | 边界从 REQ 提炼并写回溯行 |
| `SOL-API-NO-JSON` | API 契约无 JSON 示例 | AI | 按 template-api 补 jsonc 请求/响应 |
| `dev 文件数 ≠ T 头数` | todo 有多个 T 却合文件或少写 | AI | **一 T 一文件**（BE/FE 拆开） |
| `SKIP-CODE-*` / `DOC-FIRST-*` / `SKIP-README冒充T` / `SKIP-MODEL-无判定` | 先写码无方案/无 F/无建模跳过判定 / REQ 格式未过 | AI | 补 architecture+F+dev；或写「建模判定：跳过⏭️」；写码前跑 `--gate write-code` |
| `SKIP-方案进度假` / `TODO-CHECK-方案完成无arch` | 勾了方案✅却无 architecture | AI | 先落盘架构与 F |
| `SOL-README-MASH*` | solution README 写了技术栈/API 表 | AI | README 只留索引 |
| `SOL-CONTRACTS-缺` / `SOL-F-EXPOSE` / `SOL-F-BOUND` | 暴露面有编号无文件/边界缺做不做 | AI | 补 contracts；F 写暴露面与边界 |
| `SOL-A-SEC-*` / `SOL-A-RUN` | architecture 缺技术栈/模块/本地验证 | AI | 按模板补三节 |
| `REQ-SCOPE` / `REQ-AC-未回填` | 无范围提示；AC 未回填 | AI | 补范围；③ 后回填测法 |
| `SKIP-测试进度假` / `TST-R-PASS` | 「测试验收 ✅」但无 PASS | AI | tests/README 写 PASS + 报告 |
| `MOD-*` | model 目录结构/实体不合规 | AI | 按 02-modeling 补 entities/conceptual |
| 说「测过了」但编译不过 | 可运行闸门未真跑 | AI | 要求 `## 结果` 写**命令 + exit code** |
| 断点找不到进度 | todo 缺失或 checkpoint 空 | 双方 | 打开/重建根 todo；说「继续 agileflow」 |
| 跳过首启卡直接写 REQ | env 未 pending | 你 | 说「**重选模式**」→ 再发启动卡 |
| 想调研却进了 req | 意图是探索 | 你 | 说「先探索」或 `explore:` |
| 「连做」仍要写① / 细 sol·dev | 连做≠薄文档；加速靠并发 | — | 正常；见 [contract §1](templates/contract.md#1-两维--env) |
| humanTodo 一直阻塞 | 密钥/资源未提供 | 你 | 配好后说「已配置 xxx」 |
| 并行 Subagent 翻车 | 路径冲突或未过并发启用 | AI | 查 [parallel](phases/04-development.md#并行阶段-4) |
| `⚠️ validate-atlas 不可用` | 无 node / 脚本路径失败 | 双方 | AI 逐项自检；**你建议抽查**；此模式禁连做 |

```bash
node <skill>/scripts/validate-atlas.mjs --list-gates
node <skill>/scripts/validate-atlas.mjs --gate sol-confirm
```

仍不行：把**完整报错原文**贴给 AI，并打开 `atlas/README.md` / `atlas/todo.md` 看「现在」。节奏对照 → [examples/flow-interaction.md](examples/flow-interaction.md)
