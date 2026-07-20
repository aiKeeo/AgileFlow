# [T-001] 登录 — 构思 [BE]

- → [F-001](../solution/features/F-001-login.md) · [API-001](../solution/contracts/API-001-login.md)
- 顺序：✅ 先构思后写码

## 摘要

- **本 T**：F-001 的后端切片（T-001）；落地 [API-001](../solution/contracts/API-001-login.md) 账号密码登录接口。
- **做**：新写 AuthController/AuthService/JwtUtil；校验凭证签发 JWT；错误密码 401；参数缺失 400。
- **不做**：注册、第三方登录、小程序登录页（T-002 FE）。
- **上游**：[F-001](../solution/features/F-001-login.md) · [API-001](../solution/contracts/API-001-login.md) · 无 depends_on。
- **AC**：AC-001-01（200+token）、AC-001-02（401 错误密码）、AC-001-03（400 缺失参数）。

## 主流程

> 入口：POST /api/login（API-001）

1. 请求进入 → `AuthController.login()` → DTO 参数校验
2. 参数有效 → `AuthService.verifyPassword()` → 凭证通过/拒绝
3. 校验通过 → `JwtUtil.sign()` → 200 返回 token

## 边界

- **参数缺失**：第 1 步 → 400（AC-001-03）
- **密码错误**：第 2 步 → 401，不签发 token（AC-001-02）

## 实现说明

### `AuthController.java` 【新写】

- **目的**：登录 HTTP 入口
- **做什么**：`login(LoginDto dto)`
- **怎么做**：
  1. 校验 username/password 非空 → 空则 400
  2. 调 `AuthService.verifyPassword` → 封装 200 + token

### `AuthService.java` 【新写】

- **目的**：凭证校验
- **做什么**：`verifyPassword(username, password)`
- **怎么做**：
  1. 查用户 → 不存在 → 抛 401
  2. bcrypt 比对 → 失败抛 401；成功返回 userId

### `JwtUtil.java` 【新写】

- **目的**：签发 JWT
- **做什么**：`sign(userId)`
- **怎么做**：
  1. 读配置过期时间 → 组装 claims
  2. 签名 → 返回 token 字符串

## 结果

| 项 | 命令 | 结果 |
|----|------|------|
| 编译 | `mvn -q -DskipTests package` | exit 0 ✅ |
| 启动 | `java -jar target/login-0.0.1.jar` | UP ✅ |
| 冒烟 | `curl -s -X POST /api/login -d '{"username":"u","password":"p"}'` | HTTP 200 ✅ |

AC 映射表：

| AC ID | 验证方式 | 结果 |
|-------|----------|------|
| AC-001-01 | `test/unit/auth/login-ok.test.ts` | ✅ |
| AC-001-02 | `test/unit/auth/login-wrong-password.test.ts` | ✅ |
| AC-001-03 | `test/unit/auth/login-missing-field.test.ts` | ✅ |
