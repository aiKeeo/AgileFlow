import path from 'node:path';

import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';
import { validateSolutionStructure } from './solution-structure.mjs';



function extractSectionBody(content, heading) {

  const esc = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const regex = new RegExp(`^${esc}(?:\\s|$|#|[（(：:])`, 'm');

  const match = content.match(regex);

  if (!match || match.index === undefined) return null;

  const rest = content.slice(match.index + match[0].length);

  const next = rest.search(/^## /m);

  return (next === -1 ? rest : rest.slice(0, next)).trim();

}



function isUiContractFile(baseName) {

  return /^UI-\d+-.+\.md$/.test(baseName);

}



function linksApiContract(content) {

  return /\[API-\d+\]|API-\d+/i.test(content);

}



function hasFieldBindingSection(content) {

  if (!/^## 字段绑定/m.test(content)) return false;

  const body = extractSectionBody(content, '## 字段绑定');

  return Boolean(body && /\|[^|]+\|[^|]+\|/.test(body));

}



/**

 * 校验 atlas/solution/

 */

export function validateSolution(projectRoot, reporter, opts = {}) {

  if (opts.templateMode) return;

  const solRoot = path.join(projectRoot, 'atlas', 'solution');

  if (!exists(solRoot)) return;



  const readmePath = path.join(solRoot, 'README.md');

  const readme = readText(readmePath);

  if (!readme) {

    reporter.add({

      severity: 'error',

      rule: 'SOL-R001',

      file: 'atlas/solution/README.md',

      message: 'solution 缺少 README.md 索引。',

    });

  } else {

    if (!/## 功能清单/.test(readme)) {

      reporter.add({

        severity: 'error',

        rule: 'SOL-R002',

        file: 'atlas/solution/README.md',

        message: 'solution README 缺少「## 功能清单」表。',

      });

    }

    if (!/## 契约清单/.test(readme)) {

      reporter.add({

        severity: 'error',

        rule: 'SOL-R003',

        file: 'atlas/solution/README.md',

        message: 'solution README 须含「## 契约清单」索引（无暴露面可写「无」表行）。',

      });

    }

    if (!/AC\s*[→\-–—]\s*主\s*T|AC\s*→\s*主\s*T|主\s*T/.test(readme) || !/AC-\d+/i.test(readme)) {

      reporter.add({

        severity: 'warn',

        rule: 'SOL-R-AC-T',

        file: 'atlas/solution/README.md',

        message: 'solution README 建议含「AC → 主 T」表（每条 AC 唯一主责）。',

      });

    }

  }



  const archPath = path.join(solRoot, 'architecture.md');

  if (!exists(archPath)) {

    reporter.add({

      severity: 'error',

      rule: 'SOL-A001',

      file: 'atlas/solution/architecture.md',

      message: '缺少全局 architecture.md（A档：sol-confirm 必挡）。',

    });

  } else {

    const arch = readText(archPath) || '';

    if (arch.replace(/\s/g, '').length < 120) {

      reporter.add({

        severity: 'error',

        rule: 'SOL-A-THIN',

        file: 'atlas/solution/architecture.md',

        message: 'architecture.md 过短；须含技术栈、模块/目录、本地验证命令等实质内容。',

      });

    }

    // 本地验证 / 技术栈 / 模块节 → solution-structure.mjs（A 档）

  }



  const featureFiles = collectFiles(path.join(solRoot, 'features'), '.md');

  for (const file of featureFiles) {

    const content = readText(file);

    if (!content) continue;

    const relPath = rel(projectRoot, file);



    if (!/^#\s*\[F-\d+\]/m.test(content)) {

      reporter.add({

        severity: 'error',

        rule: 'SOL-F001',

        file: relPath,

        message: 'feature 标题应为 `# [F-XXX] 功能名` 格式。',

      });

    }

    if (!/^## 边界/m.test(content)) {

      reporter.add({

        severity: 'error',

        rule: 'SOL-F002',

        file: relPath,

        message: 'feature 缺少「## 边界」节。',

      });

    }

    if (!/←\s*REQ-\d+/m.test(content) && !/<\-\s*REQ-\d+/m.test(content)) {

      reporter.add({

        severity: 'error',

        rule: 'SOL-F-REQ-TRACE',

        file: relPath,

        message: 'feature 须含 REQ 回溯（如 `← REQ-001 · AC-001-01～06`）；边界须从 REQ 提炼。',

      });

    }

    // 暴露面行 → solution-structure SOL-F-EXPOSE（A 档）

    if (/^## 联调卡/m.test(content)) {

      reporter.add({

        severity: 'error',

        rule: 'SOL-F-BAN-CARD',

        file: relPath,

        message: '禁止 F「## 联调卡」→ 字段绑定写 contracts/UI；行为见 REQ AC。',

      });

    }

    if (/^## 字段绑定/m.test(content)) {

      reporter.add({

        severity: 'error',

        rule: 'SOL-F-BAN-BIND',

        file: relPath,

        message: '禁止 F「## 字段绑定」→ 写 contracts/UI §字段绑定。',

      });

    }

    if (/^## 验收要点/m.test(content)) {

      reporter.add({

        severity: 'warn',

        rule: 'SOL-F-BAN-ACCEPT',

        file: relPath,

        message: '「## 验收要点」与 REQ AC 重复，建议删除。',

      });

    }



    const desc = extractSectionBody(content, '## 说明');

    if (desc && /^\s*\d+\.\s/m.test(desc)) {

      reporter.add({

        severity: 'warn',

        rule: 'SOL-F-PATH',

        file: relPath,

        message: '「## 说明」勿写编号主路径；行为见 REQ AC，说明可保留 1 句业务锚点。',

      });

    }

  }



  const contractFiles = collectFiles(path.join(solRoot, 'contracts'), '.md');

  for (const file of contractFiles) {

    const baseName = path.basename(file);

    if (baseName.startsWith('_')) continue;



    const content = readText(file) || '';

    const relPath = rel(projectRoot, file);

    if (!/^(API|UI|JOB|EVT)-\d+-.+\.md$/.test(baseName)) {

      reporter.add({

        severity: 'warn',

        rule: 'SOL-C001',

        file: relPath,

        message: '契约文件名应为 API-XXX / UI-XXX 等格式。',

      });

    }



    if (isUiContractFile(baseName) && linksApiContract(content) && !hasFieldBindingSection(content)) {

      reporter.add({

        severity: 'error',

        rule: 'SOL-UI-BIND',

        file: relPath,

        message: 'UI 契约链了 API 须含「## 字段绑定」表（页面上↔请求字段↔接口）。',

      });

    }

  }



  if (exists(path.join(solRoot, 'boundaries.md'))) {

    reporter.add({

      severity: 'error',

      rule: 'SOL-X001',

      file: 'atlas/solution/boundaries.md',

      message: '禁止创建 boundaries.md。',

    });

  }

  validateSolutionStructure(projectRoot, reporter);

}


