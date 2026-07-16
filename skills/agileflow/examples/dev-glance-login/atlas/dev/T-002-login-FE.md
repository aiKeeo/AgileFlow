# [T-002] 请求基座 + 登录页 — 构思 [FE]

- 档位：**标准**
- 端：FE
- → [F-001](../solution/features/F-001-login.md) · [UI-001](../solution/contracts/UI-001-login.md)
- 顺序：✅ 先构思后写码
- 独立文件：本文件只覆盖 FE；BE 见 [T-001-login-BE.md](./T-001-login-BE.md)（禁止合并）

---

## 摘要

- **本 T**：F-001 前端切片。因项目初始为空，本 T 须先建请求基座，再实现登录页；主责 AC-001-04～06。
- **做**：`miniprogram/services/api.ts`（请求基座）、`miniprogram/services/auth.ts`（登录接口）、`miniprogram/pages/login/index.{tsx,scss,config.ts}`（全部新建）；复用 T-001 的 API-001（登录接口）。
- **不做**：后端校验、注册页、在本文件写字段映射表（字段绑定只看 UI-001）。
- **上游**：UI-001 · depends_on T-001。
- **AC**：AC-001-04（空提交不发请求）、AC-001-05（成功进首页存 token）、AC-001-06（失败 toast 不跳转）。

---

## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | 建请求基座 | — → 可复用 request | **新写** `miniprogram/services/api.ts` — 封装 `Taro.request`，baseURL 读 `config.ts`，自动注入 `storage` 中的 token，统一错误 toast |
| **S2** | 封装登录接口 | phone/password → token | **新写** `miniprogram/services/auth.ts` 的 `login(phone, password)` — 调用 `api.post('/api/auth/login')` |
| **S3** | 搭登录页 UI | — → 表单 | **新写** `miniprogram/pages/login/index.tsx` + `index.scss` + `index.config.ts` 三件套；表单含 phone/password 输入 + 登录按钮 |
| **S4** | 空值拦截 | 空输入 → toast | 在 `pages/login/index.tsx` 的 `handleSubmit()` 开头校验：phone 或 password 为空则 `Taro.showToast()` 并 return（AC-001-04） |
| **S5** | 成功分支 | 200 → 首页 | 在 `handleSubmit()` 中调用 `authService.login()`，成功后 `Taro.setStorageSync('token', res.token)` + `Taro.reLaunch({ url: '/pages/home/index' })`（AC-001-05） |
| **S6** | 失败分支 | 401 → toast | 在 `handleSubmit()` catch 中调 `Taro.showToast({ title: '账号或密码错误' })`，不跳转（AC-001-06） |
| **S7** | 防连点 | submitting → 忽略重复 | 在 `handleSubmit()` 开头加 `if (submitting) return`；按钮组件 `loading={submitting} disabled={submitting}` |

### ② 前端单测清单（1 AC ↔ 1 方法）

| AC | 测试方法 | 断言要点 |
|----|----------|----------|
| AC-001-04 | `login_submit_empty_noRequest` | 无 login 请求 |
| AC-001-05 | `login_onSuccess_persistAndNavigate` | storage 有 token、reLaunch 被调用 |
| AC-001-06 | `login_onFail_toastNoNavigate` | toast 显示、不跳转 |

---

## 结果

| 项 | 证据 |
|----|------|
| 构建 | `cd miniprogram && npm run build:weapp` → exit 0 |
| 冒烟 | 开发者工具：成功进首页 ✅ · 错密不跳转 ✅ · 空提交无请求 ✅ |
| 单测 | `cd miniprogram && npm test -- login` ✅ |

### AC 映射表

| AC ID | unit | ac | 人工 |
|-------|------|-----|------|
| AC-001-04 | `miniprogram/pages/login/index.spec.ts` · `login_submit_empty_noRequest` | — | — |
| AC-001-05 | 同上 · `login_onSuccess_persistAndNavigate` | — | — |
| AC-001-06 | 同上 · `login_onFail_toastNoNavigate` | — | — |
