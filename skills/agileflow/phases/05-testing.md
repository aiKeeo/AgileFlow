# 阶段 5：测试验收

> humanTodo / 步骤 0：[templates/human-todo.md](../templates/human-todo.md)
> L1–L5：[templates/l1-l5-pipeline.md](../templates/l1-l5-pipeline.md)
> 报告模板：[templates/test-report.md](../templates/test-report.md)
> 可观测性验收取证：[templates/observability-logging.md](../templates/observability-logging.md)
> 阻塞检查：[phases/task-tracking.md](task-tracking.md)

## 核心原则：REQ 一一对应

每个已确认 REQ → `specs/tests/REQ-XXX-验收报告.md`。

- 报告场景表 ↔ REQ 的 `### 场景N：名称`
- Then 断言可追溯 REQ 验收标准

## 流水线

```
0a → 0b → 0c → L1 → L2 → L3 → L4 → L5 → 逐 REQ 验收 → 报告
```

步骤 0 与 L1–L5 详见 templates 引用文件。

## 总结论（三选一）

| 结论 | 能否标交付完成 |
|------|----------------|
| PASS | ✅ |
| BLOCKED-HUMAN | ❌ |
| FAIL | ❌ |

失败：AI 跑终端；从失败层重跑最多 3 轮；仍失败 → 回阶段 4。

## REQ 门禁

| 模式 | 要求 |
|------|------|
| 快速 | 关联 REQ 全场景 ✅ 或 ⚠️ |
| 严谨 | 已确认 REQ 全场景 ✅；⚠️ 仅非核心 |

## 逐 REQ 流程

1. 读取 REQ，提取 BDD 场景
2. 映射测试（`REQ-XXX 场景N`）
3. 补测未覆盖场景
4. 执行并记录证据
5. 生成验收报告（模板见 test-report.md）
6. 更新 REQ：全 ✅ →「已实现」

全部完成后：
7. 更新 `specs/tests/README.md`
8. todo「测试验收」→ ✅

## 强制规则

1. 每个已确认 REQ 必须有验收报告
2. 场景表逐条对应 BDD
3. 先 0a 再 L1；humanTodo 阻塞不得 PASS
4. AI 亲自 L1–L3；L5 真连资源未齐不得冒充完成
5. 失败须有日志文件 + trace 证据（路径与命令见 observability-logging.md）
6. 至少 L1+L3；严谨 +L4+L5；L5 验证日志落盘
7. 每 REQ 报告含 §可观测性验证，否则不得 PASS

## 产出

| 文件 | 何时 |
|------|------|
| `specs/tests/REQ-XXX-验收报告.md` | 每 REQ |
| `specs/tests/README.md` | 全部完成后 |
| `specs/todo.md` | 更新验证状态 |
| `specs/humanTodo.md` | 缺环境时 |
| REQ 文档 | 通过后 →「已实现」 |

**本阶段不使用 AskQuestion**；PASS 后流程结束。
