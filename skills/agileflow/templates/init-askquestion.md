# init AskQuestion 卡片

> 阶段流程：[00-project-init.md](../phases/00-project-init.md)  
> **前置**： [init-scan-checklist 落盘自检](init-scan-checklist.md#init-落盘自检askquestion-前须全-) 全 ✅

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
        label: "是，刷新 p0-business / p0-domain-math / glossary（业务或规则变更）"
      - id: "yes_data"
        label: "是，刷新 data/（表/实体/关系/api-catalog/schema 变更）"
      - id: "yes_codebase"
        label: "是，刷新 codebase/p1-* / p1-architecture（含 §三模板、§四序列图）"
      - id: "yes_conventions"
        label: "是，刷新 atlas/conventions/（仅模式 A 项目）"
      - id: "yes_env"
        label: "是，刷新 p0-environment / p1-tech-stack / p0-integrations"
      - id: "yes_full"
        label: "是，全量重扫 init"
      - id: "no"
        label: "否，本次跳过"
```

确认后更新 README「刷新记录」+ 相关文件首行「最后验证」日期。
