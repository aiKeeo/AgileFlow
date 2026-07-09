# 并行编排（可选）

> **默认不启用。** 须用户**原话**含「并行 / 多 subagent / 同时开 FE+BE」。  
> **「全部做 / 全部开发 / 直接全开发 / yes_all」≠ 并行许可，≠ 可派 Subagent 批量写码。**

细则 → [04-development.md](04-development.md) · [dev-quickstart.md](../templates/dev-quickstart.md)

---

## 硬否决（先读）

| 用户说了… | 可否启 Task/Subagent 写业务源码？ |
|-----------|----------------------------------|
| 全部做 / 全部开发 / 直接全开发 / 一次性做完 | **否** → 主 Agent **串行**逐 T |
| 并行 / 多 subagent（显式） | **仅当**每个切片已有合规 `atlas/dev/T-xxx.md` 且闸门 A 已过、① 已勾 |
| 未说并行 | **否** |

**禁止**：

- 用 1～2 个 Subagent「实现全部 BE / 全部 FE / T-002～T-018」
- Subagent prompt 含多个 T 或「其余任务一并完成」
- 无 `atlas/dev/T-xxx-*.md` 就让 Subagent Write `backend/` / `miniapp/` / `src/` 等业务源码
- 主 Agent 自己不写 dev，把阶段 4 整包外包

---

## 不豁免

- 每个切片仍须 **① → 闸门 A → 勾① → 闸门 B → ② → ③**
- 催进度不可少结束闸门、不可跳过构思
- 禁止整包「实现全部 MVP」跳过 ①

---

## 阶段 4 并行序（仅显式并行时）

```
批次 B：主 Agent 写【每个】T 的 dev → 闸门 A → 勾 ① →（可选）停
         ※ 所有参与并行的 T 的 ① 都勾完之前，禁止任何 ②
         ※ 此阶段允许多个「①已勾、②未开」——这是 A1/R10 的【显式并行例外】
批次 C：每个 Subagent 只领【1 个】T 的 ②→③；prompt 必含已存在的 dev 路径 + 五的做法清单
         → 闸门 B → ② → ③ → 主 Agent 勾选（Subagent 禁止改 todo ✅；禁止写①）
全部父任务 ✅ → 阶段闸门 → 停
```

**禁止**跳过批次 B 直接 ②。  
**禁止**一个 Subagent 领取「T-002～T-005」或「全部 API」。  
**禁止**Subagent 创建/改写 `atlas/dev/T-xxx.md`（① 只属主 Agent）。

### 与串行闸门的关系（防冲突）

| 规则 | 串行默认 | 显式并行例外 |
|------|----------|--------------|
| A1 / R10 | 禁止多份「①勾完②未完」；禁止批量①再写码 | 批次 B 允许先齐多 T 的①；批次 C 再并行② |
| 「全部开发」 | 串行逐 T | **不**触发本例外 |

---

## 启用条件（须全部满足）

1. 用户显式说「并行 / subagent / 同时开发 FE+BE」  
2. solution 已确认  
3. 路径无冲突（见 active-edits）  
4. **每个**将并行的 T 已有合规 dev 且 ① 已勾  

**「全部做完」≠ 并行许可。**

---

## 角色

| 角色 | 做 | 禁止 |
|------|-----|------|
| 主 Agent | 拆片（1 片=1 T）、**全部①**、闸门 A/B、全部 AskQuestion、todo、合并 | 未授权启 subagent；把「全部开发」当成并行；跳过结束闸门；把①外包给 Subagent |
| Subagent | **仅 ②+③**（1 个 T）；prompt 含 **已存在** 的 `atlas/dev/T-xxx-*.md` 路径 | 写① / 创建 dev；多 T；自行标 todo ✅；AskQuestion |

---

## 启 Task 前主 Agent 自检（口头过一遍）

```
1. 用户是否显式要求并行/subagent？（「全部开发」不算）
2. 本 Task 是否只含 1 个 T-xxx？
3. atlas/dev/T-xxx-*.md 是否已存在且闸门 A 已过、① 已勾？
任一项否 → 禁止 Task，改由主 Agent 串行
```

---

## subagent prompt 必含

```
唯一任务：T-xxx（禁止触及其他 T）
dev 文件（已存在，必须先 Read）：atlas/dev/T-xxx-….md
只允许：按该文件「五、怎么做」写码 + 跑「八」中的 test/ac
禁止：创建/跳过 dev；写其他 T；改 atlas/todo.md 勾选；实现「全部后端/前端」
若 dev 文件不存在 → 立即停止，向主 Agent 回报，禁止写业务源码
```

① 必须已由主 Agent 完成 → subagent **只**执行 ②→③，须附 dev 路径。  
若 prompt 要求写①或创建 dev → Subagent 应拒绝并回报主 Agent。
