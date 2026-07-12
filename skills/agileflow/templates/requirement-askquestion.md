# 需求澄清 AskQuestion 模板

> **入口铁律**：进入阶段 1 后**第一件事**就是本卡片；用户已发长需求也**不可跳过**——用本卡片做确认/补充，而非直接写 REQ。

## 第 1 步：澄清/确认（进入阶段 1 后必须先做）

根据用户**已述内容**生成选项（把用户提到的功能写进 `core_features`，勿留空占位）：

```
title: "{项目名} - 需求澄清"
questions:
  - id: "target_user"
    prompt: "主要使用者是谁？"
    options:
      - { id: "self", label: "我自己用" }
      - { id: "family", label: "家庭/小团体" }
      - { id: "public", label: "面向公众用户" }

  - id: "platform"
    prompt: "希望先做哪种形态？"
    options:
      - { id: "web", label: "Web 网页" }
      - { id: "mobile", label: "手机 App" }
      - { id: "mini", label: "微信小程序" }
      - { id: "unsure", label: "还没想好，帮我建议" }

  - id: "core_features"
    prompt: "核心功能有哪些？（可多选，已根据你的描述预填）"
    allow_multiple: true
    options:
      - { id: "feature_a", label: "（根据用户描述填入）" }
      - { id: "other", label: "还有其他要补充" }

  - id: "priority"
    prompt: "第一版 MVP 最优先解决什么？"
    options:
      - { id: "mvp_a", label: "（根据上下文填入）" }
      - { id: "all", label: "第一版就要全部功能" }

  - id: "ui_scope"
    prompt: "项目是否涉及用户可见界面（Web/App/小程序）？"
    options:
      - { id: "ui_yes", label: "有，需要描述页面/交互（样式我后面自己定）" }
      - { id: "ui_partial", label: "有界面，但第一版可以先做 API/后端" }
      - { id: "ui_no", label: "无 UI（纯 API/CLI/批处理）" }
      - { id: "ui_unsure", label: "不确定，帮我判断" }
```

**调用 AskQuestion 后立即停止（本回复）**；禁止**同回复**写 REQ。

## 第 2 步：用户回答后 — 必须写 REQ（下一条回复执行）

用户完成第 1 步点选/回复后，Agent **下一条回复必须**：

1. 写 `atlas/requirements/REQ-XXX-*.md`（状态：草稿）
2. 写 `atlas/requirements/README.md`，初始化 `atlas/todo.md`
3. 按需写 `atlas/requirements/ui/UID-*.md`
4. 再 AskQuestion 第 3 步确认 → **停止（本回复）**

**禁止**：用户已答需求卡片却不下 REQ 文件；只回复「好的，我记下了」。

## 第 3 步：草稿确认（写完 REQ 草稿后）

```
title: "需求确认"
questions:
  - id: "confirm_requirements"
    prompt: "以下需求清单是否正确？\n\nREQ-001 xxx\nREQ-002 xxx\n\n（共 N 个）"
    options:
      - { id: "confirm", label: "确认需求清单" }
      - { id: "add", label: "基本正确，但我还要补充" }
      - { id: "revise", label: "有较大调整，重新讨论" }

  - id: "missing_features"
    prompt: "有没有遗漏的功能？（可多选）"
    allow_multiple: true
    options:
      - { id: "none", label: "没有遗漏" }
      - { id: "login", label: "用户登录/注册" }
      - { id: "share", label: "分享/协作" }
      - { id: "offline", label: "离线使用" }
      - { id: "other", label: "其他（下轮文字补充）" }

  - id: "ui_confirm"
    prompt: "界面描述（UID）是否准确？\n\n（列出已生成的 UID-xxx 或「本项目无 UI」）\n\n每个有 UI 的 UID 须含：区域表 + ASCII 布局线条图（§2.2）。纯文字/纯表不合格。\n注：此处只确认结构与交互；视觉样式由你后续决定。"
    options:
      - { id: "ui_ok", label: "界面描述 OK（含线条图）/ 无 UI" }
      - { id: "ui_wire", label: "缺线条图，先补再确认" }
      - { id: "ui_add", label: "还要补充页面或交互" }
      - { id: "ui_revise", label: "界面描述需要大改" }
```

## 正误示例

**✅ 正确**：AskQuestion 收集 → 草稿 → AskQuestion 确认 → 标已确认 → 阶段闸门（askquestion-gate.md）

**❌ 错误**：未 AskQuestion 就写 REQ；一句话直接写 5 个 REQ；AskQuestion 后同回复继续写文档；正文聊天追问平台
