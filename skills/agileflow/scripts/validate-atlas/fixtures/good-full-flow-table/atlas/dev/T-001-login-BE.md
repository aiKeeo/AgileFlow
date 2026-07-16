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

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | 收 POST 请求 | username+password → 进入业务 | 新写 `AuthController.login` — 模块首接口 |
| **S2** | 校验凭证 | username+password → 通过/拒绝 | `AuthService.verifyPassword` — 失败→401 |
| **S3** | 签发 token | userId → JWT | `JwtUtil.sign` — 200 返回 token |

## 结果

| 项 | 证据 |
|----|------|
| 编译/启/冒烟 | ③ mvn package ✅ · curl POST /api/login → HTTP 200 ✅ |
