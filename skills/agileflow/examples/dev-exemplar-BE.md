# dev 构思金标准（BE 示例）

> **权威颗粒度**：阶段 4 步骤 ① 须达到本文件水准。  
> 来源：真实落盘 dev 文档（T-004 体重记录 API）。新项目**照结构写**，内容换成本任务。

---

# [T-004] 体重记录 API — 构思落盘 [BE]

- 任务：**T-004**（唯一）
- 端：**BE**
- 功能：[F-002](../solution/features/F-002-健康记录与可视化.md) · 契约：[API-003](../solution/contracts/API-003-体重记录.md)
- 关联 REQ：[REQ-002](../requirements/REQ-002-健康记录与可视化.md)
- depends_on：T-002（鉴权）
- 写法对齐：`code-patterns-backend.md` §二（后续 §3.3 创建模板从此任务摘录）

---

## 一、需求理解（我理解的你要什么）

- **核心目标**：已登录用户能**新增 / 按区间查询 / 删除**自己的体重记录，为趋势图与仪表盘提供数据源。
- **必须满足**：
  - POST 合法体重 → **201** + 记录 id
  - GET `from`/`to` 返回当前用户记录，**recordedAt 升序**
  - DELETE 只能删自己的记录
  - value ≤ 0 或缺失 → **400** `VALIDATION_ERROR`
- **明确不做**：
  - 饮食/运动（T-005/T-006）
  - 仪表盘聚合（T-007）
  - 单位换算 UI（unit 存库即可，默认 kg）
  - 食物库、目标体重

---

## 二、数据模型（需要哪些表/实体）

| 实体 | 关键字段 | 类型 | 约束/说明 |
|------|---------|------|----------|
| WeightRecord | id | BIGINT | PK |
| | userId | BIGINT | FK，**隔离数据** |
| | value | DECIMAL(6,2) | 必须 > 0 |
| | unit | VARCHAR(4) | 默认 `kg`；MVP 允许 `lb` 原样存 |
| | recordedAt | TIMESTAMP | 测量时间 |
| | createdAt | TIMESTAMP | 入库时间 |

表已在 V1；本任务补 Entity + Repository 查询方法。

---

## 三、接口契约

| 接口 | 方法 | 入参 | 出参 | 异常码 |
|------|------|------|------|--------|
| 新增体重 | POST `/api/v1/records/weight` | `{ value, unit?, recordedAt }` | 201 + `{ id, value, unit, recordedAt }` | 400 / 401 |
| 列表 | GET `/api/v1/records/weight?from=&to=` | 日期/时间范围 | `{ items: [...] }` 升序 | 401 |
| 删除 | DELETE `/api/v1/records/weight/{id}` | id | 200 `{code:0}` 或 204 | 404 非己/不存在 |

对齐 [API-003](../solution/contracts/API-003-体重记录.md)。

---

## 四、状态机

无。记录无生命周期状态（无 soft-delete 状态机；删除即物理删或硬删）。

---

## 五、核心流程

### 目的

让用户能**记录体重、查趋势、删自己的记录**；每条数据只属于当前登录人。  
做完后：小程序体重 Tab 有 API 可用，T-007 仪表盘能读最新体重。

---

### 需要什么（没有这些做不成）

| 类别 | 具体项 | 用来干什么 |
|------|--------|-----------|
| 前置任务 | T-002 JWT | `AuthContext.requireUserId()` 知道是谁 |
| 数据表 | `weight_records`（T-001 已建） | 存体重 |
| 类 | `WeightRecord` 实体 + Repository | JPA 读写 |
| 类 | `WeightRecordController` / `WeightRecordService` | HTTP + 业务 |
| 入参/出参 | `CreateWeightRecordRequest`、Response、ListResponse | 校验 + 返回 |

---

### 怎么做

#### 5.1 新增体重 `AC-002-01`

**要达成什么**：提交体重 → 落库 → 返回 id。

**需要什么**：Body `{ value, unit?, recordedAt }`；value 必须 > 0。

**做法**：
1. `WeightRecordController.create` 收 Body，`@Valid` 拦非法 value
2. Service 取 `userId`，new `WeightRecord`，填 userId/value/unit/recordedAt
3. `weightRecordRepository.save` 插入
4. 返回 `WeightRecordResponse`，HTTP **201**

#### 5.2 查体重列表 `AC-002-02`

**要达成什么**：给定时间范围，返回**当前用户**的记录，按时间升序。

**需要什么**：Query 参数 `from`、`to`（必填）。

**做法**：
1. `WeightRecordController.list(from, to)` 收 Query
2. Service 取 userId，`findByUserIdAndRecordedAtBetweenOrderByRecordedAtAsc` 查表
3. 转 `items[]` 返回，HTTP 200

#### 5.3 删除体重

**要达成什么**：只能删自己的记录。

**需要什么**：Path 参数 `id`。

**做法**：
1. `findById(id)` → 不存在 404
2. 比对 `record.userId == 当前userId` → 不等 403
3. `delete(record)`

#### 5.4 非法体重 `AC-002-07`

**要达成什么**：value ≤ 0 → 400，不写库。

**做法**：`@Valid` 在 Controller 层拦截，Service 不执行。

#### 5.5 验收

| AC | 测法 |
|----|------|
| AC-002-01 | POST 合法 → 201 + id |
| AC-002-02 | 插 2 条 → GET from/to → 升序 |
| AC-002-07 | POST value=-1 → 400 |

---

## 六、异常与边界

| 场景 | 处理方式 |
|------|----------|
| value ≤ 0 / null | 400 `VALIDATION_ERROR` |
| from > to | 400 |
| 删除他人 id | 404 `NOT_FOUND`（不暴露存在性） |
| recordedAt 未来时间 | MVP 允许；可选校验 ≤ now+1d |
| 同秒多条 | 允许，列表全返回 |

---

## 七、技术选型与依赖

- JPA + 现有 Security
- 写法对齐：
  - `code-patterns-backend.md` §二：分层、`ApiResponse`、`@Valid`、写操作 `@Transactional`
  - 本任务完成后可 refresh §3.3「创建」模板
- 关键假设：Flyway 表已就绪
- humanTodo：无

---

## 八、REQ 验收对照

| AC ID | Then（来自 REQ） | test/ac 方法（规划名） |
|-------|------------------|------------------------|
| AC-002-01 | HTTP 201，返回记录 id | `ac002_01_createWeight` |
| AC-002-02 | HTTP 200，按时间升序列表 | `ac002_02_listWeight` |
| AC-002-07 | HTTP 400，`VALIDATION_ERROR` | `ac002_07_invalidWeight` |

---

## 九、实现结果

| AC ID | test/ac 方法 | L3 | 终端证据 |
|-------|--------------|-----|----------|
| AC-002-01 | ac002_01_createWeight | ⬜ | |
| AC-002-02 | ac002_02_listWeight | ⬜ | |
| AC-002-07 | ac002_07_invalidWeight | ⬜ | |
