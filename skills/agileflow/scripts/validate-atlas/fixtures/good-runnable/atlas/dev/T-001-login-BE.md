# [T-001] 登录 — 构思 [BE]

- 档位：**标准**
- → [F-001](../solution/features/F-001-login.md) · [API-001](../solution/contracts/API-001-login.md)

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
- **改**：`AuthController.login` · 见 API-001

#### 2. 密码错误

- **用户**：提交错误密码
- **系统**：401，无 token（AC-001-02）
- **改**：`AuthService.verifyPassword`

## 结果

| 检查项 | 命令 | 结果 |
|--------|------|------|
| 编译构建 | `mvn -q -DskipTests package` | exit 0 ✅ |
| 能启能调 | `curl -s localhost:8080/actuator/health` | UP ✅ |
| 主路径冒烟 | `curl -s -X POST /api/login -d '{...}'` | HTTP 200 ✅ |
