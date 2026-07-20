# dev 颗粒度 SSOT（全端 · 唯一质量线）

> **没有精简档 / 标准档。** 每个 T 一律按完整质量写。  
> `AF_FLOW=fast` / `AF_DECIDE=ai` **不减**厚度——要快只能并发，不能薄写。  
> 完整范例：[dev-exemplar-FE](../examples/dev-exemplar-FE.md) · [dev-exemplar-BE](../examples/dev-exemplar-BE.md) · [dev-reuse-examples](../examples/dev-reuse-examples.md)

---

## 0. 一句话

构思文件要让**另一个 Agent / 人**不看聊天，就能按文件写码、按边界处理错误、按 AC 验收。  
过闸门 ≠ 够厚——闸门验「硬字段」；本文件定义「写到什么颗粒度才算完整」。

---

## 1. 五段结构（全端统一）

| 段 | 回答什么 | 读者拿它做什么 |
|----|----------|----------------|
| **摘要** | 本 T 是谁、做/不做、上游、验哪些 AC | 3 秒定位范围，防蔓延 |
| **主流程** | happy path 怎么从入口走到成功 | 写码时的主干顺序 |
| **边界** | 哪一步拦、拦了怎么办 | 错误码 / 空态 / 防连点 |
| **实现说明** | 每个文件/类具体怎么写 | ② 写码的唯一落点清单 |
| **结果** | 真跑过的命令与 AC 映射 | 勾 ③ 的证据 |

**FE/MP** 主流程主语：用户动作 → `method()`。  
**BE** 主流程主语：请求/回调 → `Controller` → `Service` → 返回/落库。

**禁止**：`## 步骤`、`## 范围`、`## 做法`、8 字段原子表、dev 内字段映射表、粘贴大段 JSON。

---

## 2. 摘要 — 解释 + few-shot

### 这段干什么

把「本 T 的合同边界」写死：做什么、不做什么、靠谁、验什么。  
**做**是一行索引（指向后面实现说明会展开的类/文件），不是空话。

### 硬规则

- 五条 bullet 齐：`本 T` / `做` / `不做` / `上游` / `AC`
- 冒号后有实质（禁止 `- **做**：…` 空占位）
- BE 链 API-xxx；FE/MP 链 UI-xxx（+UID）；调 API 时也要链 UI

### ❌ 坏

```markdown
## 摘要
- **本 T**：实现登录
- **做**：写前后端
- **不做**：其他
- **上游**：需求
- **AC**：登录相关
```

### ✅ 好（BE）

```markdown
## 摘要
- **本 T**：F-001 后端切片；落地账号密码登录接口
- **做**：新写 `AuthController` / `AuthService` / `JwtUtil`；单测 AC-001-01～03
- **不做**：注册、第三方登录、前端登录页（T-002）
- **上游**：F-001 · API-001 · depends_on 无
- **AC**：AC-001-01、AC-001-02、AC-001-03
```

### ✅ 好（FE/MP）

```markdown
## 摘要
- **本 T**：F-001 小程序切片；登录页完成提交、存 token、失败 toast
- **做**：新写 `pages/login` + `services/auth`；复用 `http`；单测 AC-001-04～06
- **不做**：后端校验、注册页、dev 内字段映射表
- **上游**：UI-001 · UID-001 · API-001 · depends_on T-001
- **AC**：AC-001-04、AC-001-05、AC-001-06
```

---

## 3. 主流程 — 解释 + few-shot

### 这段干什么

只写 **happy path**：从入口事件到成功结果的主干。  
异常不写在这里——丢进「边界」。一步 = 一个可观察节点（用户动作或请求链编排节点）。

### 硬规则

| 项 | 要求 |
|----|------|
| 入口 | 首行必须 `> 入口：…` |
| 步数 | **3～8** 条编号步骤（完整质量） |
| 一步 | FE：一个用户动作；BE：请求链上一次编排 |
| 落点 | 步骤里须出现 `` `handler()` `` / `` `Service.method` `` / `` `path/` `` |
| 禁止 | 从 repository 写起当主流程；mermaid；字段映射表 |

### ❌ 坏

