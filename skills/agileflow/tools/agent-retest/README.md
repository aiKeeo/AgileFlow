# Agent 复测工具

操作说明只维护一份 → [../../../AGENT-RETEST.md](../../../AGENT-RETEST.md)

本目录文件：

| 文件 | 用途 |
|------|------|
| `PROMPT.ai.md` | 被试 prompt：AI 自主（「你定」） |
| `PROMPT.user.md` | 被试 prompt：用户决策（「我来决策」） |
| `USER-SIM.prompt.md` | user 模式扮用户答卡 |

```bash
node scripts/agent-retest/prepare.mjs --work-root <dir> --mode ai|user
node scripts/agent-retest/score.mjs --root <dir> --mode ai|user
```

**ORCH**：正式复测须台账含 `subagentId`；dev 须 `taskId`；禁 `degraded-single-session`。详见 [AGENT-RETEST.md](../../../AGENT-RETEST.md) §派活台账。
