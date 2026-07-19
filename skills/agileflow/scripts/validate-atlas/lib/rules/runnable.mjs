import path from 'node:path';
import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';
import { hasCommandTrace, hasTimestamp } from './command-trace.mjs';

/** @param {string} content */
export function extractSectionResult(content) {
  const match = content.match(/^## 结果[^\n]*/m);
  if (!match || match.index === undefined) return null;
  const rest = content.slice(match.index + match[0].length);
  const next = rest.search(/^## /m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

/** @param {string|null|undefined} body */
export function hasRunnableEvidence(body) {
  if (!body || body.replace(/\s/g, '').length < 30) return false;
  if (/写码后填|写码后补|编码后填|事后补|先码后|③\s*后填|勾③后填|验收后填写|待写码/i.test(body)) {
    return false;
  }
  if (/③\s*验收后填写/.test(body) && !/exit\s*0|✅|通过|PASS|\bUP\b|成功/i.test(body)) {
    return false;
  }

  const hasBuild = /编译|build|package|mvn|gradle|tsc|npm run|npm start|npm test|yarn|pnpm|vite|cargo|go build|dotnet|make|cmake|webpack|rollup|esbuild|swc|python|pytest|node|deno|bun|构建/i.test(body);
  const hasStartOrSmoke =
    /启动|能启|health|listening|Started|冒烟|smoke|主路径|HTTP\s*200|curl|探针|serve|dev server|launch|docker|运行/i.test(body);
  const hasResult = /exit\s*0|✅|通过|PASS|\bUP\b|成功|ok\b|BUILD SUCCESS|完成/i.test(body);

  return hasBuild && hasStartOrSmoke && hasResult;
}

export function validateRunnable(projectRoot, reporter) {
  const devRoot = path.join(projectRoot, 'atlas', 'dev');
  if (!exists(devRoot)) {
    reporter.add({
      severity: 'error',
      rule: 'RUN-D001',
      file: 'atlas/dev/',
      message: '缺少 atlas/dev/，无法核验可运行证据。',
    });
    return;
  }

  const files = collectFiles(devRoot, '.md').filter((f) => {
    const base = path.basename(f);
    return base !== 'README.md' && !base.startsWith('temp');
  });

  if (files.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'RUN-D002',
      file: 'atlas/dev/',
      message: '无 T 级 dev 文件，无法核验可运行证据。',
    });
    return;
  }

  for (const file of files) {
    const content = readText(file);
    if (!content) continue;
    const relPath = rel(projectRoot, file);
    const body = extractSectionResult(content);

    if (body === null) {
      reporter.add({
        severity: 'error',
        rule: 'RUN-RESULT-MISSING',
        file: relPath,
        message: '缺少「## 结果」段，无法核验可运行证据。',
      });
      continue;
    }

    if (!hasRunnableEvidence(body)) {
      reporter.add({
        severity: 'error',
        rule: 'RUN-RESULT-EVIDENCE',
        file: relPath,
        message:
          '「## 结果」须含编译/build + 启动或冒烟 + exit0/✅/PASS（须实际运行后写入）。',
      });
      continue;
    }

    // 硬闸：可运行证据须含命令痕迹，否则可被纯文字伪造
    if (!hasCommandTrace(body)) {
      reporter.add({
        severity: 'error',
        rule: 'RUN-RESULT-COMMAND',
        file: relPath,
        message: '「## 结果」须含实际执行的命令痕迹（如 `$ npm run build`、反引号命令或「命令：」）。',
      });
    }

    // 软闸：建议带时间戳，便于后续拒绝过期报告
    if (!hasTimestamp(body)) {
      reporter.add({
        severity: 'info',
        rule: 'RUN-RESULT-TIMESTAMP',
        file: relPath,
        message: '「## 结果」可带时间戳，便于后续验证报告未过期。',
      });
    }
  }
}
