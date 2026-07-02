# dev 速查（阶段 4 写码前读这一页）

> 细则：[dev-rationale.md](dev-rationale.md) · [04-development.md](../phases/04-development.md) · 写法锚点：[code-conventions.md](code-conventions.md)

---

## 三步序（不可跳）

```
① 构思落盘 atlas/dev/T-xxx.md（七段+八+九表头）→ 勾 todo ①
② 按 五、核心流程 写码 → 勾 todo ②
③ 对照 八 跑 test/ac 全绿 → 九回填 → 勾 todo ③
```

**todo ① 未勾 = 禁止 Write 业务源码**

---

## 写码前：写法锚点在哪？

| 项目类型 | 默认读哪里 | dev 七 写法 |
|----------|------------|-------------|
| **brownfield**（有 init） | `atlas/init/codebase/p1-{端}.md` **§三 模板** | `codebase 对齐：p1-backend.md §3.2` |
| **greenfield**（无 init） | `atlas/solution/code-patterns-{端}.md` **§三** | `code-patterns 对齐：backend §3.1` |
| **全栈独立维护**（显式模式 A） | `atlas/conventions/*-patterns.md` §2 | `conventions 对齐：frontend §2.2` |

**默认模式 B**——不建 `atlas/conventions/`，除非用户明确要求模式 A。

---

## Write 拦截 W0–W8

| # | 过线条件 |
|---|----------|
| W0 | todo ① 已勾 |
| W2 | `T-xxx.md` 存在 |
| W3 | 七段+八+九表头齐全 |
| W4 | **五** 逐步编号；**六** 有异常表 |
| W7 | humanTodo 已沉淀 |
| W8 | 写法锚点已 Read；**七** 已引用 § |

---

## 写码规则（3 条）

1. **只执行 dev 五**——不即兴扩 scope
2. **对齐 §三模板**——只改业务字段；**禁止**乱引栈外 UI 库/DTO 风格
3. **首个典型 CRUD/列表 ③ ✅ 后**——从源码 refresh 写法锚点 §三（🌱→📝）

---

## 首行声明（阶段 4）

`📍 Agileflow | 模式：{快速/严谨} | 阶段：4-开发 | 步骤：{①|②|③} | 任务：T-xxx | dev：atlas/dev/T-xxx.md | 写法：{codebase §3.x | code-patterns §3.x}`
