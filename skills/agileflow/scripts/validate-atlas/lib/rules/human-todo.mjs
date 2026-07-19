import path from 'node:path';
import { exists, readText, rel } from '../fs-utils.mjs';

const PENDING_RE = /⬜|\b pending\b|待办（|待办项|BLOCKED-HUMAN/i;

/**
 * 校验 atlas/humanTodo.md 骨架与阶段 5 阻塞
 *
 * - 文件缺失：info 提示跑 --bootstrap-scaffold（不强制，避免 greenfield 早期误报）
 * - 阶段 5 验收前若仍有 ⬜ 待办项 → error（BLOCKED-HUMAN，禁止假标交付）
 *
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ phase?: string }} opts
 */
export function validateHumanTodo(projectRoot, reporter, opts = {}) {
  const phase = opts.phase ?? 'all';
  const humanPath = path.join(projectRoot, 'atlas', 'humanTodo.md');

  if (!exists(humanPath)) {
    reporter.add({
      severity: 'info',
      rule: 'HT-001',
      file: 'atlas/humanTodo.md',
      message:
        '建议跑 --bootstrap-scaffold 创建 atlas/humanTodo.md（记录需人类协助的事项：密钥/商户号/.env/业务拍板等）。',
    });
    return;
  }

  // 阶段 5 验收前：检查是否有未完成待办项
  if (phase === '5') {
    const content = readText(humanPath) || '';
    if (PENDING_RE.test(content)) {
      reporter.add({
        severity: 'error',
        rule: 'HT-PENDING',
        file: rel(projectRoot, humanPath),
        message:
          '阶段 5 验收前 humanTodo 仍有 ⬜ 待办项；完成后改 ✅ 再验收（BLOCKED-HUMAN，禁止误标交付完成）。',
      });
    }
  }
}
