# 前端 Playwright 冒烟（通用 · 页面可展示）

> **用途**：对**任意可在浏览器打开的前端**做页面冒烟——逐路由打开、收集 `console.error` / `pageerror`、确认能渲染（非白屏）。  
> **金标准脚本**：[examples/fe-smoke/fe-smoke.mjs](../examples/fe-smoke/fe-smoke.mjs)  
> **不替代**：可运行闸门 编译/启动、BE 接口冒烟、阶段 5 细 AC、微信开发者工具真机。

---

## 适用范围（通用，不绑框架）

| 前端形态 | 怎么测 |
|----------|--------|
| Web / SPA（React、Vue、Vite、Next 静态导出等） | **正常 `dev` / `preview` 启动** → Playwright 打开 `FE_BASE_URL` |
| 管理后台 / PC 站 | 同上；`routerMode` 多为 `history` |
| 小程序（Taro / uni-app 等） | **用其 H5 构建产物或 `dev:h5` 启动**再测；**禁止**声称已覆盖 weapp 真机 |
| 纯原生 weapp / 无 H5 | 本脚本**不适用** → 人工/开发者工具；AskQuestion 选跳过并写明原因 |

**原则**：脚本只认「浏览器里能打开的 URL」，不认框架名。

---

## 对抗式审查

| 点 | 结论 |
|----|------|
| 通用 Web FE | ✅ 启动后配 `FE_BASE_URL` + `pages.json` 即可 |
| 路由差异 | ✅ 配置 `routerMode`：`history`（默认）/ `hash`（Taro H5 等）/ `path`（完整 path 自管） |
| 读 console | ✅ 落盘 `atlas/logs/fe-smoke.*`，AI 可读 |
| 小程序 | ⚠️ **仅 H5 形态**；weapp 原生另测 |
| 无 FE 服务 | ❌ 须先启动；脚本不替你起服务 |
| 登录态 | ✅ 可选 API 登录 + 注入 localStorage（键名可配） |
| 替代全量 E2E | ❌ 只验「能开、不炸」 |
| **浏览器二进制下载** | ✅ **必须走镜像优先**（见下）；官方 CDN 国内极慢/超时，会卡死体验 |
| 镜像是否永远可用 | ⚠️ Playwright≥1.58 Chromium 走 CfT 路径；优先 `cdn.npmmirror.com/binaries/playwright`；失败再回退官方 |
| 装全套浏览器 | ❌ **只装 chromium**；勿 `install` 无参 |

**结论：可实现且应做成通用能力。** 可选增强；AskQuestion 决定是否跑。**安装浏览器时镜像优先，否则影响体验。**  
**有强制原型时**：另须 [fe-pixel-compare](fe-pixel-compare.md)（`test:pixel-fe`）。

---

## 安装 Chromium（镜像优先 · 防卡死）

> **权威仅此节**。其他文件只链到这里，禁止再抄一套命令。  
> npm 包镜像 ≠ 浏览器二进制；`registry.npmmirror.com` **不解** `playwright install` 慢的问题。

### Agent 必须

1. 首次跑 FE 冒烟前：若本机尚无 Playwright Chromium → **先装**，再跑脚本  
2. 安装命令 **默认带国内镜像**（见下）；超时/404 → 清掉 host 再试官方一次  
3. **只装 `chromium`**；已装过则跳过（`npx playwright install chromium` 幂等）  
4. 禁止默默挂在官方 CDN 上超过 ~2 分钟还不换镜像/回退

### 推荐命令

**PowerShell（Windows）**：

```powershell
$env:PLAYWRIGHT_DOWNLOAD_HOST="https://cdn.npmmirror.com/binaries/playwright"
npx playwright install chromium
# 若失败：
Remove-Item Env:PLAYWRIGHT_DOWNLOAD_HOST -ErrorAction SilentlyContinue
npx playwright install chromium
```

**bash / macOS / Linux**：

```bash
PLAYWRIGHT_DOWNLOAD_HOST=https://cdn.npmmirror.com/binaries/playwright npx playwright install chromium
# 若失败：
unset PLAYWRIGHT_DOWNLOAD_HOST && npx playwright install chromium
```

**项目脚本（推荐写入 package.json，免记 env）**：

```json
"smoke:fe:install": "node scripts/fe-smoke-install.mjs"
```

金标准安装包装：[examples/fe-smoke/fe-smoke-install.mjs](../examples/fe-smoke/fe-smoke-install.mjs)（内置镜像 → 失败回退官方）。

备用镜像（主镜像 404 时可试）：`https://npmmirror.com/mirrors/playwright`。

---

## 何时询问（AskQuestion）

命中**任一**且 architecture / todo 存在 **FE**（含 Web / 小程序-H5）：

1. **F-xxx / MVP 切片** 可运行闸门 过线后、阶段性确认卡之前或之中  
2. **阶段 5 · 测试入场 · 功能冒烟时**
3. 用户说「给用户看 / 演示 / 页面测一下」  
4. 用户前缀 **`test:smoke-fe`** / **`test:smoke`**（有 FE）→ **直接跑**，可跳过本卡

### 询问卡模板

```yaml
title: "前端页面冒烟（Playwright）"
questions:
  - id: fe_smoke_playwright
    prompt: |
      是否跑前端页面冒烟自动化？（通用：Web / 后台 / 小程序-H5）
      - 须已正常启动前端（如 npm run dev / dev:h5 / preview）
      - 打开 pages 清单每一页；收集 console.error / pageerror
      - 结果 → atlas/logs/fe-smoke.*
    options:
      - id: run_fe_smoke
        label: "跑 Playwright 前端冒烟"
      - id: skip_fe_smoke
        label: "跳过（仅人工/构建冒烟）"
      - id: later
        label: "稍后，先继续别的"
```

