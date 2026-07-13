# [T-001] 登录 — 构思落盘 [BE]

- 任务：**T-001**
- 端：**BE**
- 功能：F-001 · 契约：API-001
- 关联 REQ：REQ-001
- depends_on：无
- 顺序：✅ 先构思后写码

## 一、需求理解（我理解的你要什么）

- → [REQ-001](../requirements/REQ-001-login.md) · [F-001](../solution/features/F-001-login.md)
- **核心目标**：用户凭账号密码登录，获得 token
- **必须满足**：AC-001-01 合法登录 200；AC-001-02 错误密码 401
- **明确不做**：注册、找回密码（其他 T）

## 二、数据模型

→ 见 [User](../model/entities/user.md)（无 schema 变更）

**本 T 增量**：只读 User 表校验密码，不新建表。

## 三、接口契约

→ 权威：[API-001](../solution/contracts/API-001-login.md)（入参/出参/错误码以此为准）

### 复用盘点（BE）

| 能力 | 资产路径.方法 | 决策 |
|------|---------------|------|
| 密码校验 | `UserService.verifyPassword` | 复用 |
| JWT | `JwtUtil.sign` | 复用 |
| 登录入口 | 无 | 新建 `AuthController.login` |

**本 T 增量**：无偏离 contract。

## 四、状态机

→ 无独立状态机（登录为一次性请求，无持久状态流转）。

## 五、核心流程

### 目的
让用户登录拿到 token；下游 FE T-002 可带 token 调 API。

### 需要什么

| 类别 | 具体项 | 用来干什么 |
|------|--------|-----------|
| 数据 | User 表 | 查用户 |
| 类 | AuthController / AuthService | HTTP + 业务 |

### 怎么做

#### 5.1 登录 `AC-001-01`

**要达成什么**：合法账号密码 → 200 + token

**做法**：
1. `AuthController.login` 收 `{ username, password }`
2. `AuthService.verifyPassword` 校验
3. `JwtUtil.sign(userId)` 返回 token

#### 5.2 错误密码 `AC-001-02`

**做法**：`AuthService.verifyPassword` 失败 → 401

## 六、异常与边界

→ 见 [API-001 错误码](../solution/contracts/API-001-login.md)

**本 T 增量**：连续失败不锁定（MVP）；不暴露用户是否存在。

## 七、技术选型与依赖

→ [architecture.md](../solution/architecture.md) · 写法 → [p1-backend §3.2](../init/codebase/p1-backend.md)

- depends_on：无
- humanTodo：无

## 八、REQ 验收对照

| AC ID | Then（来自 REQ） | test/ac 方法 |
|-------|------------------|--------------|
| AC-001-01 | HTTP 200 + token | `ac001_01_loginOk` |
| AC-001-02 | HTTP 401 | `ac001_02_badPassword` |

## 九、实现结果

| AC ID | test/ac 方法 | AC单测 | 终端证据 |
|-------|--------------|-----|----------|
| | | ⬜ | ③ 验收后填写 |
