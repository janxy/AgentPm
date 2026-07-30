---
description: 代码审查 — 对当前改动调用 code-reviewer，大改动自动并行分片提速
---

# /review

手动触发代码审查。小改动单次审查，大改动并行分片以压缩墙钟时间。

## 行为

1. **统计改动规模**
   - 运行 `git diff --numstat` 和 `git diff --staged --numstat` 汇总变更文件数与总行数。

2. **选择审查模式**
   - **单次审查**（文件 ≤ 8 个且总变更 ≤ 400 行）：直接调用一个 `code-reviewer` agent 审查全部改动。
   - **并行分片审查**（文件 > 8 个或总变更 > 400 行）：见下方分片流程。

3. **并行分片流程**
   - 把变更文件按**风险 + 模块**分组，每组 4-8 个文件，例如：
     - 高风险组：`server/` 后端、认证/权限、`prisma/`、支付/订单
     - 前端组：`admin/` 视图与组件
     - 其余：配置、样式、脚本
   - 在**同一条消息里并行启动多个 `code-reviewer` agent**（每个 Agent 调用用 `run_in_background` 或直接在一个 response 内发起多个 Agent 工具调用），每个 agent 的 prompt 中明确列出它负责审查的文件清单，并要求它**只审这些文件**。
   - 墙钟时间 ≈ 最慢的一组，而非所有文件串行相加。

4. **汇总**
   - 收集各分片的发现，按严重级别（CRITICAL → HIGH → MEDIUM → LOW）合并去重。
   - 输出统一的审查汇总表与结论（DONE / DONE_WITH_CONCERNS / BLOCKED）。

5. **修复**
   - 修复 CRITICAL / HIGH 问题；MEDIUM / LOW 提示用户按需处理。

## 分片示例

改了 24 个文件：
- 组 A（高风险，7 个）：`server/src/modules/exam/**`, `server/src/**/guard*`
- 组 B（前端，9 个）：`admin/src/views/external-org/**`, `admin/src/api/**`
- 组 C（其余，8 个）：配置、locale、样式

→ 同时启动 3 个 code-reviewer，各审一组，最后合并报告。
