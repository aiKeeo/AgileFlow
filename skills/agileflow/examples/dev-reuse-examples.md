# dev 构思 · 流程拆解 + 接现有代码（详细例子）

> **主形态（标准 / 完整，含 AI 自主）**：**流程表**——动作 / 输入→输出 / 注意点（含落点）。  
> **精简档**：可缩成一行 **改**。  
> **规则**：每步能看出系统怎么走；注意点里点明继续走 / 在…上加 / 照… / 新写哪份代码。  
> `AF_DECIDE=ai` **不减**拆解厚度——完整档算法/链路照样走复杂流程表。  
> 正式范例：[dev-exemplar-BE](dev-exemplar-BE.md) · [dev-exemplar-FE](dev-exemplar-FE.md)

---

## 写法约定（速查）

### 何时用哪种

| 档位 / 场景 | 步骤形态 |
|-------------|----------|
| **完整** / 多步算法·链路 / **AI 自主做复杂功能** | **流程表**（S1…Sn） |
| **标准** · 多步 CRUD / 跨层 | **流程表** 优先 |
| **精简** · 单点改配置/改一行 | 一行 **改** 即可 |

### 流程表（推荐）

```markdown
## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | … | a → b | 继续走 `JwtFilter` — … |
| **S2** | … | … | 在 `XxxService` 上加 `foo` — … |
```

注意点里五种说法：

| 说法 | 何时 |
|------|------|
| **继续走 / 不动** | 本步不改实现 |
| **在 X 上加** | 扩展现有类/文件 |
| **直接用** | 组件/工具零改动引用 |
| **照 Y 那套** | 对齐邻居页/同文件模式 |
| **新写** | 无合适落点（半句原因） |

摘要 **做** 用分号串起整体接法，例如：`扩 Service；Controller 不动；Mapper 补查询`。

### 精简档一行

```markdown
#### 1. 调过期
- **改**：改 `application.yml` 的 `jwt.expiration` — 不动 Filter
```

---

## 旗舰例 · 完整档 / AI 自主也可：减脂走势预测

**场景**：多步计算链路；用户说「你定」也不许压成两句空话。

```markdown
# [T-015-BE] 减脂走势预测 — 构思 [BE]

- 档位：完整 · depends_on：T-002, T-004, T-005
- → F-015 · API-015 · 写法：p1-backend

## 摘要

- **本 T**：按历史净卡路里推算未来减重与到目标日。
- **做**：新写 `PredictionService` 串「窗口→日均净卡→缺口→脂肪换算→预测」；入口挂现有 `DashboardController`；鉴权/BMR/身高继续走 JwtFilter + Goal/User 已有能力。
- **不做**：前端图表、改 BMR 公式、改饮食/运动录入。
- **上游**：F-015 · API-015 · 饮食/目标/JWT 已就绪。
- **AC**：AC-015-01～04。

## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | 获取用户身份 | token → `user_id` | 继续走 `JwtFilter` + `UserContext` — 本 T 不重写登录 |
| **S2** | 圈定时间窗口 | 近 7/30/90 天 → `start_date, end_date` | 默认 30 天；校验写在挂到 `DashboardController` 的新接口上 |
| **S3** | 查询日均净卡路里 | user_id + 区间 → `avg_daily_net_calorie` | 净卡=摄入−运动；复用饮食/运动汇总查询，不平行造统计 SQL |
| **S4** | 计算热量缺口 | 日均净卡 + BMR → `daily_deficit` | BMR **读**目标模块已有计算，不复制公式；净卡>BMR→增重要在响应里表达 |
| **S5** | 换算脂肪重量 | daily_deficit → `estimated_daily_fat_loss_kg` | 在 `PredictionService` 内用常量 7700 kcal≈1kg + 注释依据 |
| **S6** | 推算未来走势 | 日均脂肪 × 天数 → `predicted_weight_loss_kg` | 输出 7/30/90 三档；目标体重读现有 `Goal` |
| **S7** | 组装响应 | → 预测减重 / 到目标日 / 置信度 | 样本<7 天「低」，≥30 天「高」；包装走现有 `Result` |

## 结果

| 项 | 证据 |
|----|------|
| 编译/冒烟 | mvn package ✅ · GET 预测接口 30 天窗口返回三档+置信度 ✅ |
```

---

## 一、brownfield · 流程表

### 1 · BE：体重同日覆盖

