# AC（验收标准）与代码验收规范

> **阶段 1**：在 REQ 写 AC 表 — **AC 唯一定义处**，后续阶段只读、不改。  
> **阶段 4 ③ 对照 REQ 验收 AC**：**② 写码完成后**，按 dev **八** 引用的 REQ AC 在 `test/ac/` 写验收测试并跑全绿（细则 [04-development.md](../phases/04-development.md)）。  
> **阶段 5（tests:）**：复跑 → 更新 AC 状态 → 验收报告（[05-testing.md](../phases/05-testing.md)）。

## 核心原则

| 关系 | 要求 |
|------|------|
| **AC 只在一处** | 定义在 REQ；**禁止**在 dev/方案/测试里新增或改写 AC |
| **1 AC ↔ 1 验收测试** | 每个**可自动化** AC 至少一个 `test/ac/` 测试；名称/描述**含 AC ID** |
| 顺序 | ① 完整模板落盘 → 闸门 A → 勾① → 闸门 B → ② → **闸门 C（编译+能启/接口+冒烟）** → ③（**严谨**一～九标题；**快速**一+五+八+九；**禁止摘要版**） |
| **AC 测试方法列** | 步骤 ③ 完成后回填 REQ |
| **不可测 AC** | 标 `⚠️ 人工` 或 `⚠️ FE 人工`；不阻塞开发完成 |

## REQ AC 表（阶段 1 写好，阶段 4 只读）

```markdown
| AC ID | 场景 | Given | When | Then（可断言） | AC 测试方法 | 状态 |
|-------|------|-------|------|----------------|-------------|------|
| AC-001-01 | 登录成功 | 未登录 | POST /auth/login | 200 + token | （③ 后填） | ⬜ |
| AC-001-02 | 首页 BMI | 档案完善 | 打开首页 | 展示 BMI | — | ⚠️ FE 人工 |
```

## 按暴露面类型的验收测试指引（步骤 ③）

| 契约类型 | 怎么测 | 示例 |
|----------|--------|------|
| **API-** | HTTP/集成：状态码、body、DB 副作用 | POST /orders 断言 201 |
| **UI-** | 组件/E2E；或标 ⚠️ FE 人工 | 提交按钮调 API-001 |
| **JOB-** | 触发 job，断言输出/DB | 对账 job 行数 |
| **EVT-** | 发布/消费消息，断言 handler 副作用 | order.paid → 更新状态 |
| **无暴露面** | 单元测试业务逻辑 | Service 断言 |

对照：REQ AC 表 + 关联 `contracts/*`（若有）+ `features/F-xxx`。

## 步骤 ③：test/ac/ 组织与命名

**在 ② 写码完成后执行。** 框架与命令以 **`architecture.md`** 为准。

推荐按 REQ 聚合：`test/ac/req{NNN}_*`（临时：`test/ac/temp/`）。

**命名**（须含 AC ID）：

```
ac{REQ三位}_{序号}_{简述}
# 例：ac001_01_loginSuccess；描述须含 AC-001-01
```

**禁止**：

- ❌ **开发前**写 `test/ac/`（不是 TDD，不是先设计 AC）
- ❌ 在 test/dev 里**新增 AC**（AC 已在 REQ）
- ❌ 用 dev 文档代替验收测试代码
- ❌ 未跑 L3 就标 todo ✅
- ❌ **未过闸门 C**（编译/启动/冒烟）就标 ③ 或说「可以给用户看」

## 步骤 ③ 完成后

1. 回填 REQ「AC 测试方法」列  
2. 填 dev **九** 或 todo 贴 L3 终端证据

## UI / JOB 不可测

- 纯 UI 视觉：AC 标 `⚠️ FE 人工`；阶段 5 验收报告手动勾选  
- JOB 无测试钩子：在 architecture 约定测试入口  
- 可自动化 AC 须在 ③ 全绿后才算开发完成

## 阶段 4 DoD

| # | 动作 |
|---|------|
| D0 | ① 构思落盘完成（**闸门 A** 过线并已勾 ①） |
| D1 | ② 业务代码完成（按 **五、核心流程**） |
| D2 | **闸门 C** 过线：本端编译 + 能启/能调 + 本 T 冒烟；证据在 dev 九 |
| D3 | ③ 全部**可自动化** AC 已在 `test/ac/` 有验收测试 |
| D4 | 可自动化 AC 验收测试全绿（L3） |
| D5 | REQ「AC 测试方法」列已回填 |
| D6 | dev **九** 或 todo 有 L3 + 闸门 C 通过证据 |
| D7 | 「给用户看」前：存在端启动 + MVP 主路径冒烟（见闸门 C） |

## 阶段 5（tests: / test:）

- **入口**：裸 `tests:` / `test:` = 全量；`test:unit` / `test:smoke` / `test:smoke-be` / `test:smoke-fe` 等 = 分层（见 [00-intent](../phases/00-intent-routing.md#test-分层可指定层--单端)）
- **5-0（强制入场）**：**architecture 存在的端** **G1 编译** → **G2 启动探针** → **G3 功能冒烟**；不过禁止 5A（见 [l1-l5-pipeline 5-0](l1-l5-pipeline.md#阶段-5-入场门禁5-0) · [05-testing](../phases/05-testing.md#5-0-入场门禁强制)）  
- **5A**：复跑 `test/ac/` → AC 状态 ✅ → `atlas/tests/REQ-XXX-验收报告.md`  
- **5B**：全量 L1–L5 → `atlas/tests/README.md` PASS

## 禁止

- 开发前写 test/ac；在 dev 里自造 AC；测试失败标完成；阶段 4 写验收报告或改 AC 状态列  
- 阶段 5 跳过复跑；humanTodo 未清标 PASS  
- 用 `test:unit` 代替冒烟 / 闸门 C / 「可给用户看」
