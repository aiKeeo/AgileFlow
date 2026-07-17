# Agileflow 排障（短表）

> 闸门报错 / AI 卡住时先查本表。细则仍以 [validate-atlas-gate](templates/validate-atlas-gate.md) / [SKILL 裁决表](SKILL.md) 为准，**不在此复述裁决**。

| 问题 | 常见原因 | 怎么做 |
|------|----------|--------|
| AI 不写文件、像卡住 | 等你点 AskQuestion 卡片 | 看聊天是否有未回答的卡；点完再说「继续」 |
| `TODO-CHECK-*` | 勾了①②③但无合规 `atlas/dev/` 或无可运行证据 | 先落盘 `dev/T-*.md` 并真跑命令，再勾 |
| `REQ-UID-断链` | REQ 链了 UID，`ui/` 空或不存在 | 先写满 UID，再标 REQ 已确认 |
| `REQ-AC-观测面` / `REQ-AC-GWT` | AC 表缺观测面或 Given/When/Then | 按 [ac-guide](templates/ac-guide.md) 补列 |
| `SOL-F-REQ-TRACE` | F 无 `← REQ-…` 回溯 | 边界从 REQ 提炼并写回溯行 |
| `dev 文件数 ≠ T 头数` | todo 有多个 T 却合文件或少写 | **一 T 一文件**（BE/FE 拆开） |
| `SKIP-CODE-*` / `SKIP-README冒充T` | 先写了 backend/frontend，方案揉进 README，或用 `dev/README` 冒充 T | 停写码；补 `architecture.md`+`features/F-*.md`+每 T 的 `dev/T-*.md`；再跑 `--gate anti-skip` |
| `SKIP-方案进度假` / `TODO-CHECK-方案完成无arch` | 进度勾了「方案设计 ✅」却无 architecture | 先落盘架构与 F，再勾进度 |
| `SOL-README-MASH*` | solution README 写了技术栈/架构/API 表 | README 只留索引；正文进 architecture / contracts / features |
| `SOL-CONTRACTS-缺` / `SOL-F-EXPOSE` / `SOL-F-BOUND` | 暴露面有编号无文件，或边界缺做/不做 | 补 contracts；F 写暴露面与 **做**/**不做** |
| `SOL-A-SEC-*` / `SOL-A-RUN` | architecture 缺技术栈/模块/本地验证 | 按模板补三节 |
| `REQ-SCOPE` / `REQ-AC-未回填` | 无范围提示；或进度已完成仍「③ 后填」 | 补范围；③ 后回填测法与状态 |
| `SKIP-测试进度假` / `TST-R-PASS` | 「测试验收 ✅」但无字面量 PASS | tests/README 写 PASS + 验收报告/smoke |
| `MOD-README-MASH` | model README 内联表结构 | 拆到 `entities/` 与 `conceptual/`；README 只索引 |
| `MOD-NO-ENTITY` | `entities/` 下无实体文件 | 每个实体写 `entities/{Name}.md`，禁止用 model-overview.md 单文件 |
| `MOD-CROSS-MISSING` | 缺 conceptual 跨实体文件 | 补写 `conceptual/entity-relations.md` 与 `conceptual/domain-rules.md` |
| `MOD-LEGACY-FLAT` | model 根下仍有实体或旧平铺文件 | 迁到 `entities/` · `conceptual/` · `physical/schema.md` |
| `MOD-ENTITY-FIELDS` | 实体文件缺「## 字段」表 | 补字段表（字段名 \| 类型 \| 约束 \| 说明） |
| 说「测过了」但编译不过 | 可运行闸门未真跑 | 要求 `## 结果` 写**命令 + exit code** |
| 跨会话找不到进度 | `todo.md` 缺失或 checkpoint 空 | 打开/重建 todo；说「继续 agileflow」并点名 T |
| 跳过首启卡直接写 REQ | env 值不对或未走启动卡 | 说「**重选模式**」→ env pending → 再发启动卡 |
| 想调研/优化却进了 req | 意图是探索不是交付 | 说「先探索」或 `explore:`；选定后再 req |
| 「快速」仍被要求写① / 写细 sol·dev | 快速 ≠ 跳① ≠ 薄文档；加速靠并发 | ①落盘同质；推并行启动卡 |
| humanTodo 一直阻塞 | 密钥/资源未提供 | 配好后通知「已配置 xxx」 |
| 并行 Subagent 翻车 | 无①或未过并行启动卡 | 先写齐①；显式说「并行」并确认卡 |

```bash
node <skill>/scripts/validate-atlas.mjs --list-gates
node <skill>/scripts/validate-atlas.mjs --gate sol-confirm
```

仍不行：把**完整报错原文**贴给 AI，并打开 `atlas/README.md` / `todo.md` 看「现在」。节奏对照 → [examples/flow-interaction.md](examples/flow-interaction.md)