```markdown
# [T-003-BE] 体重同日覆盖 — 构思 [BE]

- 档位：标准 · depends_on：T-002
- → F-002 · API-002 · 写法：p1-backend

## 摘要

- **本 T**：同日再提交体重则覆盖当日记录。
- **做**：扩 `WeightRecordService`；`WeightRecordController` 不动；`WeightRecordMapper` 补按日查询。
- **不做**：趋势、前端、鉴权。
- **上游**：F-002 · API-002 · depends_on T-002。
- **AC**：AC-002-01、AC-002-02。

## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | 接收写入请求 | body(weightKg,date) → 入参校验通过 | 继续走 `WeightRecordController.create()` — 路由/入参不变 |
| **S2** | 查当日是否已有记录 | userId+date → 已有记录或空 | 在 `WeightRecordMapper` 上加 `selectByUserAndDate` — 现有仅有分页列表 |
| **S3** | 覆盖或插入 | 请求 + 查得结果 → 库中当日仅一条 | 在 `WeightRecordService` 上加 `createOrReplace` — 同日 update，异日 insert |

## 结果

| 项 | 证据 |
|----|------|
| 编译/冒烟 | mvn package ✅ · 同日 POST 两次库中 1 行 ✅ |
```

---

### 2 · BE：新接口挂老 Controller

```markdown
# [T-004-BE] 饮食当日汇总 — 构思 [BE]

- 档位：标准 · depends_on：T-003
- → F-003 · API-003 · 写法：p1-backend

## 摘要

- **本 T**：返回当日饮食列表 + 总热量。
- **做**：在 `DietRecordController` / `DietRecordService` 上加 today；鉴权继续走 JwtFilter。
- **不做**：添加饮食、前端。
- **上游**：F-003 · depends_on T-003。
- **AC**：AC-003-02、AC-003-05。

## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | 取当前用户 | token → user_id | 继续走 `JwtFilter` + `UserContext` |
| **S2** | 查当日饮食 | userId+today → 记录列表 | 在 `DietRecordService` 上加 `listTodayWithTotal` — 内部调已有 Mapper，不新 Repository |
| **S3** | 汇总热量并返回 | 列表 → `{records, totalCalories}` | 在 `DietRecordController` 上加 `GET /api/diet/today` — 累加写在 Service，不新 Util |

## 结果

| 项 | 证据 |
|----|------|
| 编译/冒烟 | GET /api/diet/today ✅ |
```

---

### 3 · BE：横切不动，新业务模块

```markdown
# [T-005-BE] 目标管理 API — 构思 [BE]

- 档位：标准 · depends_on：T-002
- → F-004 · API-004 · 写法：p1-backend

## 摘要

- **本 T**：设置/查询目标，算 BMI 与建议热量。
- **做**：新写 Goal 入口与 Service；401/异常继续走 JwtFilter + GlobalExceptionHandler；身高读 `UserMapper`。
- **不做**：小程序页。
- **上游**：F-004 · depends_on T-002。
- **AC**：AC-004-01～05。

## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | 鉴权 | token → user_id | 继续走 `JwtFilter` — 本 T 不改 Filter |
| **S2** | 写入/读取目标 | GoalRequest → Goal | 新写 `GoalController` + `GoalService` + `GoalMapper` — 尚无 Goal 类；Mapper 照 `WeightRecordMapper` |
| **S3** | 算 BMI | 身高+体重 → BMI+分类 | 在 `GoalService` 调已有 `UserMapper.selectById` — 不复制 User 查询 |
| **S4** | 错误包装 | BizException → 统一 JSON | 继续走 `GlobalExceptionHandler` + `BizException` |

## 结果

| 项 | 证据 |
|----|------|
| 编译/冒烟 | POST/GET goal ✅ · 无 token→401 ✅ |
```

---

### 4 · FE：接组件 + 照邻居

```markdown
# [T-010-FE] 饮食当日列表 — 构思 [FE]

- 档位：标准 · depends_on：T-004-BE
- → F-003 · UI-003 · UID-003 · 写法：p1-frontend

## 摘要

- **本 T**：当日饮食列表 + 顶栏总热量。
- **做**：`api.ts` 照 weightApi；列表直接用 `RecordList`；汇总写本页；未登录检查照首页。
- **不做**：添加表单、趋势图。
- **上游**：F-003 · UI-003 · depends_on T-004-BE。
- **AC**：AC-003-02、AC-003-05。

## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | 校验登录 | token 有无 → 进页或跳登录 | `useDidShow` 照 `pages/index/index.tsx` 检查 `getToken()` — 不复制 AuthGuard |
| **S2** | 拉当日数据 | — → today DTO | 在 `services/api.ts` 加 `dietApi.today`，写法照 `weightApi.list`；走现有 `request()` |
| **S3** | 渲染列表 | records → 列表 UI | `pages/diet/index` 直接用 `components/RecordList` — 不复制列表 |
| **S4** | 顶栏热量 | totalCalories → 汇总条 | 在本页加汇总条 — 无 Summary 组件；体重页卡片样式不硬套 |

## 结果

| 项 | 证据 |
|----|------|
| 构建/冒烟 | build:weapp ✅ · 3 条+顶栏热量 ✅ |
```

