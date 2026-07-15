# 构思落盘（atlas/dev/）

> 颗粒度 → [exemplar-BE](../examples/dev-exemplar-BE.md) · [exemplar-FE](../examples/dev-exemplar-FE.md)  
> 档位 → [04](../phases/04-development.md) · 裁决 → [SKILL](../SKILL.md#裁决表冲突时以此为准)

## 分工（v9.12 template + legacy 双模式）

| 层 | 定什么 | dev 做什么 |
|----|--------|------------|
| **REQ AC** | 行为、异常、验收 Given/When/Then | 摘要列 AC ID；步骤写方法级边界（404/幂等/toast） |
| **contracts/API** | 接口完整规格 | BE **只链** API-xxx |
| **contracts/UI §字段绑定** | 页面上↔请求字段↔接口 | FE **只链** UI-xxx（有 API 时） |
| **dev/T** | — | 结构化摘要 + 步骤（**涉及改动** 伪代码清单）+ 结果 |

> **`AF_TEMPLATE=no`（legacy）**：步骤仍用 **用户/系统/改** 三行，见 legacy exemplar 与 `DEV-STEP-3` 规则。

## 留什么（仅 3 段）

| 段 | 精简 | 标准·完整 | 写什么 |
|----|:----:|:--------:|--------|
| **## 摘要** | ✅ | ✅ | 五 bullet：**本 T** / **做** / **不做** / **上游** / **AC**（FE+API 可加 **接线**） |
| **## 步骤** | ✅ | ✅ | `####` + **涉及改动**（须 `` `Class.method` `` 或 `` `PageName` ``；`—` 后写此方法边界） |
| **## 结果** | ✅ | ✅ | ③ 可运行证据 |

**不留**：范围、异常、AC 专节、前置、必读、契约、做法、dev 内映射表、抄 API/UID JSON、F 联调卡。

## 骨架（标准 · template 模式）

```markdown
# [T-id] 名 — 构思 [BE|FE]

- 档位：[标准|完整|精简] · depends_on：T-xxx
- → [F-xxx](../solution/features/…) · [API|UI|UID](…) · 写法：code-patterns-{端}

## 摘要

- **本 T**：F-008 的后端切片（T-008-BE）；落地 API-008 单条通知标记已读。
- **做**：入口 → 查库 → 校验本人 → 写 isRead；已读再 PATCH 仍 200；非本人→404。
- **不做**：通知列表 GET、推送、小程序页面。
- **上游**：F-008 · API-008 · depends_on T-002 登录鉴权。
- **AC**：AC-008-01、AC-008-03、AC-008-04（细节见 REQ-008）。

## 步骤

#### 1. 写接口入口
- **涉及改动**：`NotificationController.markRead()` — 未登录→401

#### 2. 按 id 查通知
- **涉及改动**：`NotificationRepository.findById(id)` — 空→404

#### 3. …

## 结果
| 项 | 证据 |
```

## 步骤格式（闸门 grep）

每 `####` 下**默认一行**（方法级伪代码）：

```
- **涉及改动**：`Class.method()` — 空→404
```

- **涉及改动** = 本步代码落点（含新建/绑定/读 `` `API-008` ``）
- `—` 后写此方法要注意的边界；多要点才拆 `- 注意：…`
- **禁止**每步强引 AC；AC 只在摘要列 ID

| 档 | 最少 #### 步 |
|----|-------------|
| 精简 | 1 |
| 标准 | 2 |
| 完整 | 3 |

勾①：完整档另跑 `--gate dev-step1-literal --dev-file …`（template 模式走 `TMPL-DEV-CHANGE`；legacy 走 `DEV-STEP-3`）。
