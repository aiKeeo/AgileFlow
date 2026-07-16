# 构思落盘（atlas/dev/）

> 颗粒度 → [exemplar-BE](../examples/dev-exemplar-BE.md) · [exemplar-FE](../examples/dev-exemplar-FE.md)  
> **流程拆解** → [dev-reuse-examples.md](../examples/dev-reuse-examples.md)  
> **AC≈UT / 映射表** → [ac-guide.md](ac-guide.md)  
> 档位 → [04](../phases/04-development.md) · 裁决 → [SKILL](../SKILL.md#裁决表冲突时以此为准)  
> 完整样例（人读）→ [dev-glance-login](../examples/dev-glance-login/)

## 分工

| 层 | 定什么 | dev 做什么 |
|----|--------|------------|
| **REQ AC** | 单测级 Given/When/Then + 观测面 | **摘要列齐本 T 主责 AC**；禁止改 AC 语义 |
| **contracts/API·UI** | 接口/字段绑定 | BE 链 API；FE 链 UI（**禁** dev 内映射表） |
| **② UT** | — | BE：`1 AC ↔ 1` `test/unit` 方法；UI：同构前端单测 |
| **③ 薄 ac** | — | 出口烟测 + **## 结果 AC 映射表** |

> **`AF_TEMPLATE=no`（legacy）**：仍可用 #### + **改**；标准/完整优先流程表。  
> **`AF_DECIDE=ai`**：不减拆解厚度。

## 段结构

| 段 | 写什么 |
|----|--------|
| **## 摘要** | 五 bullet：本T / 做（含接法） / 不做 / 上游 / AC（FE 可加接线） |
| **## 步骤** | 流程表 S1…（或精简一行改） |
| **## 结果** | 可运行证据 + **AC 映射表**（unit / ac / 人工） |

**不留**：范围/异常/AC 专节、dev 内字段映射表、抄 API JSON、F 联调卡。

## 骨架

```markdown
# [T-id] 名 — 构思 [BE|FE]

- 档位：[标准|完整|精简] · depends_on：T-xxx
- → [F-xxx] · [API|UI] · 写法：code-patterns-{端}
- 独立文件：禁止与其他端 T 合并

## 摘要

- **本 T**：…
- **做**：…（含接法；一句话概括改哪些文件/类）
- **不做**：…
- **上游**：…
- **AC**：AC-xxx-01, AC-xxx-02, …（盖住主责）

## 步骤

| 步骤 | 动作 | 输入 → 输出 | 注意点（含落点） |
|------|------|-------------|------------------|
| **S1** | … | a → b | 新写 `Xxx.method` — … |

## 结果

| 项 | 证据 |
|----|------|
| 编译/启/冒烟 | … |
| UT | `npm test -- unit` ✅（②） |

### AC 映射表

| AC ID | unit | ac | 人工 |
|-------|------|-----|------|
| AC-xxx-01 | `test/unit/...` | `test/ac/...` | — |
```

## 步骤格式（闸门）

**优先 · 流程表**：注意点须含 `` `Class.method` `` / `` `path/` ``。

**精简 · 一行**：`#### 1. …` + `- **改**：…`

| 档 | 最少步数 |
|----|----------|
| 精简 | 1 |
| 标准 | 2 |
| 完整 | 3 |

勾①：完整档另跑 `--gate dev-step1-literal --dev-file …`。  
勾③：映射表须覆盖本 T 主责 AC；BE 主责须有 `test/unit` 路径。
