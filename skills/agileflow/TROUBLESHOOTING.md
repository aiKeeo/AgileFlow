# Agileflow 排障（短表）

> **用法**：先看报错行末 `💡 白话 · 谁修`；本表 = **白话 + 谁修 + 下一步**（不重复规则定义）。  
> **错误码权威**：规则含义与修复动作 → [validate-atlas-gate](templates/validate-atlas-gate.md)；脚本 `lib/rule-hints.mjs`；流程裁决 → [SKILL 裁决表](SKILL.md#裁决表冲突时以此为准)。  
> **谁修**：`AI`=自修后重跑闸门（`AF_DECIDE=ai` 勿等人说继续）· `你`=需选卡/提供资源 · `双方`=配合。

## 高频（置顶）

| 问题 | 白话 | 谁修 | 怎么做 |
|------|------|------|--------|
| 闸门红 / `[SOL-*]` | 方案或契约文档不合规 | AI | 贴完整报错；AI 自修后重跑 |
| 闸门红 / `[DEV-*]` `[TODO-CHECK-*]` | dev 文档薄/缺证据/勾了但没文件 | AI | 让 AI 补 dev + 真跑命令写 `## 结果` |
| 闸门红 / `[REQ-*]` | 需求缺 AC/UID/范围 | AI | 补 REQ / 回填 AC 后重跑 |
| `AF-ENV-BOOT` | 还没选谁决策 | 你 | 答启动卡或说「重选决策权」 |
| `AF-ENV-CAPABILITY-PENDING` | 总控未声明宿主能力 | AI | 首条写 `AF_HOST_CAPABILITY=full|degraded` |
| `AF-ENV-PHASE` | env 阶段与产物不一致 | AI | 按报错更新 `AF_PHASE` 后重跑 gate |
| `ORCH-DEGRADED-CONFLICT` | 有 Task 却 degraded 台账 | AI | 改 `normal` 台账 + `subagentId`，或真降级则改 env |
| AI 不写文件、像卡住 | 在等你点阶段闸门卡 | 你 | 点「继续」；要全自动→「后面都你定」 |
| `ai` 却每阶段停 | Agent 误用旧纪律 | AI | 提醒按委托**连做**；仍须闸门绿 |
| `ai` 派完一批等人「继续」 | 后台派活后交班 | AI | 改阻塞式 Task；同会话循环到交付 → [orchestrator](templates/orchestrator.md) |
| 总控包办 REQ/sol/dev / 未开 Subagent | 口头派活或连做误读 | AI | 查是否真派 Subagent；补派 + 记台账；真无 Subagent → `AF_HOST_CAPABILITY=degraded` + `degradedReason` |
| `ORCH-NO-DISPATCH` / `ORCH-DISPATCH-MISMATCH` | 无台账或未覆盖产物路径 | AI | 派 Subagent（Cursor=Task）对应 role → 收回报写台账 → 重跑 gate |
| `ORCH-NO-SUBAGENT-ID` / `ORCH-DEV-NO-TASKID` | 台账缺 Subagent ID 或 dev 缺 taskId | AI | 每条 entry 写宿主返回的 `subagentId`；dev 写 `taskId`（如 T-001）；`dev-complete`/`test-entry` 收口亦验 |
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
| `SKIP-CODE-*` / `DOC-FIRST-*` / `SKIP-README冒充T` / `SKIP-MODEL-无判定` | 先写码无方案/无 F/无建模跳过判定 / REQ 格式未过 | AI | 补 architecture+F+dev；或在 `flow.yaml` 写 model skip+reason（旧项目可 todo「建模判定：跳过⏭️」）；写码前跑 `--gate write-code` |
| `SKIP-方案进度假` / `TODO-CHECK-方案完成无arch` | 勾了方案✅却无 architecture | AI | 先落盘架构与 F |
| `SOL-README-MASH*` | solution README 写了技术栈/API 表 | AI | README 只留索引 |
| `SOL-CONTRACTS-缺` / `SOL-F-EXPOSE` / `SOL-F-BOUND` | 暴露面有编号无文件/边界缺做不做 | AI | 补 contracts；F 写暴露面与边界 |
| `SOL-A-SEC-*` / `SOL-A-RUN` | architecture 缺技术栈/模块/本地验证 | AI | 按模板补三节 |
| `REQ-SCOPE` / `REQ-AC-未回填` | 无范围提示；AC 未回填 | AI | 补范围；③ 回填测法；`dev-complete`/`test-entry` 强制拦 |
| `SKIP-测试进度假` / `TST-R-PASS` | 「测试验收 ✅」但无 PASS | AI | tests/README 写 PASS + 报告 |
| `MOD-*` | model 目录结构/实体不合规 | AI | 按 02-modeling 补 entities/conceptual |
| 说「测过了」但编译不过 | 可运行闸门未真跑 | AI | 要求 `## 结果` 写**命令 + exit code** |
| `ORCH-STEP-ID` / `ORCH-DIRECT-ID` | 台账缺步名，或直做步未标 orch-direct | AI | 每步写 stepId；prompt:null 用 role=orch-direct |
| `AF-ENV-STEP*` / `FLOW-*` | AF_STEP 缺失或与 flow/产物不一致；strict 擅自 skip | AI | 同步 `AF_STEP`+`AF_PHASE`；见 [flow.md](templates/flow.md) |
| 断点找不到进度 | todo 缺失或 checkpoint 空 | 双方 | 读 `AF_STEP`+flow；说「继续 agileflow」→ 从当前步续 |
| 半初始化 atlas（有 role 无 dispatch 等） | scaffold 中断 | AI | 重跑 `--bootstrap-scaffold --root .`（幂等，只补缺失） |
| 跳过首启卡直接写 REQ | env 未 pending | 你 | 说「**重选决策权**」→ 再发启动卡 |
| 想调研却进了 req | 意图是探索 | 你 | 说「先探索」或 `explore:` |
| AI 自主仍要写① / 细 sol·dev | 单档位不减厚；加速靠并发 | — | 正常；见 [contract](templates/contract.md) |
| humanTodo 一直阻塞 | 密钥/资源未提供 | 你 | 配好后说「已配置 xxx」 |
| 并行 Subagent 翻车 | 路径冲突或未过并发启用 | AI | 查 [parallel](phases/04-development.md#并行阶段-4) |
| `⚠️ validate-atlas 不可用` | 无 node / 脚本路径失败 | 双方 | AI 逐项自检；**你建议抽查**；`ai` 模式禁甩「继续」给人 |

```bash
node <skill>/scripts/validate-atlas.mjs --list-gates
node <skill>/scripts/validate-atlas.mjs --gate sol-confirm
```

仍不行：把**完整报错原文**贴给 AI，并打开 `atlas/README.md` / `atlas/todo.md` 看「现在」。停点对照 → [examples/flow-interaction.md](examples/flow-interaction.md)
