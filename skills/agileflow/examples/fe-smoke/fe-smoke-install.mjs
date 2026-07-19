/**
 * 安装 Playwright Chromium：国内镜像优先，失败回退官方 CDN。
 * 用法：node scripts/fe-smoke-install.mjs
 * 权威说明：agileflow templates/../tools/fe-smoke-playwright.md「安装 Chromium」
 */
import { spawnSync } from 'node:child_process'

const MIRROR = 'https://cdn.npmmirror.com/binaries/playwright'
const MIRROR_ALT = 'https://npmmirror.com/mirrors/playwright'

function runInstall(downloadHost) {
  const env = { ...process.env }
  if (downloadHost) {
    env.PLAYWRIGHT_DOWNLOAD_HOST = downloadHost
    console.log(`[fe-smoke-install] PLAYWRIGHT_DOWNLOAD_HOST=${downloadHost}`)
  } else {
    delete env.PLAYWRIGHT_DOWNLOAD_HOST
    console.log('[fe-smoke-install] 使用官方 CDN')
  }
  const r = spawnSync('npx', ['playwright', 'install', 'chromium'], {
    env,
    stdio: 'inherit',
    shell: true
  })
  return r.status === 0
}

function main() {
  if (runInstall(MIRROR)) {
    console.log('[fe-smoke-install] ok (mirror)')
    process.exit(0)
  }
  console.warn('[fe-smoke-install] 主镜像失败，试备用镜像…')
  if (runInstall(MIRROR_ALT)) {
    console.log('[fe-smoke-install] ok (mirror-alt)')
    process.exit(0)
  }
  console.warn('[fe-smoke-install] 镜像均失败，回退官方…')
  if (runInstall(null)) {
    console.log('[fe-smoke-install] ok (official)')
    process.exit(0)
  }
  console.error('[fe-smoke-install] 全部失败')
  process.exit(1)
}

main()
