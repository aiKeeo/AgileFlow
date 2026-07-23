# [F-001] 登录

- 关联 REQ：REQ-001
- ← REQ-001 · AC-001-01～06
- 优先级：P0
- **暴露面**：API-001, UI-001 → [contracts/](../contracts/)
- depends_on：—

## 说明

账号密码登录，签发登录态；小程序登录页提交后进首页。（← 用户故事）

## 资源依赖

- `User` 实体 + `UserRepository` + `UserService`：由 T-001 创建，Auth 模块复用。
- 前端请求基座 `miniprogram/services/api.ts`：由 T-002 创建，登录页复用。

## 边界

**做**：账号密码校验成功发登录态；失败统一文案；登录页提交与跳转（← AC-001-01～06）
**不做**：注册、第三方登录、refresh（← REQ 范围外）
**约定**：错误同文案；密码哈希存储

## 暴露面

- API-001 登录签发 JWT
- UI-001 登录页字段绑定 → contracts/
