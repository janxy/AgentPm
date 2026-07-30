'use strict';

const path = require('path');
const { isCodeFile, isTestFile } = require('./lib/file-utils.cjs');
const { appendState } = require('./lib/state.cjs');
const { reviewMode } = require('./lib/config.cjs');

exports.run = (input) => {
  const filePath = input?.tool_input?.file_path;
  if (!filePath) return null;

  if (!isCodeFile(filePath)) return null;

  // 豁免路径：gpt-image-generator 等技能/工具文件不纳入代码门禁
  const REVIEW_EXEMPT = [/[/\\]skills[/\\]gpt-image-generator[/\\]/i];
  if (REVIEW_EXEMPT.some(p => p.test(filePath))) return null;

  appendState('edited-files.txt', filePath);

  // mode=off：仍跟踪改动文件（便于中途切档生效），但不注入提醒噪音
  const mode = reviewMode();
  if (mode === 'off') return null;

  const basename = path.basename(filePath);
  const isTest = isTestFile(filePath);

  // 执行方式指引（与 stop-quality-gate 的 runHint 保持一致）：
  // background=后台 run_in_background 启动、不阻塞回合，跑完异步汇报；blocking=当场审完再结束回合。
  const runHint = mode === 'background'
    ? '⚙️ 执行方式【模式=background】：必须用 Agent 的 run_in_background:true 后台启动 code-reviewer，启动后即可继续/结束回合、不阻塞用户，跑完再异步汇报结论。禁止在前台同步等待审查结果。'
    : '⚙️ 执行方式【模式=blocking】：当场同步审完再结束回合。';

  return {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext:
        `【Review Reminder】你刚修改了代码文件: ${basename}\n` +
        '当这组相关改动完成后，按规模自适应审查：小改动/纯数据文案可跳过；' +
        '≤8 文件且≤400 行起一个 code-reviewer（只审本轮改动文件）；' +
        '>8 文件或>400 行自动按「风险+模块」并行起多个 code-reviewer 分片审查（无需等用户手动 /review）。\n' +
        '触碰敏感路径（认证/安全/支付/数据层）默认要审——但恢复一段已审过的旧代码、照抄审查员上一轮给的修复、纯加参数/常量这类「无新增风险」的琐碎改动可跳过，别为它单独起一轮审查。\n' +
        runHint
    }
  };
};
