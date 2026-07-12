# dev 构思金标准（FE 示例）

> **权威颗粒度**：阶段 4 步骤 ① 须达到本文件水准。  
> 来源：真实落盘 dev 文档（T-011 记录录入页），**五** 已对齐 [dev-exemplar-BE.md](dev-exemplar-BE.md) 结构。新项目**照结构写**，内容换成本任务。

---

# [T-011] 记录录入页（体重/饮食/运动）— 构思落盘 [FE]

- 任务：**T-011**（唯一）
- 端：**FE**
- 功能：[F-002](../solution/features/F-002-健康记录与可视化.md) · [UID-003](../requirements/ui/UID-003-体重记录页.md) · [UI-003](../solution/contracts/UI-003-体重记录页.md)
- 关联 REQ：[REQ-002](../requirements/REQ-002-健康记录与可视化.md)
- depends_on：T-008（miniapp 初始化）、T-009（登录）、BE T-004/T-005/T-006
- 写法对齐：`code-patterns-frontend.md` §二 · §3.1 表单页（后续 §3.1 模板从此任务摘录）

---

## 一、需求理解（我理解的你要什么）

- **核心目标**：一个记录页用 Tab 切换，分别提交体重 / 饮食 / 运动，成功后可回首页看到数据变化。
- **必须满足**：
  - Tab：体重 | 饮食 | 运动
  - 各表单字段对齐 API-003/004/005
  - 校验失败本地提示；服务端 400 展示 `message`
  - 提交成功 toast + 可选跳转首页
- **明确不做**：
  - 历史列表编辑删除 UI（API 有 DELETE 可后续）
  - 食物搜索（手填）
  - 复杂日期时间选择器定制（用 Taro 默认 picker）

---

## 二、数据模型（页面状态）

> **state 字段名优先与 API Request/Response JSON 键名一致**（见 **三、映射表**）；便于全局搜索 `value`、`recordedAt` 等对账。

| 状态 | 类型（契约字段名） | 说明 |
|------|-------------------|------|
| activeTab | `'weight' \| 'diet' \| 'exercise'` | 当前 Tab（仅 UI，无 API 字段） |
| weightForm | `{ value, unit, recordedAt }` | 对齐 API-003 POST body |
| dietForm | `{ mealType, foodName, calories, recordedAt }` | 对齐 API-004 POST body |
| exerciseForm | `{ exerciseType, durationMin, burnedCalories, note, recordedAt }` | 对齐 API-005 POST body |
| submitting | `boolean` | 防重复提交 |

---

## 三、UI 布局与 API 字段映射

> **① 必建**。布局来自 [UID-003](../requirements/ui/UID-003-体重记录页.md) + [UI-003](../solution/contracts/UI-003-体重记录页.md)；**「契约字段」列必须与 `API-xxx` 入参/出参 JSON 键名完全一致（英文 camelCase）**，方便 `grep value` / `grep recordedAt` 对账。

### 3.1 布局组件（对齐 UI-xxx，禁止自造区块）

> **须含布局线条图**（ASCII，对齐 UID §2.2 / UI-xxx）；纯区域表不合格。

**布局线条图**：

```
┌──────────────────────────────┐
│  Tab: 体重 | 饮食 | 运动      │
├──────────────────────────────┤
│  [ NumberInput  value     ]  │
│  [ Picker        unit     ]  │
│  [ DateTimePicker recordedAt]│
│  [      保存按钮           ]  │
└──────────────────────────────┘
```

| UI 区域/组件 | 来源（UID/UI） |
|--------------|----------------|
| Tab：体重 \| 饮食 \| 运动 | UID-003 §2 顶区 |
| `RecordForm` 表单区 | UI-003 组件树 |
| 保存按钮 | UID-003 §3 SaveButton |

### 复用盘点（FE）

| 原型区域 | 控件类型 | 资产路径（抄自索引，无则「无」） | 决策 |
|----------|----------|----------------------------------|------|
| 顶 Tab | Tab/Segmented | `components/Segmented.tsx`（示例） | 复用 |
| 体重数字 | NumberInput | 无 | 新建：用 Taro Input，不另封业务组件 |
| 保存 | Button | 无 | 用基础 Button |

### 3.2 UI ↔ API 字段映射表（② 按表绑数据）

**体重 Tab** — [API-003](../solution/contracts/API-003-体重记录.md)

