# dev 构思范例（FE）

> ① 照此结构写；UID/UI/API **只链不抄**；布局默认链 UID，偏离才写差量。每步须有 **目的：**。

# [T-011] 记录录入页 — 构思 [FE]

- 任务：**T-011** · 端：**FE** · 档位：**标准**
- → [REQ-002](../requirements/REQ-002-健康记录与可视化.md) · [UID-003](../requirements/ui/UID-003-体重记录页.md) · [UI-003](../solution/contracts/UI-003-体重记录页.md) · [API-003](../solution/contracts/API-003-体重记录.md)
- depends_on：T-008/T-009 · BE T-004+ · 写法：`code-patterns-frontend` 资产索引

## 前置

- depends_on：BE T-004（体重 API 可用）；T-008（登录态注入 `services`）
- 运行条件：前端 dev server / 小程序工具可预览；已登录
- 前提假设：路由与 Tab 壳已按 UI-003 建好；本 T 只做录入页交互

## 必读（只链，打开即用）

| 用途 | 链接 | 本 T 用到什么 |
|------|------|---------------|
| 验收 | [REQ-002](../requirements/REQ-002-健康记录与可视化.md) | AC-002-01 / AC-002-07 |
| 布局 | [UID-003](../requirements/ui/UID-003-体重记录页.md) | 区域与交互（线框权威） |
| UI 增量 | [UI-003](../solution/contracts/UI-003-体重记录页.md) | 路由、组件树、API 绑定 |
| 字段 | [API-003](../solution/contracts/API-003-体重记录.md) | POST body 英文字段 |

## 范围

- **目标**：一页 Tab 提交体重/饮食/运动；成功可回首页见数据
- **必须**：三 Tab；字段对齐 API；校验失败本地提示；400 展示 message
- **不做**：历史编辑删除 UI、食物搜索、定制日期控件

## 契约

→ 布局权威 [UID-003](../requirements/ui/UID-003-体重记录页.md)  
→ 技术增量 [UI-003](../solution/contracts/UI-003-体重记录页.md)  
→ 字段权威 [API-003](../solution/contracts/API-003-体重记录.md)（映射表只写**英文键名**）

### 布局

→ [UID-003](../requirements/ui/UID-003-体重记录页.md)（禁止粘贴整图；本 T 无布局差量）

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

#### Tab 保态 — 目的：切 Tab 不丢未提交表单 `RecordPage`

- 引用：UID-003 §交互 · UI-003 组件树
- 做：`activeTab` + 三套 form；切 Tab **不清空**；`RecordForm` 受控
- 完成标志：切走再切回字段仍在

#### 体重提交 — 目的：按映射调 API 并给出成功反馈 `recordService.createWeight`

- 引用：API-003 POST · AC-002-01 · 映射表
- 做：组装 `{ value, unit, recordedAt }` → toast；可读 `res.data.id`
- 完成标志：成功 toast；网络面板见 201

#### 防连点与非法值 — 目的：避免重复提交与脏请求 `RecordForm.submit`

- 引用：AC-002-07
- 做：`submitting` 锁按钮；`value<=0` 本地 toast 不发请求
- 完成标志：连点仅一次请求；非法值无网络调用

## AC

| AC | Then | 测法 |
|----|------|------|
| AC-002-01 | 体重成功 | BE 自动化 + FE 联调 |
| AC-002-07 | 非法拦截 | FE 人工 |

## 结果

| AC | 证据 |
|----|------|
| … | ③ 填：编译/构建 + 启前端 + 冒烟/联调 PASS |
