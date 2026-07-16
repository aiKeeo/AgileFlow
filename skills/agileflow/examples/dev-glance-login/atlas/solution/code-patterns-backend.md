# 后端写法锚点（greenfield）

> 本示例后端使用 NestJS + TypeORM + MySQL。T-001 创建的第一个领域模块是 `user/`，第二个是 `auth/`。后续模块按相同模式扩展。

## 目录约定

```
backend/src/
├── main.ts                  # NestJS 应用入口
├── app.module.ts            # 根模块，导入各领域模块
├── common/                  # 全局 Result、异常、拦截器（T-001 后按需补充）
├── user/                    # 用户领域（T-001 创建）
│   ├── user.entity.ts
│   ├── user.repository.ts
│   └── user.service.ts
└── auth/                    # 认证领域（T-001 创建）
    ├── auth.module.ts
    ├── auth.controller.ts
    ├── auth.service.ts
    └── dto/
        └── login.dto.ts
```

## 分层约定

| 层 | 职责 | 命名 |
|----|------|------|
| Controller | 收 HTTP 请求、调 Service | `AuthController` 在 `auth.controller.ts` |
| Service | 业务逻辑、跨领域协调 | `AuthService` 在 `auth.service.ts` |
| Repository | 数据访问（TypeORM） | `UserRepository` 在 `user.repository.ts` |
| Entity | 表映射 | `User` 在 `user.entity.ts` |
| DTO | 入参校验（class-validator） | `LoginDto` 在 `dto/login.dto.ts` |

## 命名约定

- 类名：PascalCase，如 `AuthController`、`LoginDto`。
- 文件名：kebab-case，与类名对应，如 `auth.controller.ts`。
- 方法名：camelCase，如 `validateAndSign`。
- 表名：小写 + 下划线，如 `t_user`。

## 错误处理

- 统一使用 `Result<T>` 包装响应：`{ code: 0, data: T, message: 'ok' }`。
- 业务异常抛 `ApiException`，由 `GlobalExceptionHandler` 统一转 Result。
- HTTP 状态码：200 成功、400 参数错误、401 未登录/密码错误、403 无权、404 资源不存在。

## 写新模块时

1. 先建 Entity，再建 Repository，再建 Service，最后建 Controller + DTO。
2. 在根模块 `AppModule` 中导入新模块。
3. 暴露面（REST 接口）契约同步写入 `atlas/solution/contracts/API-xxx.md`。
