#!/usr/bin/env node
// gpt-image-2 生图/改图调用脚本（零依赖，Node 18+）
// 用法见同目录 SKILL.md，参数详情见 references/api.md
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { basename, extname, join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = resolve(__dirname, '..');

/** 判断值是否为空或仍是占位符（含"填入"/"your"字样） */
function isPlaceholder(v) {
  return !v || /填入|your-|<.*>/i.test(String(v));
}

/**
 * 读取并校验配置，优先级：环境变量 > config.json。
 * 环境变量：GPT_IMAGE_BASE_URL / GPT_IMAGE_API_KEY / GPT_IMAGE_MODEL。
 * 适配任意 OpenAI Images API 形式的服务，不绑定特定服务商。
 */
function loadConfig() {
  const cfgPath = join(SKILL_DIR, 'config.json');
  const file = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, 'utf8')) : {};
  const cfg = {
    baseURL: process.env.GPT_IMAGE_BASE_URL || file.baseURL,
    apiKey: process.env.GPT_IMAGE_API_KEY || file.apiKey,
    model: process.env.GPT_IMAGE_MODEL || file.model,
    defaults: file.defaults || { size: '1024x1024', quality: 'auto', n: 1 },
    outputDir: file.outputDir || 'output/images',
  };
  if (isPlaceholder(cfg.baseURL)) {
    throw new Error('未配置 baseURL：请填 config.json 的 baseURL 或设 GPT_IMAGE_BASE_URL 环境变量');
  }
  if (isPlaceholder(cfg.apiKey)) {
    throw new Error('未配置 apiKey：请填 config.json 的 apiKey 或设 GPT_IMAGE_API_KEY 环境变量');
  }
  if (isPlaceholder(cfg.model)) {
    throw new Error('未配置 model：请填 config.json 的 model 或设 GPT_IMAGE_MODEL 环境变量');
  }
  return cfg;
}

/** 解析 --key value / --key=value 形式的命令行参数 */
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const eq = a.indexOf('=');
    if (eq !== -1) {
      args[a.slice(2, eq)] = a.slice(eq + 1);
    } else {
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { args[a.slice(2)] = next; i++; }
      else args[a.slice(2)] = true;
    }
  }
  return args;
}
/** 定位项目根目录（含 .claude 的目录），用于解析默认输出路径 */
function findProjectRoot() {
  let dir = SKILL_DIR;
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, '.claude'))) return dir;
    dir = dirname(dir);
  }
  return process.cwd();
}

/** 把返回的图片（b64 或 url）落盘，返回保存路径列表 */
async function saveImages(dataList, outDir, prefix) {
  mkdirSync(outDir, { recursive: true });
  const saved = [];
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  for (let i = 0; i < dataList.length; i++) {
    const item = dataList[i];
    const file = join(outDir, `${prefix}-${ts}-${i + 1}.png`);
    if (item.b64_json) {
      writeFileSync(file, Buffer.from(item.b64_json, 'base64'));
    } else if (item.url) {
      const res = await fetch(item.url, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) throw new Error(`下载图片失败: ${res.status}`);
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    } else {
      throw new Error('响应中既无 b64_json 也无 url');
    }
    saved.push(file);
  }
  return saved;
}

/** 统一处理接口响应：非 2xx 抛出可读错误 */
async function readResponse(res) {
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try { msg = JSON.parse(text).error?.message || text; } catch { /* 保留原文 */ }
    throw new Error(`接口返回 ${res.status}: ${msg}`);
  }
  return JSON.parse(text);
}
/** 生图：POST /images/generations（JSON body） */
async function generate(cfg, args) {
  if (!args.prompt) throw new Error('generate 需要 --prompt');
  const body = {
    model: args.model || cfg.model,
    prompt: args.prompt,
    size: args.size || cfg.defaults.size,
    quality: args.quality || cfg.defaults.quality,
    n: Number(args.n || cfg.defaults.n),
  };
  const res = await fetch(`${cfg.baseURL}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(300_000),
  });
  const json = await readResponse(res);
  return json.data || [];
}

/** 改图：POST /images/edits（multipart，可传多张参考图） */
async function edit(cfg, args) {
  if (!args.prompt) throw new Error('edit 需要 --prompt');
  const images = (args.image ? String(args.image).split(',') : []).map(s => s.trim()).filter(Boolean);
  if (images.length === 0) throw new Error('edit 需要 --image（多张用逗号分隔）');

  const form = new FormData();
  form.append('model', args.model || cfg.model);
  form.append('prompt', args.prompt);
  form.append('size', args.size || cfg.defaults.size);
  form.append('quality', args.quality || cfg.defaults.quality);
  form.append('response_format', 'b64_json');
  const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };
  for (const p of images) {
    const abs = resolve(p);
    if (!existsSync(abs)) throw new Error(`参考图不存在: ${abs}`);
    const buf = readFileSync(abs);
    const type = MIME[extname(abs).toLowerCase()];
    if (!type) throw new Error(`不支持的参考图格式: ${extname(abs) || abs}（支持 png/jpg/jpeg/webp/gif）`);
    form.append('image', new Blob([buf], { type }), basename(abs));
  }
  const res = await fetch(`${cfg.baseURL}/images/edits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.apiKey}` },
    body: form,
    signal: AbortSignal.timeout(300_000),
  });
  const json = await readResponse(res);
  return json.data || [];
}
/** 入口：解析子命令 generate / edit，落盘并打印结果路径 */
async function main() {
  const [, , cmd, ...rest] = process.argv;
  if (!cmd || !['generate', 'edit'].includes(cmd)) {
    console.error('用法: node gpt-image.mjs <generate|edit> --prompt "..." [--size 1536x1024] [--quality high] [--n 1] [--out 路径] [--image a.png,b.jpg]');
    process.exit(1);
  }
  const cfg = loadConfig();
  const args = parseArgs(rest);

  const data = cmd === 'generate' ? await generate(cfg, args) : await edit(cfg, args);
  if (data.length === 0) throw new Error('接口未返回图片数据');

  const outDir = args.out
    ? resolve(args.out)
    : join(findProjectRoot(), cfg.outputDir || 'output/images');
  const saved = await saveImages(data, outDir, cmd);
  console.log(`✅ 已保存 ${saved.length} 张图片:`);
  saved.forEach(f => console.log('  ' + f));
}

main().catch(err => {
  console.error('❌ ' + err.message);
  process.exit(1);
});

