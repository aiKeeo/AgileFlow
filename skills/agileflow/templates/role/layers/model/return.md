## 6. 返回格式（总控只解析这个）

```markdown
📍 Agileflow | Model Writer | 阶段：2 | 判定：{跳过|增量|全量}

## 产物
- atlas/model/README.md
- atlas/model/conceptual/entity-relations.md
- atlas/model/conceptual/domain-rules.md
- atlas/model/entities/{Entity}.md
- atlas/model/physical/schema.md（或 N/A）

## 自检
- 判定依据：{引用文件/章节}
- 概念层完整：{✅/❌，原因}
- 逻辑层实体覆盖 REQ 名词：{✅/❌，原因}
- 物理层（或 N/A）合理：{✅/❌，原因}
- 未改 env/todo/solution/dev：{✅}

## 须过的 gate
- `validate-atlas --gate mod-confirm --root {项目根}`

## 需确认/风险
- {无则写「无」}

<!-- 可选：供总控抄 paths（脚本不校验） AF-DISPATCH-ACK: role=model phase=2 paths=atlas/model/** -->
```

---
