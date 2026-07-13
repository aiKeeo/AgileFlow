#!/usr/bin/env node
/**
 * Agileflow atlas/ 校验 CLI + AI 流程闸门
 *
 * 用法（skill 可装在项目 .cursor/skills 或 ~/.cursor/skills；可用 AGILEFLOW_SKILL_ROOT）:
 *   node <skill>/scripts/validate-atlas.mjs --gate sol-confirm --root .
 *   node <skill>/scripts/validate-atlas.mjs --print-skill-root
 *   cd <skill> && npm run validate:sol
 */

import path from 'node:path';
import {
  validateAtlas,
  runDevLiteralCheck,
  runGate,
  listGates,
  resolveSkillRoot,
  formatPortableGateCommand,
} from './validate-atlas/index.mjs';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(arg);
    }
  }
  return args;
}

/** 解析 dev 文件路径（--dev-file 优先，--a7 为旧名兼容） */
function resolveDevFilePath(args) {
  const raw = args['dev-file'] ?? args.a7;
  return raw ? path.resolve(String(raw)) : null;
}

function printLiteralCheckResult(filePath, result) {
  console.log(`\n字面量校验 + 九段：${filePath}`);
  if (result.passed) {
    console.log('✅ 通过（可勾 ①）');
    return;
  }
  console.log('❌ 未通过');
  for (const issue of result.issues) {
    console.log(`  [${issue.rule}] ${issue.message}`);
  }
}

function printGates() {
  const gates = listGates();
  console.log('\nAI 流程闸门（落盘后 / AskQuestion 前 / 勾①前 须跑）：\n');
  for (const [id, g] of Object.entries(gates)) {
    console.log(`  ${id}`);
    console.log(`    时机: ${g.when}`);
    console.log(`    模块: ${g.modules.join(', ')}`);
    if (g.extra) console.log(`    说明: ${g.extra}`);
    console.log('');
  }
}

function main() {
  const args = parseArgs(process.argv);
  const root = args.root ? String(args.root) : process.cwd();
  const devFilePath = resolveDevFilePath(args);

  if (args['list-gates']) {
    printGates();
    process.exit(0);
  }

  if (args['print-skill-root']) {
    const skillRoot = resolveSkillRoot(root);
    console.log(skillRoot);
    process.exit(0);
  }

  if (args['print-cmd'] && args.gate) {
    console.log(
      formatPortableGateCommand(String(args.gate), {
        projectRoot: root,
        devFile: devFilePath ?? undefined,
      })
    );
    process.exit(0);
  }

  if (devFilePath && !args.gate) {
    const result = runDevLiteralCheck(devFilePath, { mode: args.mode ? String(args.mode) : 'auto' });
    if (args.json) {
      console.log(JSON.stringify({ file: devFilePath, ...result }, null, 2));
    } else {
      printLiteralCheckResult(devFilePath, result);
    }
    process.exit(result.passed ? 0 : 1);
  }

  if (args.gate) {
    const gateId = String(args.gate);
    console.log(`🚧 闸门: ${gateId}`);
    const result = runGate(gateId, {
      projectRoot: root,
      devFile: devFilePath ?? undefined,
      mode: args.mode ? String(args.mode) : 'auto',
      brownfield: args.greenfield ? false : args.brownfield ? true : 'auto',
      verbose: Boolean(args.verbose),
    });
    if (args.json) {
      console.log(JSON.stringify({ gateId, passed: result.passed, issues: result.reporter.getIssues() }, null, 2));
    } else {
      console.log(`   时机: ${result.gate.when}`);
      result.reporter.print({ verbose: Boolean(args.verbose) });
    }
    process.exit(result.passed ? 0 : 1);
  }

  const options = {
    projectRoot: root,
    phase: args.phase ?? 'all',
    mode: args.mode ? String(args.mode) : 'auto',
    verbose: Boolean(args.verbose),
  };
  if (args.greenfield) options.brownfield = false;
  else if (args.brownfield) options.brownfield = true;
  else options.brownfield = 'auto';
  if (args.only) options.only = String(args.only).split(',').map((s) => s.trim());

  console.log('🔍 Agileflow Atlas 校验');
  const { passed, reporter, mode, brownfield } = validateAtlas(options);
  console.log(`   根目录: ${root} | 阶段: ${options.phase} | 模式: ${mode} | brownfield: ${brownfield}`);

  if (args.json) {
    console.log(JSON.stringify({
      passed,
      errors: reporter.getIssues().filter((i) => i.severity === 'error'),
      warnings: reporter.getIssues().filter((i) => i.severity === 'warn'),
    }, null, 2));
  } else {
    reporter.print({ verbose: Boolean(args.verbose) });
  }
  process.exit(passed ? 0 : 1);
}

main();
