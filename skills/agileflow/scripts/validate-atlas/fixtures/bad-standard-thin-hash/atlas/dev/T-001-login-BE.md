# [T-001] 登录 — 构思 [BE]

## 摘要

- **本 T**：F-001 的后端切片（T-001）；落地 API-001 登录拿 token。
- **做**：校验凭证并签发 JWT；错误密码 401。
- **不做**：注册、第三方登录。
- **上游**：F-001 · API-001 · 无 depends_on。
- **AC**：AC-001-01（200+token）、AC-001-02（401）。

## 步骤

#### 1. 配置路由
- **用户**：发起登录请求
- **系统**：返回 200/401
- **改**：`AuthController.login` — 新接口

#### 2. 校验凭证
- **用户**：提交 username+password
- **系统**：校验通过/拒绝
- **改**：`AuthService.verifyPassword` — 比对密码

## 结果

| 项 | 证据 |
|----|------|
| 编译/启/冒烟 | ③ mvn package ✅ · curl POST /api/login → HTTP 200 ✅ |
