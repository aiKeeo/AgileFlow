## 2. 输入（总控会在文末注入）

派活前你必须已经读到以下信息，并当作约束执行：

- **Tid**：T-xxx
- **决策**：`AF_DECIDE`
- **上游**：
  - 所属 F/REQ 的 `solution/features/F-*.md` 或 `solution/contracts/API-*.md` / `UI-*.md`
  - 本 T 的写法锚点（API/UID/FE/BE）
- **必过 gate**：`validate-atlas --gate dev-step1-literal --dev-file atlas/dev/T-xxx-*.md`
- **并发上下文**：是否并行，是否已有 `active-edits.md` 占用行

---

## 3. 输出物（按这个顺序写，不要跳）

| 阶段 | 允许写入 | 不允许写入 |
|---|---|---|
| **① 构思** | `atlas/dev/T-xxx-*.md`（摘要+主流程+边界+实现说明+结果；此时结果可空） | 业务源码、改 todo、写其他 T |
| **② 写码** | 业务源码（仅限实现说明涉及路径）、`test/unit`（BE 1 AC ↔ 1 UT）、`active-edits.md` **本 T 行** | 其他 T、非本 T 的 active-edits 行 |
| **③ 证据** | 回填 `## 结果`（命令+exit0/✅/PASS）、薄 `test/ac`、AC 映射表；**回填对应 REQ AC「测试方法/状态」**（禁仍「③ 后填」） | 无证据自称通过；AC 仍后填却勾③ |

---

## 4. 质量约束（硬规则）

### 4.1 构思文件必须满足
- 摘要：5 条 bullet（本 T / 做 / 不做 / 上游 / AC）
- **全端统一 · 唯一完整质量线**：`## 主流程`（3～8 步，含 `> 入口：`）+ `## 边界`（≥2，挂第 N 步）+ `## 实现说明`（【新写/改动】含目的+做什么+怎么做；逻辑块怎么做编号 ≥2）→ 见 [dev-exemplar-FE](../examples/dev-exemplar-FE.md) / [dev-exemplar-BE](../examples/dev-exemplar-BE.md) · [dev-granularity](../templates/dev-granularity.md)（每段解释 + few-shot）
- 步骤里不要直接粘贴 JSON 或 API 契约；只引用路径
- FE/MP 必须链接到 `UI-xxx` / `UID-xxx`；BE 必须链接到 `API-xxx`

### 4.2 写码阶段必须满足
- 写码前：在 `active-edits.md` 登记本 T 占用行（如果文件存在）
- 先写单测（BE 1 AC ↔ 1 UT），再写实现
- 运行 `npm run lint` / `tsc` / `npm test` 等，保证不红
- 修改结束后释放 `active-edits.md` 本 T 行（微调 ≤ 5 行的「设计调整」可保留）

### 4.3 证据阶段必须满足
- `## 结果` 必须包含：具体命令 + 输出片段或 exit code / ✅ / PASS
- 可运行证据包括：编译通过、单测通过、启动无错、冒烟通过
- **有 FE（含小程序）**：阶段 5 / `test-entry` 另须 [Playwright 冒烟 + 截图 + AI 目视](../../../tools/fe-smoke-playwright.md)（H5）；禁止跳过
- 没证据就不能回填结果，不能自称通过

---


## 9. 必读清单（执行前必须读）

- `phases/04-development.md`（阶段质量要求）
- `templates/dev-granularity.md`（每段解释 + few-shot，**先读**）
- `templates/dev.md`（写码闸门）
- `examples/dev-exemplar-BE.md` 或 `examples/dev-exemplar-FE.md`（对本端）
- `templates/code-conventions.md` + `phases/05-testing.md`
- 本 T 上游的 `F-*.md` / `API-*.md` / `UI-*.md` / `UID-*.md`

---
