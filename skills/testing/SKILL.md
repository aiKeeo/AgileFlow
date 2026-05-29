---
name: testing
description: >-
  测试验收：分层测试、对照 specs/001-requirement.md 验收标准核对，输出
  specs/004-test-report.md 与 specs/delivery-report.md，更新 specs/todo.md。
  在测试、验收、回归、交付前检查时使用。
version: 1.1.0
category: testing
priority: 50
disable-model-invocation: true
---

# 测试与验收

## 执行流程

1. 运行所有单元测试和集成测试
2. 执行功能测试，覆盖所有验收标准
3. 测试边界条件和异常场景
4. 生成测试报告
5. 对照 `specs/001-requirement.md` 进行最终验收
6. 更新 `specs/todo.md`

## 强制输出格式（specs/004-test-report.md）

必须包含：

1. **测试概览**：总用例数、通过数、失败数、覆盖率、测试时间
2. **测试结果详情**：按类型（单元/接口/功能/边界）统计表
3. **验收标准核对**：逐条对照 Given-When-Then，标注通过/失败
4. **遗留问题与建议**

## 强制文档产出

| 文件 | 条件 |
|------|------|
| `specs/004-test-report.md` | 必须生成 |
| `specs/todo.md` | 「测试验收」→ ✅ 已完成 |
| `specs/delivery-report.md` | 全部测试通过后生成 |

## delivery-report.md 最小结构

```markdown
# 最终交付报告

## 交付物清单
- 代码：src/, tests/
- 文档：specs/*.md, sql/init.sql

## 验收结论
- 通过 / 有条件通过 / 不通过

## 已知限制
```

## 强制规则

- 必须覆盖所有验收标准
- 必须测试边界条件和异常情况
- 测试不通过禁止交付
- 必须对照最初的需求规格书进行验收
