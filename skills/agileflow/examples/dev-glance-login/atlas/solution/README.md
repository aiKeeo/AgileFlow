# 方案设计（Solution）

- 状态：已确认
- 关联需求：REQ-001
- 全局架构：[architecture.md](architecture.md)

## AI 决策记录

| 决策项 | 选择 | 依据 |
|--------|------|------|
| 后端框架 | NestJS | 示例项目需要清晰的分层（Controller/Service/Module），且 TypeORM 与 MySQL 搭配常见 |
| 前端框架 | 微信小程序原生 | 登录示例简单，原生小程序足够演示 FE 与 BE 联调 |
| 鉴权方式 | JWT + BCrypt | 无状态、与小程序 storage 配合简单；密码哈希用 BCrypt |
| 数据库 | MySQL | 示例采用 TypeORM 默认；dev 可用 sqlite 或本地 MySQL 替代 |

## 开发者一览

| 问 | 答 |
|----|-----|
| 要做啥 | 账号密码登录，拿 JWT 进首页 |
| 不做啥 | 注册 / 微信一键 / refresh（← REQ 范围外） |
| 后端接口 | `POST /api/auth/login` → [API-001](contracts/API-001-login.md) |
| 前端页面 | `pages/login` → [UI-001](contracts/UI-001-login.md) |
| 技术栈 | NestJS + 微信小程序原生 |
| 资源初始状态 | greenfield：`backend/src` 与 `miniprogram/` 为空；T-001 先建 User 基础 + Auth 模块，T-002 先建请求基座 + 登录页 |
| 动手顺序 | T-001（BE）→ T-002（FE）；**两个独立 dev 文件** |
| 怎么算完 | AC-001-01～06；BE 主证据为 UT |

## 功能清单

| 功能ID | 文档 | 关联 REQ | 暴露面 |
|--------|------|----------|--------|
| F-001 | [features/F-001-login.md](features/F-001-login.md) | REQ-001 | API-001, UI-001 |

## 契约清单

| 契约ID | 文档 |
|--------|------|
| API-001 | [contracts/API-001-login.md](contracts/API-001-login.md) |
| UI-001 | [contracts/UI-001-login.md](contracts/UI-001-login.md) |

## AC → 主 T

| AC ID | 观测面 | 主 T | 建议测法 |
|-------|--------|------|----------|
| AC-001-01 | API | T-001 | ② UT + ③ 薄 ac |
| AC-001-02 | API | T-001 | ② UT + ③ 薄 ac |
| AC-001-03 | 规则 | T-001 | ② UT（主证据） |
| AC-001-04 | UI | T-002 | ② 前端单测 |
| AC-001-05 | UI | T-002 | ② 前端单测 |
| AC-001-06 | UI | T-002 | ② 前端单测 |

## 开发任务

见 [../todo.md](../todo.md)（期望 `dev/T-*.md` 数 = 2）
