import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

export function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

export function atomicWriteJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${crypto.randomUUID()}.tmp`,
  );
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, filePath);
}

export function appendJsonLine(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, 'utf8');
}

export function readJsonLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function resolveProjectFile(projectRoot, relativePath) {
  const root = fs.realpathSync(projectRoot);
  const resolved = path.resolve(root, String(relativePath));
  const rel = path.relative(root, resolved);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`路径必须是项目根内的文件：${relativePath}`);
  }
  if (!fs.existsSync(resolved)) {
    throw new Error(`文件不存在：${relativePath}`);
  }
  const real = fs.realpathSync(resolved);
  const realRel = path.relative(root, real);
  if (!realRel || realRel.startsWith('..') || path.isAbsolute(realRel)) {
    throw new Error(`路径经符号链接越出项目根：${relativePath}`);
  }
  const stat = fs.statSync(real);
  if (!stat.isFile()) {
    throw new Error(`当前只支持登记文件产物：${relativePath}`);
  }
  return { absolutePath: real, relativePath: realRel.split(path.sep).join('/') };
}

export function digestFile(filePath) {
  return sha256(fs.readFileSync(filePath));
}

export function withStateLock(projectRoot, fn) {
  const lockDir = path.join(projectRoot, 'atlas', 'state', '.runtime-lock');
  fs.mkdirSync(path.dirname(lockDir), { recursive: true });
  const token = crypto.randomUUID();
  const acquire = () => {
    try {
      fs.mkdirSync(lockDir);
      return;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      const ownerPath = path.join(lockDir, 'owner.json');
      const owner = readJson(ownerPath, {});
      let ageMs = 0;
      try {
        ageMs = Date.now() - fs.statSync(lockDir).mtimeMs;
      } catch {
        ageMs = 0;
      }
      let ownerAlive = false;
      if (Number.isInteger(owner.pid) && owner.pid > 0) {
        try {
          process.kill(owner.pid, 0);
          ownerAlive = true;
        } catch (probeError) {
          ownerAlive = probeError?.code === 'EPERM';
        }
      }
      if (ageMs > 120_000 && !ownerAlive) {
        const staleDir = `${lockDir}.stale.${process.pid}.${token}`;
        try {
          fs.renameSync(lockDir, staleDir);
          fs.rmSync(staleDir, { recursive: true, force: true });
          fs.mkdirSync(lockDir);
          return;
        } catch {
          throw new Error('AgileFlow 状态锁回收冲突，请稍后重试');
        }
      }
      throw new Error('AgileFlow 状态正被另一进程修改，请稍后重试');
    }
  };
  acquire();
  try {
    fs.writeFileSync(
      path.join(lockDir, 'owner.json'),
      `${JSON.stringify({ pid: process.pid, token, acquiredAt: new Date().toISOString() }, null, 2)}\n`,
      'utf8',
    );
    return fn();
  } finally {
    const owner = readJson(path.join(lockDir, 'owner.json'), {});
    if (owner.token === token) {
      fs.rmSync(lockDir, { recursive: true, force: true });
    }
  }
}
