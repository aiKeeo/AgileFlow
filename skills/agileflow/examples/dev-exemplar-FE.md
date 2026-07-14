# dev 构思范例（FE）

> ① 照此结构写；UID/UI/API **只链不抄**；布局图与映射是 FE 增量。

# [T-011] 记录录入页 — 构思 [FE]

- 任务：**T-011** · 端：**FE** · 档位：**标准**
- → [REQ-002](../requirements/REQ-002-健康记录与可视化.md) · [UID-003](../requirements/ui/UID-003-体重记录页.md) · [UI-003](../solution/contracts/UI-003-体重记录页.md) · [API-003](../solution/contracts/API-003-体重记录.md)
- depends_on：T-008/T-009 · BE T-004+ · 写法：`code-patterns-frontend` 资产索引

## 范围

- **目标**：一页 Tab 提交体重/饮食/运动；成功可回首页见数据
- **必须**：三 Tab；字段对齐 API；校验失败本地提示；400 展示 message
- **不做**：历史编辑删除 UI、食物搜索、定制日期控件

## 契约

→ 布局权威 [UID-003](../requirements/ui/UID-003-体重记录页.md) · [UI-003](../solution/contracts/UI-003-体重记录页.md)  
→ 字段权威 [API-003/004/005](../solution/contracts/)（映射表只写**英文键名**）

### 布局

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

### 复用

| 区域 | 资产 | 决策 |
|------|------|------|
| Tab | `components/Segmented.tsx` | 复用 |
| 数字输入 | 无 | 用 Taro Input |
| 保存 | 无 | 基础 Button |

### 映射

| UI | API | 字段 | 方向 |
|----|-----|------|------|
| NumberInput | API-003 POST | `value` | body |
| Picker | API-003 POST | `unit` | body |
| DateTimePicker | API-003 POST | `recordedAt` | body |

饮食/运动 → 同表格式链 API-004/005，勿再贴长表。

### 调用

| Tab | 方法 | 路径 | Body |
|-----|------|------|------|
| 体重 | POST | `/api/v1/records/weight` | `value,unit?,recordedAt` |

统一走 `services/record.ts`，禁止页内裸 request。

## 做法

#### Tab 保态

1. `RecordPage`：`activeTab` + 三套 form；切 Tab **不清空**
2. `RecordForm` 受控：`type` + form + `onChange`

#### 体重提交 `AC-002-01`

1. 按映射组装 `{ value, unit, recordedAt }`
2. `recordService.createWeight` → toast；可读 `res.data.id`

#### 防连点 `AC-002-07`

1. `submitting` 锁按钮；`value<=0` 本地 toast 不发请求

## AC

| AC | Then | 测法 |
|----|------|------|
| AC-002-01 | 体重成功 | BE 自动化 + FE 联调 |
| AC-002-07 | 非法拦截 | FE 人工 |

## 结果

| AC | 证据 |
|----|------|
| … | ③ 填：编译/构建 + 启前端 + 冒烟/联调 PASS |
