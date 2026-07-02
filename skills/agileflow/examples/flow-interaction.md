# Agileflow 交互示例

## 示例 1：需求（单阶段）

**用户**：`req: 订单要支持优惠券抵扣`

→ AskQuestion 需求卡片 → **停止**  
→ REQ 草稿 + UID → AskQuestion 确认 → **阶段闸门** → **停止**

---

## 示例 2：方案（greenfield · 模式 B）

**用户**：`sol: 设计退款功能`

→ features + contracts → AskQuestion 技术栈 → **停**  
→ architecture + **`code-patterns-backend.md` 🌱** + todo → AskQuestion 方案确认 → **停**  
→ **阶段闸门** → **停止**

---

## 示例 3：开发（串行）

**用户**：阶段闸门已选「是，继续」→ T-000

→ TodoWrite：①构思 / ②写码 / ③验收  
→ **①** `atlas/dev/T-000-BE.md`（七 引用 `code-patterns-backend §3.1` 或 `codebase/p1-backend §3.1`）  
→ **②** 按 五 写码  
→ **③** test/ac 全绿 → T-000 ✅  
→ **首个典型功能 ③ 后 refresh §三**

**首行声明**：
`📍 Agileflow | 阶段：4-开发 | 步骤：②按构思开发 | 任务：T-000 | 写法：codebase §3.1`

---

## 示例 4：init（brownfield · 模式 B）

**用户**：`init:` 接手 lossfat-server

→ 扫描源码 → `init/codebase/p1-backend.md`（§一含架构模块）  
→ **不建** `p1-architecture.md` · **不建** `conventions/`  
→ AskQuestion init 确认 → **停止**

---

## 示例 5：违规反例

- ❌ init 建 `p1-architecture.md`（与 codebase §一 重复，已废弃）  
- ❌ conventions 与 codebase §三 双份维护  
- ❌ dev ② 不读写法锚点 §三  
- ❌ 没 ① 落盘就写源码  
- ❌ 阶段完成不 AskQuestion  

---

## 示例 6：只看成品

- **可**：任务间连续 ①→②→③  
- **不可**：跳过 ①；跳过 ③；跳过阶段闸门  

更多 → [code-pattern-scan.md](code-pattern-scan.md) · [dev-quickstart.md](../templates/dev-quickstart.md)
