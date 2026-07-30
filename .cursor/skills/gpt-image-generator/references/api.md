# gpt-image-2 接口参考

遵循 OpenAI Images API 形式，通过可配置的 baseURL 调用（OpenAI 官方或任意兼容服务，见 `config.json` / 环境变量 `GPT_IMAGE_*`）。

## 目录

- [认证](#认证)
- [生图 /images/generations](#生图-imagesgenerations)
- [改图 /images/edits](#改图-imagesedits)
- [公共参数取值](#公共参数取值)
- [响应结构](#响应结构)
- [错误处理](#错误处理)

## 认证

所有请求带 `Authorization: Bearer <apiKey>`。apiKey 存于技能内 `config.json`，不入库。

## 生图 /images/generations

`Content-Type: application/json`，body 字段：

| 字段 | 必填 | 说明 |
|------|------|------|
| model | 是 | 固定 `gpt-image-2` |
| prompt | 是 | 文本描述 |
| size | 否 | 图片尺寸，见下 |
| quality | 否 | 质量档位，见下 |
| n | 否 | 生成张数，默认 1 |

## 改图 /images/edits

`multipart/form-data`，字段：

| 字段 | 必填 | 说明 |
|------|------|------|
| model | 是 | `gpt-image-2` |
| prompt | 是 | 编辑指令 |
| image | 是 | 参考图文件，可传多个 `image` 字段（脚本用 `--image a.png,b.jpg`） |
| size | 否 | 输出尺寸 |
| quality | 否 | 质量档位 |
| response_format | 否 | `b64_json` 或 `url`，脚本固定用 `b64_json` |

## 公共参数取值

- **size**: `1024x1024`（方）、`1536x1024`（横）、`1024x1536`（竖）、`auto`
- **quality**: `low` / `medium` / `high` / `auto`

具体支持范围以服务端为准；传入不支持的值时服务端会返回 400，错误信息会由脚本透传。

## 响应结构

```json
{
  "created": 1234567890,
  "data": [
    { "b64_json": "iVBORw0KGgo..." }
  ]
}
```

`data` 数组每项含 `b64_json`（base64 PNG）或 `url`（临时链接）。脚本两者都能落盘。

## 错误处理

非 2xx 时响应体形如 `{"error":{"message":"..."}}`，脚本提取 `error.message` 抛出。常见：

- 401：apiKey 无效或未填
- 400：参数不合法（size/quality 取值错误、prompt 为空）
- 429：限流，稍后重试
