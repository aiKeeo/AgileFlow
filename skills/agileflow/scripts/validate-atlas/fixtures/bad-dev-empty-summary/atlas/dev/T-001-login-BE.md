# [T-001] 登录 — 构思 [BE]

- → [API-001](../solution/contracts/API-001-login.md)
- 顺序：✅ 先构思后写码

## 摘要

- **本 T**：
- **做**：
- **不做**：
- **上游**：
- **AC**：

## 主流程

> 入口：POST /api/login

1. 请求进入 → `AuthController.login()` → 校验
2. 参数有效 → `AuthService.verifyPassword()` → 通过/拒绝
3. 校验通过 → `JwtUtil.sign()` → 200 返回 token

## 边界

- **密码错误**：第 2 步 → 401

## 实现说明

### `AuthController.java` 【新写】

- **目的**：登录入口
- **做什么**：`login()`
- **怎么做**：收参 → 调 Service

### `AuthService.java` 【新写】

- **目的**：校验
- **做什么**：`verifyPassword()`
- **怎么做**：bcrypt 比对

### `JwtUtil.java` 【新写】

- **目的**：签发
- **做什么**：`sign()`
- **怎么做**：返回 token

## 结果

| 项 | 命令 | 结果 |
|----|------|------|
| 编译 | `mvn -q -DskipTests package` | exit 0 ✅ |
| 启动 | `java -jar target/login-0.0.1.jar` | UP ✅ |
| 冒烟 | `curl -s -X POST /api/login` | HTTP 200 ✅ |
