<template>
  <div class="linkage-live-panel annot-device-uav-linkage-live">
    <div class="live-toolbar">
      <div class="live-title">无人机直播</div>
      <div class="live-status">
        <ElTag
          :type="
            uav?.status === 1
              ? 'success'
              : uav?.status === 2
                ? 'danger'
                : 'info'
          "
          size="small"
          disable-transitions
        >
          {{ statusText }}
        </ElTag>
        <ElTag v-if="arrived" type="success" size="small" disable-transitions
          >已到达</ElTag
        >
        <ElTag
          v-else-if="taskRunning"
          type="primary"
          size="small"
          disable-transitions
          >飞赴中</ElTag
        >
      </div>
    </div>

    <div
      ref="canvasWrap"
      class="canvas-wrap annot-device-uav-linkage-live-video"
    >
      <canvas ref="canvasRef" class="live-canvas"></canvas>
      <div v-if="!uav" class="cover-mask">请从左侧选择无人机</div>
      <div v-else-if="uav.status !== 1" class="cover-mask offline-mask">
        无人机不可用，画面已冻结
      </div>
      <div v-if="uav && recording" class="rec-tip">
        <i class="rec-dot"></i>REC
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

/**
 * 无人机联动直播与控制区
 * Canvas 模拟机载直播画面，承载飞赴任务、悬停、返航、截图、录像与喊话操作
 */
const props = defineProps<{
  uav: any;
  target: { lat: number; lng: number; address?: string } | null;
  task: any;
  arrived: boolean;
  recording: boolean;
}>();
const emit = defineEmits<{
  capture: [dataUrl: string];
}>();

const canvasRef = ref<HTMLCanvasElement>();
const canvasWrap = ref<HTMLDivElement>();
let raf = 0;

const statusText = computed(() => {
  if (!props.uav) return "未连接";
  return props.uav.status === 1
    ? "在线"
    : props.uav.status === 2
      ? "故障"
      : "离线";
});
const taskRunning = computed(
  () =>
    !!props.task &&
    (props.task.status === "running" || props.task.status === "planned"),
);
const progress = computed(() => props.task?.progress || 0);

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
  grad.addColorStop(0, "#8fc1e8");
  grad.addColorStop(0.42, "#c6dbe9");
  grad.addColorStop(0.46, "#4d7fa6");
  grad.addColorStop(1, "#173f5f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const horizon = h * 0.46;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 1;
  const time = performance.now();
  for (let i = 0; i < 6; i++) {
    const base = horizon + 14 + i * (h * 0.09);
    ctx.beginPath();
    for (let px = 0; px <= w; px += 8) {
      const py = base + Math.sin(px / 28 + time / 900 + i * 0.8) * 3;
      px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  if (props.arrived) {
    drawTargetBox(ctx, w, h, time);
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("已到达告警目标", w / 2, 46);
    ctx.textAlign = "left";
  } else if (taskRunning.value) {
    drawTargetBox(ctx, w, h, time);
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "12px monospace";
  ctx.fillText(`UAV ${props.uav?.name || "-"}`, 10, 20);
  ctx.fillText(
    `ALT ${props.uav?.altitude ?? 0}m  SPD ${props.uav?.speed ?? 0}m/s`,
    10,
    38,
  );
  ctx.fillText(`BAT ${props.uav?.battery ?? 0}%`, 10, 56);
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

function drawTargetBox(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
) {
  const cx = w * 0.5 + Math.sin(time / 1400) * w * 0.03;
  const cy = h * 0.42 + Math.cos(time / 1700) * 6;
  const size = 34;
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

function capture() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  emit("capture", canvas.toDataURL("image/png"));
}

onBeforeUnmount(() => cancelAnimationFrame(raf));
raf = requestAnimationFrame(draw);

defineExpose({ capture });
</script>

<style lang="scss" scoped>
.linkage-live-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.live-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.live-title {
  font-size: 15px;
  font-weight: 600;
}
.live-status {
  display: flex;
  align-items: center;
  gap: 6px;
}
.canvas-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  background: #081420;
}
.live-canvas {
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
.rec-tip {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(245, 108, 108, 0.9);
  color: #fff;
  font-size: 12px;
  z-index: 3;
}
.rec-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
}
</style>
