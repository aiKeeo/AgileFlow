# 构思落盘（atlas/dev/）

> 颗粒度 → [exemplar-BE](../examples/dev-exemplar-BE.md) · [exemplar-FE](../examples/dev-exemplar-FE.md)  
> **流程拆解** → [dev-reuse-examples.md](../examples/dev-reuse-examples.md)  
> **AC≈UT / 映射表** → [ac-guide.md](ac-guide.md)  
> 档位 → [04](../phases/04-development.md) · 裁决 → [SKILL](../SKILL.md#裁决表冲突时以此为准)  
> 完整样例（人读）→ [dev-glance-login](../examples/dev-glance-login/)  
> **快=并发不减质** → [fast-means-parallel](../examples/fast-means-parallel.md)

## 质量铁律（快速 / 严谨同质）

- **`AF_FLOW=fast` / `AF_DECIDE=ai`：不减拆解厚度、不降档、不标「待补齐」代替步骤。**  
- 要加速 → 并发写码，不是少写 S1…Sn。  
- 开发打开本文件应能**按步骤落码**，不必再问「改哪个类」。

| 必须 | **禁止**（模糊句） |
|------|-------------------|
| 摘要五 bullet（本T/做含接法/不做/上游/AC） | 「实现登录」「按需调整」「相关逻辑」 |
| 每步：动作 + 输入→输出 + 注意点含 `` `Class.method` `` / `` `path/` `` | 空注意点；只有目的没有落点 |
| 接法写清：继续走 / 在…上加 / 照… / 新写 | 「参考现有实现」无点名 |

## 分工

| 层 | 定什么 | dev 做什么 |
|----|--------|------------|
| **REQ AC** | 单测级 Given/When/Then + 观测面 | **摘要列齐本 T 主责 AC**；禁止改 AC 语义 |
| **contracts/API·UI** | 接口/字段绑定 | BE 链 API；FE 链 UI（**禁** dev 内映射表） |
| **② UT** | — | BE：`1 AC ↔ 1` `test/unit` 方法；UI：同构前端单测 |
| **③ 薄 ac** | — | 出口烟测 + **## 结果 AC 映射表** |

> **`AF_TEMPLATE=no`（legacy）**：仍可用 #### + **改**；标准/完整优先原子步骤表。

## 段结构

| 段 | 写什么 |
|----|--------|
| **## 摘要** | 五 bullet：本T / 做（含接法） / 不做 / 上游 / AC（FE 可加接线） |
| **## 步骤** | 原子步骤表 S1…（每 `####` + 8 字段规格表）或精简一行改 |
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

#### S1：步骤名称

| 字段 | 内容 |
|------|------|
| 执行角色 | … |
| 触发条件 | … |
| 输入数据 | … |
| 处理逻辑 | ① … |
| 调用依赖 | `XxxService.method(params)` → 返回类型 |
| 异常处理 | `ERROR_CODE(xxxx)` → `Result.fail(xxxx, "msg")` |
| 输出数据 | … |
| 状态变更 | … |

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

**优先 · 原子步骤表**：每 `#### S1…` 下 8 字段规格表（执行角色/触发条件/输入数据/处理逻辑含 if-else/调用依赖 `Service.method(params)`/异常处理 错误码+回滚/输出数据/状态变更）；调用依赖字段须含 `` `Class.method` `` / `` `path/` ``。

**精简 · 一行**：`#### 1. …` + `- **改**：…`

| 档 | 最少步数 |
|----|----------|
| 精简 | 1 |
| 标准 | 2 |
| 完整 | 3 |

勾①：完整档另跑 `--gate dev-step1-literal --dev-file …`。  
勾③：映射表须覆盖本 T 主责 AC；BE 主责须有 `test/unit` 路径。
