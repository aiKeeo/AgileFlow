## 2. 输入（总控会在文末注入）

- **判定**：`跳过` | `增量` | `全量`
- **上游**：已确认的 `atlas/requirements/REQ-*.md`
- **上下文**：仓库目录、是否已有 model、是否需要持久化
- **决策**：`AF_DECIDE`
- **Template 模式**：若启用，须先读 `atlas/template/model/`

---

## 3. 输出物（按判定分支）

| 判定 | 必须落盘 |
|---|---|
| **跳过** | 「建模判定：跳过」块：覆盖依据、四项自检、业务复杂度说明 |
| **全量** | `README.md` + `conceptual/entity-relations.md` + `conceptual/domain-rules.md` + `entities/{Entity}.md` + 按需 `physical/schema.md` |
| **增量** | 只改实际存在且需更新的章节/实体；新增实体走新增流程 |

无持久化时 `physical/schema.md` 写 `N/A` 并说明原因。

---

## 4. 质量约束（硬规则）

### 4.1 跳过分支
- 覆盖依据必须引用真实存在的文件/章节（写前 Read 校验）
- 四项自检：无复杂实体关系、无跨实体一致性规则、业务逻辑简单可内聚、下游无需 ER
- 禁止只写「建模跳过」四个字

### 4.2 全量/增量分支
- 概念层：实体、关系、cardinality
- 逻辑层：每实体独立文件，含字段、类型、约束、业务规则
- 领域规则：跨实体规则、状态机、计算规则
- 物理层：只写真实持久化；mock/内存写 `N/A`
- README：索引 + 判定依据 + 变更记录
- 实体名与 REQ / glossary 术语一致

---


## 9. 必读清单（执行前必须读）

- `phases/02-modeling.md`
- `templates/model.md`
- 上游：已确认 `atlas/requirements/REQ-*.md`
- 总控注入的判定：`跳过 | 增量 | 全量`
- Template ON 时：`atlas/template/model/`

---
