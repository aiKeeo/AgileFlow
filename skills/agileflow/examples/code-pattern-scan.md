# 写法锚点 · 工作流示例

> 默认 **模式 B**：`p1-architecture` + **`p1-frontend` / `p1-backend`（资产索引靠前）**，**不建**平行 catalog。  
> 完整规则 → [code-conventions.md](../templates/code-conventions.md)

---

## brownfield（接手老项目 · init:）

```
init:
  扫描源码
  → p1-architecture.md（仅模块依赖）
  → codebase/README（可选：FE/BE 读谁）
  → p1-frontend.md：速查 →【资产索引】→ §一~§五
  → p1-backend.md：同上（服务/Util + 参考调用）
  → init-scan-checklist 落盘自检全 ✅ → AskQuestion
```

```
dev: T-002 [BE] 新接口
  ① Read p1-backend 资产索引 → 流程表注意点写落点（继续走/在…上加/照…/新写）→ 按需 Read §3.3
  ② 复用路径写入 5.x；禁止平行造轮子
  ③ test/ac 全绿；若新建 Util → refresh 资产索引一行
```

```
dev: T-011 [FE] 表单页
  ① 原型/3.1 → 控件类型 → Read p1-frontend 资产索引 → 流程表注意点写落点
  ② 打开一个参考页抄结构；键名对齐 3.2
```

---

## greenfield（从零 · sol: + dev:）

```
sol:
  → code-patterns-frontend.md / code-patterns-backend.md 🌱
     （速查 + 资产「待建设」+ §一§二；§三待补）

dev: 首个表单/CRUD ③ ✅
  → refresh 本端资产索引 + §三 → 📝
```

---

## AI 最小链（省力）

```
T 头 [FE]|[BE]
  → Read 本端一个锚点文件
  → 只用「资产索引」写流程表注意点落点
  → 需要抄时再 Read「一个」§3.x +「一个」参考页
  → 写码
```

**❌** 每个 T 读双端全书 · 资产藏文末 · 另起 catalog  
**✅** 路径可复制 · 库存靠前 · 按需二次 Read