```markdown
## 主流程
实现登录功能，校验密码后返回 token。
```

### ✅ 好（BE）

```markdown
## 主流程

> 入口：POST /api/login（API-001）

1. 请求进入 → `AuthController.login()` → DTO 非空校验
2. 参数有效 → `AuthService.verifyPassword()` → 通过/拒绝
3. 校验通过 → `JwtUtil.sign(userId)` → 200 返回 token（AC-001-01）
```

### ✅ 好（FE/MP）

```markdown
## 主流程

> 入口：用户在登录页点「登录」

1. 用户打开登录页 → 渲染 phone/password + 登录按钮
2. 用户输入账号密码
3. 用户点「登录」→ `handleSubmit()` → 前端校验
4. 校验通过 → `authService.login()` → 存 token → `reLaunch` 首页（AC-001-05）
```

---

## 4. 边界 — 解释 + few-shot

### 这段干什么

把「不走 happy path」的情况钉死：在**第几步**拦截、返回什么错误码 / UI 态。  
写码时对照这里补 `if`，测 AC 时对照这里断言。

### 硬规则

| 项 | 要求 |
|----|------|
| 条数 | **≥2** 条（完整质量） |
| 格式 | `- **场景名**：第 N 步 …` 或 `- **场景名**：\`handler\` 内 …` |
| 挂钩 | 必须能挂回主流程步骤号或具体 method |
| 内容 | 空态 / 401 / 400xx / 幂等 / 库存 / 连点 等各写清「怎么处理」 |

### ❌ 坏

```markdown
## 边界
- 注意错误处理
- 要防连点
```

### ✅ 好（BE）

```markdown
## 边界

- **参数缺失**：第 1 步 → 400（AC-001-03）
- **密码错误**：第 2 步 → 401，不签发 token（AC-001-02）
- **用户不存在**：第 2 步 → 401（与错密同码，防枚举）
```

### ✅ 好（FE/MP）

```markdown
## 边界

- **空提交**：第 3 步 phone/password 空 → toast，不调 API（AC-001-04）
- **错密码**：第 4 步 401 → toast，不跳转（AC-001-06）
- **连点**：第 3 步 `if (submitting) return`；按钮 loading
```

---

## 5. 实现说明 — 解释 + few-shot

### 这段干什么

**② 写码只允许改这里列出的【新写】【改动】落点。**  
每个块回答：为什么有它、暴露什么方法、**按什么顺序 / 什么分支写**。

### 硬规则

| 项 | 要求 |
|----|------|
| 展开谁 | 主流程+边界里出现的 **【新写】【改动】** 全展开；【复用】可短写 |
| 块标题 | `### \`path/或Class\` 【新写\|改动\|复用】` |
| 必含 | **目的** + **做什么** + **怎么做**（三者都要） |
| **怎么做（逻辑块）** | Service / Controller / page / Handler / Repository 等：**编号 ≥2**，且**至少一条编号步含「条件 → 动作」箭头**。禁止「1. 处理逻辑 2. 返回结果」假厚 |
| **怎么做（壳层块）** | 纯 wxml/json/css/Dto/module：可一行，但须说清绑什么 / 链 UI-xxx 或 API-xxx |
| **做 ↔ 实现说明** | 摘要「做」点名的类/路径，须在某个 `###` 标题中出现 |
| 落点 | 块内或标题须能定位到文件路径 |
| 禁止 | 「实现登录逻辑」这种一句糊弄；把算法 JSON 整段粘进 dev |

### ❌ 坏（编号假厚——同样禁止）

```markdown
### `AuthService.java` 【新写】
- **目的**：登录
- **做什么**：校验
- **怎么做**：
  1. 处理逻辑
  2. 返回结果
```

### ❌ 坏（一行糊弄——最常见偷懒）

```markdown
### `ProfileService.java` 【新写】
- **目的**：档案服务
- **做什么**：get / upsert
- **怎么做**：校验目标体重与日期后保存
```

### ✅ 好（BE · 逻辑块须编号）

