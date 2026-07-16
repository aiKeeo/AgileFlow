# [T-001] 登录 — 构思 [BE]

- 任务：**T-001** · 端：**BE** · 档位：**标准**
- → [REQ-001](../requirements/REQ-001-login.md) · [API-001](../solution/contracts/API-001-login.md)

## 前置

- depends_on：无
- 运行条件：可启 BE
- 前提假设：无

## 必读（只链，打开即用）

| 用途 | 链接 | 本 T 用到什么 |
|------|------|---------------|
| 验收 | [REQ-001](../requirements/REQ-001-login.md) | AC-001-01 |
| 接口 | [API-001](../solution/contracts/API-001-login.md) | POST |

## 范围

- **目标**：登录拿 token
- **必须**：AC-001-01 200
- **不做**：注册

## 契约

→ [API-001](../solution/contracts/API-001-login.md)

### 复用

| 能力 | 资产 | 决策 |
|------|------|------|
| 入口 | 无 | 新建 `AuthController.login` |

## 步骤

#### 登录成功 — 目的：签发 token `AuthController.login`

- 引用：API-001 · AC-001-01
- 做：收入参 → 校验 → 签发
- 完成标志：200

#### 错误密码 — 目的：拒绝非法登录

- 引用：AC-001-02
- 做：401
- 完成标志：无 token

## AC

| AC | Then | test/ac |
|----|------|---------|
| AC-001-01 | 200 + token | `ac001_01_loginOk` |

## 结果

| 检查项 | 命令 | 结果 |
|--------|------|------|
| 编译构建 | `mvn -q -DskipTests package` | exit 0 ✅ |
| 能启能调 | `curl -s localhost:8080/actuator/health` | UP ✅ |
| 主路径冒烟 | `curl -s -X POST /api/login -d '{...}'` | HTTP 200 ✅ |
