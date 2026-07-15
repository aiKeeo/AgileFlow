# [T-001] 登录 — 构思 [BE]

- 档位：**标准**
- → [F-001](../solution/features/F-001-login.md) · [API-001](../solution/contracts/API-001-login.md)

## 摘要

- **本 T**：F-001 后端切片。
- **做**：登录拿 token
- **不做**：注册
- **上游**：F-001 · API-001
- **AC**：AC-001-01

## 步骤

#### 1. 登录成功

- **用户**：提交账号密码
- **系统**：200+token
- **改**：`AuthController.login`

错误粘贴 API JSON（应只链 API-001）：

```json
{
  "username": "string",
  "password": "string",
  "extra": { "deviceId": "string", "remember": true },
  "meta": { "client": "web", "version": "1.0.0" }
}
```

#### 2. 密码错误

- **用户**：错误密码
- **系统**：401
- **改**：`AuthService.verifyPassword`

## 结果

| … | ⬜ |
