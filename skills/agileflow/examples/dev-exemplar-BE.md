# dev 构思范例（BE）

> ① 照此结构写；接口链 API；**禁止**在 dev 内写字段映射表。  
> 标准/完整优先 **流程表**；精简可用一行 **改**。更多 → [dev-reuse-examples](dev-reuse-examples.md)

# [T-008-BE] 通知已读 API — 构思 [BE]

- 档位：**完整** · depends_on：T-002
- → [F-008](../solution/features/F-008-通知已读.md) · [API-008](../solution/contracts/API-008-通知已读.md) · 写法：code-patterns-backend

## 摘要

- **本 T**：F-008 的后端切片（T-008-BE）；单条通知标记已读。
- **做**：新写通知入口与 Service；401 走全局鉴权；404/幂等在 Service；查库用 NotificationMapper。
- **不做**：通知列表 GET、推送下发、批量已读、小程序页面与角标逻辑。
- **上游**：[F-008](../solution/features/F-008-通知已读.md) · [API-008](../solution/contracts/API-008-通知已读.md) · depends_on [T-002](../dev/T-002-login-BE.md)（401 走全局过滤器）。
- **AC**：AC-008-01（标记成功 200）、AC-008-03（幂等）、AC-008-04（404）、AC-008-05（401 由鉴权层）。

## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | 收 PATCH 请求 | id + token → 进入业务 | 新写 `NotificationController.markRead` — 模块首接口；未登录由 `JwtFilter` 挡 |
| **S2** | 按 id 查通知 | id → 实体或空 | `NotificationMapper.findById` — 空→404 |
| **S3** | 校验归属 | 通知 + userId → 通过/拒绝 | 在 `NotificationService` 上加 `assertOwner` — 非本人当 404，不泄露存在性 |
| **S4** | 标记已读 | 通知 → isRead=true | 在 `NotificationService.markRead` — 已读再 PATCH 仍 200 |

## 结果

| 项 | 证据 |
|----|------|
| 编译/启/冒烟 | ③ mvn package ✅ · curl PATCH 未读→200 ✅ · 重复 PATCH→200 ✅ · 他人 id→404 ✅ |
