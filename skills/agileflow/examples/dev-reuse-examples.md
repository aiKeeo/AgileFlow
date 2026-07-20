# dev 构思 · 流程拆解 few-shot（完整质量）

> **全端主形态**：叙述五段式 — 主流程 / 边界 / 实现说明。  
> **没有精简档**：逻辑块「怎么做」一律编号 ≥2 且含「条件 → 动作」；边界 ≥2 且挂第 N 步并写清处理。  
> 颗粒度（含每段解释）→ [dev-granularity.md](../templates/dev-granularity.md)  
> 正式范例：[dev-exemplar-FE](dev-exemplar-FE.md) · [dev-exemplar-BE](dev-exemplar-BE.md)

---

## FE/MP · 登录提交

### ❌ 坏（一行糊弄）

```markdown
### `pages/login/index.js` 【新写】
- **目的**：登录页
- **做什么**：提交
- **怎么做**：调接口跳转
```

### ✅ 好

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
- **怎么做**：
  1. phone/password 空 → toast return
  2. 调 `authService.login` → 成功存 token + reLaunch
  3. catch 401 → toast，不跳转
```

---

## BE · 登录 API

### ❌ 坏

```markdown
### `AuthService.java` 【新写】
- **目的**：登录
- **做什么**：校验
- **怎么做**：
  1. 处理逻辑
  2. 返回结果
```

### ✅ 好

```markdown
## 主流程
> 入口：POST /api/login（API-001）

1. 请求进入 → `AuthController.login()` → DTO 校验
2. 参数有效 → `AuthService.verifyPassword()` → 通过/拒绝
3. 校验通过 → `JwtUtil.sign()` → 200 返回 token

## 边界
- **参数缺失**：第 1 步 → 400
- **密码错误**：第 2 步 → 401（AC-001-02）

## 实现说明
### `AuthService.java` 【新写】
- **目的**：凭证校验
- **做什么**：`verifyPassword(username, password)`
- **怎么做**：
  1. 查库 → 无用户 → 401
  2. bcrypt 比对 → 失败 401；成功返回 userId
```

---

## 写法速查

| 标签 | 何时 |
|------|------|
| **新写** | 本 T 新建文件/方法 |
| **改动** | 已有文件加逻辑 |
| **复用** | 只读调用，本 T 不改 |

| 块类型 | 「怎么做」厚度 |
|--------|----------------|
| 逻辑块（Service/Controller/page/Repository…） | 编号 ≥2，**须含 →** |
| 壳层（wxml/json/css/Dto/module） | 可一行，但须可执行 |

---

## 相关

| 文档 | 用途 |
|------|------|
| [dev-granularity.md](../templates/dev-granularity.md) | 颗粒度 SSOT（每段解释 + few-shot） |
| [dev-exemplar-FE.md](dev-exemplar-FE.md) | FE/MP 闸门范例 |
| [dev-exemplar-BE.md](dev-exemplar-BE.md) | BE 闸门范例 |
