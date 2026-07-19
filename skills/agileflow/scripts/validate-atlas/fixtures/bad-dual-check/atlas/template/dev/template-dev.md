---
target: dev/T-*.md
summaryBullets: 本T,做,不做,上游,AC
forbidden: "## 范围,## 做法,## 异常,## AC,## 联调卡"
changeLabel: 涉及改动
---

# [T-001] 任务名 — 构思 [BE]

> 步骤 = **方法级伪代码清单**（每 `####` 一个函数落点 + 后果/校验）。  
> **涉及改动** = 本步写/读哪里；`—` 后面写查无、404、幂等等**此方法要注意的**。


## 摘要

- **本 T**：…
- **做**：入口 → 查库 → 校验本人 → 写 isRead
- **不做**：…
- **上游**：…
- **AC**：…

## 步骤

#### 1. 写接口入口

- **涉及改动**：`NotificationController.markRead()` — 未登录→401

#### 2. 按 id 查通知

- **涉及改动**：`NotificationRepository.findById(id)` — 空→404

#### 3. 校验是不是本人

- **涉及改动**：`NotificationService.assertOwner(n, userId)` — 非本人→404

#### 4. 把通知改成已读

- **涉及改动**：`NotificationService.markRead(n)` — 已读重复仍 200

## 结果

| 项 | 证据 |
