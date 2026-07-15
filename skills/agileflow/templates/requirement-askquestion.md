# 需求澄清 AskQuestion 模板

> **适用范围：仅 `user_decide`**。  
> **AI自主** → **不发本卡**，直接按 [01-requirement 第 2 步 AI 自主](../phases/01-requirement.md) 落盘 → 审阅闸门。  
> **信息充分**（[flow-modes §REQ 信息充分例外](flow-modes.md#req-信息充分例外快速严谨共用)）→ **跳过第 1 步整卡**，直接落盘 → 第 3 步确认。  
> 否则：只问**缺口**；**禁止**对用户原话已明确的字段再出题；不可用聊天追问代替卡片。

## 缺口判定（发卡前必做）

对照用户原话，逐项勾选是否已覆盖：

| 字段 id | 已覆盖则 |
|---------|----------|
| `target_user` | **不入卡** |
| `platform` | **不入卡** |
| `core_features` | **不入卡**（功能列表已可拆 REQ） |
| `priority` | **不入卡**（已说先后/MVP/本批都要） |
| `ui_scope` | **不入卡**（已说有界面/无 UI/先 API；或平台已是小程序/Web/App 可推断有 UI） |

- 5 项全覆盖 → 等同信息充分，**跳过第 1 步**，首行声明依据，进第 2 步落盘。
- 仅缺口项进入下方 `questions` 数组；预填选项须来自用户原话，**禁止**占位「（根据用户描述填入）」。

## 第 1 步：澄清/确认（仅 user_decide · 仅缺口）

示例：用户已说「微信小程序 + 公众用户」，只缺功能与优先级时，卡里**只有** `core_features` / `priority`（勿再出 target_user / platform）。

```
title: "{项目名} - 需求澄清（仅缺口）"
questions:
  # 仅包含上方判定为未覆盖的 id；下列为题库，勿整卡照抄
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
      - { id: "feature_a", label: "{用户原话中的功能名}" }
      - { id: "other", label: "还有其他要补充" }

  - id: "priority"
    prompt: "本批要落盘的功能里，哪个最先做？（每个功能仍各自一份 REQ，本题只定优先级）"
    options:
      - { id: "mvp_a", label: "{优先功能名}" }
      - { id: "all", label: "本批列出的功能都要（仍一功能一 REQ）" }

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

用户完成第 1 步点选/回复后，**或**信息充分跳过第 1 步时的本条回复，Agent **必须**：

1. 写 `atlas/requirements/REQ-XXX-*.md`（状态：草稿）
2. 写 `atlas/requirements/README.md`，初始化 `atlas/todo.md`，更新 `atlas/README.md`
3. 按需写 `atlas/requirements/ui/UID-*.md`
4. **禁止**把用户原话已答清的事项再写入 `humanTodo`
5. 再 AskQuestion 第 3 步确认 → **停止（本回复）**（快速可与闸门合并，见 flow-modes）

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
    prompt: "界面描述（UID）是否准确？\n\n（列出已生成的 UID-xxx 或「本项目无 UI」）\n\n线框权威在 UID；此处只确认结构与交互。"
    options:
      - { id: "ui_ok", label: "界面描述 OK / 无 UI" }
      - { id: "ui_wire", label: "缺线条图，先补再确认" }
      - { id: "ui_add", label: "还要补充页面或交互" }
      - { id: "ui_revise", label: "界面描述需要大改" }
```
