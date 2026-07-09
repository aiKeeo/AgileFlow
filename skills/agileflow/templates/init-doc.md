# init 文档模板（atlas/init/）

> 阶段流程：[00-project-init.md](../phases/00-project-init.md)  
> 扫描与验收：[init-scan-checklist.md](init-scan-checklist.md)（**逐步勾选 + 落盘自检**）  
> 写法锚点（dev 共用）：[code-conventions.md](code-conventions.md)  
> **仅 brownfield**；greenfield **不建 init/**。

## 三件套分工（避免重复读）

| 文件 | 只管什么 | 不管什么 |
|------|----------|----------|
| **本文件 init-doc** | 各 init 文档 **正文模板**（写满什么节） | 扫描步骤、W1~W12 逐项、合格/不合格 |
| **init-scan-checklist** | **怎么扫**、codebase W/F/E 逐项、**AskQuestion 前自检** | 重复贴模板正文 |
| **code-conventions** | codebase **五段式结构**、init/dev **写法锚点生命周期** | 业务沙盘、实体业务用途 |

---

## 通用规则

| 标签 | 含义 |
|------|------|
| **P0** | 开工前：业务、环境、仓库 |
| **P1** | 写码前：栈、架构、代码、数据 |
| **L0~L6** | 分层标签；文内首行 `> **L0.5 · …** · 最后验证：{{日期}}` |

- **没有就不建**（不写 N/A、不建空目录）
- 术语 ≤8 → `p0-business`；>8 或跨域 → `glossary/p0-{域}.md`（**禁止**一词一文件）
- 多实体/关系/状态机 → 多个 `p1-*.md`，禁止合并后硬拆

---

## L0–L6 分层模型

> **痛点**：L0 业务 + L4 实体 → 新人读 15 个文件才拼出「怎么算」。  
> **解法**：L0.5 领域规则 + L3 API/排错 + L2 模块依赖 + L5 序列图。

```
L0   业务     README 沙盘、p0-business
L0.5 领域规则 p0-domain-math ★
L1   运行     p0-environment、p0-integrations
L2   架构     p1-tech-stack、p1-architecture
L3   接口     api-catalog、p1-errors
L4   数据     schema-overview、data/README、entities/、relations/
L5   代码     codebase/p1-*（§二~§四）
L6   验证     p1-testing
```

导航：**`LAYERS.md`** · 入口：**`README.md` 业务沙盘**（非纯文件索引）

**文件分工（禁止重复写）**：

| 文件 | 写 | 不写（→ 链到） |
|------|-----|----------------|
| `p1-architecture` | 模块一览、依赖 mermaid、跨 Service 调用 | 分层细节、模板、序列图 → codebase |
| `p0-domain-math` | 公式、边界、代码入口 | 字段明细 → entities |
| `codebase/p1-*` | §一目录 · §二规范 · §三模板 · §四序列图 · §五自检 | 模块职责 → architecture |
| `p0-business` | 业务、旅程、**实体↔功能对照**（P0 速查） | 字段/API 明细 → entities |
| `data/entities` | 业务用途 + ⭐ 字段 + 碰表 | Controller 模板 → codebase §三 |

---

## 目录（按需创建）

```
atlas/init/
├── README.md · LAYERS.md
├── p0-business.md（必建）· p0-domain-math.md（有计算则建）
├── p0-environment.md · p0-integrations.md · p0-repository.md · p0-quickstart.md（可选）
├── glossary/ · p1-tech-stack.md · p1-architecture.md
├── p1-errors.md · p1-testing.md
├── codebase/p1-{端}.md
└── data/
    ├── README.md · api-catalog.md · schema-overview.md
    ├── entities/ · relations/ · state-machines/（无则不存在）
```

---

## README.md（必有 · 业务沙盘）

```markdown
# {项目名} · 项目沙盘

> {为谁解决什么问题}（`{仓库路径}`）

## 一句话
{…}

## 三大业务闭环

### ⚖️ {闭环1}
\`\`\`
{步骤链}
\`\`\`
| 想知道… | 直达 |
|---------|------|
| {X 怎么算？} | [p0-domain-math.md §n](p0-domain-math.md) |
| 调哪些 API？ | [data/api-catalog.md](data/api-catalog.md) |

### 🍽️ {闭环2} · 🏆 {闭环3}
（同上：流程 + 想知道表）

## 新人 30 分钟路线
| 分钟 | 文档 | 收获 |
| 0–5 本文 · 5–15 domain-math · 15–20 architecture · 20–25 api-catalog · 25–30 codebase §四 |

## 快速入口
| 想… | 点 |
| 表干什么 | data/README → entities |
| 怎么算 | p0-domain-math |
| 有哪些 API | api-catalog |
| 报 400 | p1-errors |
| 怎么跑 | p0-environment |
| 怎么写码 | codebase §三 |

→ [LAYERS.md](LAYERS.md)

## 文档状态
- 类型：brownfield as-is · 状态：草稿|已确认 · 最后更新：{{日期}}

## 刷新记录
| 时间 | 变更 |
```

---

## LAYERS.md（推荐）

```markdown
> **分层导航** · 最后验证：{{日期}}

# init 分层（L0 → L0.5 → L6）

\`\`\`
L0 业务 · L0.5 领域 ★ · L1 运行 · L2 架构 · L3 接口 · L4 数据 · L5 代码 · L6 验证
\`\`\`

**15 分钟速览**：README → p0-domain-math → architecture → api-catalog → codebase §四

## L0 · 业务层
| 文档 | 内容 |
| README · p0-business | 沙盘、旅程、页面↔API |
**读完应能回答**：用户主路径是什么？

## L0.5 · 领域规则 ★
| p0-domain-math | 公式+边界+代码入口 |
**读完应能回答**：{核心指标}怎么算？缺什么会报错？

## L1 ~ L6
（每层：文档表 + **读完应能回答** 一句）

## 按任务跳转
| 我要… | 跳转 |
| 30 分钟懂业务 | README → domain-math → architecture |
| 加新 API | api-catalog 查重 → data/README 碰表 → codebase §三 → p1-testing |
| 排查数据 | data/README 场景 → relations → entities |
| 报 400 | p1-errors 前置自检表 |
```

---

## p0-business.md（必建）

> as-is 推断，不是新需求。无文档仍建，标「未找到」。

```markdown
> **P0** · 业务与用户 · 最后验证：{{日期}}

# 业务与用户

## 项目解决什么问题
## 目标用户 / 角色（来源列填具体文件）
## 核心业务场景（≥2 条动词链）

## 用户旅程（时序 · 推荐）
| 步骤 | 端/页面 | API | 碰表 |

## 实体 ↔ 功能对照（P0 速查 · 必建）
| 用户/界面 | 干什么 | 表 | 文档 |
> 细节 → data/entities/，此处不写字段

## 页面 ↔ API（有前端）
| 页面 | 路径 | 主要 API |

## 核心术语（≤8）
## 信息来源（勾选实际读过的）
## 未找到 / 待补充
```

---

## p0-domain-math.md（有业务计算则建）

> **从源码** Util/Service 摘录；禁止凭常识。

```markdown
> **L0.5** · 领域规则 · 最后验证：{{日期}}

# 核心业务规则手册

> L0=用户怎么用 · L4=表怎么存 · **本文件=算出来的值怎么来**

## 规则总览
| 业务概念 | 一句话 | 代码入口 |

## 1. {规则名}
### 公式链（源码摘录）
### 依赖数据
| 必填 | 表/字段 | 缺则 |
### 被谁用（含 catch 不抛错等特殊行为）
### 易误解点

## 跳转 → data/README · relations/p1-{场景} · p1-errors
```

---

## p0-integrations.md · p0-environment.md · p0-repository.md

按需建。integrations 含：OAuth/JWT/第三方/Mock、开发 vs 生产、公开 vs 鉴权接口。environment 含：依赖版本、启动命令、端口、阻塞点。

---

## p1-tech-stack.md

语言/框架/**精确版本**（来自 pom/package.json）+ 来源路径。

---

## p1-architecture.md

```markdown
> **L2** · 架构与模块 · 最后验证：{{日期}}

# 架构与模块

## 总体形态
## 模块依赖流向（mermaid · 对照 Service inject）
## 跨模块调用表
| 调用方 | 被调方 | 场景 | 失败行为 |
## 业务模块一览
| 模块 | 路径 | 职责 | 主要 Controller |

→ API：[data/api-catalog.md](data/api-catalog.md) · 写法：[codebase/p1-{端}.md](codebase/p1-{端}.md) §二~§四
```

---

## codebase/p1-{端}.md（模式 B · 五段式）

> §二 逐项要求 → [init-scan-checklist §codebase](init-scan-checklist.md#步骤-6--codebasep1-端md)  
> dev 生命周期 → [code-conventions.md](code-conventions.md)

```markdown
> **L5** · {端}代码 · 最后验证：{{日期}}

# {端}代码

## 一、目录结构
{树、入口、测试路径；模块职责 → p1-architecture}

## 二、写法规范
### 2.1 分层与命名 · 2.2 响应与异常 · 2.3 校验/鉴权/分页/事务
### 2.4 HTTP 与主键 · 2.5 模块参考（path:行号）· 2.6 前端（有则写）

## 三、代码模板
每节：参考 path:行号 · 适用 · 禁止偏离 · **真实代码块**
### 3.1 列表 · 3.2 详情 · 3.3 创建/更新 · 3.4 幂等/状态（无则标暂无）

## 四、典型请求链路（有 REST · 2~4 条 mermaid · 对照源码）
### 4.1 跨模块聚合 · 4.2 易误解链路

## 五、新功能自检（≥6 条项目特定）
```

无 REST → 四段式（跳过 §四，§五→§四）。模式 A → §一目录 + `atlas/conventions/`。

---

## data/README.md · api-catalog.md · schema-overview.md

**data/README**：

```markdown
> **L4** · 数据层入口 · 最后验证：{{日期}}

## 本层文档（schema · api-catalog · entities · relations）
## 表一览
## 业务场景 → 碰表清单（开发排查首选）
| 场景 | API/Service | 读表 | 写表 | 关系文档 |
## 关系文档索引
## 推断依据 + 主流程 text 简图
```

**api-catalog**：每行 **方法|路径|鉴权|说明|碰表|Controller**（有前端加页面列）。前缀/鉴权 legend 放文首。

**schema-overview**：ER mermaid、migration 演进、唯一约束→业务行为（upsert/幂等）。

---

## p1-errors.md · p1-testing.md

**p1-errors**（有 REST）：

```markdown
## 错误码表（errorCode|HTTP|message|场景|模块）
## 业务前置自检表
| 用户操作 | 遇到的错误 | 根因 | 先完成这些 |
## 推荐 onboarding 顺序（避免连环 400）
## 常见 message 速查 · 成功 vs 空响应
```

**p1-testing**：

```markdown
| 测试类 | 模块 | 主要 API | 说明 |
## 改模块时跑哪个
## 测试环境特性（mock、profile）
```

---

## data/entities/p1-{名}.md（融合模板）

> 验收 E1~E7 → [init-scan-checklist](init-scan-checklist.md#每份实体文档完成度)

```markdown
> **P1** · 实体 · {Entity} · 来源：{migration/Entity} · 最后验证：{{日期}}

# {Entity}（{table}）

## 业务用途（E1）
## 用户 / 界面里怎么用（E2）
## 相关 API（E3）
## 表定位（与 p0-business 对照一致）

## 字段清单
| 字段 | 类型 | 核心 | 说明 | 典型读写 |
| status | | ⭐ | {值→中文} | |

## 索引与约束 → 业务行为
## 碰表场景
## 跨模块只读本表
## 关联 → relations/
## 推断依据（E5）· 代码映射 Entity+Service（E7）
```

**禁止**：只有字段表、无业务用途。

---

## data/relations/

**简单 FK**（1 张表对 1 张）：

```markdown
# {A} → {B}
**一句话** · 类型 · 字段 · 约束 · 联查步骤 · → entities
```

**跨场景**（3+ 表 / 有公式 · 独立文件）：

```markdown
# {场景名}
## 入口 `{METHOD path}` → `{Service.method}`
## 碰表清单（顺序|表|读什么|产出）
## 计算公式 · 依赖链图
## 同类读法复用 · 缺数据行为
## 实体链接
```

---

## data/state-machines/p1-{名}.md

枚举表 + 流转 + 所属实体链接。

---

## glossary/p0-{域}.md

按域一个文件：术语|含义|代码/表对应|易混淆。

---

## AskQuestion 前

[init-scan-checklist 落盘自检](init-scan-checklist.md#init-落盘自检askquestion-前须全-) **全 ✅** → [init-askquestion.md](init-askquestion.md)
