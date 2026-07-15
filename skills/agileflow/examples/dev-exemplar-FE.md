# dev 构思范例（FE）

> ① 照此结构写；字段绑定 **只看 contracts/UI**，dev 内禁止映射表。

# [T-008-FE] 通知列表已读交互 — 构思 [FE]

- 档位：**标准** · depends_on：T-008-BE
- → [F-008](../solution/features/F-008-通知已读.md) · [UI-008](../solution/contracts/UI-008-通知列表页.md) · [UID-008](../requirements/ui/UID-008-通知中心.md) · 写法：code-patterns-frontend

## 摘要

- **本 T**：F-008 的前端切片（T-008-FE）；通知列表展示、点「标记已读」、更新未读圆点与 Tab 角标。
- **做**：按 UID-008 渲染列表；按 UI-008 绑定对单条发 PATCH；成功后本地更新 isRead 并重算角标；提交中按钮禁用防连点。
- **不做**：通知推送、批量已读、后端 PATCH 实现（T-008-BE）、消息详情页（F-009）。
- **上游**：[F-008](../solution/features/F-008-通知已读.md) · [UI-008](../solution/contracts/UI-008-通知列表页.md) · depends_on [T-008-BE](../dev/T-008-BE-通知已读API.md) · [UID-008](../requirements/ui/UID-008-通知中心.md)。
- **AC**：AC-008-01（标记成功 UI 反馈）、AC-008-02（角标 3→2）、AC-008-03（已读再点不报错）。
- **接线**：PATCH 路径与列表字段见 [UI-008 §字段绑定](../solution/contracts/UI-008-通知列表页.md#字段绑定)；dev 内禁止另建映射表。

## 步骤

#### 1. 列表与未读态

- **涉及改动**：`NotificationListPage` — 未读圆点 + Tab 角标

#### 2. 调已读接口

- **涉及改动**：`notificationService.markRead(id)` — 200 后本地 isRead=true

#### 3. 绑标记按钮

- **涉及改动**：`NotificationItem.onMarkRead()` — 成功后减角标

#### 4. 防连点

- **涉及改动**：`NotificationItem` submitting 锁 — 已读再点不 toast

## 结果

| 项 | 证据 |
|----|------|
| 构建/联调 | npm run build:weapp ✅ · 3 未读→标记 1 条→角标 2 ✅ · 已读再点无报错 ✅ |
