# [T-001] 登录 — 构思 [BE]

- 任务：**T-001** · 端：**BE** · 档位：**标准**
- → [REQ-001](../requirements/REQ-001-login.md) · [API-001](../solution/contracts/API-001-login.md)
- 顺序：✅ 先构思后写码

## 前置

- depends_on：无（首个 BE 任务）
- 运行条件：本地可启 BE；测试库可用
- 前提假设：用户表已存在

## 必读（只链，打开即用）

| 用途 | 链接 | 本 T 用到什么 |
|------|------|---------------|
| 验收 | [REQ-001](../requirements/REQ-001-login.md) | AC-001-01/02 |
| 接口 | [API-001](../solution/contracts/API-001-login.md) | POST 登录形状 |

## 范围

- **目标**：账号密码登录拿 token
- **必须**：AC-001-01 200；AC-001-02 401
- **不做**：注册、找回密码

## 契约

→ [API-001](../solution/contracts/API-001-login.md) · model 无 schema 变更

### 复用

| 能力 | 资产 | 决策 |
|------|------|------|
| 密码 | `UserService.verifyPassword` | 复用 |
| JWT | `JwtUtil.sign` | 复用 |
| 入口 | 无 | 新建 `AuthController.login` |

## 做法

#### 登录成功 — 目的：校验凭证并签发 token `AuthController.login`

- 引用：API-001 §请求 · AC-001-01
- 做：收 `{ username, password }` → `AuthService.verifyPassword` → `JwtUtil.sign(userId)` → 200 + token
- 完成标志：AC-001-01 单测绿

#### 错误密码 — 目的：拒绝非法凭证不签发 `AuthService.verifyPassword`

- 引用：AC-001-02
- 做：校验失败 → 401
- 完成标志：错误密码无 token

## AC

| AC | Then | test/ac |
|----|------|---------|
| AC-001-01 | 200 + token | `ac001_01_loginOk` |
| AC-001-02 | 401 | `ac001_02_badPassword` |

## 结果

| AC | AC单测 | 终端证据 |
|----|--------|----------|
| | ⬜ | ③ 验收后填写 |
