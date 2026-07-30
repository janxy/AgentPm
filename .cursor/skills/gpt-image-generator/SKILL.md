---
name: gpt-image-generator
description: 调用 OpenAI Images API 形式的服务生成或编辑图片（通用，不绑定特定服务商或模型）。当用户要求"AI 生图""文生图""生成一张图""用 gpt-image-2/dall-e 等生图""改图/编辑图片/参考图生成""生成插画/海报/头像"等图像生成或编辑需求时使用。通过零依赖 Node 脚本调用，支持文生图（/images/generations）和参考图编辑（/images/edits），服务地址/密钥/模型均可配置，生成结果保存到项目根 output/images/。
---

# AI 生图（OpenAI Images API 形式）

## 概述

通过 `scripts/gpt-image.mjs`（Node 18+，零依赖）完成文生图和参考图编辑。接口遵循 OpenAI Images API 形式，**服务地址、密钥、模型均为配置项，不绑定任何特定服务商**——填入 OpenAI 官方或任意兼容服务（如自建/第三方 gpt-image-2、dall-e-3 等）即可使用。

## 首次使用：环境配置

所有服务参数只存在于 `config.json` 一处，脚本运行时从中读取，不在脚本或文档里写死。调用前完成两步，任缺其一脚本会报错并提示：

1. **确认 Node 版本 ≥ 18**（需原生 `fetch`/`FormData`）：`node -v`
2. **打开技能目录下 `config.json`，按其中字段填写**：
   - `baseURL`、`model` 通常已预置，按需修改
   - `apiKey` 必填
   - `defaults`（size/quality/n）、`outputDir` 按需调整

> 各字段含义见 config.json 内的 `_说明`，取值范围见 [references/api.md](references/api.md)。
>
> 可选：用环境变量 `GPT_IMAGE_BASE_URL` / `GPT_IMAGE_API_KEY` / `GPT_IMAGE_MODEL` 临时覆盖对应字段（优先级高于 config.json），适合不想改文件的场景。

密钥不要提交到 git，也不要在对话中回显明文。

## 调用方式

统一入口 `scripts/gpt-image.mjs`，两个子命令：

### 文生图 generate

```bash
node .claude/skills/gpt-image-generator/scripts/gpt-image.mjs generate \
  --prompt "一个小男孩" \
  --size 1536x1024 \
  --quality high \
  --n 1
```

### 参考图编辑 edit

多张参考图用逗号分隔（对应接口的多个 `image` 字段）：

```bash
node .claude/skills/gpt-image-generator/scripts/gpt-image.mjs edit \
  --prompt "参考图2的姿势和构图，替换成人物1，其他基本不变" \
  --image fixtures/references/01.png,fixtures/references/02.jpg \
  --size 1536x1024 \
  --quality high
```

### 参数说明

| 参数 | 适用 | 默认值 | 说明 |
|------|------|--------|------|
| `--prompt` | 二者 | 无（必填） | 文本描述/编辑指令 |
| `--image` | edit | 无（edit 必填） | 参考图路径，多个用逗号分隔 |
| `--size` | 二者 | config 默认 | `1024x1024`/`1536x1024`/`1024x1536`/`auto` |
| `--quality` | 二者 | config 默认 | `low`/`medium`/`high`/`auto` |
| `--n` | generate | 1 | 生成张数 |
| `--model` | 二者 | `gpt-image-2` | 覆盖模型 |
| `--out` | 二者 | `output/images` | 覆盖输出目录 |

未指定的参数回退到 `config.json` 的 `defaults`。

## 输出

图片默认保存到项目根 `output/images/`，命名 `<generate|edit>-<时间戳>-<序号>.png`。脚本结束打印每张的绝对路径。

## 参数取值与响应细节

完整的接口字段、size/quality 取值范围、响应结构和错误码，见 [references/api.md](references/api.md)。

## 使用流程

1. 首次：检查 `node -v ≥ 18`，确认 `config.json` 的 `apiKey` 已填。
2. 判断需求是纯文生图（用 `generate`）还是基于参考图编辑（用 `edit`）。
3. 把用户的画面描述转成 `--prompt`，选择合适的 `--size`/`--quality`。
4. 运行脚本，向用户报告保存路径。失败时按脚本抛出的错误信息（透传服务端 `error.message`）排查。

