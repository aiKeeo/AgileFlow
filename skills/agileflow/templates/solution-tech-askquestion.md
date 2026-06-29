# 技术栈 / 框架选型 AskQuestion 模板

> 阶段 3 专用：**编写 `architecture.md` 之前必须执行**。
> 禁止 AI 自行假设 NestJS / Spring / React 等默认栈；须先 AskQuestion，**调用后立即停止**。

## 何时执行

| 条件 | 动作 |
|------|------|
| 首次进入阶段 3，尚未写 `architecture.md` | ✅ 必须 AskQuestion |
| 用户已在对话中**明确指定**完整技术栈（语言+框架+数据库） | 可跳过初次卡片，但须在回复首行声明依据；**方案确认**卡片仍须含架构确认题 |
| 已有 `architecture.md` 草稿，用户要求改栈 | 重新 AskQuestion 技术栈卡片 → 改 architecture → **方案确认** |
| 仓库已有成熟技术栈（package.json / pom.xml 等） | 首题优先提供「沿用现有仓库技术栈」选项 |

## 第 1 步：技术栈选型（写 architecture.md 前）

```
title: "{项目名} - 技术栈与框架选型"
questions:
  - id: "stack_source"
    prompt: "技术栈怎么定？"
    options:
      - { id: "follow_repo", label: "沿用当前仓库已有技术栈" }
      - { id: "user_specify", label: "我来指定（下面几题选择）" }
      - { id: "ai_suggest", label: "还没想好，根据需求和平台帮我推荐" }

  - id: "language"
    prompt: "后端 / 主语言偏好？"
    options:
      - { id: "typescript", label: "TypeScript" }
      - { id: "javascript", label: "JavaScript" }
      - { id: "java", label: "Java" }
      - { id: "python", label: "Python" }
      - { id: "go", label: "Go" }
      - { id: "csharp", label: "C# / .NET" }
      - { id: "other", label: "其他（下轮文字补充）" }

  - id: "backend_framework"
    prompt: "后端框架偏好？"
    options:
      - { id: "nestjs", label: "NestJS" }
      - { id: "express", label: "Express / Fastify" }
      - { id: "spring", label: "Spring Boot" }
      - { id: "django", label: "Django / FastAPI" }
      - { id: "gin", label: "Gin / Echo" }
      - { id: "aspnet", label: "ASP.NET Core" }
      - { id: "none", label: "纯前端 / 无后端（静态或 BaaS）" }
      - { id: "unsure", label: "还没想好，帮我建议" }

  - id: "frontend_framework"
    prompt: "前端框架偏好？（可与 REQ 阶段 platform 对齐）"
    options:
      - { id: "react", label: "React" }
      - { id: "vue", label: "Vue" }
      - { id: "next", label: "Next.js / Nuxt" }
      - { id: "mini_program", label: "微信小程序原生 / Taro / uni-app" }
      - { id: "mobile", label: "React Native / Flutter" }
      - { id: "none", label: "无独立前端（API / CLI / 后台）" }
      - { id: "unsure", label: "还没想好，帮我建议" }

  - id: "database"
    prompt: "数据库 / 持久化偏好？"
    options:
      - { id: "postgresql", label: "PostgreSQL" }
      - { id: "mysql", label: "MySQL / MariaDB" }
      - { id: "sqlite", label: "SQLite（轻量 / 本地）" }
      - { id: "mongodb", label: "MongoDB" }
      - { id: "redis_only", label: "仅 Redis / 内存（无关系库）" }
      - { id: "follow_model", label: "跟 model/physical-model.md 已定选型走" }
      - { id: "unsure", label: "还没想好，帮我建议" }

  - id: "ui_style"
    prompt: "界面视觉样式怎么定？（REQ 的 UID 只描述了结构与交互）"
    options:
      - { id: "style_later", label: "样式我后面自己定，先按默认组件库实现" }
      - { id: "style_reference", label: "我有参考稿/Figma，会提供（写 humanTodo）" }
      - { id: "style_system", label: "用指定设计系统（下轮文字说 Ant Design / Material 等）" }
      - { id: "style_minimal", label: "极简/无定制，能用就行" }
      - { id: "style_na", label: "本项目无 UI / 不适用" }
```

### 选项填充规则

- `follow_repo`：先读仓库依赖与目录结构，将实际栈写入 `architecture.md`「技术栈」表，并在**方案确认**时列出
- `ai_suggest`：结合 REQ 平台形态、团队规模、model 物理模型给出**一份**推荐栈，写入 architecture 后须用户**方案确认**
- 各题选项须按项目语境替换或增删（如纯 Java 项目可省略 TypeScript）
- 若 REQ 已明确「微信小程序」，前端题默认突出 mini_program 相关选项
- `ui_style`：选 `style_reference` → humanTodo 追加参考稿；选 `style_later` → UID/UI-xxx 样式状态保持「待定」；**禁止 Agent 替用户定配色**

## 第 2 步：写入 architecture.md

用户回答后（或声明沿用仓库栈后）：

1. 将选型结果写入 `architecture.md`「技术栈」表（语言 / 框架 / 数据库 / 日志框架等）
2. 日志框架、测试命令须与所选栈一致（见 [observability-logging.md](observability-logging.md)）
3. 继续编写架构图、文件结构、追溯矩阵、测试依赖、L1–L5 命令

## 正误示例

**✅ 正确**：features（含§边界）+ 按需 contracts → **AskQuestion 技术栈** → architecture（全局一份）→ todo → 方案确认 → 阶段闸门

**❌ 错误**：未问技术栈直接写 NestJS + PostgreSQL；architecture 用模板示例值而不反映用户选择；技术栈卡片与**方案确认**合并为一步（须先选型、后确认）
