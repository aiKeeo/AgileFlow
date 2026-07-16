# [T-001] 用户基础 + 登录 API — 构思 [BE]

- 档位：**标准**
- 端：BE
- → [F-001](../solution/features/F-001-login.md) · [API-001](../solution/contracts/API-001-login.md)
- 顺序：✅ 先构思后写码
- 独立文件：本文件只覆盖 BE；FE 见 [T-002-login-FE.md](./T-002-login-FE.md)（禁止合并）

---

## 摘要

- **本 T**：F-001 后端切片。因项目初始为空，本 T 须先建 `User` 基础（实体/Repository/Service），再实现账号密码登录 API；落地 API-001；主责 AC-001-01～03。
- **做**：`User` 实体、`UserRepository`、`UserService`（含 `findByPhone`）、`AuthController.login`、`AuthService.validateAndSign`、`LoginDto`、`auth.module`（全部新建；首 T 无上游代码可复用）。
- **不做**：注册、refresh、小程序页、密码重置。
- **上游**：F-001 · API-001 · depends_on 无。
- **AC**：AC-001-01（正确→200+token）、AC-001-02（错密→401）、AC-001-03（不存在→同 401 文案）。

---

## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | 建用户实体 | — → `User` 表结构 | **新写** `backend/src/user/user.entity.ts` — 字段 phone（唯一）、password_hash、nickname、created_at；TypeORM 装饰器 |
| **S2** | 建用户 Repository | phone → User / null | **新写** `backend/src/user/user.repository.ts` 的 `findByPhone()` — 供 AuthService 专用 |
| **S3** | 建用户 Service | 查询请求 → User | **新写** `backend/src/user/user.service.ts` 的 `findByPhone()` — 只读基础，不暴露 password_hash |
| **S4** | 建登录接口 | JSON body → 进入校验 | **新写** `backend/src/auth/auth.controller.ts` 的 `login()`；**新写** `backend/src/auth/dto/login.dto.ts` 校验 phone/password |
| **S5** | 建登录校验 + JWT | password + hash → token | **新写** `backend/src/auth/auth.service.ts` 的 `validateAndSign()`：`bcrypt.compare()` 失败→40101；成功→`JwtService.sign()` |
| **S6** | 注册模块 | — → 可注入 | 在 `backend/src/auth/auth.module.ts` 的 `providers` 注册 `AuthService` / `JwtService`，`controllers` 注册 `AuthController`，并导入 `UserModule` |

### ② UT 清单（1 AC ↔ 1 方法）

| AC | UT 方法 | 断言要点 |
|----|---------|----------|
| AC-001-01 | `auth.service.login_ok_returnsToken` | token 非空，user 脱敏 |
| AC-001-02 | `auth.service.login_badPassword_uniformFailure` | 统一失败、无 token |
| AC-001-03 | `auth.service.login_unknownUser_sameAsBadPassword` | 与 AC-001-02 同出口 |

---

## 结果

| 项 | 证据 |
|----|------|
| 编译 | `cd backend && npm run build` → exit 0 |
| 启动 | `cd backend && npm run start:dev` → `:3000` UP |
| 冒烟 | `curl -X POST /api/auth/login -d '{phone,password}'` 正确→200+token ✅ · 错密→401 ✅ |
| UT | `cd backend && npm test -- auth.service` ✅ |

### AC 映射表

| AC ID | unit | ac | 人工 |
|-------|------|-----|------|
| AC-001-01 | `backend/src/auth/auth.service.spec.ts` · `login_ok_returnsToken` | — | — |
| AC-001-02 | 同上 · `login_badPassword_uniformFailure` | — | — |
| AC-001-03 | 同上 · `login_unknownUser_sameAsBadPassword` | — | — |
