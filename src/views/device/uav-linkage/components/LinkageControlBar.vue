<template>
  <div class="linkage-control-bar annot-device-uav-linkage-control-bar">
    <div class="control-left">
      <div class="flight-actions">
        <ElButton
          type="primary"
          :icon="Promotion"
          :disabled="!canOperate || taskRunning || arrived || lowBattery"
          @click="emit('dispatch')"
        >
          {{
            arrived ? "已到达告警点" : taskRunning ? "飞赴中" : "一键飞赴告警点"
          }}
        </ElButton>
        <ElButton
          :icon="VideoPause"
          :disabled="!canOperate || (!taskRunning && !arrived)"
          @click="emit('hover')"
          >悬停</ElButton
        >
        <ElButton
          :icon="Back"
          :disabled="!canOperate || taskRunning"
          @click="emit('return')"
          >返航</ElButton
        >
      </div>

      <div class="capture-actions">
        <ElButton
          :icon="Camera"
          :disabled="!canOperate"
          @click="emit('capture')"
          >截图</ElButton
        >
        <ElButton
          :icon="recording ? VideoPause : VideoPlay"
          :type="recording ? 'danger' : 'default'"
          :disabled="!canOperate"
          @click="emit('record-toggle')"
        >
          {{ recording ? "停止录像" : "开始录像" }}
        </ElButton>
        <ElButton
          :icon="FolderOpened"
          :disabled="!canOperate"
          @click="emit('evidence')"
          >取证与喊话</ElButton
        >
      </div>
    </div>

    <div class="progress-area">
      <div class="progress-head">
        <span class="task-name">{{ taskText }}</span>
        <strong>{{ progress }}%</strong>
      </div>
      <ElProgress
        :percentage="progress"
        :stroke-width="10"
        :status="arrived ? 'success' : undefined"
      />
      <div class="progress-grid">
        <div>
          <span>航程</span><strong>{{ totalDistance.toFixed(1) }}km</strong>
        </div>
        <div>
          <span>已飞</span><strong>{{ flownDistance.toFixed(1) }}km</strong>
        </div>
        <div>
          <span>剩余</span><strong>{{ remainDistance.toFixed(1) }}km</strong>
        </div>
        <div>
          <span>预计到达</span><strong>{{ remainMinutes }}分钟</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  Back,
  Camera,
  FolderOpened,
  Promotion,
  VideoPause,
  VideoPlay,
} from "@element-plus/icons-vue";

/**
 * 无人机联动操作区
 * 承载飞赴任务、悬停、返航、截图、录像、取证喊话入口与飞行进度
 */
const props = defineProps<{
  uav: any;
  target: { lat: number; lng: number; address?: string } | null;
  task: any;
  arrived: boolean;
  recording: boolean;
}>();
const emit = defineEmits<{
  capture: [];
  "record-toggle": [];
  dispatch: [];
  hover: [];
  return: [];
  evidence: [];
}>();

const canOperate = computed(() => !!props.uav && props.uav.status === 1);
const lowBattery = computed(() => (props.uav?.battery ?? 100) < 20);
const taskRunning = computed(
  () =>
    !!props.task &&
    (props.task.status === "running" || props.task.status === "planned"),
);
const progress = computed(() => props.task?.progress || 0);
const taskText = computed(() => {
  if (props.arrived) return "已到达告警点，可执行取证喊话";
  if (taskRunning.value) return "无人机飞赴告警点中";
  return "等待起飞";
});

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const totalDistance = computed(() => {
  if (!props.uav || !props.target) return 0;
  return haversine(
    props.target.lat,
    props.target.lng,
    props.uav.lat ?? props.target.lat,
    props.uav.lng ?? props.target.lng,
  );
});
const flownDistance = computed(
  () => totalDistance.value * (progress.value / 100),
);
const remainDistance = computed(() =>
  Math.max(0, totalDistance.value - flownDistance.value),
);
const remainMinutes = computed(() => {
  const speed = Math.max(10, props.uav?.speed || 15);
  return Math.ceil((remainDistance.value * 1000) / (speed * 60));
});
</script>

<style lang="scss" scoped>
.linkage-control-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}
.control-left {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  flex: none;
}
.flight-actions,
.capture-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.progress-area {
  flex: 1;
  min-height: 0;
  padding: 6px 2px;
}
.progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.task-name {
  font-size: 13px;
  font-weight: 600;
}
.progress-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 10px;
}
.progress-grid div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.progress-grid span {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.progress-grid strong {
  font-size: 13px;
  color: var(--el-text-color-primary);
}
</style>
