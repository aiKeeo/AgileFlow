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
| `atlas/requirements/REQ-XXX-*.md` | 每 ≥1 个独立可验收功能 1 份 | 标题、范围、AC 表（状态列）、边界 |
| `atlas/requirements/ui/UID-*.md` | 有 UI 时 | 区域表、ASCII 线框、样式 **待定** |
| `atlas/requirements/README.md` | 始终 | 索引表、AI 决策记录（MVP、拆分理由） |
| `atlas/glossary.md` | 出现新术语时 | 术语定义，标记 `<!-- auto -->` |

**路径铁律**：产物只在 `atlas/requirements/`。  
❌ 禁止 `atlas/req/`、`atlas/solution/`、`atlas/dev/`、`atlas/todo.md`。

---

## 4. 质量约束（硬规则）

### 4.1 每个 REQ 必须满足
- 标题格式：`REQ-XXX-功能名.md`（不能用 `REQ-001.md` 无后缀）
- 功能名称在标题、正文第一段、AC 表中一致
- 范围明确：范围内 / 范围外 两段，不能空
- AC 表：每行一条可验收用例，状态列只能是 `⬜` / `✅` / `PASS` / `FAIL` / `BLOCKED` / `（③ 后填）`
- 边界：用 `← REQ-xxx` 引用上游，不直接复制粘贴

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

---
