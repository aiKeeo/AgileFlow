# dev 构思 · 流程拆解 + 接现有代码（详细例子）

> **全端主形态**：叙述五段式 — 主流程 / 边界 / 实现说明。  
> FE 主流程写用户动作；BE 主流程写请求链（POST /api/… → Controller → Service）。  
> 颗粒度 → [dev-granularity.md](../templates/dev-granularity.md)  
> 正式范例：[dev-exemplar-FE](dev-exemplar-FE.md) · [dev-exemplar-BE](dev-exemplar-BE.md)

---

## FE/MP · 短例：登录提交

```markdown
## 主流程
> 入口：用户在登录页点「登录」

1. 用户输入账号密码
2. 用户点「登录」→ `handleSubmit()` → 前端校验
3. 校验通过 → `authService.login()` → 存 token → 跳首页

## 边界
- **空提交**：第 2 步校验拦住 → toast，不调接口
- **错密码**：第 3 步 401 → toast，不跳转

## 实现说明
### `pages/login/index.js` 【新写】
- **目的**：登录页交互
- **做什么**：`handleSubmit`
- **怎么做**：空值 return；成功 reLaunch；catch 401 toast
```

---

## BE · 短例：登录 API

```markdown
## 主流程
> 入口：POST /api/login（API-001）

1. 请求进入 → `AuthController.login()` → DTO 校验
2. 参数有效 → `AuthService.verifyPassword()` → 通过/拒绝
3. 校验通过 → `JwtUtil.sign()` → 200 返回 token

## 边界
- **密码错误**：第 2 步 → 401（AC-001-02）

## 实现说明
### `AuthService.java` 【新写】
- **目的**：凭证校验
- **做什么**：`verifyPassword(username, password)`
- **怎么做**：查库 → bcrypt → 失败 401
```

---

## 写法速查

| 标签 | 何时 |
|------|------|
| **新写** | 本 T 新建文件/方法 |
| **改动** | 已有文件加逻辑 |
| **复用** | 只读调用，本 T 不改 |

---

## 相关

| 文档 | 用途 |
|------|------|
| [dev-granularity.md](../templates/dev-granularity.md) | 颗粒度 SSOT |
| [dev-exemplar-FE.md](dev-exemplar-FE.md) | FE/MP 闸门范例 |
| [dev-exemplar-BE.md](dev-exemplar-BE.md) | BE 闸门范例 |
