'use strict';

const fs = require('fs');
const path = require('path');

// 读取 .claude/config.json；缺失或损坏时回退到安全默认值。
// 从 cwd 向上找 .claude/config.json（与 run.cjs 的根定位一致）。
function findConfig(start) {
  let dir = start || process.cwd();
  for (;;) {
    const candidate = path.join(dir, '.claude', 'config.json');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// code-reviewer 门禁模式：'off' | 'background' | 'blocking'，默认 'background'
exports.reviewMode = () => {
  try {
    const fp = findConfig();
    if (!fp) return 'background';
    const cfg = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const mode = cfg?.codeReview?.mode;
    return ['off', 'background', 'blocking'].includes(mode) ? mode : 'background';
  } catch {
    return 'background';
  }
};
