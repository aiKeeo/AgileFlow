/**
 * Agileflow FE 像素级对比：页面截图 vs 原型图（pixelmatch + sharp + playwright）
 *
 * 用法（须在项目根，或指定 --root）：
 *   node <skill>/scripts/fe-pixel/fe-pixel.mjs --root .
 *   FE_BASE_URL=http://127.0.0.1:5173 node <skill>/scripts/fe-pixel/fe-pixel.mjs
 *
 * 依赖（装到**项目**）：npm i -D playwright sharp pixelmatch
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 解析 CLI：--root / --help
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const args = { root: process.env.FE_PIXEL_ROOT || null, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--root' && argv[i + 1]) {
      args.root = argv[++i];
    }
  }
  return args;
}

/** 打印用法 */
function printHelp() {
  console.log(`Usage: node fe-pixel.mjs [--root <projectRoot>]
  FE_BASE_URL / FE_PIXEL_ROOT / FE_PIXEL_THRESHOLD / FE_PIXEL_MAX_DIFF_RATIO
  Config: atlas/tests/fe-pixel/pages.json ∪ UID「原型图」`);
}

/**
 * 动态加载依赖；缺包时给出可执行提示
 */
async function loadDeps() {
  const missing = [];
  /** @type {Record<string, any>} */
  const deps = {};
  for (const name of ['playwright', 'sharp', 'pixelmatch']) {
    try {
      deps[name] = await import(name);
    } catch {
      missing.push(name);
    }
  }
  if (missing.length) {
    console.error(
      `[fe-pixel] 缺少依赖: ${missing.join(', ')}\n` +
        `  请在项目根执行: npm i -D playwright sharp pixelmatch\n` +
        `  然后: npx playwright install chromium`
    );
    process.exit(2);
  }
  return {
    chromium: deps.playwright.chromium,
    sharp: deps.sharp.default || deps.sharp,
    pixelmatch: deps.pixelmatch.default || deps.pixelmatch,
  };
}

/**
 * 向上查找含 atlas/ 的仓库根（跳过仅有 skill 自身、无业务 atlas 的目录）
 * @param {string} startDir
 * @param {string | null} explicitRoot
 */
