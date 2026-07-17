# dev 构思范例（FE）

> ① 照此结构写；字段绑定 **只看 contracts/UI**，dev 内禁止映射表。
> 标准/完整优先 **原子步骤表**（每 `####` 一个步骤 + 8 字段规格表）；精简可用 `####` + **涉及改动**/**改**。更多 → [dev-reuse-examples](dev-reuse-examples.md)
>
> **8 字段必须全列**（值可填"无"，但行不能省）：
> 执行角色 / 触发条件 / 输入数据 / 处理逻辑（含所有 if/else）/ 调用依赖（`component.method()` / `api.xxx()`）/ 异常处理（toast/回退 UI）/ 输出数据 / 状态变更

# [T-008-FE] 通知列表已读交互 — 构思 [FE]

- 档位：**完整** · depends_on：T-008-BE
- → [F-008](../solution/features/F-008-通知已读.md) · [UI-008](../solution/contracts/UI-008-通知列表页.md) · [UID-008](../requirements/ui/UID-008-通知中心.md) · 写法：code-patterns-frontend

## 摘要

- **本 T**：F-008 的前端切片；通知列表渲染、点「标记已读」、更新未读圆点与 Tab 角标。
- **做**：扩列表页与 Item 组件；`markRead` 照 `api.ts` 现有 PATCH；不复制第二份 Item；防连点。
- **不做**：通知推送、批量已读、后端 PATCH（T-008-BE）、消息详情页（F-009）。
- **上游**：[F-008](../solution/features/F-008-通知已读.md) · [UI-008](../solution/contracts/UI-008-通知列表页.md) · depends_on [T-008-BE](../dev/T-008-BE-通知已读API.md) · [UID-008](../requirements/ui/UID-008-通知中心.md)。
- **AC**：AC-008-01（标记成功 UI 反馈）、AC-008-02（角标 3→2）、AC-008-03（已读再点不报错）。
- **接线**：PATCH 路径与列表字段见 [UI-008 §字段绑定](../solution/contracts/UI-008-通知列表页.md#字段绑定)；dev 内禁止另建映射表。

## 步骤

#### S1：渲染列表与未读态

| 字段 | 内容 |
|------|------|
| 执行角色 | 前端 `NotificationListPage` 组件 |
| 触发条件 | 用户进入通知列表页，组件 `onLoad` 触发 |
| 输入数据 | 后端返回 `notificationList`（Array<{ id: Number, title: String, isRead: Boolean, createTime: String }>） |
| 处理逻辑 | ① 调用 `api.notification.getList()` 获取列表 ② if 返回为空 → 渲染空状态组件 `EmptyState` ③ if 返回非空 → 遍历列表渲染 `NotificationItem` ④ 对每条 `isRead === false` 的项渲染未读圆点 `Badge` ⑤ 统计未读数 `unreadCount = list.filter(n => !n.isRead).length` ⑥ if `unreadCount > 0` → 调用 `tabBar.setBadge(unreadCount)` 设置 Tab 角标 |
| 调用依赖 | `api.notification.getList()` → `Promise<Array<NotificationItem>>`；`tabBar.setBadge(Number count)` |
| 异常处理 | API 请求失败 → 渲染 `ErrorState` 组件 + toast "加载失败，下拉刷新"；超时（>5s）→ 同上 |
| 输出数据 | 渲染后的列表 DOM，未读圆点显示，Tab 角标数 |
| 状态变更 | `data.notificationList` 填充；`data.unreadCount` 设值 |

#### S2：点击标记已读

| 字段 | 内容 |
|------|------|
| 执行角色 | 前端 `NotificationItem` 组件 → `NotificationListPage` 父组件 |
| 触发条件 | 用户点击某条未读通知的「标记已读」按钮 |
| 输入数据 | `notificationId`(Number), `currentIndex`(Number, 列表索引), `currentIsRead`(Boolean) |
| 处理逻辑 | ① if `currentIsRead === true` → 直接 return，不调 API（AC-008-03 幂等） ② 设置 `submitting = true` 防连点 ③ 调用 `api.notification.markRead(notificationId)` ④ if 返回 200 → 进入 S3 更新 UI ⑤ if 返回 404 → toast "通知不存在" + 从列表移除该项 ⑥ if 返回 401 → 跳转登录页（全局拦截器处理） ⑦ if 网络错误 → toast "网络异常，请稍后重试" ⑧ finally → `submitting = false` |
| 调用依赖 | `api.notification.markRead(Number id)` → `Promise<Result>`；`toast.show(String msg)` |
| 异常处理 | 404 → toast + 移除项；401 → 路由跳转 `/login`；网络错误 → toast，不回滚本地状态（保持未读态让用户重试）；`submitting` 防连点：重复点击直接 return |
| 输出数据 | API 调用结果（成功/失败） |
| 状态变更 | `data.submitting` → `true`（请求中）→ `false`（完成） |

#### S3：更新本地状态与 UI

| 字段 | 内容 |
|------|------|
| 执行角色 | 前端 `NotificationListPage` 组件 |
| 触发条件 | S2 返回 200 成功 |
| 输入数据 | `currentIndex`(Number), `notificationId`(Number) |
| 处理逻辑 | ① 调用 `this.setData` 更新 `notificationList[currentIndex].isRead = true` ② 隐藏该项未读圆点（`Badge` 条件渲染 `isRead === false`） ③ 重新计算 `unreadCount = notificationList.filter(n => !n.isRead).length` ④ if `unreadCount === 0` → 调用 `tabBar.removeBadge()` 清除角标 ⑤ else → 调用 `tabBar.setBadge(unreadCount)` 更新角标数 ⑥ toast "已标记为已读"（轻提示，1.5s 自动消失） |
| 调用依赖 | `this.setData(Object newData)`；`tabBar.setBadge(Number count)` / `tabBar.removeBadge()`；`toast.show(String msg, Number duration)` |
| 异常处理 | `setData` 失败（极少见）→ 不影响主流程，下次 `onShow` 刷新列表自然纠正；无需回滚 |
| 输出数据 | 更新后的列表 UI（该条无圆点），Tab 角标数减 1 或清除 |
| 状态变更 | `notificationList[currentIndex].isRead` → `true`；`unreadCount` 减 1；角标数同步更新 |

## 结果

| 项 | 证据 |
|----|------|
| 构建/联调 | npm run build:weapp ✅ · 3 未读→标记 1 条→角标 2 ✅ · 已读再点无报错无请求 ✅ · 网络断开→toast"网络异常" ✅ |
