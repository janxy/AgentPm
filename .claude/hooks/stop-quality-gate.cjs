'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { readState, clearState } = require('./lib/state.cjs');
const { reviewMode } = require('./lib/config.cjs');

// 触碰这些路径且净变更达到 SENSITIVE_DIFF_THRESHOLD 的改动强制 review（认证/安全/支付/数据完整性）。
// 极小的敏感改动（如恢复一段已审过的旧代码、加一行权限守卫）低于该阈值时放行，避免为琐碎改动强拦。
const SENSITIVE_PATTERNS = [
  /auth/i,
  /security/i,
  /payment|billing|order/i,
  /guard|middleware|interceptor/i,
  /prisma[/\\]schema|migrations?[/\\]/i,
  /\.env/i,
  /login|password|token|secret|credential/i,
  /permission|role|rbac|acl/i,
];

// 纯样式文件：小改动可豁免（不含逻辑）
const STYLE_ONLY = /\.(scss|css)$/i;

// 完全豁免 review 的路径：这些技能/工具的文件不参与代码门禁（如 gpt-image-generator 生图技能）
const REVIEW_EXEMPT = [
  /[/\\]skills[/\\]gpt-image-generator[/\\]/i,
];

// 小改动阈值：本轮代码净变更行数（增+删）低于此值且非敏感路径 → 免 review
const SMALL_DIFF_THRESHOLD = 50;
// 敏感路径阈值：敏感文件自身净变更低于此值 → 视为琐碎敏感改动（恢复旧码/单行守卫等），放行免 review
const SENSITIVE_DIFF_THRESHOLD = 15;

function churnFor(fp, cwd) {
  let added = 0;
  let deleted = 0;
  for (const args of [['diff', '--numstat', '--', fp], ['diff', '--staged', '--numstat', '--', fp]]) {
    try {
      const out = execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      for (const line of out.trim().split('\n').filter(Boolean)) {
        const [a, d] = line.split('\t');
        if (a !== '-') added += parseInt(a, 10) || 0;
        if (d !== '-') deleted += parseInt(d, 10) || 0;
      }
    } catch {}
  }
  // git diff 无输出：可能是未跟踪的新文件，按整文件行数计入
  if (added === 0 && deleted === 0) {
    try {
      execFileSync('git', ['ls-files', '--error-unmatch', '--', fp], { cwd, stdio: ['ignore', 'ignore', 'ignore'] });
      // 已跟踪但无 diff → churn 为 0
    } catch {
      try {
        if (fs.existsSync(fp)) added = fs.readFileSync(fp, 'utf8').split('\n').length;
      } catch {}
    }
  }
  return added + deleted;
}

exports.run = (input) => {
  // 防止无限循环：stop hook 已激活说明本轮已警告过一次。
  // 此时清空累积状态，让后续无关轮次（如生图/纯查询）从干净状态开始，
  // 避免旧的未审查编辑在整个会话里反复触发门禁。
  if (input?.stop_hook_active) {
    clearState('edited-files.txt');
    clearState('review-called.txt');
    return null;
  }

  const editedRaw = readState('edited-files.txt');
  if (!editedRaw.trim()) return null;

  const editedFiles = [...new Set(editedRaw.trim().split('\n').filter(Boolean))]
    .filter(fp => !REVIEW_EXEMPT.some(p => p.test(fp)));
  if (editedFiles.length === 0) return null;
  const issues = [];
  const cwd = process.cwd();

  // Check 1: console.log 残留（始终检查，成本低）。跳过 CLI 文件（console.log 是有意的 stdout 输出）
  const CLI_PATTERNS = [/packages[/\\]agentpm[/\\]src[/\\]/i, /packages[/\\]agentpm[/\\]scripts[/\\]/i, /[/\\]bin[/\\]/];
  for (const fp of editedFiles) {
    if (CLI_PATTERNS.some(p => p.test(fp))) continue;
    try {
      if (!fs.existsSync(fp)) continue;
      const content = fs.readFileSync(fp, 'utf8');
      const lines = content.split('\n');
      const hits = [];
      lines.forEach((line, i) => {
        if (/console\.(log|debug|info)\s*\(/.test(line) && !/\/\/\s*keep/.test(line)) {
          hits.push(i + 1);
        }
      });
      if (hits.length > 0) {
        issues.push(`${path.basename(fp)} 第 ${hits.join(',')} 行有 console.log`);
      }
    } catch {}
  }

  // Check 2: 智能判断是否强制 review（mode=off 时完全跳过，console.log 检查仍保留）
  const mode = reviewMode();
  const reviewCalled = readState('review-called.txt').trim();
  if (mode !== 'off' && !reviewCalled) {
    const sensitiveHits = editedFiles.filter(fp => SENSITIVE_PATTERNS.some(p => p.test(fp)));
    const allStyleOnly = editedFiles.every(fp => STYLE_ONLY.test(fp));
    // 每个文件的净变更只算一次，供总量闸与敏感闸复用
    const churnByFile = {};
    for (const fp of editedFiles) churnByFile[fp] = churnFor(fp, cwd);
    const totalChurn = editedFiles.reduce((sum, fp) => sum + churnByFile[fp], 0);
    // 敏感闸按敏感文件自身净变更判定，不被同轮非敏感大改动带高
    const sensitiveChurn = sensitiveHits.reduce((sum, fp) => sum + churnByFile[fp], 0);

    const sensitiveMustReview = sensitiveHits.length > 0 && sensitiveChurn >= SENSITIVE_DIFF_THRESHOLD;
    const sizeMustReview = !allStyleOnly && totalChurn >= SMALL_DIFF_THRESHOLD;
    const mustReview = sensitiveMustReview || sizeMustReview;

    if (mustReview) {
      const why = sensitiveMustReview
        ? `触碰敏感路径（${sensitiveHits.map(f => path.basename(f)).join(', ')}）且敏感文件净变更约 ${sensitiveChurn} 行（阈值 ${SENSITIVE_DIFF_THRESHOLD}）`
        : `代码净变更约 ${totalChurn} 行（阈值 ${SMALL_DIFF_THRESHOLD}）`;
      // 按本轮改动规模给出审查方式指引：达到分片阈值 → 自动并行分片；否则单次
      const large = editedFiles.length > 8 || totalChurn > 400;
      const how = large
        ? `改动较大（${editedFiles.length} 文件 / ~${totalChurn} 行）→ 按「风险+模块」并行起多个 code-reviewer 分片审查（每组 4-8 文件，同一条消息内并行），只审本轮改动文件`
        : `起一个 code-reviewer 审查本轮改动的 ${editedFiles.length} 个文件即可，只审这些文件、勿全项目扫描`;
      // background 模式：后台启动不阻塞回合；blocking 模式：当场审完才放行
      const runHint = mode === 'background'
        ? '【模式=background】用 Agent 的 run_in_background:true 后台启动这些 code-reviewer，启动后即可结束本回合、不阻塞用户；跑完再异步汇报结论。'
        : '【模式=blocking】当场审完再结束回合。';
      issues.push(`本轮修改了代码文件但未调用 code-reviewer agent — ${why}。${how}\n    ${runHint}`);
    }
    // 否则：小改动 / 纯样式 / 非敏感 → 自动放行，不阻断
  }

  if (issues.length === 0) return null;

  return {
    decision: 'block',
    reason:
      '【质量门禁】发现以下问题：\n' +
      issues.map(i => `  - ${i}`).join('\n') +
      '\n请处理后再结束回复。\n' +
      '（分片是自动的：达到阈值就在同一条消息里并行起多个 code-reviewer，无需用户手动 /review）'
  };
};
