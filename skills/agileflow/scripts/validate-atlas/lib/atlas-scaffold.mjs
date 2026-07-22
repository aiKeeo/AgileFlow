import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exists } from './fs-utils.mjs';
import { createEmptyLedger, DISPATCH_LEDGER_REL } from './rules/dispatch-ledger.mjs';
import { bootstrapRoleBaselines } from './rules/role-custom.mjs';
import { ensureFlowYaml } from './flow.mjs';

const ROLE_FILES = ['role-req.md', 'role-model.md', 'role-sol.md', 'role-dev.md'];

const HUMAN_TODO_SKELETON = `# 人类待办（humanTodo）

> AI 干不了的事，列在这里找你要。完成后改 ✅ 并通知 AI。

| 事项 | 来源阶段 | 状态 |
|------|----------|------|
| _（示例）提供 API 密钥 / 商户号 / .env 配置_ | _阶段_ | ⬜ 待办 |

> 人类完成请改状态为 ✅ 并通知 AI。细则 → skill \`templates/human-todo.md\`。
`;

/** 首启 todo 骨架（流程进度 + 决策占位；sol 阶段总控填 T 头） */
const TODO_SKELETON = `# 项目待办事项

## 项目信息
- 项目名称：
- 创建时间：
- 预计完成时间：

## 流程进度
- [ ] 项目盘点（init，仅 brownfield）
- [ ] 需求澄清
- [ ] 数据建模
- [ ] 方案设计（sol:）
- [ ] 开发实现
- [ ] 测试验收

## 决策委派（须与 agileflow.env 同步）
- 全局：未设置 | AI自主 | 用户决策
- 自阶段：—
- 备注：—

## 开发任务

> sol 阶段由总控写入 \`### T-xxx\` 任务头；进 dev 前须齐。

## 功能依赖

| 功能 ID | 依赖 |
|---------|------|
| — | — |

## 进行中
- **checkpoint**：\`—\` · 步骤 \`—\` · 更新于 \`YYYY-MM-DD\`
- 无

## 已完成任务
- 无

## 变更历史

| 时间 | 操作 | 说明 |
|------|------|------|
| — | 首启 scaffold | bootstrap 创建骨架 |
`;

/**
 * 定位 skill 根目录（用于读取 templates/role/ 源）
 */
function resolveSkillRoot() {
  if (process.env.AGILEFLOW_SKILL_ROOT) return process.env.AGILEFLOW_SKILL_ROOT;
  // lib/atlas-scaffold.mjs → lib → validate-atlas → scripts → skill root
  const here = fileURLToPath(import.meta.url);
  const libDir = path.dirname(here);
  const vaDir = path.dirname(libDir);
  const scriptsDir = path.dirname(vaDir);
  return path.dirname(scriptsDir);
}

/**
 * 检查 atlas/role/ 是否含完整 4 个角色文件
 * @param {string} projectRoot
 * @returns {boolean}
 */
export function hasProjectRoleTree(projectRoot) {
  const roleDir = path.join(projectRoot, 'atlas', 'role');
  if (!exists(roleDir)) return false;
  return ROLE_FILES.every((f) => exists(path.join(roleDir, f)));
}

/**
 * 首启脚手架：复制 skill role 模板到 atlas/role/（不覆盖已有）+ 创建 humanTodo.md 骨架
 * @param {string} projectRoot
 * @returns {{ role: { copied: string[], skipped: string[] }, human: { created: boolean, path: string } }}
 */
export function bootstrapAtlasScaffold(projectRoot) {
  const roleDir = path.join(projectRoot, 'atlas', 'role');
  if (!exists(roleDir)) fs.mkdirSync(roleDir, { recursive: true });

  const skillRoot = resolveSkillRoot();
  const skillRoleDir = path.join(skillRoot, 'templates', 'role');

  const copied = [];
  const skipped = [];

  for (const f of ROLE_FILES) {
    const dest = path.join(roleDir, f);
    if (exists(dest)) {
      skipped.push(f);
      continue;
    }
    const src = path.join(skillRoleDir, f);
    if (exists(src)) {
      fs.copyFileSync(src, dest);
    } else {
      // 源缺失：写最小占位（用户可从 skill templates/role/ 补全）
      fs.writeFileSync(
        dest,
        `# ${f.replace(/\.md$/, '')}\n\n> 角色提示词占位。请从 skill \`templates/role/${f}\` 复制完整内容并按项目自定义。\n`,
      );
    }
    copied.push(f);
  }

  const humanPath = path.join(projectRoot, 'atlas', 'humanTodo.md');
  let humanCreated = false;
  if (!exists(humanPath)) {
    fs.writeFileSync(humanPath, HUMAN_TODO_SKELETON);
    humanCreated = true;
  }

  const todoPath = path.join(projectRoot, 'atlas', 'todo.md');
  let todoCreated = false;
  if (!exists(todoPath)) {
    fs.writeFileSync(todoPath, TODO_SKELETON);
    todoCreated = true;
  }

  const flowBoot = ensureFlowYaml(projectRoot, skillRoot);

  const ledgerPath = path.join(projectRoot, DISPATCH_LEDGER_REL);
  let ledgerCreated = false;
  if (!exists(ledgerPath)) {
    fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
    fs.writeFileSync(ledgerPath, `${JSON.stringify(createEmptyLedger(), null, 2)}\n`);
    ledgerCreated = true;
  }

  const roleBaseline = bootstrapRoleBaselines(projectRoot, copied);

  return {
    role: { copied, skipped },
    human: { created: humanCreated, path: humanPath },
    todo: { created: todoCreated, path: todoPath },
    flow: { created: flowBoot.created, path: flowBoot.path },
    dispatch: { created: ledgerCreated, path: ledgerPath },
    roleBaseline: {
      created: roleBaseline.created,
      merged: Boolean(roleBaseline.merged),
      path: roleBaseline.path,
    },
  };
}
