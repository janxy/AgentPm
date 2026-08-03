<template>
  <div ref="wrapRef" class="ppi-wrap">
    <canvas ref="canvasRef" class="ppi-canvas" @click="onCanvasClick"></canvas>
    <div v-if="!active" class="offline-mask">
      <div class="offline-title">设备离线</div>
      <div class="offline-sub">PPI 回波已冻结</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 雷达 PPI 回波面板
 * Canvas 绘制距离环、方位刻度、旋转扫描线与强度分级目标回波，支持点击选中目标
 */
const props = defineProps<{
  station: any
  targets: any[]
  selectedTargetId: number | null
  active: boolean
}>()
const emit = defineEmits<{ selectTarget: [id: number] }>()

const wrapRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
let raf = 0
let sweepAngle = 0
let resizeObserver: ResizeObserver | null = null

function ppiGeometry(w: number, h: number) {
  const ar = props.station?.mode === 'AR'
  const cx = w / 2
  const cy = ar ? h * 0.3 : h / 2
  const radius = Math.max(64, Math.min(w / 2 - 18, (ar ? h * 0.56 : h) / 2 - 14))
  return { cx, cy, radius, ar }
}

function levelColor(level: string, scheme: string) {
  if (scheme === 'hot') {
    return { high: '#ff3b30', normal: '#ff9f0a', weak: '#ffe14d' }[level] || '#7ee8a2'
  }
  if (scheme === 'cool') {
    return { high: '#ff5f7a', normal: '#3ec6ff', weak: '#2ee6a8' }[level] || '#7ee8a2'
  }
  return { high: '#ff6b5e', normal: '#ffc857', weak: '#4ed98a' }[level] || '#7ee8a2'
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bg = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h) * 0.7)
  bg.addColorStop(0, '#08271a')
  bg.addColorStop(1, '#020d08')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
}

function drawRingsAndBearing(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, range: number) {
  ctx.save()
  ctx.strokeStyle = 'rgba(86, 255, 171, 0.28)'
  ctx.fillStyle = 'rgba(150, 255, 205, 0.62)'
  ctx.lineWidth = 1
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 1; i <= 4; i++) {
    const r = (radius * i) / 4
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillText(`${Math.round((range * i) / 4)}km`, cx + r - 10, cy)
  }
  for (let deg = 0; deg < 360; deg += 15) {
    const rad = (deg * Math.PI) / 180
    const x1 = cx + Math.sin(rad) * radius * 0.93
    const y1 = cy - Math.cos(rad) * radius * 0.93
    const x2 = cx + Math.sin(rad) * radius
    const y2 = cy - Math.cos(rad) * radius
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    if (deg % 30 === 0) {
      const lx = cx + Math.sin(rad) * radius * 0.82
      const ly = cy - Math.cos(rad) * radius * 0.82
      const label = deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : `${deg}`
      ctx.fillText(label, lx, ly)
    }
  }
  ctx.restore()
}

function drawSweep(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  const rad = (sweepAngle * Math.PI) / 180
  const tail = rad - 0.42
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, radius, tail, rad)
  ctx.closePath()
  ctx.fillStyle = 'rgba(72, 255, 168, 0.10)'
  ctx.fill()
  const lx = cx + Math.sin(rad) * radius * 0.96
  const ly = cy - Math.cos(rad) * radius * 0.96
  ctx.strokeStyle = 'rgba(110, 255, 185, 0.92)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(lx, ly)
  ctx.stroke()
  ctx.restore()
}

