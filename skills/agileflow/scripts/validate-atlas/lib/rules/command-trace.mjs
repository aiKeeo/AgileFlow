/**
 * 命令痕迹检测（可运行/冒烟证据通用）
 * 识别实际执行过的命令，而非纯文字描述。
 */

const COMMAND_KEYWORDS = [
  'npm', 'yarn', 'pnpm', 'npx', 'mvn', 'gradle', 'go', 'cargo', 'dotnet',
  'python', 'pytest', 'node', 'curl', 'docker', 'docker-compose', 'docker compose',
  'make', 'cmake', 'tsc', 'vite', 'webpack', 'rollup', 'esbuild', 'swc',
];

const LINE_RE = new RegExp(
  `(^|\\n)\\s*(\\$|>|#|\\./|\\.\\\\)|\\b(?:${COMMAND_KEYWORDS.join('|')})\\b`,
  'i'
);
const TABLE_CELL_RE = new RegExp(
  `\\|\\s*(?:${COMMAND_KEYWORDS.join('|')})\\b`,
  'i'
);

/**
 * 内容中是否含实际命令痕迹。
 * @param {string} body
 */
export function hasCommandTrace(body) {
  return LINE_RE.test(body) ||
    /`[^`]{3,}`/.test(body) ||
    /命令[：:]/.test(body) ||
    TABLE_CELL_RE.test(body);
}

/**
 * 内容中是否含时间戳。
 * @param {string} body
 */
export function hasTimestamp(body) {
  return /\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}/.test(body) ||
    /\d{4}\/\d{2}\/\d{2}[\s]\d{2}:\d{2}/.test(body) ||
    /\d{2}:\d{2}:\d{2}/.test(body);
}
