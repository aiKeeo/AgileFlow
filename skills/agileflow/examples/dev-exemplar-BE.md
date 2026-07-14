# dev 构思范例（BE）

> ① 照此结构写；细节链到 REQ/API/model，**禁止抄全文**。

# [T-004] 体重记录 API — 构思 [BE]

- 任务：**T-004** · 端：**BE** · 档位：**标准**
- → [REQ-002](../requirements/REQ-002-健康记录与可视化.md) · [F-002](../solution/features/F-002-健康记录与可视化.md) · [API-003](../solution/contracts/API-003-体重记录.md)
- depends_on：T-002 · 写法：`code-patterns-backend` 资产索引

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

#### 新增 `AC-002-01`

1. `WeightRecordController.create` + `@Valid`
2. Service 填 `userId` → `weightRecordRepository.save`
3. 返回 201 + `WeightRecordResponse`

#### 列表 `AC-002-02`

1. `list(from,to)` → `findByUserIdAndRecordedAtBetweenOrderByRecordedAtAsc`
2. 转 `items[]` 升序返回

#### 删除

1. `findById` → 非己/不存在 404 → `delete`

#### 非法值 `AC-002-07`

1. Controller `@Valid` 拦 value≤0，Service 不执行

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
