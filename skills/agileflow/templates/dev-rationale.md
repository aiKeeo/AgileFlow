# 构思落盘（atlas/dev/）

> 颗粒度 → [exemplar-BE](../examples/dev-exemplar-BE.md) · [exemplar-FE](../examples/dev-exemplar-FE.md)  
> 档位 → [04](../phases/04-development.md) · 裁决 → [SKILL](../SKILL.md#裁决表冲突时以此为准)

## 留什么

| 段 | 精简 | 标准·完整 | 写什么 |
|----|:----:|:--------:|--------|
| **## 范围** | ✅ | ✅ | 目标 / 必须 / 不做 |
| **## 契约** | — | ✅ | **链** API/UID；FE 另写布局+映射；BE 复用表 |
| **## 做法** | ✅ | ✅ | `####` 步骤 + `` `Class.method` `` / pages |
| **## AC** | — | ✅ | AC→test 对照（Then 链 REQ，勿抄场景） |
| **## 结果** | ✅ | ✅ | ③ 填可运行证据 |

**不留**：一二三编号、空「状态机/异常/技术选型」段、抄 model/API 全文。

## 骨架

```markdown
# [T-id] 名 — 构思 [BE|FE]
- 档位：[精简|标准|完整] · → [REQ]() · [API|UID]()

## 范围
- 目标 / 必须 / 不做

## 契约          # 精简可省略
→ [API-xxx](...)
### 布局         # 仅 FE+UI，含 ASCII 线框
### 映射 / 复用 / 调用

## 做法
#### … `XxxService.foo`

## AC            # 精简可省略
| AC | Then | test |

## 结果
| … | 编译+启/冒烟+PASS |
```

勾①：完整档 `--gate dev-step1-literal --dev-file …`
