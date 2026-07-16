#!/usr/bin/env node
/**
 * Skill 示例自检：确保 examples/ 下的示例能通过对应闸门。
 * 运行：node scripts/validate-atlas/test-skill-examples.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readText } from './lib/fs-utils.mjs';
import { validateAtlas, runGate, runDevLiteralCheck } from './index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..', '..');

const examples = {
  'dev-glance-login': path.join(skillRoot, 'examples', 'dev-glance-login'),
};

const devExemplars = [
  path.join(skillRoot, 'examples', 'dev-exemplar-BE.md'),
  path.join(skillRoot, 'examples', 'dev-exemplar-FE.md'),
];

/** 临时切换 env 中的 AF_PHASE，返回恢复函数 */
function withPhase(projectRoot, phase) {
  const envPath = path.join(projectRoot, 'atlas', 'agileflow.env');
  const original = readText(envPath) || '';
  const patched = original.replace(/^AF_PHASE=.*$/m, `AF_PHASE=${phase}`);
  fs.writeFileSync(envPath, patched, 'utf8');
  return () => fs.writeFileSync(envPath, original, 'utf8');
}

function reportResult(name, result) {
  const { passed, reporter } = result;
  const issues = reporter.getIssues();
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warn');
  if (passed && errors.length === 0) {
    console.log(`✅ ${name} 通过`);
    return true;
  }
  console.log(`❌ ${name} 失败（${errors.length} 个错误${warnings.length ? `, ${warnings.length} 个警告` : ''}）`);
  for (const issue of errors.concat(warnings)) {
    console.log(`   [${issue.rule}] ${issue.file || ''}: ${issue.message}`);
  }
  return false;
}

let allPassed = true;

// 1. dev-glance-login 示例
const glanceRoot = examples['dev-glance-login'];

// 1.1 REQ 内容格式校验：dev-glance-login 已推进到阶段 4，无法回头跑 req-confirm
// （req-confirm 要求 AF_PHASE=1）。此处用 validateAtlas 仅校验 REQ/UID 格式合规性，
// 作为示例质量的等价检查。
const reqOnlyResult = validateAtlas({ projectRoot: glanceRoot, phase: '1', only: ['dir', 'req'] });
allPassed = reportResult('dev-glance-login REQ/UID 格式校验', reqOnlyResult) && allPassed;

// 1.2 sol-confirm
const solResult = runGate('sol-confirm', { projectRoot: glanceRoot });
allPassed = reportResult('dev-glance-login sol-confirm', solResult) && allPassed;

// 1.3 dev-step1-literal for T-001 / T-002
for (const devFile of ['T-001-login-BE.md', 'T-002-login-FE.md']) {
  const devPath = path.join(glanceRoot, 'atlas', 'dev', devFile);
  const literalResult = runGate('dev-step1-literal', {
    projectRoot: glanceRoot,
    devFile: devPath,
  });
  allPassed = reportResult(`dev-glance-login dev-step1-literal ${devFile}`, literalResult) && allPassed;
}

// 2. dev-exemplar 单文件字面量检查
for (const exemplar of devExemplars) {
  const result = runDevLiteralCheck(exemplar, { mode: 'auto', tier: 'full' });
  if (result.passed) {
    console.log(`✅ ${path.basename(exemplar)} 字面量检查通过`);
  } else {
    allPassed = false;
    console.log(`❌ ${path.basename(exemplar)} 字面量检查失败`);
    for (const issue of result.issues) {
      console.log(`   [${issue.rule}] ${issue.message}`);
    }
  }
}

if (!allPassed) {
  console.log('\n部分示例未通过自检，请修复后再发布 skill。');
  process.exit(1);
}

console.log('\n全部示例自检通过。');