| UI 组件 | 界面展示/输入 | API | 契约字段（英文） | 方向 |
|---------|--------------|-----|------------------|------|
| `NumberInput` | 体重数值 | API-003 POST | `value` | req.body |
| `Picker` | 单位 kg/lb | API-003 POST | `unit` | req.body |
| `DateTimePicker` | 测量时间 | API-003 POST | `recordedAt` | req.body |
| 成功提示后缓存 | 记录 id | API-003 POST 201 | `id` | res.data |

**饮食 Tab** — API-004：`mealType` · `foodName` · `calories` · `recordedAt`（req.body，同上表格式）

**运动 Tab** — API-005：`exerciseType` · `durationMin` · `burnedCalories` · `note` · `recordedAt`（req.body）

**映射铁律**：

- **契约字段**列只写 API 文档里的**英文字段名**；禁止写「体重」「日期」等中文代替
- 禁止前端私自改名（如 API 是 `value` 却用 `weight`）；若必须转换，增列 **state 赋值**：``setValue(api.value)``
- 映射表每一行都要在 [API-xxx](../solution/contracts/) 找得到；对不上 → 先改契约或补 BE，再写 FE

### 3.3 接口调用清单

| Tab | 方法 | 路径 | Body 字段（英文，同映射表） |
|-----|------|------|----------------------------|
| 体重 | POST | `/api/v1/records/weight` | `value`, `unit?`, `recordedAt` |
| 饮食 | POST | `/api/v1/records/diet` | `mealType`, `foodName`, `calories`, `recordedAt` |
| 运动 | POST | `/api/v1/records/exercise` | `exerciseType`, `durationMin`, `burnedCalories`, `note?`, `recordedAt` |

对齐 [API-003/004/005](../solution/contracts/)。禁止页面内裸 `Taro.request`，统一走 `services/record.ts`。

---

## 四、状态机

```
[编辑中] --校验失败--> [编辑中]
[编辑中] --提交中--> [submitting]
[submitting] --201--> [成功 toast → 可切 Tab 或回首页]
[submitting] --失败--> [编辑中 + 错误提示]
```

---

## 五、核心流程

### 目的

让用户在**同一页**完成体重 / 饮食 / 运动三类录入，提交后首页仪表盘能读到新数据。  
做完后：体重 Tab 联调 BE T-004；饮食/运动联调 T-005/T-006；首页 T-010 可刷新展示。

---

### 需要什么（没有这些做不成）

| 类别 | 具体项 | 用来干什么 |
|------|--------|-----------|
| 前置任务 | T-008 路由与 request 封装 | 页面可挂载、带 token 请求 |
| 前置任务 | T-009 登录 | 未登录进页前守卫 |
| 前置任务 | BE T-004/005/006 | 三类 POST 接口 |
| UI 契约 | UID-003 + UI-003 | 布局与组件树 |
| API 契约 | API-003/004/005 | **三、映射表**字段来源 |
| 页面 | `pages/record/index.tsx` | Tab + 提交入口 |
| 组件 | `RecordForm` | 按 type 渲染字段 |
| Service | `services/record.ts` | createWeight / createDiet / createExercise |
| 状态 | weightForm / dietForm / exerciseForm / submitting | 分 Tab 保表单、防连点 |

---

### 怎么做

#### 5.1 Tab 切换与表单保态

**要达成什么**：三 Tab 切换时**不丢**已填内容。

**需要什么**：`activeTab` + 三套独立 form state。

**做法**：
1. `RecordPage` 用 `useState` 维护 `activeTab` 与三套 form
2. 顶部 `Tabs` / Segmented：`onChange` 只改 `activeTab`，**不清空** form
3. `RecordForm` 接收 `type` + 对应 form + `onChange`，受控更新

#### 5.2 体重录入 `AC-002-01`

**要达成什么**：填写合法体重 → POST 成功 → toast 提示。

**需要什么**：`weightForm.value > 0`；`recordedAt` 默认 ISO 字符串；POST body 键名见 **三、3.2**（`value` / `unit` / `recordedAt`）。

**做法**：
1. `RecordForm`（type=weight）按 UI-003 渲染 `NumberInput`→`value`、`Picker`→`unit`、`DateTimePicker`→`recordedAt`
2. `RecordPage.handleSubmitWeight`：校验 `value > 0`，组装 ``{ value, unit, recordedAt }``（**键名与 API-003 一致**）
3. `recordService.createWeight(body)` → `request.ts` 带 token
4. 成功：读 `res.data.id`；`Taro.showToast`；可选 `switchTab` 首页

