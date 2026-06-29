# 并行编排（可选）

> 默认不启用。须用户显式「并行 / subagent」。**开发顺序与串行相同**：todo ① 构思落盘→② 写码→③ AC验收，仅切片可并发。  
> 细则 → [04-development.md](04-development.md) · 阶段闸门 → [askquestion-gate.md](../templates/askquestion-gate.md)

## 不豁免

- **① 构思落盘 → G0–G8 → ② 按 五、核心流程 写码 → ③ 对照 八、REQ 验收 AC**；阶段 4 结束仍须 AskQuestion 阶段闸门
- 催进度仅可少**阶段内**批次审阅卡，**不可少阶段闸门、不可跳过构思落盘**
- 禁止整包委派「实现全部 MVP」跳过 ① 构思

## 阶段 4 并行序

```
批次 B：各切片 ① 构思落盘 → 勾 todo ① → G0–G8 → （可选）AskQuestion dev 审阅 → 停
批次 C：各切片 ② → 勾 todo ② → ③ → 勾 todo ③ → 主 Agent 标父任务 ✅
下一批次重复；全部 ✅ → AskQuestion 阶段闸门 → 停
```

**禁止**跳过批次 B（① 未落盘）直接 ② 写码。

## 启用条件

用户显式并行 + solution 已确认 + 路径无冲突。**「全部做完」≠ 并行许可。**

## 角色

| 角色 | 做 | 禁止 |
|------|-----|------|
| 主 Agent | 拆片、G0–G8、**全部 AskQuestion**、todo、合并 | 跳过阶段闸门；未授权启 subagent |
| Subagent | 指派 ① 或 ②+③；prompt 含 dev 路径 + **五** 流程清单 | 标 ✅；AskQuestion；跳过 ① |

批次 C 前登记 [active-edits.md](../templates/active-edits.md)。

## 阶段 3 并行（可选）

并行出 features → 合并 architecture + todo → AskQuestion 方案审阅 → **阶段闸门** → 停。

## subagent prompt 必含

```
切片：{T-xxx 唯一} · dev：{specs/dev/T-xxx-...md}
顺序：① 构思落盘（七段模板，五逐步）→ ② 仅按 五 写码 → ③ 对照 八 test/ac 全绿
禁止：多 T 合一 dev；跳过 ①；自行标 ✅
```

① 已由主 Agent 完成时 → subagent 只执行 ②→③，须附 dev 路径。