```markdown
### `ProfileService.java` 【新写】

- **目的**：档案读与 upsert 编排 + 领域不变量
- **做什么**：`get(deviceUserId)` / `upsert(deviceUserId, writeDto)`
- **怎么做 — get**：
  1. `repo.findByDeviceUserId` → 空 → 抛 `40401`
  2. 有实体 → `mapper.toDto(entity, todayShanghai())` 返回
- **怎么做 — upsert**：
  1. `targetWeightKg >= currentWeightKg` → 抛 `40002`（AC-001-06）
  2. `targetDate <= today` → 抛 `40002`（AC-001-08）
  3. 无行 → insert；有行 → 覆盖提交字段
  4. 返回带 BMI / remainingKg / suggestedDailyLossKg 的 Dto（派生不入库）
- **落点**：`com.slimtrack.profile.ProfileService`
```

### ✅ 好（FE/MP · 页面须按 handler 拆）

```markdown
### `pages/profile/index.tsx` 【新写】

- **目的**：承接 UI-001 全部交互
- **做什么**：`loadProfile` / `onSave`
- **怎么做**：
  1. 进页 → `loadProfile()` → `profileService.getProfile()`
  2. 成功 → 表单回填 + 摘要区展示派生字段
  3. 40401 → 引导文案，表单仍可填
  4. 点保存 → `onSave()` → `putProfile(form)`；成功 Toast 并用响应刷新
  5. 40001/40002 → Toast `message`；`saving` 防连点
- **落点**：`miniprogram/src/pages/profile/index.tsx`
```

### ✅ 好（壳层可短，但要可执行）

```markdown
### `miniprogram/app.json` 【改动】

- **目的**：注册档案页路由
- **做什么**：`pages` 追加 `"pages/profile/index"`
- **怎么做**：按现有 pages 数组末尾追加，不改 tabBar 语义
```

### ✅ 好（【复用】短写）

```markdown
### `http` 【复用】

- **目的**：统一请求与设备头
- **本 T 怎么用**：profile service 全部走 http
- **本 T 不改**
```

---

## 6. 结果 — 解释 + few-shot

### 这段干什么

证明「能跑」：命令 + 真实输出片段（exit 0 / ✅ / PASS）+ AC 映射。  
① 构思阶段结果可空表头；勾 ③ 前必须填实。

### 硬规则

- 须有具体命令（禁止「测试已通过」）
- BE：AC 映射尽量落到 `test/unit` 路径
- FE：可用构建冒烟 + 人工/单测列

### ❌ 坏

```markdown
## 结果
全部测试通过。
```

### ✅ 好

```markdown
## 结果

| 检查项 | 命令 | 结果 |
|--------|------|------|
| 编译测试 | `cd backend && ./mvnw test` | Tests run: 30, Failures: 0；exit 0 ✅ |
| 冒烟 | `ProfileApiTest` MockMvc | PASS ✅ |

| AC ID | unit | ac | 人工 |
|-------|------|----|------|
| AC-001-02 | `…/ProfileApiTest.java` · `create_ok` | — | — |
| AC-001-06 | 同上 · `reject_target_ge_current` | — | — |
```

---

## 7. 「做」↔ 实现说明 对齐

```
主流程（组件/类 + 方法）
    ↓ 标注新写 / 改动 / 复用
摘要「做」（一行索引）
    ↓ 逐项展开
实现说明（目的 + 做什么 + 怎么做编号）
```

摘要里点名的类/文件，实现说明必须有对应 `###` 块。

---

## 8. T 拆分

| 原则 | 说明 |
|------|------|
| 一切口一 T | 1 T = 一个用户入口流程，或 BE 一个 API 切片 |
| 对齐 F/UI/API | 1 T ↔ 1 个 UI-xxx 或 1 个 API-xxx |
| 禁止合文件 | BE+FE 不得同文件；多 T 不得糅合 |

口诀：用户要不要换页面/换入口？换 → 新 T。

---

## 9. 写码约束

- ② Write ⊆ `## 实现说明` 中【新写】【改动】落点
- 勾 ① 前：摘要 + 主流程 + 边界 + 实现说明写满；仅 `## 结果` 可写码后填
- 接现有代码：注意点写清 **继续走 / 在…上加 / 照… / 新写**——禁止无视库存造轮子
