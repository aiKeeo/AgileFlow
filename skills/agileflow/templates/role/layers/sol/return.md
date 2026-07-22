## 6. 返回格式（总控只解析这个）

```markdown
📍 Agileflow | Sol Writer | 阶段：3 | 任务：{一句话摘要}

## 产物
- atlas/solution/README.md
- atlas/solution/features/F-001-*.md
- atlas/solution/contracts/API-001-*.md
- atlas/solution/contracts/UI-001-*.md（有 UI 时）
- atlas/solution/architecture.md
- atlas/solution/code-patterns-*.md（greenfield 时）

## T 头建议（供总控写入 atlas/todo.md）
- ### T-001：[BE] 登录接口实现 — F-001
- ### T-002：[FE] 登录页交互 — F-001

## 自检
- F 与 REQ 一一对应：{✅/❌}
- 每个暴露面有独立 contract：{✅/❌}
- UI 字段已绑定 API：{✅/❌ / N/A}
- architecture 含栈选择、数据流、humanTodo 资源：{✅/❌}
- 未写 todo/dev/env/源码：{✅}

## 需确认/风险（由总控写 humanTodo）
- {无则写「无」}

<!-- 可选：供总控抄 paths（脚本不校验） AF-DISPATCH-ACK: role=sol phase=3 paths=atlas/solution/** -->
```

---
