---
name: ppt-builder-agentPM
description: 把幻灯片截图/导出图/参考图重建成"可编辑"的 PowerPoint（.pptx）。当用户要求"做可编辑的PPT""把这张图/这页做成能改的PPT""图片转PPT""还原这页幻灯片并可编辑""批量把多页图重建成PPT"等需求时使用。核心是用 python-pptx 把图里的文字重建为可编辑文本框、简单几何重建为原生形状、Logo/图标/照片抽成独立可移动图片对象，产出真·可编辑 pptx。纯 Python，Windows / macOS 均可运行，无需安装 Office。
---

# 图片 → 可编辑 PPT（ppt-builder-agentPM）

## 概述

把幻灯片图像**重建**成可编辑的 PowerPoint，而不是把整图塞进一页当背景。产物里的文字能改、形状能拖、图片能替换。

两阶段流程：先从原图**抽取视觉素材**成独立 PNG（Logo/图标/照片/复杂装饰），再把每页**重建**为 PPT 原生的文本框、形状、线条和图片对象。

纯 `python-pptx`，**Windows / macOS 都能跑，不依赖任何 Office 安装**（区别于 image→VBA 方案要装 PowerPoint 跑宏）。

## 首次使用：环境

本技能自带 venv（`.venv/`，已装 python-pptx + Pillow + numpy）。若在新机器（含 Windows）上没有该 venv，创建一个：

```bash
python -m venv .claude/skills/ppt-builder-agentPM/.venv
# macOS/Linux
.claude/skills/ppt-builder-agentPM/.venv/bin/pip install python-pptx Pillow numpy
# Windows
.claude\skills\ppt-builder-agentPM\.venv\Scripts\pip install python-pptx Pillow numpy
```

解释器路径见 `config.json` 的 `python` / `pythonWindows`。下文命令用 `$PY` 代指该解释器。

## 核心姿态（必须遵守）

**重建它，不要截图它。** 文字必须是可编辑的 PowerPoint 文本，除非是 Logo、印章、艺术字、装饰性书法这类更适合当图片素材的东西。图标和图片必须是独立图片对象。简单的边框、卡片、圆形、分隔线、直线应该用原生形状/线条。

用原图作为**视觉参考**，不要把整张原图当成最终 deck 的整页背景。

## 工作流

1. **建工作区**（产物统一放项目根 `output/ppt/` 下）：
   - `output/ppt/assets/page_###/` 抽出的 PNG 素材
   - `output/ppt/layouts/page_###.layout.json` 每页的重建规格
   - `output/ppt/` 最终 pptx
   - `output/ppt/scratch/` 预览、报告、临时文件

2. **分析每张源图**：记录像素尺寸；盘点所有非文字视觉素材；盘点所有可编辑文字；识别跨页重复的模板。

3. **抽取素材**：写 asset manifest JSON → 跑 `asset_cropper.py` → 看 `_contact_sheet.png` → 迭代到没有明显遗漏。（格式见 `references/asset-manifest.md`）

4. **重建每页**：用**源图像素坐标**写 layout JSON → 普通文字用文本框、简单几何用原生形状、图标/Logo/照片/复杂装饰用抽出的 PNG → 跑 `build_pptx_from_layout.py`。（schema 见 `references/layout-json.md`）

5. **批量与合并**：先做代表性页；每页一个 layout JSON；用 `combine_layouts.py` 合并；导出一个最终 pptx。

6. **质检**：跑 `inspect_pptx.py`；预览并与源图对比；报告 pptx 路径、素材目录、预览/报告路径、尚未解决的还原差异。

密集或批量场景先读 `references/reconstruction-sop.md`。

## 脚本命令

`$PY` = `config.json` 里的解释器（macOS: `.venv/bin/python`；Windows: `.venv\Scripts\python.exe`）。
`$SKILL` = `.claude/skills/ppt-builder-agentPM/scripts`。

抽取素材：
```bash
$PY $SKILL/asset_cropper.py --manifest page_002.assets.json --out-dir output/ppt/assets/page_002 --contact-sheet
```

由 layout JSON 生成可编辑 pptx：
```bash
$PY $SKILL/build_pptx_from_layout.py --layout output/ppt/layouts/page_002.layout.json --assets-root . --out output/ppt/page_002_editable.pptx
```

合并多页 layout：
```bash
$PY $SKILL/combine_layouts.py --layouts output/ppt/layouts --out output/ppt/layouts/combined.layout.json
```

质检 pptx：
```bash
$PY $SKILL/inspect_pptx.py --pptx output/ppt/deck_editable.pptx --report output/ppt/scratch/quality_report.json
```

## layout JSON 速览

坐标用**源图像素**，builder 按 `source_width/height` → `slide_size` 等比缩放。元素顺序=图层顺序：先背景 → 大形状 → 图片 → 文字。

```json
{
  "source_width": 1280, "source_height": 720,
  "slide_size": { "width_in": 13.333333, "height_in": 7.5 },
  "background": "#FFFFFF",
  "slides": [{
    "background": "#F5F7FA",
    "elements": [
      { "type": "shape", "shape": "round_rect", "box": [80,200,340,220], "fill": "#FFFFFF", "line": "#004098", "line_width": 2, "radius": 0.08 },
      { "type": "text", "box": [100,230,300,40], "text": "标题", "size": 24, "bold": true, "color": "#004098", "align": "left", "valign": "middle", "font": "微软雅黑" },
      { "type": "image", "box": [900,120,260,260], "path": "assets/page_001/logo.png" },
      { "type": "line", "points": [80,620,1200,620], "line": "#CCCCCC", "line_width": 1 }
    ]
  }]
}
```

元素类型：`text`（可编辑文本框）、`shape`（rect/round_rect/oval/diamond/triangle/trapezoid，含 fill/line/line_width/radius/rotation/shadow）、`image`（独立图片，box + path[+rotation]）、`line`（points 或 box，含 line/line_width/dash）。完整字段见 `references/layout-json.md`。

## 与 gpt-image-generator 配合

- 需要**可编辑**的部分（标题/要点/表格/流程框）→ 写成 text/shape 元素
- 需要**精美视觉**的部分（封面主视觉/复杂插画）→ 用 gpt-image-generator 出 PNG → 当 image 元素引用
- 需要**整页图当封面**→ 一个铺满整页的 image 元素即可（无需再单独塞整图当背景）

## 验收标准

- 源图里每个有意义的视觉素材，要么抽成了 PNG，要么有意重建成了原生形状
- 普通文字在 pptx 里可编辑
- PNG 素材是独立图片对象，可移动/替换
- `inspect_pptx.py` 通过：无空媒体、无占位文字
- 已把 pptx 预览和源图做过对比，或在最终回复里说明为何无法渲染预览

## 打包资源

- `scripts/asset_cropper.py`：按 manifest 从源图裁 PNG 素材
- `scripts/build_pptx_from_layout.py`：由 layout JSON 生成可编辑 pptx
- `scripts/combine_layouts.py`：合并多页 layout
- `scripts/inspect_pptx.py`：pptx 质检
- `references/asset-manifest.md` / `layout-json.md` / `reconstruction-sop.md`：格式与检查清单