#### 5.3 饮食录入 `AC-002-03`

**要达成什么**：mealType + 食物名 + 热量 → POST 成功。

**需要什么**：`dietForm` 必填 `mealType`、`foodName`、`calories > 0`（字段名同 API-004）。

**做法**：
1. `RecordForm`（type=diet）：四字段绑定映射表 `mealType` / `foodName` / `calories` / `recordedAt`
2. `handleSubmitDiet` 校验 → ``createDiet({ mealType, foodName, calories, recordedAt })``
3. 成功 toast；失败展示服务端 `message`

#### 5.4 运动录入 `AC-002-05`

**要达成什么**：类型 + 时长 + 消耗卡路里 → POST 成功。

**需要什么**：`exerciseType`、`durationMin > 0`、`burnedCalories > 0`；`note` 可选（API-005 字段名）。

**做法**：
1. `RecordForm`（type=exercise）绑定 `exerciseType` / `durationMin` / `burnedCalories` / `note` / `recordedAt`
2. `handleSubmitExercise` → ``createExercise({ exerciseType, durationMin, burnedCalories, note, recordedAt })``
3. 成功 toast

#### 5.5 防重复与非法值 `AC-002-07`

**要达成什么**：连点不重复提交；value ≤ 0 前端先拦，体验与 BE 400 一致。

**需要什么**：`submitting` 状态；各 Tab 本地校验规则。

**做法**：
1. 提交前 `if (submitting) return`；请求中 `setSubmitting(true)`，`finally` 复位
2. 保存按钮 `:disabled="submitting"`
3. 体重 `value <= 0`：本地 toast，不发请求（body 不含非法 `value`）

#### 5.6 services/record.ts 封装

**要达成什么**：页面零裸请求；三 POST 统一错误处理。

**需要什么**：`request.ts` 已封装 baseURL、Authorization、错误码。

**做法**：
1. `createWeight(body)` → POST `/records/weight`
2. `createDiet(body)` → POST `/records/diet`
3. `createExercise(body)` → POST `/records/exercise`
4. 抛出带 `message` 的错误供页面 toast

#### 5.7 验收

| AC | 测法 |
|----|------|
| AC-002-01 | 体重 Tab 合法提交 → toast；BE 自动化绿 |
| AC-002-03 | 饮食 Tab 合法提交 → 联调绿 |
| AC-002-05 | 运动 Tab 合法提交 → 联调绿 |
| AC-002-07 | 体重 value=-1 → 前端 toast，不发请求 |
| AC-002-08 | 录入后回首页可见新数据（FE 人工） |

---

## 六、异常与边界

| 场景 | 处理方式 |
|------|----------|
| 重复点击保存 | submitting 禁用按钮 |
| 非法数值 | 前端先拦，与 AC-002-07 一致 |
| 401 未登录 | 进页前守卫 → 跳转 login |
| 400 服务端校验 | toast 展示 `message` |
| 切换 Tab 中途 | 不丢 form；submitting 时禁止切换（可选） |

---

## 七、技术选型与依赖

- Taro + React Hooks
- 写法对齐：
  - `code-patterns-frontend.md` §二：页面/组件/service 分层、受控表单
  - 本任务完成后可 refresh §3.1「表单页」模板
- 关键假设：BE T-004/005/006 已部署联调环境
- humanTodo：H-002（视觉）、H-004（联调账号）

---

## 八、REQ 验收对照

| AC ID | Then（来自 REQ） | test/ac 方法（规划名） |
|-------|------------------|------------------------|
| AC-002-01 | 体重录入成功 | BE 自动化 + FE 人工联调 |
| AC-002-03 | 饮食录入成功 | 同上 |
| AC-002-05 | 运动录入成功 | 同上 |
| AC-002-07 | 非法体重前端拦截 | FE 人工 |
| AC-002-08 | 录入后首页可见 | FE 人工 |

---

## 九、实现结果

| AC ID | test/ac 方法 | L3 | 终端证据 |
|-------|--------------|-----|----------|
| AC-002-01 | ac002_01_createWeight（BE）+ 人工 | ⬜ | |
| AC-002-03 | 人工联调 | ⬜ | |
| AC-002-05 | 人工联调 | ⬜ | |
| AC-002-07 | 人工 | ⬜ | |
| AC-002-08 | 人工 | ⬜ | |
