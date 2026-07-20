# AgileFlow · Agent 复测手册

改完 `skills/agileflow` 之后，用真实 Agent 冒烟一次：看它能不能**只靠 skill**跑通，而不是靠你嘴喂流程。

---

## 你怎么用（一句话）

对当前会话说：

> 按 `AGENT-RETEST.md` 做一次复测。

然后它按下面「考官步骤」执行即可。

---

## 考官步骤（当前会话照做）

### 1. 准备空目录

任选一个新路径，例如：

`~/code/af-retest-YYYYMMDD`

没有就建空目录。

### 2. 开被试 Task

- 类型：`generalPurpose`，后台跑
- **prompt 只能是下面整段，一个字都不要加**

```
请使用本机 AgileFlow skill（目录：`/Users/fangtong.nan/AgileFlow/skills/agileflow`，入口 `SKILL.md`）执行：

/agileflow 做一个减肥小程序
java21 springboot3.5.5 taro4 +react +vite
什么都别问我 你定

在目录 `<上面的空目录>` 落盘（已有内容可接着做）。严格按该 skill 自行推进，直到开发完毕。
```

把 `<上面的空目录>` 换成真实路径。skill 目录若换了机器，改成你本机的 `…/skills/agileflow`。

### 3. 中途停了怎么办

被试每派完一批子任务往往会结束本轮。  
收到完成通知后：**resume，只发两个字——`继续`**。  
禁止再夹带闸门名、流程说明、exemplar 路径。

重复「继续」，直到它自己说开发完毕，或你决定收场。

### 4. 打分（以脚本为准，不信口头）

```bash
NODE="/Users/fangtong.nan/Desktop/Cursor.app/Contents/Resources/app/resources/helpers/node"
SKILL="/Users/fangtong.nan/AgileFlow/skills/agileflow"
WORK="<复测项目根>"

$NODE "$SKILL/scripts/agent-retest/score.mjs" --root "$WORK" --skill-root "$SKILL"
```

- exit 0 → 过
- 非 0 → 看终端失败项，或 `$WORK/atlas/logs/agent-retest-score.json`
- **靠改被试提示来「测过」= 无效复测**；应回去改 skill

（可选）先准备并打印同样提示词：

```bash
$NODE "$SKILL/scripts/agent-retest/prepare.mjs" --skill-root "$SKILL" --work-root "$WORK"
```

---

## 铁律

| 可以 | 不可以 |
|------|--------|
| 给被试 skill 路径 + 用户原话 + 落盘目录 | 教被试怎么写 ①、怎么过闸门 |
| 续跑只说「继续」 | 续跑时塞一堆「你要跑 dev-complete」 |
| 用 `score.mjs` 收场 | 听 Agent 说「完成了」就算过 |

---

## 和静态测试的关系

- `cd skills/agileflow && npm run test:validate` → fixture / 文档一致性（必跑、很快）
- 本手册 → 真实 Agent 端到端（慢，改完关键流程后再跑）
