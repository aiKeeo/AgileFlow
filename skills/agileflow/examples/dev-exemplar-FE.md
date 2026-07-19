# dev 构思范例（FE/MP）

> ① FE/MP 用 **叙述五段式**：摘要 + 主流程 + 边界 + 实现说明 + 结果。  
> 字段绑定 **只看 contracts/UI**，dev 内禁止映射表。  
> 颗粒度 → [dev-granularity.md](../templates/dev-granularity.md) · 更多例子 → [dev-reuse-examples.md](dev-reuse-examples.md)

# [T-007-MP] 减脂周计划生成与打卡对照 — 构思 [MP]

- 档位：标准 · depends_on：T-003
- → [F-006](../solution/features/F-006-减脂计划.md) · [API-006](../solution/contracts/API-006-减脂计划服务.md) · [UI-006](../solution/contracts/UI-006-减脂计划页.md) · [UID-006](../requirements/ui/UID-006-减脂计划.md) · 写法：code-patterns-miniprogram

## 摘要

- **本 T**：进计划页可查看/生成本周 7 日建议，含今日高亮与饮食/运动打卡对照
- **做**：新写 pages/plan + planService + planRepository + 单测；改动 date.js / app.json；复用 goal/diet/exercise
- **不做**：进度/提醒/首页（T-006/T-008/T-009）；改 goal/diet/exercise 既有语义
- **上游**：F-006 · API-006 · UI-006 · depends_on T-003
- **AC**：AC-006-01～06

## 主流程

> 入口：用户进入计划页

1. 用户打开计划页 → `onShow()` → `loadPlan()` → `planService.getActivePlan()`
2. 有 plan → 展示 `plan-week-list`（7 日 + 今日高亮）+ `today-compare`（建议 vs 打卡）
3. 用户点「生成计划」→ `onGenerate()` → `planService.generateWeekPlan()`
4. 成功 → 再 `loadPlan()` 刷新 → 展示 `disclaimer-text`

## 边界

- **空态**：第 2 步 plan=null → 空态 + 生成按钮（仍可从第 3 步走）
- **未设目标**：第 3 步 PRECONDITION_FAILED → 展示 `need-goal-guide` → 点「先设目标」→ `onGoGoal()` 跳 `/pages/goal/index`
- **覆盖已有计划**：第 3 步 CONFLICT → `wx.showModal` → 确认后 `confirmReplace:true` 再生成
- **连点**：`onGenerate` 内 `if (generating) return`
- **单测**：`test/planService.test.js` 覆盖 AC-006（非 UI 路径）

## 实现说明

### `miniprogram/pages/plan/index.js` 【新写】

- **目的**：计划页控制器，承接 UI-006 全部交互
- **做什么**：`onShow` / `loadPlan` / `onGenerate` / `onGoGoal`
- **怎么做**：
  1. `onShow` → 调 `loadPlan()`
  2. `loadPlan` → `getActivePlan()` → `setData` 绑列表/对照/空态
  3. `onGenerate` → `generateWeekPlan({ confirmReplace:false })` → 成功再 `loadPlan()`
  4. `onGoGoal` → `wx.navigateTo({ url:'/pages/goal/index' })`
  5. 边界分支见下块

### `miniprogram/pages/plan/index.wxml` 【新写】

- **目的**：按 UI-006 组件树渲染
- **做什么**：`plan-actions` / `plan-week-list` / `today-compare` / `disclaimer-text` / `need-goal-guide`
- **怎么做**：字段绑定见 [UI-006 §字段绑定](../solution/contracts/UI-006-减脂计划页.md#字段绑定)；按钮 `bindtap="onGenerate"`

### `miniprogram/services/planService.js` 【新写】

- **目的**：读 active 计划、生成 7 日建议、拼今日对照
- **做什么**：`getActivePlan()`、`generateWeekPlan({ confirmReplace })`
- **怎么做 — getActivePlan**：
  1. `planRepository.findActiveByUserId()`
  2. 无 plan → 返回 null 结构
  3. 有 plan → 取 todayItem；只读调 diet/exercise 日汇总拼 `todayCompare`
- **怎么做 — generateWeekPlan**：
  1. `goalService.getActiveGoal()` → 无 → throw PRECONDITION_FAILED
  2. 有 active 且 !confirmReplace → throw CONFLICT
  3. 读最新体重；算法见 [API-006](../solution/contracts/API-006-减脂计划服务.md#简化算法mvp)
  4. `date.weekDatesMonToSun(today)` 得 7 日；组装 plan → `planRepository.saveAll()`

### `miniprogram/repositories/planRepository.js` 【新写】

- **目的**：计划本地持久化
- **做什么**：`findActiveByUserId` / `saveAll`
- **怎么做**：键 `af.fatLossPlans`；active 唯一；替换时旧 plan 标 superseded

### `miniprogram/utils/date.js` 【改动】

- **目的**：自然周（周一～日）生成
- **做什么**：加 `weekStartMonday`、`weekDatesMonToSun`
- **怎么做**：复用已有 `addDaysLocal`

### `miniprogram/app.json` 【改动】

- **目的**：注册计划页路由
- **做什么**：`pages` 追加 `"pages/plan/index"`

### `onGenerate` 边界分支 【新写 · 写在 index.js】

- **目的**：处理 CONFLICT / PRECONDITION_FAILED / 其他错误
- **怎么做**：
  1. PRECONDITION_FAILED → `setData({ showNeedGoal:true })`
  2. CONFLICT → modal 确认 → `confirmReplace:true` 再调
  3. 其他 → toast；finally `generating=false`

### `goalService.getActiveGoal` 【复用】

- **目的**：生成前置 — 必须有目标
- **本 T 怎么用**：`generateWeekPlan` 第 1 步只读
- **本 T 不改**

### `test/planService.test.js` 【新写】

- **目的**：AC-006 可重复验收
- **做什么**：6 cases 对应 AC-006-01～06

## 结果

| 项 | 证据 |
|----|------|
| 编译构建 | pages/plan 四件套 + planService + planRepository |
| 能启能调 | DevTools：进页 → 生成 → 7 日行 + 对照 |
| UT | `npm test` → exit 0 |

### AC 映射

| AC ID | unit | ac | 人工 |
|-------|------|-----|------|
| AC-006-01 | `test/planService.test.js` · `generateWeekPlan_withGoal_creates7Days` | — | — |
| AC-006-02 | 同上 · `generateWeekPlan_withoutGoal_preconditionFailed` | — | — |
| AC-006-03 | 同上 · `getActivePlan_showsWeekAndToday` | DevTools 计划页 | 可选 |
| AC-006-04 | 同上 · `generateWeekPlan_replace_supersedesPrevious` | — | — |
| AC-006-05 | 同上 · `getActivePlan_todayCompare_withCheckIns` | DevTools 对照区 | 可选 |
| AC-006-06 | 同上 · `generateWeekPlan_calorieRange_valid` | — | — |
