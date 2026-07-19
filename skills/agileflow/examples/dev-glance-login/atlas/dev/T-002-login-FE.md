# [T-002] 请求基座 + 登录页 — 构思 [FE]

- 端：FE
- → [F-001](../solution/features/F-001-login.md) · [UI-001](../solution/contracts/UI-001-login.md)
- 顺序：✅ 先构思后写码
- 独立文件：本文件只覆盖 FE；BE 见 [T-001-login-BE.md](./T-001-login-BE.md)

## 摘要

- **本 T**：F-001 前端切片；空项目须先建请求基座，再实现登录页；主责 AC-001-04～06
- **做**：新写 `api.ts` + `auth.ts` + `pages/login`；复用 API-001
- **不做**：后端校验、注册页、dev 内字段映射表
- **上游**：UI-001 · depends_on T-001
- **AC**：AC-001-04（空提交不发请求）、AC-001-05（成功进首页存 token）、AC-001-06（失败 toast 不跳转）

## 主流程

> 入口：用户在登录页点「登录」

1. 用户打开登录页 → 渲染 phone/password 表单 + 登录按钮
2. 用户输入账号密码
3. 用户点「登录」→ `handleSubmit()` → 前端校验
4. 校验通过 → `authService.login()` → 存 token → `reLaunch` 首页

## 边界

- **空提交**：第 3 步 phone 或 password 为空 → toast 并 return，不调 API（AC-001-04）
- **错密码**：第 4 步 401 → toast，不跳转（AC-001-06）
- **连点**：第 3 步 `if (submitting) return`；按钮 loading/disabled
- **单测**：`index.spec.ts` 覆盖 AC-001-04～06

## 实现说明

### `miniprogram/services/api.ts` 【新写】

- **目的**：请求基座，统一注入 token 与错误 toast
- **做什么**：封装 `Taro.request`；baseURL 读 `config.ts`
- **怎么做**：导出 `post/get`；header 自动带 storage token

### `miniprogram/services/auth.ts` 【新写】

- **目的**：登录接口封装
- **做什么**：`login(phone, password)` → token
- **怎么做**：调 `api.post('/api/auth/login')` — 契约见 API-001

### `miniprogram/pages/login/index.tsx` 【新写】

- **目的**：登录页 UI 与交互
- **做什么**：表单 + `handleSubmit`
- **怎么做**：
  1. 空值校验 → toast return（边界·空提交）
  2. 调 `authService.login()` → 成功 `setStorageSync` + `reLaunch`
  3. catch 401 → toast 不跳转
  4. submitting 防连点

### API-001 `/api/auth/login` 【复用】

- **本 T 怎么用**：`auth.ts` 调用
- **本 T 不改**

## 结果

| 项 | 证据 |
|----|------|
| 构建 | `cd miniprogram && npm run build:weapp` → exit 0 |
| 冒烟 | 开发者工具：成功进首页 ✅ · 错密不跳转 ✅ · 空提交无请求 ✅ |
| 单测 | `cd miniprogram && npm test -- login` ✅ |

### AC 映射

| AC ID | unit | ac | 人工 |
|-------|------|-----|------|
| AC-001-04 | `miniprogram/pages/login/index.spec.ts` · `login_submit_empty_noRequest` | — | — |
| AC-001-05 | 同上 · `login_onSuccess_persistAndNavigate` | — | — |
| AC-001-06 | 同上 · `login_onFail_toastNoNavigate` | — | — |
