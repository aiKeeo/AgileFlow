# [T-001] 登录 — 构思 [BE]

- 档位：**完整**
- → [F-001](../solution/features/F-001-login.md) · [API-001](../solution/contracts/API-001-login.md)
- 顺序：✅ 先构思后写码

## 摘要

- **本 T**：F-001 的后端切片（T-001）；落地 API-001 登录拿 token。
- **做**：校验凭证并签发 JWT；错误密码 401。
- **不做**：注册、第三方登录。
- **上游**：F-001 · API-001 · 无 depends_on。
- **AC**：AC-001-01（200+token）、AC-001-02（401）。

## 步骤

#### 1. 登录成功

- **用户**：提交账号密码
- **系统**：正确→200+token（AC-001-01）
- **改**：`AuthController.login` → `AuthService.verifyPassword` → `JwtUtil.sign`

#### 2. 密码错误

- **用户**：提交错误密码
- **系统**：401，无 token（AC-001-02）
- **改**：`AuthService.verifyPassword` 失败分支

#### 3. 登录日志

- **用户**：无
- **系统**：记录登录日志
- **改**：`LoginLogService.record`

## 结果

| 项 | 证据 |
|----|------|
| 编译/启/冒烟 | ③ mvn package ✅ · curl POST /api/login → HTTP 200 ✅ |
