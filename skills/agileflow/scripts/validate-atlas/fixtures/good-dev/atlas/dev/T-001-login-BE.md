# [T-001] 登录 — 构思 [BE]

- 档位：**标准** · depends_on：无
- → [F-001](../solution/features/F-001-login.md) · [API-001](../solution/contracts/API-001-login.md)
- 顺序：✅ 先构思后写码

## 摘要

- **本 T**：F-001 的后端切片（T-001）；落地 [API-001](../solution/contracts/API-001-login.md) 账号密码登录接口。
- **做**：校验 username/password，凭证正确签发 JWT 并 200 返回 token；错误密码返回 401。
- **不做**：注册、第三方登录、小程序登录页（T-002 FE）。
- **上游**：[F-001](../solution/features/F-001-login.md) · [API-001](../solution/contracts/API-001-login.md) · 无 depends_on。
- **AC**：AC-001-01（200+token）、AC-001-02（401 错误密码）。

## 步骤

#### 1. 登录成功

- **用户**：提交账号密码
- **系统**：凭证正确→200+token（AC-001-01）
- **改**：`AuthController.login` → `AuthService.verifyPassword` → `JwtUtil.sign` · 见 API-001 POST

#### 2. 密码错误

- **用户**：提交错误密码
- **系统**：401，不签发 token（AC-001-02）
- **改**：`AuthService.verifyPassword` 失败分支

## 结果

| 项 | 证据 |
|----|------|
| 编译/启/冒烟 | ⬜ ③ 填 |