function findRepoRoot(startDir, explicitRoot) {
  if (explicitRoot) {
    const abs = path.resolve(explicitRoot);
    if (!fs.existsSync(path.join(abs, 'atlas'))) {
      console.error(`[fe-pixel] --root 下无 atlas/: ${abs}`);
      process.exit(2);
    }
    return abs;
  }

  let dir = path.resolve(startDir);
  for (let i = 0; i < 12; i++) {
    const atlas = path.join(dir, 'atlas');
    if (fs.existsSync(atlas)) {
      // skill 目录若误放空 atlas 仍可能误判；优先有 requirements 或 todo 的
      const hasTodo = fs.existsSync(path.join(atlas, 'todo.md'));
      const hasReq = fs.existsSync(path.join(atlas, 'requirements'));
      const hasLogs = fs.existsSync(path.join(atlas, 'logs'));
      if (hasTodo || hasReq || hasLogs || i === 0) return dir;
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  console.error(
    '[fe-pixel] 找不到项目 atlas/。请在项目根运行，或加 --root <项目根> / FE_PIXEL_ROOT'
  );
  process.exit(2);
}

/**
 * @param {string} repoRoot
 * @param {string} p
 */
function resolveUnderRepo(repoRoot, p) {
  if (!p) return null;
  return path.isAbsolute(p) ? p : path.join(repoRoot, p);
}

/** @param {string} dir */
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/** @param {string} filePath */
function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * 文件名安全化（避免中文/空格弄坏路径）
 * @param {string} id
 */
function safeFileId(id) {
  return String(id).replace(/[^\w.-]+/g, '_').replace(/^_|_$/g, '') || 'page';
}

/**
 * @param {string} content
 * @returns {string[]}
 */
function extractPrototypePathsFromUid(content) {
  const paths = [];
  const re = /原型图[：:]\s*`?([^`\n\s]+\.(?:png|jpe?g|webp|gif))`?/gi;
  let m;
  while ((m = re.exec(content)) !== null) {
    paths.push(m[1].trim());
  }
  return paths;
}

/**
 * 从 UID 扫描对比项
 * @param {string} repoRoot
 */
function discoverFromUidDocs(repoRoot) {
  const uiRoot = path.join(repoRoot, 'atlas', 'requirements', 'ui');
  if (!fs.existsSync(uiRoot)) return [];

  /** @type {object[]} */
  const pages = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        if (name === 'prototypes') continue;
        walk(full);
        continue;
      }
      if (!/^UID-\d+.*\.md$/i.test(name)) continue;
      const content = fs.readFileSync(full, 'utf8');
      const protos = extractPrototypePathsFromUid(content);
      if (protos.length === 0) continue;

      const idMatch = name.match(/UID-(\d+)/i);
      const id = idMatch ? `UID-${idMatch[1]}` : path.basename(name, '.md');
      const routeMatch = content.match(/路由[：:]\s*`?(\/[^`\n\s]*)`?/i);
      const selectorMatch = content.match(/截图选择器[：:]\s*`?([^`\n]+)`?/i);

      for (let i = 0; i < protos.length; i++) {
        pages.push({
          id: i === 0 ? id : `${id}-${i + 1}`,
          path: routeMatch?.[1] || '/',
          selector: selectorMatch?.[1]?.trim() || 'body',
          prototype: protos[i],
          uid: path.relative(repoRoot, full).replace(/\\/g, '/'),
        });
      }
    }
  };
  walk(uiRoot);
  return pages;
}

/**
 * 合并 pages.json 与 UID 扫描（同一 prototype 以 json 为准）
 * @param {object[]} fromJson
 * @param {object[]} fromUid
 */
function mergePageLists(fromJson, fromUid) {
  const byProto = new Map();
  for (const p of fromUid) {
    if (!p?.prototype) continue;
    byProto.set(normPathKey(p.prototype), p);
  }
  for (const p of fromJson) {
    if (!p?.prototype) continue;
    byProto.set(normPathKey(p.prototype), p);
  }
  return [...byProto.values()];
}

/** @param {string} p */
function normPathKey(p) {
  return String(p).replace(/\\/g, '/').replace(/^\.\//, '');
}

/**
 * 加载配置：仅 atlas/tests/fe-pixel/pages.json + UID「原型图」并集
 * @param {string} repoRoot
 */
function loadConfig(repoRoot) {
  const projectPages = path.join(repoRoot, 'atlas', 'tests', 'fe-pixel', 'pages.json');
  const skillDefaults = path.join(__dirname, 'fe-pixel.pages.json');

  let raw = readJson(projectPages);
  let configPath = raw ? projectPages : null;
  if (!raw) {
    raw = readJson(skillDefaults) || {};
    configPath = skillDefaults;
  }

  const fromJson = Array.isArray(raw.pages) ? raw.pages.filter((p) => p && p.prototype) : [];
  const fromUid = discoverFromUidDocs(repoRoot);
  const pages = mergePageLists(fromJson, fromUid).filter((p) => {
    // 无路由且非 json 显式项：UID 缺路由时仍允许 path=/，但须有原型路径
    return Boolean(p.prototype);
  });

  const viewport = raw.viewport || { width: 1280, height: 720 };

  return {
    configPath,
    baseUrl: (process.env.FE_BASE_URL || raw.baseUrl || 'http://127.0.0.1:5173').replace(/\/$/, ''),
    routerMode: raw.routerMode || 'history',
    basePath: raw.basePath || '',
    threshold: Number(process.env.FE_PIXEL_THRESHOLD || raw.threshold || 0.1),
    maxDiffRatio: Number(process.env.FE_PIXEL_MAX_DIFF_RATIO || raw.maxDiffRatio || 0.02),
    maxDiffPixels: Number(process.env.FE_PIXEL_MAX_DIFF || raw.maxDiffPixels || 0),
    maxAspectDelta: Number(raw.maxAspectDelta ?? 0.05),
    settleMs: Number(raw.settleMs ?? 400),
    viewport: {
      width: Number(viewport.width || 1280),
      height: Number(viewport.height || 720),
    },
    pages,
  };
}

/**
 * @param {object} cfg
 * @param {string} pagePath
 */
function buildPageUrl(cfg, pagePath) {
  if (/^https?:\/\//i.test(pagePath)) return pagePath;
  const p = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
  if (cfg.routerMode === 'hash') return `${cfg.baseUrl}/#${cfg.basePath}${p}`;
  if (cfg.routerMode === 'path') return `${cfg.baseUrl}${p}`;
  return `${cfg.baseUrl}${cfg.basePath}${p}`;
}

/**
 * 宽高比差是否超限
 * @param {number} w1
 * @param {number} h1
 * @param {number} w2
 * @param {number} h2
 * @param {number} maxDelta
 */