function drawTargets(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, range: number, gain: number, scheme: string) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ;(props.targets || []).forEach((t) => {
    const d = Number(t.distance)
    if (d > range) return
    const visible = (gain / 100) * 0.55 + (Number(t.strength) / 100) * 0.55
    if (visible < 0.32) return
    const rad = (Number(t.bearing) * Math.PI) / 180
    const px = cx + Math.sin(rad) * (d / range) * radius
    const py = cy - Math.cos(rad) * (d / range) * radius
    const color = levelColor(t.level, scheme)
    const selected = props.selectedTargetId === t.id
    ctx.globalAlpha = Math.min(1, 0.42 + visible)
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = selected ? 16 : 8
    ctx.beginPath()
    ctx.arc(px, py, selected ? 6 : 3 + Number(t.strength) / 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    if (selected) {
      ctx.globalAlpha = 1
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(px, py, 9, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px sans-serif'
      ctx.fillText(t.targetNo, px, py - 13)
    }
  })
  ctx.globalAlpha = 1
  ctx.restore()
}

function drawAScope(ctx: CanvasRenderingContext2D, w: number, h: number, range: number, gain: number, scheme: string) {
  const top = h * 0.66
  const bottom = h - 12
  ctx.save()
  ctx.fillStyle = '#03130c'
  ctx.fillRect(0, top, w, bottom - top)
  ctx.strokeStyle = 'rgba(86, 255, 171, 0.55)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(12, bottom)
  ctx.lineTo(w - 12, bottom)
  ctx.stroke()
  ctx.fillStyle = 'rgba(150, 255, 205, 0.55)'
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  for (let i = 0; i <= 4; i++) {
    const x = 12 + ((w - 24) * i) / 4
    ctx.beginPath()
    ctx.moveTo(x, bottom)
    ctx.lineTo(x, bottom - 4)
    ctx.stroke()
    ctx.fillText(`${Math.round((range * i) / 4)}`, x, bottom + 10)
  }
  ctx.fillText('km', w / 2, top + 12)
  ;(props.targets || []).forEach((t) => {
    const d = Number(t.distance)
    if (d > range) return
    const visible = (gain / 100) * 0.55 + (Number(t.strength) / 100) * 0.55
    if (visible < 0.32) return
    const x = 12 + ((w - 24) * d) / range
    const spike = (bottom - top - 14) * (Number(t.strength) / 100) * 0.9
    ctx.strokeStyle = levelColor(t.level, scheme)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, bottom)
    ctx.lineTo(x, bottom - spike)
    ctx.stroke()
  })
  ctx.restore()
}

function draw(time: number) {
  const canvas = canvasRef.value
  const wrap = wrapRef.value
  if (!canvas || !wrap) { raf = requestAnimationFrame(draw); return }
  const dpr = window.devicePixelRatio || 1
  const w = wrap.clientWidth
  const h = wrap.clientHeight
  if (w === 0 || h === 0) { raf = requestAnimationFrame(draw); return }
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) { raf = requestAnimationFrame(draw); return }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawBackground(ctx, w, h)
  const range = Number(props.station?.range || 24)
  const gain = Number(props.station?.gain || 60)
  const scheme = props.station?.colorScheme || 'standard'
  const { cx, cy, radius, ar } = ppiGeometry(w, h)
  if (props.active) {
    const rpm = Number(props.station?.antennaRpm || 12)
    sweepAngle = ((time / 60000) * rpm * 360) % 360
  }
  drawRingsAndBearing(ctx, cx, cy, radius, range)
  if (props.active) drawSweep(ctx, cx, cy, radius)
  drawTargets(ctx, cx, cy, radius, range, gain, scheme)
  if (ar) drawAScope(ctx, w, h, range, gain, scheme)
  if (!props.active) {
    ctx.save()
    ctx.fillStyle = 'rgba(9, 22, 16, 0.72)'
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
  }
  raf = requestAnimationFrame(draw)
}

function onCanvasClick(e: MouseEvent) {
  if (!props.active || !canvasRef.value) return
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const { cx, cy, radius } = ppiGeometry(rect.width, rect.height)
  const range = Number(props.station?.range || 24)
  const dx = x - cx
  const dy = y - cy
  const dist = (Math.hypot(dx, dy) / radius) * range
  let bearing = (Math.atan2(dx, -dy) * 180) / Math.PI
  if (bearing < 0) bearing += 360
  let best: any = null
  let bestScore = Infinity
  ;(props.targets || []).forEach((t) => {
    let angleDiff = Math.abs(bearing - Number(t.bearing))
    angleDiff = Math.min(angleDiff, 360 - angleDiff)
    const distDiff = Math.abs(dist - Number(t.distance))
    const score = angleDiff * 0.5 + distDiff
    if (angleDiff <= 10 && distDiff <= range * 0.08 && score < bestScore) {
      best = t
      bestScore = score
    }
  })
  if (best) emit('selectTarget', best.id)
}

function scheduleDraw() {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(draw)
}

onMounted(() => {
  raf = requestAnimationFrame(draw)
  resizeObserver = new ResizeObserver(scheduleDraw)
  if (wrapRef.value) resizeObserver.observe(wrapRef.value)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  resizeObserver?.disconnect()
})
</script>

<style lang="scss" scoped>
.ppi-wrap { position: relative; width: 100%; height: 100%; background: #03120c; }
.ppi-canvas { width: 100%; height: 100%; display: block; cursor: crosshair; }
.offline-mask { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: rgba(8, 20, 14, 0.78); z-index: 2; color: #9bb8aa; }
.offline-title { font-size: 20px; font-weight: 700; color: #f0a9a9; }
.offline-sub { font-size: 12px; }
</style>
