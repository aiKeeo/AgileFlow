# AgileFlow 快速上手

> **安装约 1 分钟；完整跑完一个功能约 30 分钟**（含落盘、闸门、可运行证据）。下文按实战顺序说明你会遇到什么。

---

## 1. 安装（1 分钟）

```bash
git clone https://github.com/aiKeeo/AgileFlow.git
cp -r AgileFlow/skills/agileflow YOUR_PROJECT/.cursor/skills/
```

支持的 AI 工具：Cursor、Claude Code、Trae。其他工具将 `skills/agileflow` 复制到对应 Skills 目录即可。

### 首启脚手架（写入**项目** atlas/，不是 skill 目录）

在**你的业务项目根**执行（`--root` = 项目根）：

```bash
node YOUR_PROJECT/.cursor/skills/agileflow/scripts/validate-atlas.mjs --bootstrap-scaffold --root YOUR_PROJECT
```

产出（均在 `YOUR_PROJECT/atlas/` 下）：

- `role/role-req|model|sol|dev.md` — Subagent 提示词（可改）
- `humanTodo.md` — 需人类协助的事项
- `todo.md` — **流程进度骨架**（sol 阶段总控填入 T 任务头；开发进度看这里）
- `agileflow-dispatch.json` — 派活台账（Subagent 回报后总控追加 entry，再跑 gate）
- `role/.agileflow-role-baseline.json` — role 哈希 baseline（改动 role 后对应文档闸门自动跳过）

---

## 2. 三句话启动第一个功能

在你配置好 AgileFlow 的 AI 工具中，说：

```
走 agileflow，做一个待办清单 API
```

（第一句没说谁决策 → AI 会发**启动卡**问你：连做/严谨 × 我来/AI全权。若说「你定，别问我，直接做完」→ 跳卡走连做+AI。）

| 组合 | 体验 |
|------|------|
| 连做 + 我来 | 少停，关键点仍问你 |
| 连做 + AI 全权 | 很少问，可自动进下一阶段 |
| 严谨 + 我来 | 分步确认 |
| 严谨 + AI 全权 | 不问选型，但每阶段审阅（可说「不想看了」让 AI 接管） |

中途随时可说「后面都你定 / 不想看了」让 AI 接管剩余流程。

| 轮次 | AI 做什么 | **你只需** | 落盘/闸门 |
|:----:|----------|----------|-----------|
| 1 | 发首启卡（若未点明决策） | 选「连做 + 我来」或「连做 + AI」 | 写 `atlas/agileflow.env` |
| 2 | 写需求文档（REQ） | 确认需求对不对 | `atlas/requirements/` + `req-confirm` |
| 3 | 写技术方案 + 任务拆解 | 确认方案（严谨模式）或等交付（连做+AI） | `atlas/solution/` + `sol-confirm` |
| 4 | 逐任务写代码 + 编译 + 冒烟 | 连做+AI 时可不说「继续」；严谨/user 时点卡 | 每 T：`dev/T-*.md` + 闸门 |
| 5 | 跑验收测试，出报告 | 拿到可部署的代码 | `atlas/tests/` + `test-entry` |

> **连做模式**（`AF_FLOW=fast`）= **少停点 + 可并行**，不是少写文档。铁律详见 [contract §1](templates/contract.md#1-两维--env)。

---

## 3. 三种典型用法

### 场景 A：连做交付一个 Demo（~1 小时）

```
走 agileflow，连做模式，AI 自主。做一个用户登录 API（JWT + MySQL）
```

AI 会按序落盘 REQ → sol → dev，有 ≥2 无冲突 T 时自动并行，每步过闸门。

### 场景 B：严谨交付核心业务（半天~1 天）

```
走 agileflow，严谨模式。做一个微信支付回调模块，要处理并发和幂等
```

与连做的差异只在**停点**，不在文档厚度。

### 场景 C：改已有项目（brownfield）

```
init: 扫描当前项目
```

AI 扫描代码库写入 `atlas/init/`，之后再走正常流程。

---

## 4. 术语速查卡（实战会遇到）

| 你会看到 | 是什么 | 你不用管 |
|----------|--------|----------|
| **atlas/** | 所有项目文档目录 | — |
| **连做模式** / `fast` | 少停、可并行；**不减文档** | env 键名 |
| **严谨模式** / `strict` | 每阶段停等你确认 | — |
| **启动卡** | 首问：连做还是严谨、谁决策 | 选一次即可 |
| **①②③** | 每开发任务：构思→写码→验收 | AI 按序做 |
| **T-001-BE** | 一个开发任务切片 | 命名规则 |
| **闸门红** | 检查没过，不能进阶 | 说「继续让 AI 修」 |
| **humanTodo** | 需要你提供的密钥/资源 | 配好后说「已配置」 |
| **继续 agileflow** | 断点续作 | 新对话说这句 |

更多 env/错误码 → [TROUBLESHOOTING](TROUBLESHOOTING.md) · [contract](templates/contract.md)

---

## 5. 常用命令

| 你说 | 效果 |
|------|------|
| `走 agileflow` | 从头开始五阶段流程 |
| `继续 agileflow` | 从上次停的地方接着跑 |
| `req: 做登录` | 只做需求澄清 |
| `mod: 用户模型` | 只做数据建模 |
| `sol: 退款` | 只做技术方案 |
| `dev:` | 进入开发实现 |
| `tests:` | 跑验收测试 |
| `你定 / 别问我` | 切换为 AI 自主决策 |

---

## 6. 常见问题

**Q: 我关掉对话了，怎么接着来？**

打开新对话，说「继续 agileflow」。AI 会读 `atlas/todo.md` 从断点接着做，不用重复解释。

**Q: 需求写到一半发现不对？**

直接说「需求不对，xxx 要改成 yyy」。AI 会触发变更管理，按纠偏阶梯回到对应阶段修改。

**Q: AI 要我提供 API 密钥但我还没申请？**

AI 会把这类事情写入 `atlas/humanTodo.md`。你先去申请，好了回来说「继续 agileflow」，AI 自动解除阻塞。

**Q: 修一行 bug 也要走全流程？**

不用——**但仅当项目未启用 AgileFlow**（无 `atlas/agileflow.env` / `requirements/`）。已启用 AF 时任何写码须 `--gate write-code` 绿（文档先行硬锁）。

**Q: 闸门报错看不懂？**

报错行末有 `💡 白话说明 · 谁修`；或查 [TROUBLESHOOTING](TROUBLESHOOTING.md)。

**Q: 根目录突然多了 atlas/ 文件夹？**

那是 AgileFlow 的工作目录，建议加入 `.gitignore`，但 `atlas/requirements/` 和 `atlas/model/` 等关键文档建议提交以便团队共享。

---

## 7. 下一步

- 完整工作流 → [README.zh-CN.md](../README.zh-CN.md)
- 更改管理 → [phases/change-management.md](phases/change-management.md)
