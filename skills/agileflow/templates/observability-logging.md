# 可观测性与日志（语言无关）

> 阶段 3 写入 `atlas/solution/architecture.md` 可观测性章节、阶段 4 实现、阶段 5 验收均引用本文件。**以 architecture.md 为唯一依据**，禁止硬套某一语言或目录。

## 选型原则

| 项 | 要求 |
|----|------|
| 日志框架 | 使用该语言/框架**生态惯用方案**（见下表示例，非穷尽） |
| 格式 | 结构化：含 `timestamp`、`level`、`traceId`、`event`；JSON 或 key=value |
| 输出 | dev/prod **必须文件落盘**；路径在 architecture.md 约定；test profile 可仅控制台 |
| traceId | HTTP/API 入站生成，向下游与日志传递 |
| event | 名称、字段、级别以 architecture.md「REQ→event 映射表」为准；禁止未备案 event |

## 按技术栈选框架（architecture.md 中填实际选型）

| 栈 | 常用框架 | 配置/入口示例 |
|----|----------|---------------|
| Java / Kotlin | slf4j + logback / log4j2 | `logback-spring.xml`、`log4j2.xml` |
| Node / TypeScript | winston / pino | `logger.ts`、`logging.config.js` |
| Python | logging / structlog | `logging.conf`、`log_config.py` |
| Go | slog / zap / zerolog | `logger.go`、`zap` 初始化 |
| Rust | tracing / log | `tracing_subscriber` |
| .NET | Serilog / ILogger | `appsettings.json`、`Program.cs` |
| PHP | Monolog | `monolog.yaml` |
| 前端 | 可上报 + 本地 debug 文件（若 architecture.md 要求） | 按 architecture.md 约定 |

**禁止**：未在 architecture.md 选型就写死 `backend/logs/`、logback、winston 等。

## architecture.md 可观测性章节必须约定

```markdown
## 可观测性方案

### 技术选型
| 项 | 本项目选型 | 说明 |
|----|------------|------|
| 语言/框架 | {如 Java 17 + Spring Boot 3} | 与仓库一致 |
| 日志框架 | {如 slf4j + logback} | 生态惯用即可 |
| 格式 | JSON / key=value | 须含 traceId、event |
| 日志目录 | {如 logs/ 或 backend/logs/} | **按项目结构约定** |
| 日志文件 | {如 app.log, app.json.log} | 文件名在 architecture.md 写明 |
| 环境变量 | {如 LOG_PATH} | 可覆盖默认路径 |
| 链路追踪 | X-Request-Id / traceId | 入站生成并传递 |

### REQ → 可观测性映射表
| REQ | 场景ID | Then 关键词 | event 名 | 级别 | 打日志位置 | 关键字段 |

### 实现任务
- [ ] 日志框架 + traceId
- [ ] 文件落盘（dev/prod）
- [ ] 各 event 打点
```

## 开发实现检查（阶段 4）

1. 每个备案 event 已落地
2. API/关键路径入口出口 INFO + traceId
3. ERROR 含 traceId + 业务主键，禁止空 catch
4. 已配置落盘 appender/handler（非仅 stdout）
5. 日志目录启动后自动创建；目录进 `.gitignore`，可保留 `.gitkeep`
6. 测试注释/docstring 注明期望 `event=`

## 验收取证（阶段 5）

从 **architecture.md 约定的日志目录与文件名** 检索，示例（将 `{LOG_DIR}`、`{LOG_FILE}` 替换为 architecture.md 中的值）：

| 检查项 | Linux/macOS | Windows (PowerShell) |
|--------|-------------|----------------------|
| 日志目录 | `ls {LOG_DIR}/` | `Get-ChildItem {LOG_DIR}/` |
| 读日志 | `tail {LOG_DIR}/{LOG_FILE}` | `Get-Content {LOG_DIR}/{LOG_FILE} -Tail 20` |
| traceId | `grep traceId {LOG_DIR}/{LOG_FILE}` | `Select-String traceId {LOG_DIR}/{LOG_FILE}` |
| event | `grep {event_name} {LOG_DIR}/{LOG_FILE}` | `Select-String {event_name} {LOG_DIR}/{LOG_FILE}` |

报告须附：路径、命令、抽样片段（event + traceId）。
