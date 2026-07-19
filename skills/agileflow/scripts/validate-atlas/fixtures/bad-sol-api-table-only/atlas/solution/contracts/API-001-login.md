# [API-001] 登录

- 关联功能：[F-001](../features/F-001-login.md)
- 类型：HTTP POST
- 路径：`/auth/login`
- 鉴权：无（公开）

## 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 1–32，trim |
| password | string | 是 | 6–64 |

## 成功响应

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 0 |
| data.token | string | JWT |
| data.user | object | `{ id, username, nickname }` |

## 错误码

| HTTP | code | 场景 |
|------|------|------|
| 401 | 40101 | 账号或密码错误 |
| 400 | 40001 | 参数缺失/格式非法 |