| 用户选 | Agent 必须 |
|--------|------------|
| 跑 | 确认 `FE_BASE_URL` 可访问 → 跑脚本 → Read report → FAIL 则修 FE；PASS 再继续 |
| 跳过 | 证据写「FE Playwright：用户跳过」；**不豁免**编译与启动冒烟 |
| 稍后 | 停 |

---

## 配置约定（项目侧）

| 项 | 约定 |
|----|------|
| 脚本 | `scripts/fe-smoke.mjs`（从 exemplar 复制） |
| 清单 | `scripts/fe-smoke.pages.json`（见下） |
| 产出 | `atlas/logs/fe-smoke.log` + `fe-smoke-report.json` |

### `fe-smoke.pages.json` 结构

```json
{
  "routerMode": "history",
  "basePath": "",
  "baseUrl": "http://127.0.0.1:5173",
  "tokenKey": "token",
  "userKey": "user",
  "pages": [
    { "id": "home", "path": "/", "readySelector": "body", "needsAuth": false },
    { "id": "login", "path": "/login", "readySelector": "body", "needsAuth": false },
    { "id": "dashboard", "path": "/dashboard", "readySelector": "[data-testid=dashboard], body", "needsAuth": true }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `routerMode` | `history`：`BASE + basePath + path`；`hash`：`BASE/#/path`；`path`：`path` 已是绝对或完整 URL 片段 |
| `basePath` | 如 `/admin`（无则 `""`） |
| `baseUrl` | 前端已启动的地址；可被 `FE_BASE_URL` 覆盖 |
| `tokenKey` / `userKey` | localStorage 键；可被 env 覆盖 |
| `pages[].path` | 路由路径；Web 常用 `/xxx`；小程序 H5 常用 `pages/xxx/index` |
| `readySelector` | 默认 `body`；建议业务根节点 |
| `needsAuth` | true 时需登录注入，否则 SKIP |

### 环境变量（可选；优先于 json）

| 变量 | 默认 | 说明 |
|------|------|------|
| `FE_BASE_URL` | json `baseUrl` 或 `http://127.0.0.1:5173` | Vite 常 5173；Next 常 3000；小程序 H5 常 10086 |
| `FE_SMOKE_USER` / `FE_SMOKE_PASS` | 空 | 可选登录 |
| `FE_SMOKE_LOGIN_URL` | `{BASE}/api/v1/auth/login` | 登录 API |
| `FE_SMOKE_TOKEN_KEY` / `USER_KEY` | json 或 `token` / `user` | localStorage 键 |
| `FE_SMOKE_IGNORE` | React DevTools 提示 | console 忽略子串，`\|` 分隔 |

### 过线（PASS）

每页：导航成功 + 无 `pageerror` + 无未忽略 `console.error` + `readySelector` 可见。

### 证据铁律（防假 PASS）

| 规则 | 说明 |
|------|------|
| **无报告 = 未跑** | 必须存在并 **Read** 过 `atlas/logs/fe-smoke-report.json`；仅口头「跑过了」无效 |
| **summary.ok !== true** | 不得标可运行闸门 / 测试入场 FE 冒烟通过 |
| **H5 ≠ weapp** | 本脚本只测浏览器 URL。微信开发者工具里的 `env: …,mp` 报错 **不在覆盖范围**；不得用 H5 PASS 声称「小程序控制台无错」 |
| **Chromium 未装成功** | install 失败/超时 → 冒烟未执行 → **FAIL/未跑**，禁止跳过装浏览器仍标 PASS |

**用户在开发者工具看到的报错**（如 `taroExports.useState is not a function`）→ 属 **weapp 真机/模拟器** 问题，须修 weapp 构建或人工验；**不能**用 Playwright H5 结果反驳。

---

## Agent 执行清单

```
1. AskQuestion → 停（test:smoke-fe / test:smoke 可跳过询问）
2. 选「跑」→ 确认前端已启动（architecture 中的 dev 命令）
3. 无 Chromium → 按「安装 Chromium（镜像优先）」执行 smoke:fe:install / fe-smoke-install.mjs
4. 无 pages.json → 按路由/菜单生成（Web：router；小程序：app.config → 仅 H5 测）
5. pages.json 写对 baseUrl + routerMode（Web=history；小程序 H5=hash）
6. node scripts/fe-smoke.mjs
7. Read atlas/logs/fe-smoke-report.json
8. FAIL → 修 → 重跑；PASS → 写入可运行闸门 / 测试入场证据
```

---

## 正误

**✅** Web / 后台：正常 `npm run dev` → Playwright  
**✅** 小程序：仅 `dev:h5` / H5 产物 → Playwright（勿冒充 weapp）  
**✅** 安装浏览器：**镜像优先**，失败再官方；只装 chromium  
**✅** 用户跳过并记录  
**❌** 把「仅 H5 冒烟」写成「小程序真机已测」  
**❌** 默认写死某一端口 / 只认某一框架路径  
**❌** 不询问就声称每页测过  
**❌** 裸跑官方 `playwright install` 卡住也不换镜像（糟蹋用户时间）  
**❌** 在 askquestion-gate / 05 / l1-l5 再复制一套安装命令（只链本文）  
**❌** 无 `fe-smoke-report.json` 或未 Read 报告就声称冒烟通过  
**❌** 用 H5 Playwright PASS 否认微信开发者工具（mp）控制台报错  
