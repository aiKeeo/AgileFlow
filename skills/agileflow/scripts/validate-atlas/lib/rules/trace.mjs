import path from 'node:path';
import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';

/**
 * 需求追溯链检查（req-trace）
 * REQ → F → T → AC → 验收报告
 * 阶段 5 硬挡：每个 AC ID 须逐条被 F / dev / tests 引用。
 */

/** @param {string} content */
function extractAcIds(content) {
  const ids = new Set();
  const re = /\bAC-\d{3}-\d{2}\b/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    ids.add(m[0]);
  }
  return [...ids];
}

function buildRefSet(contents) {
  const set = new Set();
  for (const c of contents) {
    for (const m of c.matchAll(/\bAC-\d{3}-\d{2}\b/g)) {
      set.add(m[0]);
    }
  }
  return set;
}

export function validateReqTrace(projectRoot, reporter) {
  const reqRoot = path.join(projectRoot, 'atlas', 'requirements');
  const solRoot = path.join(projectRoot, 'atlas', 'solution');
  const devRoot = path.join(projectRoot, 'atlas', 'dev');
  const testsRoot = path.join(projectRoot, 'atlas', 'tests');

  if (!exists(reqRoot)) return;

  const reqFiles = collectFiles(reqRoot, '.md').filter(
    (f) =>
      !path.basename(f).startsWith('README') &&
      !f.includes(`${path.sep}ui${path.sep}`) &&
      !f.includes(`${path.sep}temp${path.sep}`)
  );

  if (reqFiles.length === 0) return;

  const featureContents = exists(solRoot)
    ? collectFiles(path.join(solRoot, 'features'), '.md').map((f) => readText(f) || '')
    : [];
  const featureAcSet = buildRefSet(featureContents);
  const devFiles = exists(devRoot) ? collectFiles(devRoot, '.md') : [];
  const devContents = devFiles
    .filter((f) => path.basename(f) !== 'README.md' && !path.basename(f).startsWith('temp'))
    .map((f) => readText(f) || '');
  const devAcSet = buildRefSet(devContents);
  const testContents = exists(testsRoot)
    ? collectFiles(testsRoot, '.md').map((f) => readText(f) || '')
    : [];
  const testAcSet = buildRefSet(testContents);

  for (const reqFile of reqFiles) {
    const reqContent = readText(reqFile) || '';
    const relReq = rel(projectRoot, reqFile);
    const reqIdMatch = reqContent.match(/REQ-(\d+)/);
    if (!reqIdMatch) continue;
    const reqId = `REQ-${reqIdMatch[1]}`;

    const acIds = extractAcIds(reqContent);
    if (acIds.length === 0) {
      reporter.add({
        severity: 'error',
        rule: 'TRACE-REQ-AC',
        file: relReq,
        message: `${reqId} 未提取到任何 AC ID（格式 AC-NNN-NN），无法建立追溯链。`,
      });
      continue;
    }

    const hasFeature = featureContents.some((c) => c.includes(reqId));
    if (!hasFeature) {
      reporter.add({
        severity: 'error',
        rule: 'TRACE-REQ-F',
        file: relReq,
        message: `${reqId} 未关联任何 feature（solution/features/ 中无引用）。`,
      });
    }

    for (const acId of acIds) {
      const inFeature = featureAcSet.has(acId);
      const inDev = devAcSet.has(acId);
      const inTest = testAcSet.has(acId);

      if (!inFeature && hasFeature) {
        reporter.add({
          severity: 'error',
          rule: 'TRACE-AC-F',
          file: relReq,
          message: `${acId} 未在 solution/features/ 中被引用。`,
        });
      }

      if (!inDev) {
        reporter.add({
          severity: 'error',
          rule: 'TRACE-AC-T',
          file: relReq,
          message: `${acId} 未在 atlas/dev/ 任务中被引用（摘要 **AC** 或步骤内须含 AC ID）。`,
        });
      }

      if (!inTest) {
        reporter.add({
          severity: 'error',
          rule: 'TRACE-AC-REPORT',
          file: relReq,
          message: `${acId} 未在 atlas/tests/ 验收报告中被引用。阶段 5 须逐 AC 归档。`,
        });
      }
    }
  }
}
