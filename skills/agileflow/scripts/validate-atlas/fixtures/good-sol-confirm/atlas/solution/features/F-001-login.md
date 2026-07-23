# [F-001] 登录

- 关联 REQ：REQ-001
- ← REQ-001 · AC-001-01
- **暴露面**：API-001, UI-001 → [contracts/](../contracts/)
- depends_on：—

## 说明

账号密码登录，签发 JWT 供后续接口鉴权。

## 边界

**做**：账号密码登录 + JWT（← AC-001-01）
**不做**：第三方登录、refresh 轮换（← REQ 范围外）
**约定**：错误统一 401；密码 BCrypt

## 暴露面

- API-001 登录签发 JWT
- UI-001 登录页字段绑定 → contracts/

（补充厚度：本 F 描述账号密码登录边界与暴露面，供 todo 拆 T 与契约对齐。）
