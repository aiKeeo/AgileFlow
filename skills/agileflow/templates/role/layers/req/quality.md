## 2. 输入（总控会在文末注入）

- **用户意图**：原始需求 / 问题 / 目标
- **平台 & 范围**：移动端 / Web / 小程序 / 全栈 / MVP
- **上游上下文**：仓库目录、相关文件、探索结论
- **决策**：`AF_DECIDE`
- **Template 模式**：若启用，须先读 `atlas/template/requirements/`

---

## 3. 输出物（按这个顺序写）

| 产物 | 什么时候写 | 必须包含 |
|---|---|---|
| `atlas/requirements/REQ-XXX-*.md` | 每 ≥1 个独立可验收功能 1 份 | 见下方硬指标表 |
| `atlas/requirements/ui/UID-*.md` | 有 UI 时 | 区域表、ASCII 线框、样式 **待定** |
| `atlas/requirements/README.md` | 始终 | 索引表、AI 决策记录（MVP、拆分理由） |
| `atlas/glossary.md` | 出现新术语时 | 术语定义，标记 `<!-- auto -->` |

**路径铁律**：产物只在 `atlas/requirements/`。
❌ 禁止 `atlas/req/`、`atlas/solution/`、`atlas/dev/`、`atlas/todo.md`。
❌ 禁止自创大纲（`## 1. 概述` / 用户故事表冒充 REQ）——必须用模板节名。

---

## 4. 质量硬指标（闸门认账 · 规则 ID）

| 硬指标 | 规则 ID | 不过则 |
|--------|---------|--------|
| 文件名 `REQ-XXX-名称.md` | `REQ-F001` | 红 |
| 标题 `# [REQ-XXX] 功能名`（禁 `666`/纯数字/junk） | `REQ-F002` / `REQ-TITLE-SUBSTANCE` | 红 |
| 版本 + 状态枚举 | `REQ-F003` | 红 |
| 必须有 `## 范围提示`；范围内/外各 ≥16 字 | `REQ-SCOPE` / `REQ-SCOPE-MINLEN` | 红 |
| 必须有 `## 验收标准` + BDD 8 列表 | `REQ-F004` / `REQ-AC-表头` | 红 |
| AC ≥2 行（成功 + 失败/边界） | `REQ-AC-MIN-ROWS` | 红 |
| 场景/Given/When/Then 各 ≥8 字；Then 含可观测断言 | `REQ-AC-CELL-MINLEN` / `REQ-AC-空单元格` | 红 |
| 正文去空白 ≥200 | `REQ-BODY-过短` | 红 |

模板权威：`templates/req.md`。写完后总控跑 `agileflow gate --gate req-confirm`。

### 4.2 有 UI 时 UID 必须满足
- 不定义配色、字体、圆角、动效（样式由用户后续决定）
- 每个区域有编号、名称、字段、操作、校验规则
- ASCII 线框只表达布局，不表达视觉风格
- 缺少参考稿时 → 返回「需确认」，由总控写 `humanTodo`

### 4.3 术语与决策记录
- 新术语第一次出现必须写入 `glossary.md`
- `requirements/README.md` 必须有「AI 决策记录」节：MVP 范围、REQ 拆分理由、ui_scope 选择

---

## 9. 必读清单（执行前必须读）

- `phases/01-requirement.md`
- `templates/req.md`
- `templates/uid.md`（有 UI 时）
- `templates/contract.md`（AI 决策记录格式）
- 上游：用户原话 / 仓库上下文 / 探索结论（总控注入）
- Template ON 时：`atlas/template/requirements/`
