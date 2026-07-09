# init 扫描清单（brownfield 必读）

> **何时读**：`init:` 步骤 ② 扫描时逐步勾选；AskQuestion 前落盘自检须全绿。  
> **模板正文**（只此一处）：[init-doc.md](init-doc.md) · 写法锚点：[code-conventions.md](code-conventions.md)

**原则**：写满路径/行号/表名/API/公式，禁止 `{…}` 占位后标 ✅。

---

## 取长补短（两套实践合并）

| 维度 | 参考既有 brownfield 实践 | 本 skill 补充 | 禁止 |
|------|-----------------|-------------------|------|
| 导航 | README 沙盘、LAYERS、30min 路线 | — | README 纯 P0/P1 文件列表 |
| 业务 | 三大闭环内「想知道→直达」 | p0-business **实体↔功能对照** | 只有 journey 无对照表 |
| 领域 | p0-domain-math 公式链+被谁用 | 推断依据、缺则报什么错 | 凭常识写公式 |
| 架构 | p1-architecture 依赖 mermaid | 与 codebase 分工不重复 | architecture 写模板/序列图 |
| 接口 | api-catalog 每行碰表、p1-errors 前置自检+onboarding | L3 与 business 页面↔API 一致 | 只有 path 无碰表 |
| 数据 | data/README **场景→碰表**、跨场景 relations | 实体 **业务用途+用户怎么用** E1~E7 | 只有字段字典 |
| 代码 | §四 序列图 2~4 条 | §二 W1~W12 逐项摘录、§三 path:行号 | 「遵循最佳实践」 |
| 实体 | ⭐ 字段、碰表场景、跨模块只读 | 业务用途、相关 API、推断依据 | 只有 `status\|varchar\|状态` |

---

## 步骤 1 · p0-business.md

| # | 必写节 | 最低要求 | 不合格 |
|---|--------|----------|--------|
| B1 | 解决什么问题 | 谁+痛点 | 「后端项目」 |
| B2 | 目标用户 | 来源列填文件 | 空表 |
| B3 | 核心场景 | ≥2 动词链 | 「有 CRUD」 |
| B4 | **实体↔功能对照** | 主流程每表一行+链 entities | 只有 User |
| B5 | 用户旅程 | 步骤/页面/API/碰表 | 纯文字 |
| B6 | 术语 | 业务含义+代码对应 | 只列缩写 |
| B7 | 信息来源 | 勾选读过的 | 全未勾 |
| B8 | 未找到 | 列出+推断依据 | 空白 |

---

## 步骤 4 · p1-tech-stack.md

T1 精确版本 · T2 框架 · T3 ORM/迁移 · T4 测试框架 · T5 来源路径（来自 pom/package.json，非猜测）

---

## 步骤 5 · p1-architecture.md

| # | 必写 | 不合格 |
|---|------|--------|
| A1 | 总体形态 | 只写框架名 |
| A2 | 模块依赖 **mermaid**（对照 inject） | 臆造调用 |
| A3 | 跨模块调用表 | 空表 |
| A4 | 模块一览（路径+职责+Controller） | 只有包名 |

---

## 步骤 7d · p0-domain-math.md（有计算则建）

M1 规则总览≥2 · M2 公式来自源码 · M3 依赖+缺则 · M4 易误解≥1 · M5 链 relations/errors

---

## 步骤 6 · codebase/p1-{端}.md

§一 目录树+入口（模块→architecture，不重复）

**§二 后端 W1~W12**（逐项摘录真实类名/路径）：

| # | 维度 | 须写清 |
|---|------|--------|
| W1~W3 | 分层/命名/DTO | 实际包路径、2~3 真实类名 |
| W4~W5 | 响应/异常 | 结构字段+1 行真实代码 |
| W6~W9 | 校验/鉴权/分页/事务 | 具体 API/注解/层 |
| W10~W11 | 主键/HTTP 语义 | 项目真实例子 |
| W12 | 抄作业 | 场景→path:行号 |

**§二 前端 F1~F6**（有则写）：UI 库、request import、Hook、样式命名、types、页面目录

**§三** 每模板：参考 path:行号 · 适用 · 禁止偏离 · 真实代码块（禁止 npm 文档腔）

**§四**（有 REST）：2~4 条 sequenceDiagram，与 architecture 一致，含易误解链路

**§五**：≥6 条项目特定自检

---

## 步骤 7 · data/

**api-catalog**：每 API 一行含碰表，与 p0-business 页面↔API 一致

**schema-overview**：ER 图、migration 演进、唯一约束→行为

**entities**（满足任一即建：migration/独立 Controller/对照表出现/AC 测试）：

| E1 业务用途 | E2 用户怎么用 | E3 相关 API 每行 |
| E4 ⭐+碰表+relations | E5 推断依据≥2 | E6 字段业务含义 | E7 Entity+Service |

**data/README**：推断依据≥3 · 主流程简图≥4步 · **场景→碰表矩阵** · 实体索引一一对应

**relations**：FK 一句话业务含义+唯一约束；跨 3+ 表/有公式 → 独立文件（入口+顺序碰表+公式+缺数据）

**p1-errors**：错误码+**前置自检表**+onboarding 顺序 · **p1-testing**：改模块→跑哪个

---

## init 落盘自检（AskQuestion 前须全 ✅）

```
[ ] README：三大闭环（含想知道→直达）+ 30min 路线
[ ] LAYERS：每层「读完应能回答」+ 按任务跳转
[ ] p0-business：实体对照表 + 旅程（或无前端说明）
[ ] p0-domain-math：公式来自源码（有计算时）
[ ] p1-architecture：依赖 mermaid + 跨模块表
[ ] p1-tech-stack：版本来自依赖文件
[ ] codebase §二 W1~W12（有 FE 则 F1~F6）
[ ] codebase §三：每模板 path:行号 + 真实代码
[ ] codebase §四：2~4 序列图与源码一致（有 REST）
[ ] codebase §五：≥6 条自检
[ ] api-catalog：每行含碰表（有 REST）
[ ] data/README：场景碰表 + 实体索引一致
[ ] entities：E1~E7 齐全
[ ] 无 conventions/（除非模式 A）
[ ] README/LAYERS 索引与磁盘一致
```

**任一项未 ✅ → 不得 AskQuestion。**

---

## 扫描优先读（后端）

模块 inject · Calculator/Util · ApiResponse/ExceptionHandler · SecurityConfig · 最完整 Controller+Service · 跨模块聚合 API · migration+Entity · Ac*Test · BizException

## 扫描优先读（前端）

列表页 index.tsx · service.ts · typings · 路由/菜单

---

## 附录 · 合格 vs 不合格

**§三 模板 ❌**（官方文档腔）：

```java
@GetMapping("/items")
public List<Item> list() { ... }
```

**§三 模板 ✅**：

```
参考：`module/coach/controller/CoachController.java:46-51`
禁止偏离：ApiResponse 包装；page 从 1 传入
```

**§四 序列图 ❌**：Participant 与源码 inject 不符  
**§四 ✅**：与 p1-architecture 跨模块表一致

**实体 ❌**：`status | varchar | 状态`  
**实体 ✅**：`status | ⭐ | 待支付/已支付/已取消`

**domain-math ❌**：BMI=体重/身高²（无代码出处）  
**domain-math ✅**：摘录 `CalorieCalculator.java:42-58` + 被谁用列表

**p1-errors ❌**：只有 errorCode 表  
**p1-errors ✅**：用户操作→根因→先做什么 + onboarding 顺序
