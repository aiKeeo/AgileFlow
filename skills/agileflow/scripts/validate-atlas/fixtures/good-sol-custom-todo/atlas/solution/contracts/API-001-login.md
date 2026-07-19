# [API-001] 登录

- 关联功能：[F-001](../features/F-001-login.md)
- 类型：HTTP POST
- 路径：`/auth/login`
- 鉴权：无（公开）

## 请求体

```jsonc
{
  "username": "alice",     // 必填，1–32，trim
  "password": "secret123"  // 必填，6–64
}
```

### 字段规则

| 字段 | 规则 |
|------|------|
| username | 必填，1–32，trim |
| password | 必填，6–64 |

## 成功响应

```jsonc
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 604800,
    "user": {
      "id": "u_1001",
      "username": "alice",
      "nickname": "Alice"
    }
  }
}
```

## 错误码

| HTTP | code | 场景 |
|------|------|------|
| 401 | 40101 | 账号或密码错误 |
| 400 | 40001 | 参数缺失/格式非法 |
