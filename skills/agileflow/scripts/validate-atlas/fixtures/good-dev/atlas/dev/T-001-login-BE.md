# [T-001] 登录 — 构思 [BE]

- 任务：**T-001** · 端：**BE** · 档位：**标准**
- → [REQ-001](../requirements/REQ-001-login.md) · [API-001](../solution/contracts/API-001-login.md)
- 顺序：✅ 先构思后写码

## 范围

- **目标**：账号密码登录拿 token
- **必须**：AC-001-01 200；AC-001-02 401
- **不做**：注册、找回密码

## 契约

→ [API-001](../solution/contracts/API-001-login.md) · model 无 schema 变更

### 复用

| 能力 | 资产 | 决策 |
|------|------|------|
| 密码 | `UserService.verifyPassword` | 复用 |
| JWT | `JwtUtil.sign` | 复用 |
| 入口 | 无 | 新建 `AuthController.login` |

## 做法

#### 登录 `AC-001-01`

1. `AuthController.login` 收 `{ username, password }`
2. `AuthService.verifyPassword`
3. `JwtUtil.sign(userId)` → 200 + token

#### 错误密码 `AC-001-02`

1. 校验失败 → 401

## AC

| AC | Then | test/ac |
|----|------|---------|
| AC-001-01 | 200 + token | `ac001_01_loginOk` |
| AC-001-02 | 401 | `ac001_02_badPassword` |

## 结果

| AC | AC单测 | 终端证据 |
|----|--------|----------|
| | ⬜ | ③ 验收后填写 |
