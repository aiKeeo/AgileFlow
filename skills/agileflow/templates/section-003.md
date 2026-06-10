# 003-solution.md 章节模板

> §7 可观测性详见 [observability-logging.md](observability-logging.md)（语言无关，按栈选型）。

## §6 测试环境与外部依赖

```markdown
## 测试环境与外部依赖

### 依赖清单
| 依赖 | 类型 | 是否必需 | L3 策略 | L5 策略 | 获取/配置方式 | 占位示例 |
|------|------|----------|---------|---------|---------------|----------|
| PostgreSQL | 数据库 | 是 | testcontainers / 内存 | 本地 Docker | docker compose up -d db | DATABASE_URL=postgres://... |
| 微信支付 | 第三方 API | 核心流程必需 | mock / WireMock | 沙箱商户号 | 联系财务 / humanTodo #N | WECHAT_MCH_ID=、API_KEY= |

### 环境变量与配置文件
- 测试专用：`.env.test` 或 `config/test.yaml`
- 禁止：测试代码硬编码生产密钥

### 启动顺序（本地全量验证）
**一条命令**（优先）：按项目栈填写，如 `docker compose up -d && mvn test` / `npm test`

### 无法自动化的场景（若有）
| REQ | 场景 | 原因 | 人工验证步骤 |
|-----|------|------|--------------|

### Mock 与真连边界
- L3：默认 mock 列表
- L5：必须真连列表；缺则写 humanTodo
```

## §7 可观测性方案（强制独立章节）

按 [observability-logging.md](observability-logging.md) 填写「技术选型」与「REQ→event 映射表」；**日志目录/框架随本项目栈约定，禁止复制其他项目路径**。

## 方案自检表

| 检查项 | 不通过则 |
|--------|----------|
| 存在 `## 可观测性方案` | 禁止进阶段 4 |
| REQ→event 覆盖核心 Then | 补行或退回阶段 1 |
| 含日志目录 + 框架选型（非空） | 补 [observability-logging.md](observability-logging.md) |
| §测试环境与 §可观测性 独立 | 拆分 |

## todo 同步示例

```markdown
- [ ] 任务1：创建数据库表（30min）
- [ ] 任务2：实现订单实体类（20min）
```
