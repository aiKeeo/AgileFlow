# 前端写法锚点（greenfield）

> 本示例前端使用微信小程序原生 + Taro。T-002 创建的第一个页面是 `pages/login/`，第一个服务是 `services/api.ts` 请求基座。后续页面按相同模式扩展。

## 目录约定

```
miniprogram/
├── app.config.ts            # 全局页面/TabBar 配置
├── app.tsx                  # 应用入口
├── app.scss                 # 全局样式
├── config.ts                # 环境配置（baseURL 等）
├── services/                # 接口封装（T-002 创建）
│   ├── api.ts               # 请求基座
│   └── auth.ts              # 登录相关接口
├── utils/                   # 工具函数（storage、format 等）
├── components/              # 公共组件
└── pages/                   # 页面
    └── login/               # 登录页（T-002 创建）
        ├── index.config.ts
        ├── index.tsx
        └── index.scss
```

## 请求基座约定

`services/api.ts` 统一封装 `Taro.request`：

- 读取 `config.ts` 的 `baseURL`。
- 从 `Taro.getStorageSync('token')` 读取 token，注入 `Authorization: Bearer <token>`。
- 全局错误处理：HTTP 非 2xx 时 `Taro.showToast({ title: message })`。
- 返回统一格式 `{ code, data, message }` 中的 `data`。

```typescript
// services/api.ts 示例
export const api = {
  post: async <T>(url: string, data?: any) => { /* ... */ },
  get: async <T>(url: string, params?: any) => { /* ... */ },
};
```

## 页面约定

每个页面三件套：

- `index.config.ts`：页面配置（如 `navigationBarTitleText`）。
- `index.tsx`：页面逻辑 + JSX。
- `index.scss`：页面样式。

## 状态管理

- 简单页面用 React `useState`。
- 全局用户态（token、userInfo）用 React Context，位于 `store/user.tsx`（T-002 后可按需补充）。

## 写新页面时

1. 先在 `app.config.ts` 注册页面路由。
2. 创建页面三件套。
3. 如需调接口，先在 `services/api.ts` 基座支持下，在 `services/{domain}.ts` 封装领域接口。
4. 页面逻辑只调领域接口，不直接写 `Taro.request`。
