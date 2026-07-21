# dev 阶段规则说明书

> 实现：`index.mjs` + `narrative-flow.mjs`（五段式厚度与语义）+ `steps.mjs`（仅 `isCodeAnchor`）。  
> 权威：`phases/04-development.md` · `templates/dev.md` · **SSOT** `templates/dev-granularity.md`  
> **已废弃**：`## 步骤` / 4 列流程表 / 8 字段原子表（`dev-core.mjs` 为空壳，勿再接入）。

## 1. 唯一形态

全端：`## 摘要` + `## 主流程` + `## 边界` + `## 实现说明` + `## 结果`  
**唯一质量线 = 完整**（无精简/标准档）。单档 full 不减厚度。

## 2. 叙述五段式校验

| 规则 | 挡住什么 |
|------|----------|
| `DEV-FLOW-*` | 缺入口 / 步数不在 3～8 / 无代码落点 |
| `DEV-EDGE-*` | 边界 <2、未挂第 N 步、未写怎么处理（码/toast/return） |
| `DEV-IMPL-块/字段` | 无【新写/改动】或缺目的/做什么/怎么做 |
| `DEV-IMPL-怎么做` | 逻辑块编号 <2 |
| `DEV-IMPL-怎么做语义` | 假厚：无 → 分支且无错误码/返回/toast 等结局 |
| `DEV-DO-对齐` | 摘要「做」点名的类/路径未出现在 ### 标题 |
| `DEV-BAN-步骤` | 出现旧 `## 步骤` |

壳层（wxml/json/css/Dto/module）允许短「怎么做」；Service/Controller/page/Repository 等必须编号 + 可执行语义。

## 3. 修改后请跑

```bash
cd skills/agileflow
# 若本机无 npm：用 Cursor helpers 的 node 依次跑
node scripts/validate-atlas/test-fixtures.mjs
node scripts/validate-atlas/test-skill-examples.mjs
```
