<template>
  <div class="uav-status-panel annot-device-uav-status">
    <div class="panel-title">无人机状态</div>
    <div
      v-for="uav in uavs"
      :key="uav.id"
      class="uav-item"
      :class="{ active: uav.id === selectedId, offline: uav.status !== 1 }"
      @click="emit('select', uav)"
    >
      <div class="uav-head">
        <span class="uav-name">{{ uav.name }}</span>
        <ElTag :type="uav.status === 1 ? 'success' : uav.status === 2 ? 'danger' : 'info'" size="small" disable-transitions>
          {{ statusLabel[uav.status] }}
        </ElTag>
      </div>
      <div class="uav-grid">
        <div class="uav-cell"><span>高度</span><strong>{{ uav.altitude }}m</strong></div>
        <div class="uav-cell"><span>速度</span><strong>{{ uav.speed }}m/s</strong></div>
        <div class="uav-cell"><span>姿态</span><strong>{{ uav.roll }}° / {{ uav.pitch }}°</strong></div>
        <div class="uav-cell"><span>距原点</span><strong>{{ uav.distanceFromOrigin }}km</strong></div>
      </div>
      <div class="uav-bottom">
        <div class="battery-row">
          <span class="battery-label">电量</span>
          <ElProgress :percentage="uav.battery" :stroke-width="8" :show-text="false" :color="uav.battery < 20 ? '#f56c6c' : '#67c23a'" class="battery-bar" />
          <strong class="battery-value" :class="{ 'low-battery': uav.battery < 20 }">{{ uav.battery }}%</strong>
        </div>
        <div class="endurance-row">预估续航 {{ uav.enduranceMinutes }} 分钟</div>
      </div>
      <div v-if="uav.battery < 20" class="warn-tip warn-low">低电量，已触发返航提示</div>
      <div v-else-if="uav.signalLost" class="warn-tip warn-signal">信号丢失，已模拟自动返航</div>
      <div v-else-if="uav.flightStatus === 'returning'" class="warn-tip warn-return">返航中</div>
    </div>
    <ElEmpty v-if="uavs.length === 0" description="暂无无人机" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
/**
 * 无人机状态面板
 * 展示位置、高度、速度、姿态、电量、距离与续航，低电量/失联状态特殊提示
 */
defineProps<{ uavs: any[]; selectedId: number | null }>()
const emit = defineEmits<{ select: [uav: any] }>()

const statusLabel: Record<number, string> = { 1: '在线', 0: '离线', 2: '故障' }
</script>

<style lang="scss" scoped>
.uav-status-panel { display: flex; flex-direction: column; gap: 10px; height: 100%; overflow: auto; }
.panel-title { font-size: 15px; font-weight: 600; }
.uav-item { padding: 12px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; cursor: pointer; }
.uav-item.active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.uav-item.offline { opacity: 0.55; }
.uav-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.uav-name { font-size: 13px; font-weight: 600; }
.uav-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 10px; }
.uav-cell { display: flex; flex-direction: column; gap: 2px; padding: 6px 8px; border-radius: 6px; background: var(--el-fill-color-light); }
.uav-cell span { font-size: 11px; color: var(--el-text-color-secondary); }
.uav-cell strong { font-size: 13px; color: var(--el-text-color-primary); }
.battery-row { display: flex; align-items: center; gap: 8px; }
.battery-label { font-size: 12px; color: var(--el-text-color-secondary); }
.battery-bar { flex: 1; }
.battery-value { font-size: 13px; min-width: 40px; }
.low-battery { color: var(--el-color-danger); }
.endurance-row { margin-top: 6px; font-size: 12px; color: var(--el-text-color-secondary); }
.warn-tip { margin-top: 8px; padding: 6px 8px; border-radius: 6px; font-size: 12px; }
.warn-low { background: var(--el-color-danger-light-9); color: var(--el-color-danger); }
.warn-signal { background: var(--el-color-warning-light-9); color: var(--el-color-warning); }
.warn-return { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
</style>
