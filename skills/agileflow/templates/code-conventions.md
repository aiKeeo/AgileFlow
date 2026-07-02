# 写法锚点（AI 写码规范）

> **目的**：让 AI **按项目既有写法**写码，而不是凭训练数据即兴发挥。  
> **默认模式 B**：结构 + 规范 + 模板 **一个文件**，**不建** `atlas/conventions/`。  
> living document：可先 🌱 种子，首个典型功能完成后从源码补充 §三。

---

## 两种落盘模式（二选一，禁止双份）

| | **模式 B（默认）** | **模式 A（显式选用）** |
|---|-------------------|------------------------|
| **文件** | 单文件四段式 | `atlas/conventions/` 目录 |
| **brownfield** | `init/codebase/p1-{端}.md` | `init/codebase/` 仅结构 + `conventions/*-patterns.md` |
| **greenfield** | `solution/code-patterns-{端}.md` | `conventions/` 🌱 种子 |
| **何时用** | 单端仓库、monorepo 单服务、**减冗余** | 全栈多端、前后端独立 refresh、用户明确要求 |
| **dev 七** | `codebase §3.x` 或 `code-patterns §3.x` | `conventions §2.x` |

**禁止**：同一项目同时维护完整 `conventions/` 与 `codebase/p1-*.md` §二§三。

---

## 单文件四段式（模式 B 标准结构）

```markdown
# {端}代码（目录 + 怎么写）

## 一、目录结构
{树、入口、配置、测试路径}

## 二、写法规范
{分层、命名、注解、响应、校验、禁止项}

## 三、代码模板（从现有代码摘录，含 path:行号）
### 3.1 分页列表 / 表单 / …
### 3.2 …
### 3.3 …
### 3.4 …（无则删）

## 四、新功能自检
- [ ] …
```

### 前后端四类模板

| 前端 §三 | 后端 §三 |
|----------|----------|
| 3.1 表单（校验/提交/重置） | 3.1 分页列表 |
| 3.2 表格（分页/搜索/操作列） | 3.2 详情 |
| 3.3 弹窗/抽屉 | 3.3 创建/更新 |
| 3.4 请求 service + hook | 3.4 幂等/状态变更（有则写） |

每条模板须含：`参考：{path}:{行号}` · `适用` · `禁止偏离`（2~3 条）

---

## 文档状态（模式 B 写在 init/README 或 solution/README）

| 状态 | 含义 | dev ② 行为 |
|------|------|------------|
| 🌱 | §二有约定，§三待补充 | 按 architecture + §二；**③ 后 refresh §三** |
| 📝 | 部分 §三 已有 | 有模板的对齐；缺的按 §二 |
| ✅ | 四类 §三 齐 | 严格对齐，只改字段 |

---

## 生命周期

```
brownfield init:  扫描源码 → 写满 init/codebase/p1-{端}.md（尽量 ✅）
greenfield sol:   定栈 → 建 solution/code-patterns-{端}.md 🌱（§三待补充）
dev 首个 CRUD:    ③ ✅ → 从源码摘录 refresh §三 → 📝
init: refresh codebase / 新模块新写法 → 增量更新 §三
```

### brownfield · init 步骤 6b

1. 判定模式：**默认 B**；用户说「独立 conventions / 全栈分开维护」→ A
2. 各找 1 份典型样本（列表页或 Controller、样式、service…）
3. **① 统计高频** → **② 摘录 §三 真实片段** → **③ 写入** `codebase/p1-{端}.md`
4. `p1-architecture.md` **只写模块一览**，分层/响应链到 codebase §二
5. 无样本标 **待补充**，**禁止** npm 文档冒充

扫描输入：

| 前端 | 后端 |
|------|------|
| 列表/CRUD 页 | Controller |
| 封装组件 | Service |
| 样式文件 | Repository/Mapper |
| service/hook | DTO + 统一响应 |

### greenfield · sol 步骤 6b

1. 技术栈 AskQuestion 确认后
2. 建 `solution/code-patterns-{backend|frontend}.md` 🌱：§一目录约定（来自 architecture）+ §二命名 + §三待补充
3. **不建** `atlas/init/`；**默认不建** `conventions/`

### dev 首个典型功能后（greenfield 必做）

某 T-xxx **③ ✅** 且为首个列表/CRUD/API → 从源码更新 `code-patterns-*.md` §三 + README 刷新记录

---

## dev 硬规则

**② 写码前**：

1. Read 写法锚点（见 [dev-quickstart.md](dev-quickstart.md) 定位表）
2. dev **七**：引用具体 `§3.x`
3. dev **五**：写「对齐 `{参考 path:行号}`」

**禁止**：

- ❌ 有锚点文件却不读就写码（W8）
- ❌ 引入 architecture/§二 未列出的库或分层
- ❌ brownfield 扫描编造模板
- ❌ greenfield 首个功能完成后不 refresh（永远 🌱）
- ❌ 锚点文件里写 REQ/AC/todo（那些属于 requirements/solution/dev）

---

## init 内分工（避免 architecture 与 codebase 重复）

| 文件 | 写什么 | 不写什么 |
|------|--------|----------|
| `p1-architecture.md` | 总体形态、模块一览、API 前缀 | 分层细节、响应格式、代码模板 |
| `codebase/p1-*.md` | §一目录 + §二写法 + §三模板 + §四自检 | 业务术语、REQ |
| `p0-business.md` | 业务、用户、实体对照（简表） | 代码模板 |
| `data/entities/` | 表/字段/业务用途 | 怎么写 Controller |

---

## 模式 A 附录（仅显式选用时）

```
atlas/conventions/
├── README.md          # 状态 🌱|📝|✅
├── frontend-patterns.md   # §1 高频 §2 模板 §3 自检
└── backend-patterns.md
```

init `codebase/p1-*.md` 只保留 §一目录，链到 `../../conventions/`。  
greenfield sol 建 `conventions/` 🌱 种子。dev 七 引用 `conventions §2.x`。

格式示例 → [code-pattern-scan.md](../examples/code-pattern-scan.md)
