# atlas/ 目录结构与路径铁律

> **权威**：`atlas/` 物理布局、路径铁律、`temp/` 规则。路由逻辑 → [00-intent-routing](00-intent-routing.md)（只链不抄本节）。

## 目录树

> **`atlas/`** = 流程文档的**根容器**，不是「把一切揉成一份」。  
> 子目录按阶段**物理隔离**：需求归 `requirements/`、模型归 `model/`、方案归 `solution/`、构思归 `dev/`、验收归 `tests/`。  
> **禁止**：把不同阶段产物写进同一文件；把多份独立功能糊成一份「总览 REQ」冒充完成；向用户编造「历史目录 / 旧名迁移」——只陈述下表约定。

```
atlas/
├── README.md                  # 人类驾驶舱（强制；见 templates/atlas-readme.md）
├── init/                      # init: 仅 brownfield
│   ├── codebase/p1-{端}.md
│   ├── p0-business.md … data/
├── requirements/              # req: 需求 REQ + 按需 ui/UID
├── model/                     # mod: 数据建模（与 REQ 分文件）
├── solution/                  # sol: 方案
│   ├── architecture.md
│   └── code-patterns-{端}.md  # greenfield 模式 B 🌱
├── conventions/               # 模式 A 可选；默认不建
├── dev/                       # dev: 每任务一份构思 T-xxx（不放业务源码）
├── tests/
│   ├── README.md · REQ-*-验收报告.md
│   └── fe-pixel/
├── logs/
├── glossary.md
├── debt.md
├── flow.yaml                    # 流程编排 SSOT（启用/跳过/插入；总控改；≠ todo）
├── agileflow.env · agileflow-dispatch.json  # AF_STEP 进度 + 派活台账（entries 须含 stepId）
├── todo.md · humanTodo.md · active-edits.md（按需）
├── role/                      # 首启强制；Subagent 提示词（可自定义）
│   └── role-req|model|sol|dev.md
```

- **`atlas/README.md`**：人先读；每阶段结束更新（[atlas-readme](../templates/atlas-readme.md)）
- **`atlas/flow.yaml`**：完整轨步骤开闭（YAML）；仅总控改；schema → [flow](../templates/flow.md)。**不**放开发任务（任务在 `todo.md`）
- **`atlas/role/` + `humanTodo.md` + `agileflow-dispatch.json`**：首启 `--bootstrap-scaffold --root {项目根}` 写入**项目** atlas/（非 skill 目录）；派活只读 `atlas/role/`
- 各目录下 `temp/` 放临时稿（见 [§TEMP](#temp-临时目录)）
- 无独立前缀：`atlas/todo.md` / `humanTodo.md` / `active-edits.md` 随阶段 1/3/4 更新（路径始终在 atlas 根，不进 solution/）
- **业务源码**写在工程正常位置（如 `src/`、`miniprogram/`），**不**塞进 `atlas/`
- **只链不抄**：验收/线框/API 各有唯一权威，见 [SKILL 裁决表](../SKILL.md)

## 路径铁律（落盘前自检 · 写错即闸门红）

> 裁决表摘要 → [SKILL §路径铁律](../SKILL.md)。总控 gate 前自检 → [orchestrator §落盘路径](../templates/orchestrator.md#落盘路径自检gate-前--总控必做)（仅链接，不重复表）。

| ❌ 禁止 | ✅ 正确 |
|--------|--------|
| `atlas/req/` · `atlas/sol/` | `atlas/requirements/` · `atlas/solution/` |
| `atlas/solution/todo.md` | `atlas/todo.md`（根） |
| `.cursor/agileflow-dispatch.json` · `atlas/.agileflow-dispatch.json` | `atlas/agileflow-dispatch.json`（与 `agileflow.env` 同级） |
| `contracts/API.md` · `UI.md` 一大坨 | `contracts/API-001-*.md` · `UI-001-*.md` 一暴露面一文件 |
| 把前缀 `req:`/`sol:` 当文件夹名 | 前缀=口令；文件夹用上表全名 |

脚本：`DIR-NAME-*` · `DIR-TODO-PATH` · `SOL-C001` / `SOL-C001-FAT`。

## TEMP 临时目录

> **已启用 AF**（`agileflow.env` 或 `requirements/`）→ **禁止** `temp/` 写码路径；须完整 REQ→sol→dev→`write-code`。

与已有 REQ/F/API **无明确关联**的工作 → **仅未启用 AF 时**放各目录 **`temp/` 子目录**，与正式文档物理隔离。仍遵守 ①→②→③。转正移出 `temp/`。

**命名**：`{NNN}-{简述}.md`（dev 含端：`{NNN}-{简述}-{FE|BE|FULL}.md`）；NNN 三位递增。**禁止**在正式目录用 `TEMP-` 前缀命名（统一用 `temp/` 子目录）。

命中 [00-intent §豁免判定](00-intent-routing.md#①-豁免判定最先做) → **禁止** `dev/temp/`、**禁止**微型豁免。灰色地带须 AskQuestion；`temp/` 不计入 T 头等式。
