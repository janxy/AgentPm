'use strict';

// UserPromptSubmit：每次用户发新消息即为「新一轮」的边界。
// 清空上一轮累积的「已编辑文件」「已调用 review」状态，
// 使质量门禁只针对本轮（用户上条消息之后）实际改动的文件判断，
// 避免历史遗留的未提交文件（如几轮前改过的 auth.ts）反复触发误报。
const { clearState } = require('./lib/state.cjs');

exports.run = () => {
  clearState('edited-files.txt');
  clearState('review-called.txt');
  return null;
};
