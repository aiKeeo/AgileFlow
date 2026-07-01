# 测试验收报告模板

> AC 规范：[ac-guide.md](ac-guide.md)

## REQ 验收报告（`atlas/tests/REQ-XXX-验收报告.md`）

```markdown
# [REQ-XXX] 验收报告

- 关联需求：`atlas/requirements/REQ-XXX-名称.md`
- 关联功能：F-xxx（可选）
- 验收时间：{{时间}}
- 验收模式：快速 | 严谨
- **结论**：`PASS` | `BLOCKED-HUMAN` | `FAIL`
- AC 覆盖：X/Y 自动化 ✅（Z 条 ⚠️ FE 人工）

## 1. 验收场景矩阵（AC ID）

| AC ID | 场景名称 | G-W-T 摘要 | 状态 | 测试证据 | event | 日志取证 |
|-------|----------|------------|------|----------|-------|----------|
| AC-XXX-01 | 正常登录 | code 有效 → JWT | ✅ | `reqxxx_ac_test#acxxx_01_…`（阶段 4 ③ 编写，阶段 5 复跑） | user.login.success | — |
| AC-XXX-03 | 首页展示 | 进首页见 BMI | ⚠️ | FE 人工 | — | — |

## 2. 可观测性验证
- 日志路径、检索命令、抽样（event + traceId）

## 3. 流水线结果
| 层 | 命令 | 结果 |
|----|------|------|
| L3 | `cd backend && mvn test` | BUILD SUCCESS |

## 4. 遗留问题
- ⚠️ FE 人工 AC 列表及点验说明
```

## README（`atlas/tests/README.md`）

含：交付概览、全流程结论、REQ 对照表（含 AC 覆盖）、流水线摘要、humanTodo 状态。

## 可观测性验收命令

从 `atlas/solution/architecture.md` 可观测性章节取 `{LOG_DIR}`、`{LOG_FILE}`，完整示例见 [observability-logging.md](observability-logging.md#验收取证阶段-5)。
