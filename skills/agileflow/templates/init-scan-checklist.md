# init 扫描清单（brownfield 必读）

> **何时读**：`init:` 步骤 ② 扫描源码时 **逐步勾选**；AskQuestion 确认前 **落盘自检须全绿**。  
> 模板正文：[init-doc.md](init-doc.md) · 写法锚点：[code-conventions.md](code-conventions.md)

**原则**：每一节都要 **写满可执行的细节**（路径、行号、表名、API、业务句），禁止 `{…}`、`待补充` 占位后标 ✅。

---

## 步骤 1 · p0-business.md

| # | 必写节 | 最低要求 | 不合格示例 |
|---|--------|----------|--------------|
| B1 | 项目解决什么问题 | ≥1 句，含 **谁** + **解决什么痛点** | 「这是一个后端项目」 |
| B2 | 目标用户/角色 | ≥1 行，**来源**列填具体文件 | 空表 |
| B3 | 核心业务场景 | ≥2 条 **动词链**（登录→…→…） | 「有 CRUD 功能」 |
| B4 | 实体↔功能对照 | **每个主流程涉及的表** 一行；链到 entities | 只有 User 一行 |
| B5 | 核心术语 | 每个术语 **业务含义** + 代码/表对应 | 只列英文缩写 |
| B6 | 信息来源 | 勾上实际读过的来源 | 全未勾却标完成 |
| B7 | 未找到/待补充 | 无文档处 **明确列出** + 推断依据 | 空白 |

---

## 步骤 4 · p1-tech-stack.md

| # | 必写 | 怎么扫 |
|---|------|--------|
| T1 | 语言 + **精确版本** | `pom.xml` / `package.json` / `go.mod` |
| T2 | 框架 + 版本 | parent / dependencies |
| T3 | ORM / 迁移工具 | JPA/Flyway、Prisma 等 |
| T4 | 测试框架 | JUnit、Vitest、pytest |
| T5 | **来源路径** | 写明读的文件路径 |

---

## 步骤 5 · codebase/p1-{端}.md

### §一 架构与目录（4 小节缺一不可）

| 小节 | 必写内容 | 扫哪里 |
|------|----------|--------|
| **1.1 总体形态** | 单体/微服务；**API 前缀**；**鉴权方式**（JWT/Session/Cookie）；是否有网关 | `SecurityConfig`、`application.yml`、路由前缀 |
| **1.2 模块一览** | **每个业务包一行**：模块名、路径、**一句话职责**、主要 Controller | `module/`、`apps/` 目录 |
| **1.3 目录树** | 至少 **2 层**真实树；含 `common/`、配置、测试目录 | 实际 `tree` / IDE |
| **1.4 入口与配置** | 启动类/端口；**无需登录的路径列表**；测试 profile/命令 | `main`、`*Test.java`、`application-test.yml` |

### §二 写法规范（后端 · 逐项摘录，禁止概括）

| # | 维度 | 须写清什么 | 示例写法 |
|---|------|------------|----------|
| W1 | 分层 | Controller/Service/Repository **实际包路径** | `module.{域}.controller` |
| W2 | 类命名 | `{Domain}Controller`、`{Entity}Service` | 列 2~3 个真实类名 |
| W3 | DTO | Request/Response **后缀规则**；是否用 `record` | `DietRecordRequest` |
| W4 | 统一响应 | **结构字段** + 成功码；**摘录 1 行真实代码** | `ApiResponse.ok(data)` → `{code,data,message}` |
| W5 | 业务异常 | 异常类名、**如何抛**、HTTP 状态谁定 | `BizException(code, msg, status)` |
| W6 | 校验 | 注解在 **Controller 还是 DTO**；校验失败响应格式 | `@Valid @RequestBody` |
| W7 | 鉴权 | 取当前用户 **API 一行** | `AuthContext.requireUserId()` |
| W8 | 分页 | page **从 0 还是 1**；Repository 怎么写 | `PageRequest.of(page-1, size)` |
| W9 | 事务 | `@Transactional` 在 **哪一层**；readOnly 用法 | Service 写、Controller 不写 |
| W10 | 主键 | UUID/自增；**创建实体工厂**有无 | `Entity.createNew(...)` |
| W11 | HTTP 语义 | 创建 **201**、删除 **204**、幂等 POST 是否 **200/201** | 列项目真实例子 |
| W12 | 模块参考 | **抄作业表**：场景 → 参考模块路径 | CRUD→`diet/`；幂等→`checkin/` |

### §二 写法规范（前端 · 有前端时逐项）

| # | 维度 | 须写清什么 |
|---|------|------------|
| F1 | UI 库 + 版本 | `antd` 5.x、`element-plus` 等 |
| F2 | 请求封装 | `request` 从哪 import；baseURL |
| F3 | 列表数据 Hook | `useRequest` / `react-query` / 自封装路径 |
| F4 | 样式 | CSS Modules / Tailwind / scoped；**文件命名** |
| F5 | 类型 | `typings.d.ts` 位置；`XxxListItem` / `XxxQueryParams` 命名 |
| F6 | 页面目录 | 页面 + 同目录 `service.ts` / `components/` |

### §三 代码模板（每类 **必含**）

每个 `### 3.x` **必须**有：

```
- 参考：`{相对路径}:{起始行}-{结束行}`
- 适用：{什么场景用这套写法}
- 禁止偏离：{2~3 条，如「禁止裸返 Entity」「禁止 Controller 写事务」}
- 代码块：{从项目复制的片段，不是 npm 文档}
```

