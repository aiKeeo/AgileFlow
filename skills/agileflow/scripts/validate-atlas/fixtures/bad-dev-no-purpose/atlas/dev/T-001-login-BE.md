# [T-001] 登录 — 构思 [BE]

- 任务：**T-001** · 端：**BE** · 档位：**标准**

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

- **目标**：登录
- **必须**：200
- **不做**：注册

## 契约

→ [API-001](../solution/contracts/API-001-login.md)

### 复用

| 能力 | 资产 | 决策 |
|------|------|------|
| 入口 | 无 | 新建 `AuthController.login` |

## 做法

#### 登录 `AC-001-01`

1. `AuthController.login` 收入参
2. 签发 token

#### 错误密码

1. 返回 401

## AC

| AC | Then | test/ac |
|----|------|---------|
| AC-001-01 | 200 | `ac001_01` |

## 结果

| … | ⬜ |