---

### 5 · FE：照隔壁页做表单

```markdown
# [T-011-FE] 饮食添加表单 — 构思 [FE]

- 档位：标准 · depends_on：T-010-FE
- → F-003 · UI-003 · 写法：p1-frontend

## 摘要

- **本 T**：添加一条饮食记录。
- **做**：表单区照 `pages/weight/index`；字段/API 换 diet；不新建 DietForm 组件。
- **不做**：列表（T-010 已做）。
- **上游**：F-003 · depends_on T-010-FE。
- **AC**：AC-003-01。

## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | 搭表单骨架 | — → header/list/form 三区 | 在 `pages/diet/index.tsx` 照 `pages/weight/index.tsx` 拆区 — 不新建 Layout 组件 |
| **S2** | 绑定字段 | 用户输入 → mealType/foodName/calories | Picker/Input 用法照 weight；只换字段名 |
| **S3** | 提交入库 | 表单 → API 成功/toast | 照 weight 的 `handleSave` 调 `dietApi.add` |

## 结果

| 项 | 证据 |
|----|------|
| 构建/冒烟 | 添加一条后列表+汇总更新 ✅ |
```

---

## 二、greenfield

### 6 · 首 T 新写

```markdown
# [T-001-BE] 微信登录 — 构思 [BE]

- 档位：标准 · depends_on：无
- → F-001 · API-001 · 写法：code-patterns-backend（🌱）

## 摘要

- **本 T**：code → openid → JWT。
- **做**：新写 Auth 骨架（已查锚点🌱空 + `backend/src` 无登录类）；③ 后回写资产索引。
- **不做**：小程序页、刷新 token。
- **上游**：F-001 · API-001。
- **AC**：AC-001-01～04。

## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | 收登录 code | body.code → 校验非空 | 新写 `AuthController.login` — 尚无任何 Controller |
| **S2** | 换 openid 并发 JWT | code → token + user | 新写 `AuthService.login` + `JwtUtil` — 无现成 Security 可接 |
| **S3** | 用户落库 | openid → User 行 | 新写 `UserMapper` 查重 insert — 首个实体，照 architecture MyBatis-Plus 约定 |

## 结果

| 项 | 证据 |
|----|------|
| 编译/冒烟 | POST /api/auth/login → 200+token ✅ |
```

---

### 7 · 第二 T：在 T-001 上扩

```markdown
# [T-002-BE] 用户资料读写 — 构思 [BE]

- 档位：标准 · depends_on：T-001
- → F-001 · API-001 · 写法：code-patterns-backend

## 摘要

- **本 T**：读/改 profile。
- **做**：在 T-001 的 `UserController` / `UserService` 上加接口；不新写 ProfileController。
- **不做**：换票、小程序页。
- **上游**：depends_on T-001。
- **AC**：AC-001-03、AC-001-04。

## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | 鉴权 | token → user_id | 继续走 T-001 `JwtFilter` |
| **S2** | 读资料 | user_id → profile DTO | 在 `UserController` 上加 `GET /api/user/profile` |
| **S3** | 改资料 | body → 更新后 profile | 在 `UserService` 上加 `updateProfile` — 复用 T-001 `UserMapper` |

## 结果

| 项 | 证据 |
|----|------|
| 编译/冒烟 | GET/PUT profile ✅ · 无 token→401 ✅ |
```

---

## 三、档位

### 8 · 精简档：一行 **改**

```markdown
# [T-020-BE] JWT 过期调至 14 天 — 构思 [BE]

- 档位：精简 · depends_on：T-001

## 摘要

- **本 T**：JWT 7 天 → 14 天。
- **做**：只动配置与 `JwtUtil` 读配置；Filter/Controller 不动。
- **不做**：刷新 token、前端。
- **上游**：T-001。
- **AC**：AC-001-02。

## 步骤

#### 1. 调过期

- **改**：改 `application.yml` 的 `jwt.expiration` 和 `JwtUtil` 读配置处 — 不动 `JwtFilter`

## 结果

| 项 | 证据 |
|----|------|
| 编译/冒烟 | token exp=14 天 ✅ |
```

