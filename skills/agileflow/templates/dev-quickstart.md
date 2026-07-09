# dev 速查（阶段 4 唯一执行清单）

> 金标准：BE [dev-exemplar-BE.md](../examples/dev-exemplar-BE.md) · FE [dev-exemplar-FE.md](../examples/dev-exemplar-FE.md)  
> 细则：[04-development.md](../phases/04-development.md) · 模板：[dev-rationale.md](dev-rationale.md)

---

## 序（不可跳、不可批量①、不可 Subagent 外包）

```
【默认·主 Agent 串行】
0. TodoWrite 展开：每个 T ≥1 条「① 构思→atlas/dev/T-xxx…」（推荐每 T ①②③）
   ※ 未展开 → 禁止 Write 业务源码（见 todo.md「TodoWrite 强制展开」）
1. 取下一条未完成的① → Read exemplar → 写【该】T 完整 dev
   →【闸门 A】→ 勾 ①（TodoWrite + atlas/todo.md）→【闸门 B】→ ② → ③
2. 下一条①再重复。禁止先写完多份 dev 再统一写码（无并行许可时）。
```

**连续做 / 全部开发 / yes_all** = **先展开 TodoWrite**，再按清单逐条做；**≠** 摘要 / 空壳 / 合并多 T / **派 Subagent 一次写完 BE+FE** / **跳过 TodoWrite**。

| 用户说 | 主 Agent 必须 | 禁止 |
|--------|---------------|------|
| 全部开发 / 直接全开发 | **先** TodoWrite 为每个 T 建① → 串行逐条 ①→②→③ | 启 Task 批量写码；1 个 Todo 覆盖多 T；无①条目就写码 |
| 并行 / 多 subagent（显式） | 先读 [parallel-orchestration](../phases/parallel-orchestration.md)；每 T 先有合规① | 无 dev 就让 Subagent Write 业务源码 |

**未读到用户原话含「并行/subagent」→ 禁止启用 A1 并行例外。**

**标「开发实现 ✅」前**：`dev` 数 = T 头数 **且** 每个 T 的 TodoWrite① 均为 completed（`顺序：⚠️` 补盘不计正式①）。

---

## 闸门 A（勾 ① 前）

| # | 检查 |
|---|------|
| A0 | 已 Read exemplar-BE 或 exemplar-FE |
| A1 | **串行**：只 1 个 T；无其他「①勾完②未完」。**显式并行**：批次 B 允许多个①已勾②未开；批次 C 允许多 T 同时②（1 Task=1 T） |
| A2 | 文件存在 |
| A3 | 段标题（下表） |
| A4 | 五可执行 + FE 则 3.1/3.2/3.3 |
| A5 | 非 ⚠️ 补盘 |

### 段标题

- **严谨**（T≥3 或 BE+FE 或 DB/权限等 → 强制）：`## 一、`～`## 九、` 全有  
- **快速**：`## 一、` `## 五、` `## 八、` `## 九、`（FE+UI +`## 三、`）；二/四/六/七**可省略整段**

五内：`### 目的` `### 需要什么` `### 怎么做` `#### 5.`

### 五可执行（防空壳）

每个 `#### 5.`：

- 有 **要达成什么 / 需要什么 / 做法**
- 做法 ≥2 步，且含 `` `Class.method` `` 或 `` `pages/...` `` / `` `services/...` ``
- 禁止五的正文只有「见 REQ / 见 API / 实现即可」

FE+UI：须有 `### 3.1` `### 3.2` `### 3.3`

### ❌ 不过

摘要十几行；空壳九标题；批量写多份 dev；T-001 全、后面偷懒。

---

## 闸门 B（Write 前）

1. ① 已勾  
2. 仍单 T；Write ⊆ 当前 5.x  
3. 已 Read 写法锚点 §三  
4. 严谨：七有 `§3.x`；快速：3 即可  

---

## 结构速记

```
### 3.1 / 3.2（英文字段）/ 3.3     ← FE+UI
### 目的 / 需要什么 / 怎么做
#### 5.1 …  要达成 / 需要 / 做法（`XxxService.foo`）
```

首行：`📍 Agileflow | 模式：{快速/严谨} | 阶段：4 | 步骤：{①|②|③} | 任务：T-xxx`
