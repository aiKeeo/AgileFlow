/**
 * 校验结果收集与输出
 *
 * 硬挡：error 与 warn 均使校验失败（流程该做的就不分「可继续知债」）。
 * info 仅说明，不挡。
 */

import { getRuleHint } from './rule-hints.mjs';

/** @typedef {'error' | 'warn' | 'info'} Severity */

/**
 * @typedef {Object} ValidationIssue
 * @property {Severity} severity
 * @property {string} rule - 规则编号，如 开发完成格式门槛、DEV-LIT-范围
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
    if (!['error', 'warn', 'info'].includes(issue.severity)) {
      throw new Error(`Unknown severity: ${issue.severity} (rule=${issue.rule})`);
    }
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

  /**
   * 无 error、无 warn 才算通过（硬挡）
   * @returns {boolean}
   */
  passed() {
    return this.errorCount() === 0 && this.warnCount() === 0;
  }

  /**
   * 格式化输出到控制台
   * @param {{ verbose?: boolean, successLabel?: string }} [opts]
   */
  print({ verbose = false, successLabel = '' } = {}) {
    const errors = this.#issues.filter((i) => i.severity === 'error');
    const warns = this.#issues.filter((i) => i.severity === 'warn');
    const infos = this.#issues.filter((i) => i.severity === 'info');

    if (errors.length === 0 && warns.length === 0 && infos.length === 0) {
      console.log(successLabel || '✅ 全部校验通过');
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
        const hint = getRuleHint(item.rule);
        if (hint) {
          console.log(`    💡 ${hint.plain} · ${hint.who}`);
        }
      }
    };

    printGroup('阻断', errors, '❌');
    printGroup('阻断（原 warn，同等失败）', warns, '❌');

    const roleCustomSkips = infos.filter((i) => i.rule === 'ROLE-CUSTOM-SKIP');
    const otherInfos = infos.filter((i) => i.rule !== 'ROLE-CUSTOM-SKIP');
    printGroup('信息（自定义 role 跳过）', roleCustomSkips, 'ℹ️');
    if (verbose) {
      printGroup('信息', otherInfos, 'ℹ️');
    }

    console.log('\n---');
    const infoNote =
      roleCustomSkips.length + (verbose ? otherInfos.length : 0);
    console.log(
      `合计: ${errors.length + warns.length} 阻断${infoNote > 0 ? `, ${infoNote} 信息${verbose ? '' : '（含 ROLE-CUSTOM-SKIP；其余 info 加 --verbose）'}` : ''}`,
    );
    console.log(
      this.passed()
        ? successLabel || '✅ 校验通过'
        : '❌ 校验失败（有阻断项）',
    );
  }
}
