<template>
  <div class="linkage-uav-list annot-device-uav-linkage-list">
    <div class="panel-title">无人机列表</div>
    <div
      v-for="uav in uavs"
      :key="uav.id"
      class="uav-item"
      :class="{ active: uav.id === selectedId, offline: uav.status !== 1 }"
      @click="emit('select', uav)"
    >
      <div class="uav-head">
        <span class="uav-name">{{ uav.name }}</span>
        <span class="uav-head-right">
          <ElTag
            v-if="uav.id === nearestId"
            type="danger"
            size="small"
            disable-transitions
            class="nearest-badge"
            >最近</ElTag
          >
          <ElTag :type="statusTag(uav.status)" size="small" disable-transitions>
            {{ statusLabel[uav.status] || "未知" }}
          </ElTag>
        </span>
      </div>
      <div class="uav-grid">
        <div class="uav-cell">
          <span>续航</span><strong>{{ uav.enduranceMinutes }}分钟</strong>
        </div>
        <div class="uav-cell">
          <span>高度</span><strong>{{ uav.altitude }}m</strong>
        </div>
        <div class="uav-cell">
          <span>速度</span><strong>{{ uav.speed }}m/s</strong>
        </div>
      </div>
      <div
        v-if="showDistance && distanceText(uav) !== '-'"
        class="distance-line"
      >
        距告警目标 {{ distanceText(uav) }}
      </div>
      <div class="battery-row">
        <span class="battery-label">电量</span>
        <ElProgress
          :percentage="uav.battery"
          :stroke-width="8"
          :show-text="false"
          :color="uav.battery < 20 ? '#f56c6c' : '#67c23a'"
          class="battery-bar"
        />
        <strong
          class="battery-value"
          :class="{ 'low-battery': uav.battery < 20 }"
          >{{ uav.battery }}%</strong
        >
      </div>
      <div v-if="uav.status === 2" class="warn-tip warn-fault">
        设备故障，不可执行任务
      </div>
      <div v-else-if="uav.battery < 20" class="warn-tip warn-low">
        低电量，不建议起飞
      </div>
    </div>
    <ElEmpty
      v-if="uavs.length === 0"
      description="暂无无人机"
      :image-size="60"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 无人机联动列表
 * 展示状态、续航、高度、速度与电量，联动事件时附距告警点距离，点击切换当前无人机
 */
const props = defineProps<{
  uavs: any[];
  selectedId: number | null;
  target: { lat: number; lng: number; address?: string } | null;
  nearestId?: number | null;
  showDistance?: boolean;
}>();
const emit = defineEmits<{ select: [uav: any] }>();

const statusLabel: Record<number, string> = { 1: "在线", 0: "离线", 2: "故障" };

function statusTag(status: number): "success" | "danger" | "info" {
  return status === 1 ? "success" : status === 2 ? "danger" : "info";
}

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

function distanceText(uav: any) {
  if (!props.target || uav.lat == null || uav.lng == null) return "-";
  return `${haversine(props.target.lat, props.target.lng, uav.lat, uav.lng).toFixed(1)}km`;
}
</script>

<style lang="scss" scoped>
.linkage-uav-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow: auto;
}
.panel-title {
  font-size: 15px;
  font-weight: 600;
}
.uav-item {
  padding: 10px 12px;
  cursor: pointer;
}
.uav-item.active {
  background: var(--el-color-primary-light-9);
}
.uav-item.offline {
  opacity: 0.55;
}
.uav-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.uav-name {
  font-size: 13px;
  font-weight: 600;
}
.uav-head-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.nearest-badge {
  flex: none;
}
.uav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}
.uav-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
}
.uav-cell span {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.uav-cell strong {
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.distance-line {
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.battery-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.battery-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.battery-bar {
  flex: 1;
}
.battery-value {
  font-size: 13px;
  min-width: 40px;
}
.low-battery {
  color: var(--el-color-danger);
}
.warn-tip {
  margin-top: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
}
.warn-low {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}
.warn-fault {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}
</style>
