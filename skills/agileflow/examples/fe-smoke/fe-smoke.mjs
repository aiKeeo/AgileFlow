/**
 * Agileflow 通用前端冒烟：逐页打开，收集 console.error / pageerror，截图 → atlas/logs。
 * 适用于任意浏览器可打开的 FE（Vite/React/Vue/Next/后台；小程序仅用 H5 形态测）。
 *
 * 用法：
 *   node scripts/fe-smoke.mjs
 *   FE_BASE_URL=http://127.0.0.1:5173 node scripts/fe-smoke.mjs
 *   FE_SMOKE_USER=demo FE_SMOKE_PASS=demo123 node scripts/fe-smoke.mjs
 *
 * 依赖：npm i -D playwright
 * 浏览器：node scripts/fe-smoke-install.mjs（镜像优先，见 ../tools/fe-smoke-playwright.md）
 * 配置：同目录 fe-smoke.pages.json（routerMode / baseUrl / pages）
 *
 * 产出：
 *   atlas/logs/fe-smoke.log
 *   atlas/logs/fe-smoke-report.json（含 screenshot 路径、blankSuspect）
 *   atlas/logs/fe-smoke-shots/{id}.png
 * 总控须 Read 截图并写 atlas/logs/fe-smoke-visual-review.md 后，test-entry 才过。
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** 解析仓库根（含 atlas/ 的目录） */
function findRepoRoot(startDir) {
  let dir = startDir
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'atlas'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return path.resolve(startDir, '../..')
}

const SCRIPT_DIR = __dirname
const REPO_ROOT = findRepoRoot(SCRIPT_DIR)
const LOG_DIR = path.join(REPO_ROOT, 'atlas', 'logs')
const SHOT_DIR = path.join(LOG_DIR, 'fe-smoke-shots')
const PAGES_FILE = path.join(SCRIPT_DIR, 'fe-smoke.pages.json')

/** 可见文本过短时标 blankSuspect（启发式；仍须 AI 目视） */
const BLANK_TEXT_THRESHOLD = 8

const SMOKE_USER = process.env.FE_SMOKE_USER || ''
const SMOKE_PASS = process.env.FE_SMOKE_PASS || ''

const IGNORE_CONSOLE = (process.env.FE_SMOKE_IGNORE || 'Download the React DevTools')
  .split('|')
  .map((s) => s.trim())
  .filter(Boolean)

/**
 * 读 pages.json；环境变量覆盖同名字段。
 * baseUrl / loginUrl / tokenKey / userKey 可写在 json，便于各项目免设 env。
 */
function loadConfig() {
  if (!fs.existsSync(PAGES_FILE)) {
    console.error(`[fe-smoke] 缺少配置: ${PAGES_FILE}`)
    process.exit(2)
  }
  const raw = JSON.parse(fs.readFileSync(PAGES_FILE, 'utf8'))
  if (!Array.isArray(raw.pages) || raw.pages.length === 0) {
    console.error('[fe-smoke] pages[] 为空')
    process.exit(2)
  }
  const baseUrl = (
    process.env.FE_BASE_URL ||
    raw.baseUrl ||
    'http://127.0.0.1:5173'
  ).replace(/\/$/, '')
  return {
    routerMode: raw.routerMode || 'history',
    basePath: raw.basePath || '',
    baseUrl,
    loginUrl:
      process.env.FE_SMOKE_LOGIN_URL ||
      raw.loginUrl ||
      `${baseUrl}/api/v1/auth/login`,
    tokenKey: process.env.FE_SMOKE_TOKEN_KEY || raw.tokenKey || 'token',
    userKey: process.env.FE_SMOKE_USER_KEY || raw.userKey || 'user',
    pages: raw.pages
  }
}

/**
 * 按 routerMode 拼 URL（通用，不绑框架）
 * - history: BASE + basePath + path
 * - hash: BASE + /#/ + path（去前导 /）
 * - path: BASE + path（path 可自带 query）
 */
