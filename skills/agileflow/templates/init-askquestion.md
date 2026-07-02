# init AskQuestion 卡片

> 阶段流程：[00-project-init.md](../phases/00-project-init.md)

## init 确认（阶段 0 收尾）

```
title: "init 项目盘点确认"
questions:
  - id: "init_confirm"
    prompt: "init 文档已落盘（atlas/init/）。请确认："
    options:
      - id: "confirmed"
        label: "已确认，可进入后续流程（req/sol/dev）"
      - id: "draft"
        label: "先保持草稿，我要补充"
      - id: "refresh_partial"
        label: "部分不准，指定范围 refresh（回复说明范围）"
```

## init 增量 refresh（REQ 开发完毕后）

```
title: "init 增量刷新"
questions:
  - id: "init_refresh"
    prompt: "REQ-{编号} 开发已完成。是否增量更新 atlas/init/（同步 as-is）？"
    options:
      - id: "yes_business"
        label: "是，刷新 p0-business / p0-glossary-*（业务或术语）"
      - id: "yes_data"
        label: "是，刷新 p1-entity-* / p1-relation-* / p1-state-machine-*"
      - id: "yes_codebase"
        label: "是，刷新 init/codebase/（含 §一架构模块）"
      - id: "yes_env"
        label: "是，刷新 p0-environment / p1-tech-stack"
      - id: "yes_full"
        label: "是，全量重扫 init"
      - id: "no"
        label: "否，本次跳过"
```

确认后更新 README「刷新记录」+ 相关文件首行「最后验证」日期。
