# FE 像素级对比（唯一权威）

> 脚本：`scripts/fe-pixel/fe-pixel.mjs` · 点名：`test:pixel-fe`  
> 落库：`atlas/tests/fe-pixel/` · 其它文档只链到本页，勿重复抄流程。

## 目录

```
atlas/tests/fe-pixel/
├── pages.json    # 可选配置（多页/自定义 selector 时必写）
├── report.json   # 跑完结果（闸门只认这个）
├── summary.md
└── artifacts/
```

## 强制清单（与闸门一致 · 勿冲突）

**计入阻塞闸门 / 须对比** =  

1. UID 写了 `原型图：…png`，或  
2. `atlas/tests/fe-pixel/pages.json` 的 `pages[]`  

**不计入**：`prototypes/` 里未在 UID/json 声明的散图（可当草稿，不阻塞闸门）。

脚本与 validate **同一规则**：并集；同一路径以 `pages.json` 覆盖 UID 的 path/selector。

## 何时跑

| 时机 | 行为 |
|------|------|
| FE 勾③前（有强制原型） | **直接跑**，不问「要不要比」 |
| `test:pixel-fe` | 点名复跑 |
| `dev-complete` / `test-entry` | A 档：须 `report.json` PASS 且覆盖强制清单 |

## 没过怎么办

1. 读 `summary.md` + `artifacts/*-diff.png`  
2. UI 错 → 改前端；稿过期 → 更新图/路径；测歪 → 改 `pages.json` selector/viewport  
3. AskQuestion：改 UI / 换原型 / 调 selector / 暂停  
4. 禁止手改 `report.json` 成 PASS  

## 运行

```bash
npm i -D playwright sharp pixelmatch && npx playwright install chromium
node <skill>/scripts/fe-pixel/fe-pixel.mjs --root .
```

`pages.json` 最小例（可从 skill `scripts/fe-pixel/fe-pixel.pages.json` 抄默认阈值，再填 pages）：

```json
{
  "baseUrl": "http://127.0.0.1:5173",
  "viewport": { "width": 1280, "height": 720 },
  "pages": [
    {
      "id": "UID-001-login",
      "path": "/login",
      "selector": ".login-card",
      "prototype": "atlas/requirements/ui/prototypes/UID-001-login.png"
    }
  ]
}
```