function aspectDeltaTooLarge(w1, h1, w2, h2, maxDelta) {
  if (!h1 || !h2) return true;
  const a1 = w1 / h1;
  const a2 = w2 / h2;
  return Math.abs(a1 - a2) / Math.max(a1, a2) > maxDelta;
}

/**
 * 读图元信息
 * @param {any} sharp
 * @param {Buffer|string} input
 */
async function readImageMeta(sharp, input) {
  const meta = await sharp(input).metadata();
  return { width: meta.width || 0, height: meta.height || 0 };
}

/**
 * 缩放到目标尺寸 raw RGBA（contain + 白底，避免 fill 拉伸变形）
 * @param {any} sharp
 * @param {Buffer|string} input
 * @param {number} width
 * @param {number} height
 */
async function toRawRgbaContain(sharp, input, width, height) {
  const { data, info } = await sharp(input)
    .resize(width, height, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/**
 * @param {any} sharp
 * @param {any} pixelmatch
 * @param {Buffer} shotRaw
 * @param {Buffer} protoRaw
 * @param {number} width
 * @param {number} height
 * @param {number} threshold
 * @param {string} diffOutPath
 */
async function compareAndWriteDiff(
  sharp,
  pixelmatch,
  shotRaw,
  protoRaw,
  width,
  height,
  threshold,
  diffOutPath
) {
  const diffBuffer = Buffer.alloc(width * height * 4);
  const diffCount = pixelmatch(shotRaw, protoRaw, diffBuffer, width, height, { threshold });
  await sharp(diffBuffer, { raw: { width, height, channels: 4 } }).png().toFile(diffOutPath);
  return diffCount;
}

/**
 * 单页对比（原型尺寸为 SSOT）
 */
async function compareOnePage(deps, page, cfg, item, outDir, repoRoot) {
  const { sharp, pixelmatch } = deps;
  const protoPath = resolveUnderRepo(repoRoot, item.prototype);
  const id = item.id || 'page';

  if (!protoPath || !fs.existsSync(protoPath)) {
    return {
      id,
      status: 'FAIL',
      reason: `原型图不存在: ${item.prototype}`,
      prototype: item.prototype,
      diffCount: null,
      diffRatio: null,
    };
  }

  const url = buildPageUrl(cfg, item.path || '/');
  const selector = item.selector || 'body';

  await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForSelector(selector, { timeout: 30_000 });
  if (cfg.settleMs > 0) {
    await new Promise((r) => setTimeout(r, cfg.settleMs));
  }

  const locator = page.locator(selector).first();
  const shotBuffer = await locator.screenshot({ type: 'png' });

  const protoMeta = await readImageMeta(sharp, protoPath);
  const shotMeta = await readImageMeta(sharp, shotBuffer);

  if (
    aspectDeltaTooLarge(
      shotMeta.width,
      shotMeta.height,
      protoMeta.width,
      protoMeta.height,
      cfg.maxAspectDelta
    )
  ) {
    return {
      id,
      status: 'FAIL',
      reason: `宽高比偏差过大：截图 ${shotMeta.width}x${shotMeta.height} vs 原型 ${protoMeta.width}x${protoMeta.height}（maxAspectDelta=${cfg.maxAspectDelta}）`,
      prototype: item.prototype,
      diffCount: null,
      diffRatio: null,
    };
  }

  // 以原型尺寸为权威，截图 contain 对齐（避免 fill 拉伸造假）
  const targetW = protoMeta.width;
  const targetH = protoMeta.height;
  const shot = await toRawRgbaContain(sharp, shotBuffer, targetW, targetH);
  const proto = await toRawRgbaContain(sharp, protoPath, targetW, targetH);

  const fileId = safeFileId(id);
  const shotPath = path.join(outDir, `${fileId}-actual.png`);
  const diffPath = path.join(outDir, `${fileId}-diff.png`);
  await sharp(shotBuffer).png().toFile(shotPath);

  const diffCount = await compareAndWriteDiff(
    sharp,
    pixelmatch,
    shot.data,
    proto.data,
    targetW,
    targetH,
    cfg.threshold,
    diffPath
  );

  const total = targetW * targetH;
  const diffRatio = total > 0 ? diffCount / total : 1;
  const overPixels = cfg.maxDiffPixels > 0 && diffCount > cfg.maxDiffPixels;
  const overRatio = diffRatio > cfg.maxDiffRatio;
  const passed = !overPixels && !overRatio;

  return {
    id,
    status: passed ? 'PASS' : 'FAIL',
    url,
    selector,
    prototype: item.prototype.replace(/\\/g, '/'),
    uid: item.uid || null,
    width: targetW,
    height: targetH,
    diffCount,
    diffRatio: Number(diffRatio.toFixed(6)),
    maxDiffRatio: cfg.maxDiffRatio,
    actual: path.relative(repoRoot, shotPath).replace(/\\/g, '/'),
    diff: path.relative(repoRoot, diffPath).replace(/\\/g, '/'),
    reason: passed
      ? null
      : `差异像素 ${diffCount}（占比 ${(diffRatio * 100).toFixed(2)}%）超过阈值`,
  };
}

/**
 * 写 JSON + Markdown 到 atlas/tests/fe-pixel/
 * @param {string} outRoot
 * @param {object} report
 */
function writeReports(outRoot, report) {
  ensureDir(outRoot);
  const jsonPath = path.join(outRoot, 'report.json');
  const mdPath = path.join(outRoot, 'summary.md');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const lines = [
    '# FE 像素级对比报告',
    '',
    `- 时间：${report.finishedAt}`,
    `- baseUrl：${report.baseUrl}`,
    `- 结论：**${report.summary}**`,
    `- 阈值：threshold=${report.threshold} · maxDiffRatio=${report.maxDiffRatio}`,
    `- viewport：${report.viewport?.width}x${report.viewport?.height}`,
    '',
    '| id | 状态 | 差异像素 | 占比 | prototype |',
    '|----|------|----------|------|-----------|',
  ];
  for (const r of report.results) {
    lines.push(
      `| ${r.id} | ${r.status} | ${r.diffCount ?? '-'} | ${
        r.diffRatio != null ? `${(r.diffRatio * 100).toFixed(2)}%` : '-'
      } | ${r.prototype || r.reason || ''} |`
    );
  }
  lines.push('');
  fs.writeFileSync(mdPath, lines.join('\n'), 'utf8');
  return { jsonPath, mdPath };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const deps = await loadDeps();
  const repoRoot = findRepoRoot(process.cwd(), args.root);
  const cfg = loadConfig(repoRoot);

  if (!cfg.pages.length) {
    console.error(
      '[fe-pixel] 无对比项：在 UID 写「原型图」+「路由」，或落盘 atlas/tests/fe-pixel/pages.json'
    );
    process.exit(2);
  }

  const outRoot = path.join(repoRoot, 'atlas', 'tests', 'fe-pixel');
  const artifactsDir = path.join(outRoot, 'artifacts');
  ensureDir(artifactsDir);

  console.log(`[fe-pixel] repo=${repoRoot}`);
  console.log(`[fe-pixel] baseUrl=${cfg.baseUrl} pages=${cfg.pages.length}`);
  console.log(`[fe-pixel] viewport=${cfg.viewport.width}x${cfg.viewport.height}`);
  console.log(`[fe-pixel] out=${outRoot}`);
  if (cfg.configPath) console.log(`[fe-pixel] config=${cfg.configPath}`);

  const browser = await deps.chromium.launch();
  const page = await browser.newPage({
    viewport: cfg.viewport,
    deviceScaleFactor: 1,
  });
  /** @type {object[]} */
  const results = [];

  try {
    for (const item of cfg.pages) {
      console.log(`[fe-pixel] compare ${item.id} …`);
      try {
        const r = await compareOnePage(deps, page, cfg, item, artifactsDir, repoRoot);
        results.push(r);
        console.log(`  → ${r.status}${r.reason ? ` (${r.reason})` : ''} diff=${r.diffCount}`);
      } catch (err) {
        results.push({
          id: item.id,
          status: 'FAIL',
          prototype: item.prototype,
          reason: err instanceof Error ? err.message : String(err),
          diffCount: null,
          diffRatio: null,
        });
        console.error(`  → FAIL`, err);
      }
    }
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => r.status !== 'PASS');
  const report = {
    finishedAt: new Date().toISOString(),
    baseUrl: cfg.baseUrl,
    threshold: cfg.threshold,
    maxDiffRatio: cfg.maxDiffRatio,
    viewport: cfg.viewport,
    summary: failed.length === 0 ? 'PASS' : 'FAIL',
    pass: results.length - failed.length,
    fail: failed.length,
    results,
  };

  const { jsonPath, mdPath } = writeReports(outRoot, report);
  console.log(`[fe-pixel] report → ${jsonPath}`);
  console.log(`[fe-pixel] summary → ${mdPath}`);
  console.log(`[fe-pixel] ${report.summary} (pass=${report.pass} fail=${report.fail})`);

  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('[fe-pixel] fatal', err);
  process.exit(1);
});
