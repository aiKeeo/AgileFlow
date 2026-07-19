/**
 * API 契约 JSON / 数据模型质量校验
 */

/**
 * 抽取 markdown 中 json/jsonc 代码块正文
 * @param {string} content
 * @returns {string[]}
 */
function extractJsonBlocks(content) {
  /** @type {string[]} */
  const blocks = [];
  const re = /```(?:jsonc?)\s*\n([\s\S]*?)```/gi;
  let match;
  while ((match = re.exec(content)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

/**
 * 是否含成功响应 JSON（HTTP code:0 或 Local Service ok:true）
 * @param {string[]} blocks
 */
function hasSuccessResponseJson(blocks) {
  return blocks.some((block) => /"ok"\s*:\s*true/.test(block) || /"code"\s*:\s*0/.test(block));
}

/**
 * 表格类型列是否 inline 写了 object 结构
 * @param {string} content
 */
function hasInlineObjectInTable(content) {
  return /\|\s*[^|\n]*(?:object\s*\|\s*\{|`\{)/.test(content);
}

/**
 * 是否定义数据模型节
 * @param {string} content
 */
function hasDataModelSection(content) {
  return /^##\s*数据模型/m.test(content);
}

/**
 * 是否引用「见下/见上」描述嵌套
 * @param {string} content
 */
function hasNestSeeReference(content) {
  return /见下|见上/.test(content);
}

/**
 * 校验单个 API 契约文件内容
 * @param {string} content
 * @param {string} relPath
 * @param {import('../reporter.mjs').Reporter} reporter
 */
export function validateApiContractContent(content, relPath, reporter) {
  const blocks = extractJsonBlocks(content);

  if (blocks.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'SOL-API-NO-JSON',
      file: relPath,
      message:
        'API 契约须含 ```json/jsonc 代码块（请求/响应示例）；禁止纯表格写法。',
    });
    return;
  }

  if (!hasSuccessResponseJson(blocks)) {
    reporter.add({
      severity: 'error',
      rule: 'SOL-API-NO-RES',
      file: relPath,
      message: 'API 契约须含成功响应 JSON（"ok": true 或 "code": 0）。',
    });
  }

  if (hasInlineObjectInTable(content) && !hasDataModelSection(content)) {
    reporter.add({
      severity: 'warn',
      rule: 'SOL-API-INLINE-OBJ',
      file: relPath,
      message: '表格含 inline object 但未定义「## 数据模型」→ 嵌套对象应单独展开。',
    });
  }

  if (hasNestSeeReference(content) && !hasDataModelSection(content)) {
    reporter.add({
      severity: 'warn',
      rule: 'SOL-API-NEST-SEE',
      file: relPath,
      message: '含「见下/见上」但未定义「## 数据模型」→ 嵌套结构须在数据模型节展开。',
    });
  }
}

/**
 * 是否为 API 契约文件（非 _ 前缀共享约定）
 * @param {string} baseName
 */
export function isApiContractFile(baseName) {
  return /^API-\d+-.+\.md$/.test(baseName);
}
