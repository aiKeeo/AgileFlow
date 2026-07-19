# [T-001] 用户基础 + 登录 API — 构思 [BE]
- 端：BE
- → [F-001](../solution/features/F-001-login.md) · [API-001](../solution/contracts/API-001-login.md)
- 顺序：✅ 先构思后写码
- 独立文件：本文件只覆盖 BE；FE 见 [T-002-login-FE.md](./T-002-login-FE.md)（禁止合并）

## 摘要

- **本 T**：F-001 后端切片。因项目初始为空，本 T 须先建 User 基础，再实现账号密码登录 API；落地 API-001；主责 AC-001-01～03。
- **做**：新写 User 实体/Repository/Service、AuthController、AuthService、LoginDto、auth.module
- **不做**：注册、refresh、小程序页、密码重置
- **上游**：F-001 · API-001 · depends_on 无
- **AC**：AC-001-01（200+token）、AC-001-02（401）、AC-001-03（同 401 文案）

## 主流程

> 入口：POST /api/auth/login（API-001）

1. 请求进入 → `AuthController.login()` → LoginDto 校验 phone/password
2. 参数有效 → `AuthService.validateAndSign()` → 查 User + bcrypt 比对
3. 校验通过 → `JwtService.sign()` → 200 返回 token + 脱敏 user

## 边界

- **用户不存在/错密**：第 2 步 → 统一 40101，不泄露是否存在（AC-001-02/03）
- **参数缺失**：第 1 步 → 400

## 实现说明

### `backend/src/user/user.entity.ts` 【新写】

- **目的**：用户表结构
- **做什么**：TypeORM User 实体
- **怎么做**：phone 唯一、password_hash、nickname、created_at

### `backend/src/user/user.repository.ts` 【新写】

- **目的**：按 phone 查用户
- **做什么**：`findByPhone(phone)`
- **怎么做**：TypeORM repository 查询

### `backend/src/user/user.service.ts` 【新写】

- **目的**：用户只读基础
- **做什么**：`findByPhone(phone)`
- **怎么做**：调 repository，不暴露 password_hash 给 Controller

### `backend/src/auth/auth.controller.ts` 【新写】

- **目的**：登录 HTTP 入口
- **做什么**：`login(LoginDto)`
- **怎么做**：校验 DTO → 调 AuthService → 返回 token

### `backend/src/auth/auth.service.ts` 【新写】

- **目的**：凭证校验 + 签发
- **做什么**：`validateAndSign(phone, password)`
- **怎么做**：
  1. `userService.findByPhone` → null → 40101
  2. `bcrypt.compare` 失败 → 40101
  3. 成功 → `jwtService.sign({ sub: user.id })`

### `backend/src/auth/auth.module.ts` 【新写】

- **目的**：模块装配
- **做什么**：注册 Controller/Service/JwtModule
- **怎么做**：providers 含 AuthService；imports UserModule

## 结果

| 项 | 证据 |
|----|------|
| 编译 | `cd backend && npm run build` → exit 0 |
| 启动 | `cd backend && npm run start:dev` → `:3000` UP |
| 冒烟 | curl POST /api/auth/login 正确→200+token ✅ · 错密→401 ✅ |
| UT | `cd backend && npm test -- auth.service` ✅ |

### AC 映射表

| AC ID | unit | ac | 人工 |
|-------|------|-----|------|
| AC-001-01 | `backend/src/auth/auth.service.spec.ts` · `login_ok_returnsToken` | — | — |
| AC-001-02 | 同上 · `login_badPassword_uniformFailure` | — | — |
| AC-001-03 | 同上 · `login_unknownUser_sameAsBadPassword` | — | — |
