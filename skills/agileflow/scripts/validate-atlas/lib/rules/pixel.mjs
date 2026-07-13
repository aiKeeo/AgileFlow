import fs from 'node:fs';
import path from 'node:path';
import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';

/**
 * 规范化路径
 * @param {string} p
 */
function normProto(p) {
  return String(p || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '');
}

/**
 * 从 UID / pages.json 收集「强制对比」原型清单
 * 注意：prototypes/ 目录散图不单独挡门（须 UID 声明或写入 pages.json）
 * @param {string} projectRoot
 * @returns {{ hasProto: boolean, sources: string[], expectedProtos: string[] }}
 */
function discoverPrototypes(projectRoot) {
  /** @type {string[]} */
  const sources = [];
  /** @type {Set<string>} */
  const expected = new Set();

  const uiRoot = path.join(projectRoot, 'atlas', 'requirements', 'ui');
  if (exists(uiRoot)) {
    for (const file of collectFiles(uiRoot, '.md')) {
      const content = readText(file);
      if (!content) continue;
      const re = /原型图[：:]\s*`?([^`\n\s]+\.(?:png|jpe?g|webp|gif))`?/gi;
      let m;
      let hit = false;
      while ((m = re.exec(content)) !== null) {
        hit = true;
        expected.add(normProto(m[1].trim()));
      }
      if (hit) sources.push(rel(projectRoot, file));
    }
  }

  const pagesJson = path.join(projectRoot, 'atlas', 'tests', 'fe-pixel', 'pages.json');
  if (exists(pagesJson)) {
    try {
      const raw = JSON.parse(fs.readFileSync(pagesJson, 'utf8'));
      if (Array.isArray(raw.pages)) {
        let any = false;
        for (const p of raw.pages) {
          if (!p?.prototype) continue;
          any = true;
          expected.add(normProto(p.prototype));
        }
        if (any) sources.push(rel(projectRoot, pagesJson));
      }
    } catch {
      /* ignore */
    }
  }

  return {
    hasProto: expected.size > 0,
    sources,
    expectedProtos: [...expected],
  };
}

/**
 * 读 atlas/tests/fe-pixel/report.json
 * @param {string} projectRoot
 */
function readPixelReport(projectRoot) {
  const p = path.join(projectRoot, 'atlas', 'tests', 'fe-pixel', 'report.json');
  if (!exists(p)) return null;
  try {
    return { path: rel(projectRoot, p), data: JSON.parse(fs.readFileSync(p, 'utf8')) };
  } catch {
    return { path: rel(projectRoot, p), data: null };
  }
}

/**
 * 未覆盖的原型路径
 * @param {object[]} results
 * @param {string[]} expectedProtos
 */
function findUncoveredProtos(results, expectedProtos) {
  const covered = new Set();
  for (const r of results || []) {
    if (!r || r.status !== 'PASS' || !r.prototype) continue;
    covered.add(normProto(r.prototype));
  }
  return expectedProtos.filter((p) => !covered.has(normProto(p)));
}

/**
 * 有强制原型时：须 report.json PASS 且覆盖 expectedProtos
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 */
export function validatePixelCompare(projectRoot, reporter) {
  const { hasProto, sources, expectedProtos } = discoverPrototypes(projectRoot);
  if (!hasProto) return;

  const reportFile = 'atlas/tests/fe-pixel/report.json';
  const report = readPixelReport(projectRoot);
  if (!report) {
    reporter.add({
      severity: 'error',
      rule: 'PIXEL-R001',
      file: reportFile,
      message: `须跑 fe-pixel（来源：${sources.slice(0, 3).join(', ')}${
        sources.length > 3 ? '…' : ''
      }）。权威 → templates/fe-pixel-compare.md`,
    });
    return;
  }

  if (!report.data) {
    reporter.add({
      severity: 'error',
      rule: 'PIXEL-R002',
      file: report.path,
      message: 'report.json 无法解析。',
    });
    return;
  }

  const results = Array.isArray(report.data.results) ? report.data.results : [];
  if (results.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'PIXEL-R004',
      file: report.path,
      message: 'results 为空，禁止 summary 充数。',
    });
    return;
  }

  if (String(report.data.summary || '').toUpperCase() !== 'PASS') {
    reporter.add({
      severity: 'error',
      rule: 'PIXEL-R003',
      file: report.path,
      message: `像素对比未通过（summary=${report.data.summary}）。见 fe-pixel-compare「没过怎么办」。`,
    });
    return;
  }

  if (!report.data.finishedAt) {
    reporter.add({
      severity: 'error',
      rule: 'PIXEL-R005',
      file: report.path,
      message: '缺少 finishedAt（须脚本生成，禁止手写 PASS）。',
    });
    return;
  }

  const uncovered = findUncoveredProtos(results, expectedProtos);
  if (uncovered.length > 0) {
    reporter.add({
      severity: 'error',
      rule: 'PIXEL-R006',
      file: report.path,
      message: `未覆盖强制原型：${uncovered.slice(0, 5).join(', ')}${
        uncovered.length > 5 ? '…' : ''
      }（仅 UID「原型图」∪ pages.json，目录散图不计入）。`,
    });
  }
}
