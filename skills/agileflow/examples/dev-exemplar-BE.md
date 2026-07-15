# dev 构思范例（BE）

> ① 照此结构写；接口链 API-003；**禁止**在 dev 内写字段映射表。

# [T-008-BE] 通知已读 API — 构思 [BE]

- 档位：**标准** · depends_on：T-002
- → [F-008](../solution/features/F-008-通知已读.md) · [API-008](../solution/contracts/API-008-通知已读.md) · 写法：code-patterns-backend

## 摘要

- **本 T**：F-008 的后端切片（T-008-BE）；落地 [API-008](../solution/contracts/API-008-通知已读.md) 单条通知标记已读接口。
- **做**：入口 → 查库 → 校验本人 → 写 isRead；已读再 PATCH 仍 200（幂等）；非本人/不存在返回 404。
- **不做**：通知列表 GET、推送下发、批量已读、小程序页面与角标逻辑。
- **上游**：[F-008](../solution/features/F-008-通知已读.md) · [API-008](../solution/contracts/API-008-通知已读.md) · depends_on [T-002](../dev/T-002-login-BE.md) 登录鉴权（401 走全局过滤器）。
- **AC**：AC-008-01（标记成功 200）、AC-008-03（幂等）、AC-008-04（404）、AC-008-05（401 由鉴权层）。

## 步骤

#### 1. 写接口入口

- **涉及改动**：`NotificationController.markRead()` — 未登录→401

#### 2. 按 id 查通知

- **涉及改动**：`NotificationRepository.findById(id)` — 空→404

#### 3. 校验是不是本人

- **涉及改动**：`NotificationService.assertOwner(n, userId)` — 非本人→404

#### 4. 把通知改成已读

- **涉及改动**：`NotificationService.markRead(n)` — 已读重复 PATCH 仍 200

## 结果

| 项 | 证据 |
|----|------|
| 编译/启/冒烟 | ③ mvn package ✅ · curl PATCH 未读→200 ✅ · 重复 PATCH→200 ✅ · 他人 id→404 ✅ |