| 模板 | 后端必含元素 | 前端必含元素 |
|------|--------------|--------------|
| **3.1 列表/分页** | `@GetMapping` + page 参数 + Service 分页 + Repository | 搜索 Form + Table pagination + `useRequest` |
| **3.2 详情** | GET by id + `orElseThrow NOT_FOUND` | 详情页/抽屉读单条 |
| **3.3 创建/更新** | `@PostMapping` + `@Valid` DTO + `@ResponseStatus(CREATED)` | Form submit + `validateFields` |
| **3.4 特殊** | 幂等 POST / 状态 PATCH / upsert | Modal destroyOnClose / 重置 |

**无对应实现时**：写「本项目暂无，首个类似功能完成后补」，**不得**从官方文档抄示例冒充。

### §四 新功能自检

至少 **6 条** 可勾选项，须 **项目特定**（如「返回 ApiResponse.ok」「Flyway V{n}」），禁止泛泛「代码规范良好」。

---

## 步骤 6 · data/ 实体文档

### 哪些表必须单独建 `entities/p1-*.md`

满足 **任一** 即建：

- migration / Entity 类存在
- 有 **独立 Controller** 或主流程 API
- 在 p0-business **实体对照表**中出现
- 有 **AC 测试**覆盖

**可不单独建**：纯字典表、中间表（合并在 relations 或主实体文档说明）。

### 每份实体文档完成度

| # | 节 | 最低要求 |
|---|-----|----------|
| E1 | 业务用途 | ≥1 句：**这张表在业务里承担什么** |
| E2 | 用户怎么用 | ≥1 行：**操作 → 产生什么数据** |
| E3 | 相关 API | **每个** 读写该表的 API 一行（方法+路径+一句话） |
| E4 | 关系 | 链到 relations；写清归属/被谁读 |
| E5 | 推断依据 | ≥2 条具体来源（文件/测试名） |
| E6 | 关键字段 | 每字段 **业务含义**；status 枚举写 **值→中文** |
| E7 | 代码映射 | Entity 类 + **主要 Service** 路径 |

**字段表不合格**：`status | varchar | 状态` → **合格**：`status | varchar | 待支付/已支付/已取消，见 p1-order-status.md`

### data/README.md

| # | 必写 |
|---|------|
| D1 | 推断依据表 ≥3 行 |
| D2 | 主流程 text 简图 ≥4 步 |
| D3 | 实体索引：**每个 entities 文件** 一行 + 一句话干什么 |

### data/relations/

- 每个 **1:N / 1:1** 关系文件开头 **一句话业务含义**
- 写清 **唯一约束**（如 `(user_id, checkin_date)` unique）
- 链到 entities，**不重复**贴 API 列表

---

## init 落盘自检（AskQuestion **前**须全 ✅）

```
[ ] p0-business 含实体对照表且链到 entities
[ ] p1-tech-stack 版本号来自依赖文件非猜测
[ ] codebase §一 四小节齐全（1.1~1.4）
[ ] codebase §二 后端 W1~W12（有 FE 则 F1~F6）无空项
[ ] codebase §三 每模板含 参考:行号 + 禁止偏离 + 真实代码块
[ ] codebase §四 ≥6 条项目特定自检
[ ] data/README 实体索引与 entities 文件一一对应
[ ] 每个 entities 文件 E1~E7 齐全
[ ] 未建 p1-architecture.md
[ ] 未建 conventions/（除非用户要求模式 A）
[ ] README P0/P1 索引与磁盘文件一致
```

**任一项未 ✅ → 不得 AskQuestion 标 init 完成。**

---

## 扫描时建议读的文件（后端）

| 目的 | 优先读 |
|------|--------|
| 模块划分 | `*Application.java`、顶层 `module/` 包 |
| 统一响应 | `common/dto/ApiResponse`、`*ExceptionHandler*` |
| 鉴权 | `SecurityConfig`、`AuthContext`、filter |
| CRUD 范本 | 业务最完整的 `*Controller` + `*Service` |
| 分页 | 有 `Page`/`PageRequest` 的 Service |
| 幂等/upsert | checkin、weight 等「同键更新」模块 |
| 实体 | `db/migration/V*.sql` 注释 + `@Entity` |
| 测试风格 | `Ac*.java` / `*Test.java` 一个完整类 |

## 扫描时建议读的文件（前端）

| 目的 | 优先读 |
|------|--------|
| 列表页 | `pages/**/List*`、`index.tsx` 含 Table+Form |
| 请求 | `service.ts`、`hooks/useRequest` |
| 类型 | `typings.d.ts`、`types/` |
| 样式 | 同目录 `*.module.less` |

---

## 合格 vs 不合格（codebase §三 片段）

**❌ 不合格**（官方文档腔）：

```java
@RestController
public class ExampleController {
    @GetMapping("/items")
    public List<Item> list() { ... }
}
```

**✅ 合格**（项目真实 + 引用）：

```
参考：`module/coach/controller/CoachController.java:46-51`
禁止偏离：须 ApiResponse 包装；page 从 1 传入
```

```java
@GetMapping("/history")
public ApiResponse<CoachHistoryResponse> getHistory(
        @RequestParam(defaultValue = "1") int page, ...) {
    String userId = AuthContext.requireUserId();
    return ApiResponse.ok(coachService.getHistory(userId, page, pageSize));
}
```
