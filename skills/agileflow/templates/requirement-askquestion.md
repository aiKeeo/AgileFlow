# 需求澄清 AskQuestion 模板

## 第 1 步：初次提问（信息不足时）

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
    prompt: "核心功能有哪些？（可多选）"
    allow_multiple: true
    options:
      - { id: "feature_a", label: "（根据用户描述填入具体选项）" }
      - { id: "feature_b", label: "..." }
      - { id: "other", label: "其他（我会在下轮补充）" }

  - id: "priority"
    prompt: "第一版 MVP 最优先解决什么？"
    options:
      - { id: "mvp_a", label: "（根据上下文填入）" }
      - { id: "mvp_b", label: "..." }
```

## 第 3 步：确认提问

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
```

## 正误示例

**✅ 正确**：AskQuestion 收集 → 草稿 → AskQuestion 确认 → 标已确认 → 阶段闸门（askquestion-gate.md）

**❌ 错误**：一句话直接写 5 个 REQ；正文追问平台；草稿未确认就标「已确认」
