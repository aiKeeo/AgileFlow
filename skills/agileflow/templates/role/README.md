# 角色提示词（Subagent）

> **这些文件是给子代理的，不是给总控自己照着写的。**  
> **首启强制**把本目录落到项目 `atlas/role/`（可改 = 项目自定义）。  
> 总控派活前 **只读** `atlas/role/role-*.md`，再 **用宿主 Subagent/Task 发出去**。  
> **产物形态**见 `atlas/template/`；**角色行为**见 `atlas/role/`。两者独立。  
> 跨 IDE 派活 → [orchestrator §宿主义务](../orchestrator.md#宿主义务workbuddy--cursor--codex--其他)

## 加载顺序（硬规则）

```
1. 首启已落盘 atlas/role/（缺 → --bootstrap-scaffold 或闸门 DIR-ROLE）
2. 总控 Read atlas/role/role-{key}.md（项目版；用户可改）
3. 文末追加「本次任务」块
4. 【必须】调用宿主多 Agent API 发给 Subagent（禁止本会话代写正文）
5. 收回报 → 总控写 atlas/agileflow-dispatch.json → validate-atlas --gate（流程见 [orchestrator §派活台账](../orchestrator.md#派活台账gate-前必写--唯一硬挡实现)）
```

| key | 文件 | 角色 |
|-----|------|------|
| `req` | `role-req.md` | REQ Writer |
| `model` | `role-model.md` | Model Writer |
| `sol` | `role-sol.md` | Sol Writer |
| `dev` | `role-dev.md` | Dev Worker |

阶段 0 init / 阶段 5 tests：无角色派活，**总控直接做**。

## 自定义 role → 文档闸门自动失效

首启 `--bootstrap-scaffold` 会写入 `atlas/role/.agileflow-role-baseline.json`（各 `role-*.md` 的 sha256）。

**相对 baseline 内容有改动** → 该 role 视为用户自定义；`validate-atlas --gate` **跳过**对应阶段默认**文档格式**闸门（REQ-*/MOD-*/SOL-*/DEV-* 等），输出 info `ROLE-CUSTOM-SKIP`。

**仍硬挡**：`af-env`、`dir`、**ORCH 派活台账**、runnable/smoke 等流程闸门。

重置「默认」对照：从 skill 恢复 role 正文后执行  
`node <skill>/scripts/validate-atlas.mjs --refresh-role-baseline --root .`

## 首启落盘（强制）

```bash
node <skill>/scripts/validate-atlas.mjs --bootstrap-scaffold --root .
```

- 复制 skill `templates/role/role-*.md` → `atlas/role/`（**已有文件不覆盖**）
- 创建 `humanTodo.md` / `todo.md` 骨架 / 空派活台账 / **role baseline**
- 改 `atlas/role/role-*.md` = 定制本项目 Subagent 行为

## 可改 / 不可删

| 可改 | 须保留意图 |
|------|------------|
| 身份措辞、工作流细节、额外必读、项目约束 | `## 硬禁止`（env/todo/跨阶段） |
| 加严自检 | `## 验收 gate` 名（可加严，不可改成「不用 gate」） |

## 骨架（每个 role 文件）

`## 身份` · `## 必读` · `## 产物` · `## 验收 gate` · `## 硬禁止` · `## 工作流` · `## 返回给总控`

总控与派活表 → [orchestrator.md](../orchestrator.md)
