# L1–L5 测试流水线

> 阶段分工与 DoD 见 [ac-guide.md](ac-guide.md)；本文件只定义各层含义。

## 流水线顺序

```
0a → 0b → 0c → L1 → L2 → L3 → L4 → L5
```

步骤 0 详见 [human-todo.md](human-todo.md)。

## L1–L5 定义

| 层 | 通过标准 | 快速 | 严谨 |
|----|----------|------|------|
| L1 | lint/type 无 error | ✅ | ✅ |
| L2 | build 成功 | ✅ | ✅ |
| L3 | 全部 AC 对应单元测试通过 | ✅ | ✅ |
| L4 | 覆盖率报告 | 仅报告 | 变更模块 ≥80% |
| L5 | 冒烟/E2E（architecture.md 测试依赖 + humanTodo 资源） | 未齐不得标 pass | 核心不得无故 skip |

## 豁免（微型改动 / Hotfix）

改代码后跑 **L1 + 相关 AC 测试**；Hotfix 核心路径加 L5 冒烟。见 [00-intent-routing ① 豁免判定](../phases/00-intent-routing.md#①-豁免判定最先做)。

## 失败重试

AI 亲自跑终端；从失败层重跑，最多 3 轮；仍失败 → 回阶段 4。
