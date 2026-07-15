import path from 'node:path';
import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';

/**
 * 需求追溯链检查（req-trace）
 * REQ → F → T → AC → 验收报告
 */
export function validateReqTrace(projectRoot, reporter) {
  const reqRoot = path.join(projectRoot, 'atlas', 'requirements');
  const solRoot = path.join(projectRoot, 'atlas', 'solution');
  const devRoot = path.join(projectRoot, 'atlas', 'dev');
  const testsRoot = path.join(projectRoot, 'atlas', 'tests');
  const todoPath = path.join(projectRoot, 'atlas', 'todo.md');

  if (!exists(reqRoot)) return;

  const reqFiles = collectFiles(reqRoot, '.md').filter(
    (f) =>
      !path.basename(f).startsWith('README') &&
      !f.includes(`${path.sep}ui${path.sep}`) &&
      !f.includes(`${path.sep}temp${path.sep}`)
  );

  if (reqFiles.length === 0) return;

  const todoContent = readText(todoPath) || '';
  const featureContents = exists(solRoot)
    ? collectFiles(path.join(solRoot, 'features'), '.md').map((f) => ({
        path: f,
        content: readText(f) || '',
      }))
    : [];
  const devContents = exists(devRoot)
    ? collectFiles(devRoot, '.md').map((f) => ({
        path: f,
        content: readText(f) || '',
      })).filter((d) => path.basename(d.path) !== 'README.md' && !path.basename(d.path).startsWith('temp'))
    : [];
  const testFiles = exists(testsRoot) ? collectFiles(testsRoot, '.md') : [];

  for (const reqFile of reqFiles) {
    const reqContent = readText(reqFile) || '';
    const relReq = rel(projectRoot, reqFile);
    const reqIdMatch = reqContent.match(/REQ-(\d+)/);
    if (!reqIdMatch) continue;
    const reqId = `REQ-${reqIdMatch[1]}`;

    const hasFeature = featureContents.some((f) =>
      f.content.includes(reqId) || f.content.includes(`requirements/${path.basename(reqFile)}`)
    );
    if (!hasFeature) {
      reporter.add({
        severity: 'warn',
        rule: 'TRACE-REQ-F',
        file: relReq,
        message: `${reqId} 未关联任何 feature（solution/features/ 中无引用）。`,
      });
    }

    const hasTaskForReq = featureContents.some((f) => {
      const fIdMatch = f.content.match(/F-(\d+)/);
      if (!fIdMatch) return false;
      return todoContent.includes(fIdMatch[0]);
    });
    if (!hasTaskForReq && hasFeature) {
      reporter.add({
        severity: 'warn',
        rule: 'TRACE-F-T',
        file: relReq,
        message: `${reqId} 关联的 feature 在 todo.md 中无对应开发任务。`,
      });
    }

    const hasDevWithAc = devContents.some((d) => {
      return (
        (d.content.includes(reqId) || /AC-\d+/.test(d.content)) &&
        (/-\s*\*\*AC\*\*[：:]/.test(d.content) || /AC-\d+/.test(d.content))
      );
    });
    if (hasFeature && !hasDevWithAc) {
      reporter.add({
        severity: 'warn',
        rule: 'TRACE-T-AC',
        file: relReq,
        message: `${reqId} 关联的 dev 任务中未找到引用 AC ID 的文件（摘要 **AC** 或步骤内 AC-xxx）。`,
      });
    }

    const hasAcceptanceReport = testFiles.some((t) => {
      const tContent = readText(t) || '';
      return tContent.includes(reqId) && /验收|acceptance/i.test(tContent);
    });
    if (!hasAcceptanceReport) {
      reporter.add({
        severity: 'info',
        rule: 'TRACE-REQ-REPORT',
        file: relReq,
        message: `${reqId} 暂无验收报告（atlas/tests/ 中无引用）。阶段 5 须产出。`,
      });
    }
  }
}
