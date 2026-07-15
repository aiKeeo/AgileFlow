# dev 构思范例（BE）

> ① 照此结构写；细节链到 REQ/API/model，**禁止抄全文**。每步须有 **目的：**。

# [T-004] 体重记录 API — 构思 [BE]

- 任务：**T-004** · 端：**BE** · 档位：**标准**
- → [REQ-002](../requirements/REQ-002-健康记录与可视化.md) · [F-002](../solution/features/F-002-健康记录与可视化.md) · [API-003](../solution/contracts/API-003-体重记录.md)
- depends_on：T-002 · 写法：`code-patterns-backend` 资产索引

## 前置

- depends_on：T-002（鉴权与 `AuthContext` 须先可用，本 T 不重复造登录）
- 运行条件：本地可启 BE；测试库可写 `weight_records`
- 前提假设：用户表与 JWT 中间件已按 F-001 落地；本 T 无 schema 迁移

## 必读（只链，打开即用）

| 用途 | 链接 | 本 T 用到什么 |
|------|------|---------------|
| 验收 | [REQ-002](../requirements/REQ-002-健康记录与可视化.md) | AC-002-01/02/07 |
| 功能边界 | [F-002](../solution/features/F-002-健康记录与可视化.md) | 暴露面 API-003 |
| 接口 | [API-003](../solution/contracts/API-003-体重记录.md) | POST/GET/DELETE 形状与错误码 |
| 模型 | [domain-model](../model/domain-model.md) | WeightRecord 字段；无本 T schema 变更 |

## 范围

- **目标**：已登录用户新增 / 按区间查 / 删自己的体重记录
- **必须**：POST→201+id；GET 升序；DELETE 仅自己；value≤0→400
- **不做**：饮食/运动、仪表盘聚合、单位换算 UI

## 契约

→ 权威 [API-003](../solution/contracts/API-003-体重记录.md)（勿重贴入参出参表）  
→ 表结构 [model](../model/)（本 T 无 schema 变更，只补 Entity/Repo）

### 复用

| 能力 | 资产 | 决策 |
|------|------|------|
| 当前用户 | `AuthContext.requireUserId` | 复用 |
| 统一响应 | `ApiResponse` | 复用 |
| 体重 CRUD | 无 | 新建 `WeightRecordService` |

## 做法

#### 新增记录 — 目的：落库并返回可追溯 id `WeightRecordController.create`

- 引用：API-003 §请求 POST · AC-002-01
- 做：`@Valid` 入参 → Service 填 `userId` → `weightRecordRepository.save` → 201 + `WeightRecordResponse`
- 完成标志：AC-002-01 单测绿；响应含非空 id

#### 区间列表 — 目的：按时间升序返回本人记录 `WeightRecordService.list`

- 引用：API-003 GET · AC-002-02
- 做：`list(from,to)` → `findByUserIdAndRecordedAtBetweenOrderByRecordedAtAsc` → 转 `items[]`
- 完成标志：列表 `recordedAt` 非降序

#### 删除与校验 — 目的：仅本人可删且拦截非法体重 `WeightRecordService.delete`

- 引用：API-003 DELETE · AC-002-07
- 做：`findById` 非己/不存在→404；`@Valid` 拦 value≤0，Service 不执行
- 完成标志：他户 404；value≤0 → 400

## AC

| AC | Then | test/ac |
|----|------|---------|
| AC-002-01 | 201 + id | `ac002_01_createWeight` |
| AC-002-02 | 升序列表 | `ac002_02_listWeight` |
| AC-002-07 | 400 | `ac002_07_invalidWeight` |

## 结果

| AC | AC单测 | 可运行证据 |
|----|--------|------------|
| … | ⬜ | ①可空表；③填：编译命令+启/冒烟+PASS |
