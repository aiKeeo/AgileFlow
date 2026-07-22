## 7. 少样本示例（好 vs 坏）

> 完整分段 few-shot → [dev-granularity](../templates/dev-granularity.md) · [dev-reuse-examples](../examples/dev-reuse-examples.md)

**坏（FE）**：实现说明「怎么做：调接口跳转」一行糊弄；或仍用 `## 步骤`。  
**好（FE）**：`> 入口：用户点登录` + ≥3 步主流程；边界 ≥2 挂第 N 步；`handleSubmit` 【新写】怎么做编号含空提交/401。

**坏（BE）**：`AuthService` 怎么做写「查库比对密码」；或用旧 `## 步骤` 流程表。  
**好（BE）**：`> 入口：POST /api/login` + 主流程；边界挂 400/401；`verifyPassword` 怎么做编号 ≥2（无用户→401 / bcrypt 失败→401）。

**坏**：结果写「已跑测试，全部通过」。  
**好**：结果写 `npm test -- login.service.test.ts → 3 passed, 0 failed, exit 0`。

**坏**：一次性把 T-001 和 T-002 的代码都写了。  
**好**：只写 T-xxx 的文件，返回时说「其他 T 未处理」。

---