---

### 9 · 完整档：通知已读（流程表）

```markdown
# [T-008-BE] 通知已读 API — 构思 [BE]

- 档位：完整 · depends_on：T-002
- → F-008 · API-008 · 写法：code-patterns-backend

## 摘要

- **本 T**：单条通知标记已读。
- **做**：新写通知入口与 Service；401 走全局鉴权；404/幂等在 Service。
- **不做**：列表 GET、推送、小程序。
- **上游**：F-008 · API-008 · depends_on T-002。
- **AC**：AC-008-01、03、04、05。

## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | 收 PATCH | id + token → 进入业务 | 新写 `NotificationController.markRead` — 模块首接口；401 由 `JwtFilter` 挡 |
| **S2** | 按 id 查 | id → 通知实体或空 | `NotificationMapper.findById` — 空→404 |
| **S3** | 校验归属 | 通知 + userId → 通过/拒绝 | 在 `NotificationService` 上加 `assertOwner` — 非本人当 404 |
| **S4** | 标记已读 | 通知 → isRead=true | 在 `NotificationService.markRead` — 已读再 PATCH 仍 200 |

## 结果

| 项 | 证据 |
|----|------|
| 编译/冒烟 | PATCH 未读→200 · 重复→200 · 他人→404 ✅ |
```

---

### 10 · FE 完整档：通知列表已读

```markdown
# [T-008-FE] 通知列表已读 — 构思 [FE]

- 档位：完整 · depends_on：T-008-BE
- → F-008 · UI-008 · UID-008 · 写法：code-patterns-frontend

## 摘要

- **本 T**：列表、标记已读、角标。
- **做**：扩列表页与 Item；API 照现有 PATCH；不复制第二份 Item。
- **不做**：推送、后端。
- **上游**：UI-008 · depends_on T-008-BE。
- **AC**：AC-008-01～03。

## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | 渲染列表与未读 | 列表数据 → 圆点+角标 | 在 `NotificationListPage` 按 UID-008 — 有现成 Badge 则直接用 |
| **S2** | 调已读接口 | id → 200 | 在 `services/api.ts` 照其他 PATCH 加 `markRead` |
| **S3** | 绑按钮减角标 | 点击 → 本地 isRead + 角标-1 | 在 `NotificationItem` 上加 `onMarkRead` — 不另建 HOC |
| **S4** | 防连点 | submitting → 忽略重复点 | 在 `NotificationItem` 加锁 — 已读再点不 toast |

## 结果

| 项 | 证据 |
|----|------|
| 构建/联调 | 3 未读→标 1→角标 2 ✅ |
```

---

## 四、反例对照

| # | ❌ | 问题 | ✅ |
|---|----|------|-----|
| 1 | 只有「实现预测接口」两句 | AI 自主时空跑 | 用 S1–S7 流程表 |
| 2 | `WeightServiceImpl.save()` 无路径 | 平行造轮 | 注意点写在 `WeightRecordService` 上加… |
| 3 | 新建 diet 页不提 weight | 无视邻居 | 照 `pages/weight/index` |
| 4 | 新写 RequestUtil | 无视 request.ts | api.ts 照 weightApi |
| 5 | **做** 只写业务不写接法 | 看不出下手处 | **做** 里「扩谁；谁不动；照谁」 |
| 6 | 流程表注意点无 \`path\` | 闸门不过 | 每行注意点带落点 |

---

## 五、写码前自检

1. **做** 能否列出将动到的已有路径？
2. 每个 S 的注意点是否有落点（或「新写」+原因）？
3. 完整档 / 算法链路是否用了流程表（未因 `ai` 压成两句）？
4. 是否已读本端写法锚点？

---

## 相关文档

| 文档 | 用途 |
|------|------|
| [dev-rationale.md](../templates/dev-rationale.md) | 正式模板 |
| [dev-exemplar-BE](dev-exemplar-BE.md) / [FE](dev-exemplar-FE.md) | 闸门范例 |
| [dev-quickstart.md](../templates/dev-quickstart.md) | 闸门检查 |
| [code-conventions.md](../templates/code-conventions.md) | 资产索引 |
