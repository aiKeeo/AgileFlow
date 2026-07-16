# [UI-001] 登录页

- 关联功能：[F-001](../features/F-001-login.md)
- 关联 UID：UID-001（线框在 requirements/ui，本文件不粘贴整图）
- 路由：`pages/login/index`
- 实现任务：[T-002](../../dev/T-002-login-FE.md)（单独文件）

## 布局

- 品牌区 + 账号输入 + 密码输入（可显隐）+ 主按钮「登录」
- 加载中按钮禁用；错误用 toast

## 交互

1. 未填账号或密码 → toast「请输入账号和密码」，不发请求  
2. 点登录 → loading → 调 API-001  
3. 成功 → 存 token → `reLaunch` 首页  
4. 失败 → toast「账号或密码错误」

## 字段绑定

| 页面上 | 请求/响应字段 | 接口 |
|--------|---------------|------|
| 账号输入框 | → `username` | API-001 |
| 密码输入框 | → `password` | API-001 |
| （成功）本地 token | ← `data.token` | API-001 |
| （成功）可选缓存用户 | ← `data.user` | API-001 |
