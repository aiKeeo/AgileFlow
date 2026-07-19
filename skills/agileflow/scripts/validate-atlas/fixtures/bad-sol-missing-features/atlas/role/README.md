# atlas/role — 本项目 Subagent 提示词（可改）

> **Subagent 只读本目录。** 总控派活前 Read `atlas/role/role-{key}.md`，再发给子代理。  
> 改这里 = 改本项目角色行为；不必改 skill 全局模板。  
> 缺文件时跑：`node <skill>/scripts/validate-atlas.mjs --bootstrap-scaffold --root .`

| key | 文件 | 角色 |
|-----|------|------|
| req | role-req.md | REQ Writer |
| model | role-model.md | Model Writer |
| sol | role-sol.md | Sol Writer |
| dev | role-dev.md | Dev Worker |

skill 默认真源：`templates/role/`（仅作复制起点）。