function pageUrl(cfg, routePath) {
  if (/^https?:\/\//i.test(routePath)) return routePath

  const basePath = cfg.basePath
    ? `/${String(cfg.basePath).replace(/^\/|\/$/g, '')}`
    : ''
  const mode = cfg.routerMode || 'history'
  const base = cfg.baseUrl

  if (mode === 'hash') {
    const p = String(routePath).replace(/^\//, '')
    return `${base}/#/${p}`
  }

  if (mode === 'path') {
    const p = routePath.startsWith('/') ? routePath : `/${routePath}`
    return `${base}${p}`
  }

  // history（默认）
  let p = routePath.startsWith('/') ? routePath : `/${routePath}`
  if (p === '/') return `${base}${basePath || ''}` || `${base}/`
  return `${base}${basePath}${p}`
}

function shouldIgnoreConsole(text) {
  return IGNORE_CONSOLE.some((rule) => text.includes(rule))
}

/** 可选：用账号换 token，供 needsAuth 页注入 localStorage */
async function tryLoginToken(cfg) {
  if (!SMOKE_USER || !SMOKE_PASS) return null
  try {
    const res = await fetch(cfg.loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: SMOKE_USER, password: SMOKE_PASS })
    })
    const body = await res.json().catch(() => ({}))
    const token = body?.data?.token || body?.token || body?.data?.accessToken
    const userId = body?.data?.userId || body?.userId || body?.data?.id
    const username = body?.data?.username || SMOKE_USER
    if (!token) {
      console.warn('[fe-smoke] 登录响应无 token，needsAuth 页可能 SKIP', body)
      return null
    }
    return { token, user: { id: userId, username } }
  } catch (e) {
    console.warn('[fe-smoke] API 登录失败:', e.message)
    return null
  }
}

async function injectAuth(page, cfg, auth) {
  if (!auth) return
  await page.addInitScript(
    ({ tokenKey, userKey, token, user }) => {
      try {
        localStorage.setItem(tokenKey, token)
        localStorage.setItem(userKey, JSON.stringify(user))
      } catch (_) {}
    },
    {
      tokenKey: cfg.tokenKey,
      userKey: cfg.userKey,
      token: auth.token,
      user: auth.user
    }
  )
}

/**
 * 安全文件名：page id → shots 文件名
 * @param {string} id
 */
function shotFileName(id) {
  return `${String(id).replace(/[^a-zA-Z0-9._-]+/g, '_')}.png`
}

/**
 * 启发式：可见文本过短 → 疑似白屏/空壳
 * @param {import('playwright').Page} page
 */
async function detectBlankSuspect(page) {
  try {
    const text = await page.locator('body').innerText({ timeout: 3000 })
    const compact = String(text || '').replace(/\s+/g, '').trim()
    return compact.length < BLANK_TEXT_THRESHOLD
  } catch {
    return true
  }
}

async function smokeOnePage(browser, cfg, pageDef, auth) {
  const pageId = pageDef.id || pageDef.path
  const shotRel = path.join('atlas', 'logs', 'fe-smoke-shots', shotFileName(pageId))
  const shotAbs = path.join(REPO_ROOT, shotRel)
  const result = {
    id: pageId,
    path: pageDef.path,
    url: pageUrl(cfg, pageDef.path),
    ok: false,
    skipped: false,
    skipReason: '',
    consoleErrors: [],
    pageErrors: [],
    readySelector: pageDef.readySelector || 'body',
    screenshot: shotRel,
    blankSuspect: false
  }

  if (pageDef.needsAuth && !auth) {
    result.skipped = true
    result.skipReason = 'needsAuth 但未提供 FE_SMOKE_USER/PASS 或登录失败'
    result.screenshot = null
    return result
  }

  const context = await browser.newContext()
  const page = await context.newPage()
  const consoleErrors = []
  const pageErrors = []

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (shouldIgnoreConsole(text)) return
    consoleErrors.push(text)
  })
  page.on('pageerror', (err) => {
    pageErrors.push(String(err?.message || err))
  })

  if (pageDef.needsAuth && auth) {
    await injectAuth(page, cfg, auth)
  }

  try {
    await page.goto(result.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForSelector(result.readySelector, { timeout: pageDef.timeoutMs || 15000 })
    await new Promise((r) => setTimeout(r, 500))
    result.blankSuspect = await detectBlankSuspect(page)
    fs.mkdirSync(SHOT_DIR, { recursive: true })
    await page.screenshot({ path: shotAbs, fullPage: true })
    result.consoleErrors = consoleErrors
    result.pageErrors = pageErrors
    result.ok = consoleErrors.length === 0 && pageErrors.length === 0
  } catch (e) {
    result.consoleErrors = consoleErrors
    result.pageErrors = [...pageErrors, String(e.message || e)]
    result.ok = false
    try {
      fs.mkdirSync(SHOT_DIR, { recursive: true })
      await page.screenshot({ path: shotAbs, fullPage: true })
    } catch {
      result.screenshot = null
    }
  } finally {
    await context.close()
  }
  return result
}

