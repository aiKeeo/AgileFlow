# 写法锚点 · 工作流示例

> 默认 **模式 B**：单文件四段式，**不建** `atlas/conventions/`。  
> 完整规则 → [code-conventions.md](../templates/code-conventions.md)

---

## brownfield（接手老项目 · init:）

```
init:
  扫描源码
  → 写满 init/codebase/p1-backend.md（§一含模块一览+目录，不建 p1-architecture）
```

```
dev: T-002 新接口
  ① dev 七：codebase 对齐 p1-backend.md §3.3
  ② 复制 §3.3 结构写码
  ③ test/ac 全绿
```

---

## greenfield（从零 · sol: + dev:）

```
sol: 定 Spring Boot + React
  → architecture.md（栈与模块）
  → solution/code-patterns-backend.md 🌱（§三待补充）
  → 不建 init/、不建 conventions/
```

```
dev: T-001 首个用户 CRUD ③ ✅
  → 从源码摘录 Form/Controller 片段
  → refresh code-patterns-backend.md §三 → 📝

dev: T-002 订单模块
  → 对齐 §3.x 模板
```

---

## 模式 A（仅用户明确要求全栈分开维护）

```
init/codebase/p1-frontend.md     # 仅 §一目录
atlas/conventions/frontend-patterns.md   # §2 模板
dev 七：conventions 对齐 frontend §2.2
```

---

## AI 决策树

```
dev ② 要写码？
  ├─ brownfield + init/codebase/？ → Read §三，dev 七 引用 §3.x
  ├─ greenfield + solution/code-patterns/？ → Read §三
  ├─ 模式 A + conventions/？ → Read §2
  └─ 都没有？ → sol 应先建 code-patterns 🌱；brownfield 应先 init
```

---

## dev 速查

一步定位 → [dev-quickstart.md](../templates/dev-quickstart.md)
