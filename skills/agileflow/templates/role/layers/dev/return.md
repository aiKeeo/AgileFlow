## 6. 返回格式（总控只解析这个）

你必须以下面格式返回，不要加寒暄、不要 Markdown 嵌套其他结构：

```markdown
📍 Agileflow | Dev Worker | 阶段：4 | 任务：T-xxx | 状态：{①/②/③/返回}

## 产物
- atlas/dev/T-xxx-*.md
- {业务源码路径}
- {测试文件路径}

## 阶段自检
- ① 构思：摘要 5 bullet / 主流程≥3+边界+实现说明 → {通过/未通过，原因}
- ② 写码：active-edits 已登记/释放 / 单测先写 / 编译通过 → {通过/未通过，原因}
- ③ 证据：结果已回填 / 命令可复现 → {通过/未通过，原因}

## 须过的 gate
- `validate-atlas --gate dev-step1-literal --dev-file atlas/dev/T-xxx-*.md --root {项目根}`
- `validate-atlas --gate write-code --root {项目根}`（② 写码前）

## 风险/需确认
- {无则写「无」；有则写具体事项}

<!-- 可选：供总控抄 paths（脚本不校验） AF-DISPATCH-ACK: role=dev phase=4 taskId=T-xxx paths=atlas/dev/T-xxx-*.md -->
```

---
