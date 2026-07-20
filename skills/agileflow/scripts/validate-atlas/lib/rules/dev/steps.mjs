/**
 * 代码落点检测（叙述五段式共用）。
 *
 * 旧「## 步骤 / 4 列流程表 / 8 字段原子表」解析已删除——全端只认
 * 主流程 + 边界 + 实现说明（见 narrative-flow.mjs）。
 */

/**
 * 反引号内须为真实代码落点：
 * - 路径含 `/`
 * - `Class.method` / `pkg.Class.method`
 * - `func(...)` 调用
 * 禁：单单词、`pom.xml` 等「仅文件名+扩展名」假锚点
 * @param {string} text
 */
export function isCodeAnchor(text) {
  if (!text) return false;
  const FILE_EXT =
    /\.(md|xml|json|ya?ml|toml|txt|properties|gradle|kts|java|kt|ts|tsx|js|jsx|vue|css|scss)$/i;
  for (const m of text.matchAll(/`([^`\n]+)`/g)) {
    const t = m[1].trim();
    if (!t) continue;
    if (t.includes('/')) return true;
    if (/\([^)]*\)/.test(t)) return true;
    if (/^[A-Za-z_?][\w]*\.[A-Za-z_][\w.]*$/.test(t)) {
      const parts = t.split('.');
      if (parts.length === 2 && FILE_EXT.test('.' + parts[1])) continue;
      return true;
    }
  }
  return false;
}
