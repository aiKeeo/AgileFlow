# 设计样例：登录 · REQ→sol 边界 · AC≈UT · 分文件

> **不是**运行时项目。演示：REQ 单测级 AC → sol 从 REQ 提炼 F 边界 → dev 1 AC↔1 UT。

## 硬约束

| 检查 | 本样例 |
|------|--------|
| `dev/T-*.md` 数 = todo T 头数 | **2**（BE/FE 不合） |
| contracts API+UI | **2**（不合进 F/dev） |
| F 含 `← REQ-` 回溯 | ✅ |
| REQ AC 含观测面 | ✅ |
| BE：`1 AC ↔ 1 UT` | AC-001-01～03 |

## 人怎么读（30 秒）

1. [`atlas/requirements/REQ-001-login.md`](atlas/requirements/REQ-001-login.md) — AC + 范围提示  
2. [`atlas/solution/README.md`](atlas/solution/README.md) — 开发者一览 + AC→主 T  
3. [`atlas/dev/T-001-login-BE.md`](atlas/dev/T-001-login-BE.md) — 一眼 + UT 清单 + 映射表  
4. [`atlas/dev/T-002-login-FE.md`](atlas/dev/T-002-login-FE.md) — 前端同构  

权威规则：[../phases/05-testing.md](../../phases/05-testing.md) · [dev.md](../../templates/dev.md)
