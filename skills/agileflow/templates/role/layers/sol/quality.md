## 2. 输入（总控会在文末注入）

- **上游**：已确认 REQ、model/ 或跳过判定、仓库上下文
- **栈来源**：`ai_record` / `askquestion` / `user_said` / `repo`
- **决策**：`AF_DECIDE`
- **Template 模式**：若启用，须先读 `atlas/template/solution/`

---

## 3. 输出物（按这个顺序写）

| 顺序 | 产物 | 必须包含 |
|---|---|---|
| 1 | `atlas/solution/README.md` | 索引、F 列表、开发任务节（T 头建议）、AC→主 T、AI 决策记录 |
| 2 | `atlas/solution/features/F-*.md` | 边界 `← REQ-xxx`、暴露面、依赖；**禁止**联调卡 |
| 3 | `atlas/solution/contracts/API-*.md` / `UI-*.md` | 一暴露面一文件；UI 字段必须绑定到 API |
| 4 | `atlas/solution/architecture.md` | 分层、数据流、栈选择、依赖、humanTodo 资源 |
| 5 | `atlas/solution/code-patterns-*.md` | greenfield 时各端代码约定 |

**路径铁律**：
- 契约：`API-XXX-名.md` / `UI-XXX-名.md`，**禁止**揉成 `API.md` / `UI.md`
- todo：由总控写 `atlas/todo.md`，**禁止**自建 `atlas/solution/todo.md`

---

## 4. 质量约束（硬规则）

### 4.1 F 文件
- 每个 F 对应一个可独立交付的功能面
- 必须引用上游 REQ：`← REQ-xxx`
- 暴露面清晰：API、UI、事件、Job 等
- 联调卡、字段绑定**不写**在 F（绑定在 contracts/UI）

### 4.2 Contracts
- 一暴露面一文件，文件名带序号和名称
- **API 三层结构**（`sol-confirm` 硬挡）：
  1. `## 数据模型` — 嵌套 object / 跨方法复用 DTO 在此展开（禁止表格 inline `{ a, b }` 或「见下」）
  2. 每方法（或 HTTP 单接口）**请求 + 成功响应** 必须用 ` ```jsonc ` 代码块 + 示例值；行尾 `//` 注释
  3. `### 字段规则` 表 — 校验/默认值/互斥等写在这里
- **信封**：HTTP `{ "code": 0, "data": ... }`；Local Service `{ "ok": true, "data": ... }`（见 `_common.md`）
- API：method、path、错误码
- UI：区域编号、字段、校验、绑定到 API 字段
- 禁止把 JSON 粘贴进 F 或 architecture

### 4.3 Architecture
- 模块分层图（ASCII 或 Mermaid）
- 数据流 / 关键时序
- 栈选择及理由
- 外部依赖与 humanTodo 资源（密钥、账号、沙箱等）
- 不写具体函数实现，只写结构约定

### 4.4 T 头建议格式
```markdown
### T-001：[端] 描述 — F-xxx
### T-002：[端] 描述 — F-xxx
```
每个 T 必须是可派活的独立任务。

---


## 9. 必读清单（执行前必须读）

- `phases/03-solution-design.md`
- `templates/solution.md`
- `templates/solution.md`
- 上游：已确认 REQ、model/ 或跳过判定、仓库上下文（总控注入）
- Template ON 时：`atlas/template/solution/`

---
