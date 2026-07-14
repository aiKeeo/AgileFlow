# [T-001] 登录 — 构思 [BE]

- 任务：**T-001** · 端：**BE** · 档位：**标准**
- → [REQ-001](../requirements/REQ-001-login.md) · API-001

## 范围

- **目标**：登录拿 token
- **必须**：AC-001-01 200
- **不做**：注册

## 契约

→ API-001

### 复用

| 能力 | 资产 | 决策 |
|------|------|------|
| 入口 | 无 | 新建 `AuthController.login` |

## 做法

#### 登录 `AC-001-01`

1. `AuthController.login` 收入参
2. 校验密码
3. 签发 token

#### 错误密码

1. 校验失败 → 401

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