async function main() {
  const cfg = loadConfig()
  fs.mkdirSync(LOG_DIR, { recursive: true })
  fs.mkdirSync(SHOT_DIR, { recursive: true })

  const auth = await tryLoginToken(cfg)
  const browser = await chromium.launch({ headless: true })
  const results = []
  const lines = []
  lines.push(`# FE Smoke ${new Date().toISOString()}`)
  lines.push(`BASE_URL=${cfg.baseUrl}`)
  lines.push(`routerMode=${cfg.routerMode}`)
  lines.push(`basePath=${cfg.basePath || '(none)'}`)
  lines.push(`auth=${auth ? 'yes' : 'no'}`)
  lines.push(`shots=${SHOT_DIR}`)
  lines.push('')

  try {
    for (const pageDef of cfg.pages) {
      const r = await smokeOnePage(browser, cfg, pageDef, auth)
      results.push(r)
      const status = r.skipped ? 'SKIP' : r.ok ? 'PASS' : 'FAIL'
      lines.push(`## [${status}] ${r.id}  ${r.url}`)
      if (r.skipReason) lines.push(`- skip: ${r.skipReason}`)
      if (r.screenshot) lines.push(`- screenshot: ${r.screenshot}`)
      if (r.blankSuspect) lines.push(`- blankSuspect: true（启发式；须 AI 目视）`)
      for (const e of r.pageErrors) lines.push(`- pageerror: ${e}`)
      for (const e of r.consoleErrors) lines.push(`- console.error: ${e}`)
      lines.push('')
      console.log(`[fe-smoke] ${status} ${r.id}${r.blankSuspect ? ' blankSuspect' : ''}`)
    }
  } finally {
    await browser.close()
  }

  const failed = results.filter((r) => !r.skipped && !r.ok)
  const skipped = results.filter((r) => r.skipped)
  const report = {
    ok: failed.length === 0,
    baseUrl: cfg.baseUrl,
    routerMode: cfg.routerMode,
    at: new Date().toISOString(),
    shotsDir: path.relative(REPO_ROOT, SHOT_DIR).replace(/\\/g, '/'),
    summary: {
      total: results.length,
      pass: results.filter((r) => r.ok).length,
      fail: failed.length,
      skip: skipped.length,
      blankSuspect: results.filter((r) => r.blankSuspect).length
    },
    results
  }

  const logPath = path.join(LOG_DIR, 'fe-smoke.log')
  const reportPath = path.join(LOG_DIR, 'fe-smoke-report.json')
  fs.writeFileSync(logPath, lines.join('\n'), 'utf8')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8')
  console.log(`[fe-smoke] wrote ${logPath}`)
  console.log(`[fe-smoke] wrote ${reportPath}`)
  console.log(`[fe-smoke] shots → ${SHOT_DIR}`)
  console.log(`[fe-smoke] summary`, report.summary)
  console.log(
    '[fe-smoke] 下一步：总控 Read 每张截图，写 atlas/logs/fe-smoke-visual-review.md（screenshotsReviewed: true + 每页 PASS）'
  )

  process.exit(report.ok ? 0 : 1)
}

main().catch((e) => {
  console.error('[fe-smoke] fatal', e)
  process.exit(2)
})
