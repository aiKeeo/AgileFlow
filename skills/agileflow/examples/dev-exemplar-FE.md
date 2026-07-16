# dev 构思范例（FE）

> ① 照此结构写；字段绑定 **只看 contracts/UI**，dev 内禁止映射表。  
> 标准/完整优先 **流程表**。更多 → [dev-reuse-examples](dev-reuse-examples.md)

# [T-008-FE] 通知列表已读交互 — 构思 [FE]

- 档位：**完整** · depends_on：T-008-BE
- → [F-008](../solution/features/F-008-通知已读.md) · [UI-008](../solution/contracts/UI-008-通知列表页.md) · [UID-008](../requirements/ui/UID-008-通知中心.md) · 写法：code-patterns-frontend

## 摘要

- **本 T**：F-008 的前端切片；通知列表、点「标记已读」、更新未读圆点与 Tab 角标。
- **做**：扩列表页与 Item；`markRead` 照 `api.ts` 现有 PATCH；不复制第二份 Item。
- **不做**：通知推送、批量已读、后端 PATCH（T-008-BE）、消息详情页（F-009）。
- **上游**：[F-008](../solution/features/F-008-通知已读.md) · [UI-008](../solution/contracts/UI-008-通知列表页.md) · depends_on [T-008-BE](../dev/T-008-BE-通知已读API.md) · [UID-008](../requirements/ui/UID-008-通知中心.md)。
- **AC**：AC-008-01（标记成功 UI 反馈）、AC-008-02（角标 3→2）、AC-008-03（已读再点不报错）。
- **接线**：PATCH 路径与列表字段见 [UI-008 §字段绑定](../solution/contracts/UI-008-通知列表页.md#字段绑定)；dev 内禁止另建映射表。

## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | 渲染列表与未读态 | 列表数据 → 圆点 + Tab 角标 | 在 `NotificationListPage.render()` 按 UID-008 渲染 — 有现成 `Badge` 组件则直接用 |
| **S2** | 调已读接口 | id → 200 | 在 `services/api.ts` 照其他 PATCH 加 `notificationService.markRead()` — 200 后本地 `isRead=true` |
| **S3** | 绑标记按钮 | 点击 → 角标-1 | 在 `NotificationItem.onMarkRead()` 中调 `markRead()` 并更新本地状态 — 不另建 HOC |
| **S4** | 防连点 | submitting → 忽略重复 | 在 `NotificationItem.handleClick()` 开头加 `if (submitting) return` — 已读再点不 toast |

## 结果

| 项 | 证据 |
|----|------|
| 构建/联调 | npm run build:weapp ✅ · 3 未读→标记 1 条→角标 2 ✅ · 已读再点无报错 ✅ |
