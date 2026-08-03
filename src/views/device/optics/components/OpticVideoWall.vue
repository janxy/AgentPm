<template>
  <div class="video-wall">
    <div class="wall-toolbar">
      <div class="toolbar-left">
        <ElRadioGroup v-model="gridSize" size="small" :disabled="!device">
          <ElRadioButton :value="1">单屏</ElRadioButton>
          <ElRadioButton :value="4">四分屏</ElRadioButton>
          <ElRadioButton :value="9">九分屏</ElRadioButton>
          <ElRadioButton :value="16">十六分屏</ElRadioButton>
        </ElRadioGroup>
        <ElRadioGroup v-if="device?.dualLight" v-model="mode" size="small" class="mode-group">
          <ElRadioButton value="visible">可见光</ElRadioButton>
          <ElRadioButton value="ir">红外</ElRadioButton>
          <ElRadioButton value="pip">画中画</ElRadioButton>
          <ElRadioButton value="fusion">融合</ElRadioButton>
        </ElRadioGroup>
      </div>
      <div class="toolbar-right">
        <ElSwitch v-model="weakMode" active-text="弱网模拟" size="small" :disabled="!device" />
        <ElButton :icon="Camera" size="small" type="primary" :disabled="!canOperate" @click="capture">截图</ElButton>
        <ElButton :icon="recording ? VideoPause : VideoPlay" size="small" :type="recording ? 'danger' : 'default'" :disabled="!canOperate" @click="toggleRecord">
          {{ recording ? '停止录像' : '开始录像' }}
        </ElButton>
      </div>
    </div>
    <div ref="canvasWrap" class="canvas-wrap">
      <canvas ref="canvasRef" class="video-canvas"></canvas>
      <div v-if="!device" class="cover-mask">请从左侧选择光电设备</div>
      <div v-else-if="device.status === 0" class="cover-mask offline-mask">设备离线，画面已冻结</div>
      <div v-if="device && weakMode" class="weak-tip">弱网中，已切换子码流</div>
      <div v-if="device && recording" class="rec-tip"><i class="rec-dot"></i>REC</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Camera, VideoPlay, VideoPause } from '@element-plus/icons-vue'

/**
 * 光电视频墙
 * Canvas 模拟可见光/红外/画中画/融合画面，支持 1/4/9/16 分屏、弱网子码流与截图录像
 */
const props = defineProps<{ device: any; state: any; recording: boolean }>()
const emit = defineEmits<{ capture: [dataUrl: string]; 'record-toggle': [] }>()

const gridSize = ref(1)
const mode = ref('visible')
const weakMode = ref(false)
const canvasRef = ref<HTMLCanvasElement>()
const canvasWrap = ref<HTMLDivElement>()
let raf = 0

const canOperate = computed(() => !!props.device && props.device.status === 1)

function gridInfo() {
  const size = gridSize.value
  const cols = size === 4 ? 2 : size === 9 ? 3 : size === 16 ? 4 : 1
  return { cols, rows: cols }
}

