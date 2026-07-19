# [T-001] 登录 — 构思 [BE]
- → [F-001](../solution/features/F-001-login.md) · [API-001](../solution/contracts/API-001-login.md)
- 顺序：✅ 先构思后写码

## 摘要

- **本 T**：F-001 的后端切片（T-001）；落地 API-001 登录拿 token。
- **做**：新写 AuthController/AuthService/JwtUtil；校验凭证并签发 JWT；错误密码 401。
- **不做**：注册、第三方登录。
- **上游**：F-001 · API-001 · 无 depends_on。
- **AC**：AC-001-01（200+token）、AC-001-02（401）。

## 主流程

> 入口：POST /api/login（API-001）

1. 请求进入 → `AuthController.login()` → 进入业务
2. 参数有效 → `AuthService.verifyPassword()` → 通过/拒绝
3. 校验通过 → `JwtUtil.sign()` → 200 返回 token

## 边界

- **密码错误**：第 2 步 → 401（AC-001-02）

## 实现说明

### `AuthController.java` 【新写】

- **目的**：登录 HTTP 入口
- **做什么**：`login()`
- **怎么做**：收 POST body → 调 AuthService

### `AuthService.java` 【新写】

- **目的**：凭证校验
- **做什么**：`verifyPassword()`
- **怎么做**：比对密码 → 失败 401

### `JwtUtil.java` 【新写】

- **目的**：签发 token
- **做什么**：`sign(userId)`
- **怎么做**：返回 JWT 字符串

## 结果

| 项 | 证据 |
|----|------|
| 编译/启/冒烟 | ③ mvn package ✅ · curl POST /api/login → HTTP 200 ✅ |
