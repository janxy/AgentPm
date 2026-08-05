<template>
  <div class="linkage-optic-video annot-device-uav-linkage-optic-video">
    <div class="optic-toolbar">
      <div class="optic-title">光电视频</div>
      <div class="optic-status">
        <ElTag
          :type="
            device?.status === 1
              ? 'success'
              : device?.status === 2
                ? 'danger'
                : 'info'
          "
          size="small"
          disable-transitions
        >
          {{ statusText }}
        </ElTag>
        <span v-if="distanceText" class="optic-distance"
          >距告警点 {{ distanceText }}</span
        >
      </div>
    </div>
    <div
      ref="canvasWrap"
      class="canvas-wrap annot-device-uav-linkage-optic-canvas"
    >
      <canvas ref="canvasRef" class="optic-canvas"></canvas>
      <div v-if="!device" class="cover-mask">未接入光电设备</div>
      <div v-else-if="device.status !== 1" class="cover-mask offline-mask">
        光电设备不可用，画面已冻结
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

/**
 * 光电视频面板
 * Canvas 模拟光电摄像头画面，与无人机直播并排展示
 */
const props = defineProps<{
  device: any;
  target: { lat: number; lng: number; address?: string } | null;
  distanceText?: string;
}>();

const canvasRef = ref<HTMLCanvasElement>();
const canvasWrap = ref<HTMLDivElement>();
let raf = 0;

const statusText = computed(() => {
  if (!props.device) return "未连接";
  return props.device.status === 1
    ? "在线"
    : props.device.status === 2
      ? "故障"
      : "离线";
});

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) {
    raf = requestAnimationFrame(draw);
    return;
  }
  const wrap = canvasWrap.value;
  if (!wrap) return;
  const dpr = window.devicePixelRatio || 1;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#bcd8ea");
  grad.addColorStop(0.48, "#7fa8c8");
  grad.addColorStop(0.5, "#2f5f84");
  grad.addColorStop(1, "#123b5e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const horizon = h * 0.46;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 1;
  const time = performance.now();
  for (let i = 0; i < 5; i++) {
    const base = horizon + 14 + i * (h * 0.09);
    ctx.beginPath();
    for (let px = 0; px <= w; px += 8) {
      const py = base + Math.sin(px / 26 + time / 900 + i * 0.8) * 3;
      px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  if (props.device && props.target) {
    const cx = w * 0.5 + Math.sin(time / 1300) * w * 0.04;
    const cy = horizon + h * 0.16 + Math.cos(time / 1700) * 8;
    const size = 30;
    ctx.strokeStyle = "rgba(255, 80, 80, 0.95)";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
    ctx.beginPath();
    ctx.moveTo(cx - size, cy);
    ctx.lineTo(cx - size / 2, cy);
    ctx.moveTo(cx + size / 2, cy);
    ctx.lineTo(cx + size, cy);
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx, cy - size / 2);
    ctx.moveTo(cx, cy + size / 2);
    ctx.lineTo(cx, cy + size);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "12px sans-serif";
    ctx.fillText("目标", cx - size / 2, cy - size / 2 - 8);
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "12px monospace";
  ctx.fillText(`${props.device?.name || "未连接"}`, 10, 20);
  ctx.fillText(`倍率 ×${props.device?.zoom ?? "-"}`, 10, 38);
  if (props.target) {
    ctx.fillText(
      `TGT ${props.target.lat.toFixed(5)}, ${props.target.lng.toFixed(5)}`,
      10,
      h - 14,
    );
  }
  ctx.textAlign = "right";
  ctx.fillText(
    new Date().toLocaleTimeString("zh-CN", { hour12: false }),
    w - 10,
    20,
  );
  ctx.textAlign = "left";

  raf = requestAnimationFrame(draw);
}

onBeforeUnmount(() => cancelAnimationFrame(raf));
raf = requestAnimationFrame(draw);
</script>

<style lang="scss" scoped>
.linkage-optic-video {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
}
.optic-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.optic-title {
  font-size: 15px;
  font-weight: 600;
}
.optic-status {
  display: flex;
  align-items: center;
  gap: 8px;
}
.optic-distance {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.canvas-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  background: #081420;
}
.optic-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
.cover-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 20, 32, 0.65);
  color: #d6e4f0;
  font-size: 14px;
  z-index: 2;
}
.offline-mask {
  color: #f0a9a9;
}
</style>
