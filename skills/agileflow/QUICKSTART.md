# AgileFlow 快速上手

> 5 分钟，从克隆仓库到跑出第一个功能。

---

## 1. 安装（1 分钟）

```bash
git clone https://github.com/aiKeeo/AgileFlow.git
cp -r AgileFlow/skills/agileflow YOUR_PROJECT/.cursor/skills/
```

支持的 AI 工具：Cursor、Claude Code、Trae。其他工具将 `skills/agileflow` 复制到对应 Skills 目录即可。

---

## 2. 三句话启动第一个功能

在你配置好 AgileFlow 的 AI 工具中，说：

```
走 agileflow，快速模式，做一个待办清单 API，今天就要上线
```

接下来会发生：

| 轮次 | AI 做什么 | 你做什么 | 落盘/闸门 |
|:----:|----------|----------|-----------|
| 1 | 发首启卡：确认「快速模式 + 你决策还是 AI 自主」 | 选「快速 + 我来决策」 | 写 `atlas/agileflow.env` |
| 2 | 写需求文档（REQ） | 确认需求对不对 | 落盘 `atlas/requirements/REQ-*.md` + `ui/UID-*.md`；跑 `req-confirm` |
| 3 | 写技术方案 + 任务拆解 | 确认方案 | 落盘 `atlas/solution/architecture.md` + `features/F-*.md` + `contracts/`；跑 `sol-confirm` |
| 4 | 逐任务写代码 + 编译 + 冒烟 | 说「继续」 | 每 T 写 `atlas/dev/T-*.md` → 跑 `dev-step1-literal` → 写码 → 跑可运行闸门 → 勾③ |
| 5 | 跑验收测试，出报告 | 拿到可部署的代码 | 写 `atlas/tests/REQ-*-验收报告.md`；跑 `test-entry` |

**快速模式不是省文档，而是省停点。**AI 仍须按阶段落盘、跑 `validate-atlas` 闸门、产出可运行证据，你才能拿到可部署的代码。

---

## 3. 三种典型用法

### 场景 A：快速交付一个 Demo（~1 小时）

```
走 agileflow，快速模式，AI 自主。做一个用户登录 API（JWT + MySQL）
```

AI 会：写 `REQ-001` → 跑 `req-confirm` → 写 **同质** `sol: architecture + F-001 + contracts/API-001` → 跑 `sol-confirm` → 拆 `T-001/T-002` → 每 T 写细 `dev/T-*.md` → 有 ≥2 无冲突 T 时**推并行启动卡** → 批量①后 Subagent 并行写码 → 可运行闸门 → 验收。快速=少停+并发，**不**薄写 sol/dev。

### 场景 B：严谨交付核心业务（半天~1 天）

```
走 agileflow，严谨模式。做一个微信支付回调模块，要处理并发和幂等
```

支付/并发/幂等触发「完整档」（风险分档，与快速/严谨正交）：方案与 dev 流程表+字面量严检；默认串行；每阶段须用户确认或审阅闸门。sol/dev 颗粒度与快速同档，只是停点更多。

### 场景 C：改已有项目（brownfield）

```
init: 扫描当前项目
```

AI 会扫描你的代码库，识别技术栈、代码约定、现有架构，写入 `atlas/init/`，之后再走正常流程。

> ⚠️ **快速模式警示**：快速 ≠ 跳过阶段 ≠ 薄文档。仍须 `req → sol → dev` 按序落盘，sol/dev 与严谨**同质**（边界清晰、步骤有落点），每个开发任务必须有 `①构思 / ②写码 / ③AC`，勾③前必须过可运行闸门。**要加速 → 并发作业**（并行启动卡），不是少写方案/构思。

---

## 4. 核心概念（10 秒版）

| 概念 | 是什么 |
|------|--------|
| **atlas/** | 所有项目文档的文件夹（需求、模型、方案、开发记录、测试报告） |
| **快速模式** | 少问 + **推并发**加速；sol/dev **不减质**；不减闸门、不减可运行证据 |
| **严谨模式** | 多确认、默认串行、阶段结束审阅卡；sol/dev 与快速**同质** |
| **AI 自主** | AI 帮你做选择，你只看结果点头。说「你定」即可启用 |
| **闸门** | 每阶段结束的检查点，不过就不能进入下一阶段 |
| **继续 agileflow** | 关掉对话再回来，说这句从断点接着跑 |

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

不用。AgileFlow 会自动识别微型改动（豁免通道），L1+L3 几分钟搞定。

**Q: 根目录突然多了 atals/ 文件夹？**

那是 AgileFlow 的工作目录，建议加入 `.gitignore`，但 `atlas/requirements/` 和 `atlas/model/` 等关键文档建议提交以便团队共享。

---

## 7. 下一步

- 完整工作流 → [README.zh-CN.md](../README.zh-CN.md)
- 跟竞品对比 → [COMPARISON.md](COMPARISON.md)
- 更改管理 → [phases/change-management.md](phases/change-management.md)
