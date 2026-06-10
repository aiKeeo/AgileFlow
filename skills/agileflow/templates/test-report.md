# 测试验收报告模板

## REQ 验收报告（`specs/tests/REQ-XXX-验收报告.md`）

```markdown
# [REQ-XXX] 验收报告

- 关联需求：`specs/requirements/REQ-XXX-名称.md`
- 验收时间：{{时间}}
- 验收模式：快速 | 严谨
- **结论**：`PASS` | `BLOCKED-HUMAN` | `FAIL`
- 场景覆盖：X/Y

## 1. 验收场景矩阵

| 场景ID | 场景名称 | G-W-T 摘要 | 状态 | 测试证据 | event | 日志取证 |
|--------|----------|--------------|------|----------|-------|----------|

## 2. 可观测性验证
- 日志路径、检索命令、抽样（event + traceId）

## 3. 流水线结果
- L3 / L5 结论与命令

## 4. 遗留问题
```

## README（`specs/tests/README.md`）

含：交付概览、全流程结论、REQ 对照表、流水线摘要、humanTodo 状态。

## 可观测性验收命令

从 `003 §可观测性` 取 `{LOG_DIR}`、`{LOG_FILE}`，完整示例见 [observability-logging.md](observability-logging.md#验收取证阶段-5)。
