/**
 * 校验结果收集与输出
 */

/** @typedef {'error' | 'warn' | 'info'} Severity */

/**
 * @typedef {Object} ValidationIssue
 * @property {Severity} severity
 * @property {string} rule - 规则编号，如 开发完成格式门槛、DEV-LIT-一段
 * @property {string} message
 * @property {string} [file] - 相对路径
 * @property {number} [line] - 行号（1-based）
 */

export class Reporter {
  /** @type {ValidationIssue[]} */
  #issues = [];

  /**
   * 记录一条校验问题
   * @param {ValidationIssue} issue
   */
  add(issue) {
    this.#issues.push(issue);
  }

  /**
   * 批量记录
   * @param {ValidationIssue[]} issues
   */
  addAll(issues) {
    this.#issues.push(...issues);
  }

  /** @returns {ValidationIssue[]} */
  getIssues() {
    return [...this.#issues];
  }

  /** @returns {number} */
  errorCount() {
    return this.#issues.filter((i) => i.severity === 'error').length;
  }

  /** @returns {number} */
  warnCount() {
    return this.#issues.filter((i) => i.severity === 'warn').length;
  }

  /** @returns {boolean} */
  passed() {
    return this.errorCount() === 0;
  }

  /**
   * 格式化输出到控制台
   * @param {{ verbose?: boolean }} [opts]
   */
  print({ verbose = false } = {}) {
    const errors = this.#issues.filter((i) => i.severity === 'error');
    const warns = this.#issues.filter((i) => i.severity === 'warn');
    const infos = this.#issues.filter((i) => i.severity === 'info');

    if (errors.length === 0 && warns.length === 0 && infos.length === 0) {
      console.log('✅ 全部校验通过');
      return;
    }

    const printGroup = (label, items, icon) => {
      if (items.length === 0) return;
      console.log(`\n${icon} ${label} (${items.length})`);
      for (const item of items) {
        const loc = item.file
          ? `${item.file}${item.line ? `:${item.line}` : ''}`
          : '(全局)';
        console.log(`  [${item.rule}] ${loc}`);
        console.log(`    ${item.message}`);
      }
    };

    printGroup('错误', errors, '❌');
    printGroup('警告', warns, '⚠️');
    if (verbose) {
      printGroup('信息', infos, 'ℹ️');
    }

    console.log('\n---');
    console.log(
      `合计: ${errors.length} 错误, ${warns.length} 警告${verbose ? `, ${infos.length} 信息` : ''}`
    );
    console.log(this.passed() ? '✅ 校验通过（无错误）' : '❌ 校验失败');
  }
}