/** 绘制单个画面单元 */
function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, idx: number, time: number) {
  const isIr = mode.value === 'ir' || mode.value === 'pip' || mode.value === 'fusion'
  const grad = ctx.createLinearGradient(0, y, 0, y + h)
  if (mode.value === 'ir') {
    grad.addColorStop(0, '#0b1410')
    grad.addColorStop(0.5, '#12211a')
    grad.addColorStop(1, '#08100c')
  } else {
    grad.addColorStop(0, '#bcd8ea')
    grad.addColorStop(0.48, '#7fa8c8')
    grad.addColorStop(0.5, '#2f5f84')
    grad.addColorStop(1, '#123b5e')
  }
  ctx.fillStyle = grad
  ctx.fillRect(x, y, w, h)

  const horizon = y + h * 0.46
  ctx.strokeStyle = isIr ? 'rgba(120, 220, 150, 0.28)' : 'rgba(255, 255, 255, 0.35)'
  ctx.lineWidth = 1
  for (let i = 0; i < 5; i++) {
    const base = horizon + 14 + i * (h * 0.09)
    ctx.beginPath()
    for (let px = x; px <= x + w; px += 8) {
      const py = base + Math.sin(px / 26 + time / 900 + i * 0.8) * 3
      px === x ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.stroke()
  }

  const tx = x + w * 0.22 + Math.sin(time / 1300 + idx * 1.7) * w * 0.18
  const ty = horizon + h * 0.16 + Math.cos(time / 1700 + idx) * 8
  ctx.fillStyle = mode.value === 'ir' ? 'rgba(180, 255, 190, 0.85)' : 'rgba(255, 80, 80, 0.9)'
  ctx.beginPath()
  ctx.arc(tx, ty, 4, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = mode.value === 'ir' ? 'rgba(150, 255, 170, 0.9)' : 'rgba(255, 255, 255, 0.85)'
  ctx.font = '11px sans-serif'
  ctx.fillText(props.device?.name || '未连接', x + 8, y + 18)
  ctx.fillText(`倍率 ×${props.state?.zoom ?? '-'}`, x + 8, y + h - 14)
  ctx.textAlign = 'right'
  ctx.fillText(new Date().toLocaleTimeString('zh-CN', { hour12: false }), x + w - 8, y + h - 14)
  ctx.textAlign = 'left'

  if (mode.value === 'pip') drawPip(ctx, x, y, w, h)
  if (mode.value === 'fusion') drawFusionOverlay(ctx, x, y, w, h, time)
}

/** 画中画：右下角叠加红外小窗 */
function drawPip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const sw = w * 0.3
  const sh = h * 0.26
  const sx = x + w - sw - 10
  const sy = y + h - sh - 10
  ctx.fillStyle = '#0a120e'
  ctx.fillRect(sx, sy, sw, sh)
  ctx.strokeStyle = 'rgba(150, 255, 170, 0.7)'
  ctx.strokeRect(sx, sy, sw, sh)
  ctx.fillStyle = 'rgba(150, 255, 170, 0.8)'
  ctx.fillRect(sx + sw * 0.4, sy + sh * 0.45, sw * 0.2, sh * 0.12)
}

/** 融合模式：叠加半透明红外热斑 */
function drawFusionOverlay(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number) {
  const cx = x + w * 0.6 + Math.sin(time / 1100) * w * 0.08
  const cy = y + h * 0.34
  ctx.globalAlpha = 0.35
  ctx.fillStyle = '#ffaa33'
  ctx.beginPath()
  ctx.arc(cx, cy, w * 0.09, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas || !props.device) { raf = requestAnimationFrame(draw); return }
  const wrap = canvasWrap.value
  if (!wrap) return
  const dpr = window.devicePixelRatio || 1
  const w = wrap.clientWidth
  const h = wrap.clientHeight
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr
    canvas.height = h * dpr
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const { cols, rows } = gridInfo()
  const cellW = w / cols
  const cellH = h / rows
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      drawCell(ctx, c * cellW, r * cellH, cellW, cellH, r * cols + c, performance.now())
    }
  }
  raf = requestAnimationFrame(draw)
}

function capture() {
  const canvas = canvasRef.value
  if (!canvas) return
  emit('capture', canvas.toDataURL('image/png'))
}

function toggleRecord() {
  emit('record-toggle')
}

onBeforeUnmount(() => cancelAnimationFrame(raf))

raf = requestAnimationFrame(draw)
</script>

<style lang="scss" scoped>
.video-wall { display: flex; flex-direction: column; height: 100%; }
.wall-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border-bottom: 1px solid var(--el-border-color-lighter); flex-wrap: wrap; }
.toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.canvas-wrap { position: relative; flex: 1; min-height: 0; background: #081420; }
.video-canvas { width: 100%; height: 100%; display: block; }
.cover-mask { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(8, 20, 32, 0.65); color: #d6e4f0; font-size: 14px; z-index: 2; }
.offline-mask { color: #f0a9a9; }
.weak-tip { position: absolute; top: 12px; left: 12px; padding: 2px 8px; border-radius: 4px; background: rgba(230, 162, 60, 0.9); color: #fff; font-size: 12px; z-index: 3; }
.rec-tip { position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 4px; background: rgba(245, 108, 108, 0.9); color: #fff; font-size: 12px; z-index: 3; }
.rec-dot { width: 7px; height: 7px; border-radius: 50%; background: #fff; }
</style>
