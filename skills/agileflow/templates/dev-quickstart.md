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

| 项目类型 | 读什么 | dev 七 怎么写 |
|----------|--------|---------------|
| **brownfield** | `init/codebase/p1-{端}.md` **§二 + §三** | `写法对齐：codebase/p1-backend.md §3.3 创建；§二 W4 统一响应用 ApiResponse.ok` |
| **greenfield** | `solution/code-patterns-{端}.md` **§三** | `写法对齐：code-patterns-backend §3.1` |
| **模式 A** | `conventions/*-patterns.md` §2 | `conventions 对齐：backend §2.3` |

---

## dev 七 · 写法对齐（必须具体）

**❌ 不合格**：`按项目规范写`  
**✅ 合格**：

```markdown
## 七、技术选型与依赖
- 写法对齐：
  - codebase/p1-backend.md §3.3 创建（参考 DietController + DietService.addRecord）
  - §二 W4 ApiResponse.ok · W7 AuthContext.requireUserId · W11 POST 返回 201
- humanTodo：无
```

---

## dev 五 · 核心流程（必须逐步、可照着写）

**❌ 不合格**：

```markdown
## 五、核心流程
1. 实现优惠券接口
2. 写测试
```

**✅ 合格**：

```markdown
## 五、核心流程
1. 在 `module/order/dto/` 新增 `ApplyCouponRequest` record，字段 couponId、orderId，加 @NotBlank
2. 在 `OrderController` 新增 POST `/api/v1/orders/{id}/apply-coupon`，对齐 §3.3：@Valid body + AuthContext + ApiResponse.ok
3. `OrderService.applyCoupon`：findByIdAndUserId → 校验订单状态=待支付 → 调 CouponService → @Transactional 更新
4. 冲突：已用券 → BizException COUPON_ALREADY_USED 409
5. test/ac：temp 或 Ac0xxOrderCouponTest，覆盖 AC-012、AC-013
```

**规则**：每一步对应 **一个文件或一个动作**；须引用 **init 实体/API** 或 **codebase §三**。

---

## Write 拦截 W0–W8

| # | 过线条件 | 常见漏项 |
|---|----------|----------|
| W0 | todo ① 已勾 | 只写 dev 未勾 todo |
| W2 | `T-xxx.md` 存在 | — |
| W3 | 七段+八+九表头 | 缺 **六** 异常表 |
| W4 | **五** 逐步编号；**六** ≥2 行异常 | 五 只有「实现模块」 |
| W7 | humanTodo 已沉淀 | 要密钥却未写 humanTodo |
| W8 | 已 Read 写法锚点；**七** 引用 **§ 编号** | 七 只写「对齐项目风格」 |

---

## ② 写码时对照表

| 要写 | 先看 |
|------|------|
| 新 Controller 方法 | codebase §3 最接近的场景 + §二 W4/W7/W11 |
| 新 Entity/表 | data/entities 同类 + relations 归属 |
| 新 DTO | §二 W3 后缀 + 现有 `*Request` record |
| 新列表 API | §3.1 分页 + W8 page 规则 |
| 新前端列表页 | §3.1 Form+Table + §3.4 service |

---

## ③ 完成后

- 跑 **八** 中每个 test/ac → **九** 填 L3
- **greenfield 首个 CRUD ③ ✅**：refresh `code-patterns-*.md` §三（从刚写源码摘录 path:行号）

---

## 首行声明

`📍 Agileflow | 模式：{快速/严谨} | 阶段：4-开发 | 步骤：{①|②|③} | 任务：T-xxx | 写法：codebase §3.x`
