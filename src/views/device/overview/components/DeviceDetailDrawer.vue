<template>
  <ElDrawer
    :model-value="visible"
    title="设备详情"
    direction="rtl"
    size="500px"
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-loading="loading" class="detail-body annot-device-overview-detail">
      <template v-if="detail">
        <div class="detail-head">
          <div class="detail-name">{{ detail.name }}</div>
          <ElTag :type="statusTag[detail.status]" size="small" disable-transitions>{{ statusLabel[detail.status] }}</ElTag>
        </div>
        <ElDescriptions title="设备档案" :column="1" border size="small">
          <ElDescriptionsItem label="设备编码">{{ detail.code }}</ElDescriptionsItem>
          <ElDescriptionsItem label="设备型号">{{ detail.model }}</ElDescriptionsItem>
          <ElDescriptionsItem label="接入协议">{{ detail.protocol }}</ElDescriptionsItem>
          <ElDescriptionsItem label="所属区域">{{ detail.regionName }}</ElDescriptionsItem>
          <ElDescriptionsItem label="最后心跳">{{ detail.lastHeartbeat }}</ElDescriptionsItem>
          <ElDescriptionsItem label="信号强度">{{ detail.signalStrength }}%</ElDescriptionsItem>
        </ElDescriptions>
        <ElDescriptions title="运行参数" :column="2" border size="small" class="runtime-box">
          <ElDescriptionsItem label="方位角">{{ runtime.pan ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="俯仰角">{{ runtime.tilt ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="倍率">{{ runtime.zoom ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="电量">{{ runtime.battery !== undefined ? runtime.battery + '%' : '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="飞行高度">{{ runtime.altitude !== undefined ? runtime.altitude + 'm' : '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="天线转速">{{ runtime.antennaRpm !== undefined ? runtime.antennaRpm + 'r/min' : '-' }}</ElDescriptionsItem>
        </ElDescriptions>
        <div class="link-actions">
          <ElButton v-if="detail.type === 'optic'" type="primary" :icon="VideoCamera" @click="goLink('/device/optics')">光电联动</ElButton>
          <ElButton v-if="detail.type === 'uav'" type="primary" :icon="Aim" @click="goLink('/device/uav')">无人机联动</ElButton>
          <ElButton v-if="detail.type === 'radar'" type="primary" :icon="DataAnalysis" @click="goLink('/device/radar')">雷达监测</ElButton>
        </div>
        <div class="ops-title">最近操作记录</div>
        <ElTimeline v-if="detail.ops?.length">
          <ElTimelineItem v-for="op in detail.ops" :key="op.id" :timestamp="op.createTime" placement="top">
            <div class="op-row">
              <ElTag size="small" disable-transitions>{{ op.action }}</ElTag>
              <span class="op-content">{{ op.content }}</span>
            </div>
          </ElTimelineItem>
        </ElTimeline>
        <ElEmpty v-else description="暂无操作记录" :image-size="60" />
      </template>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Aim, DataAnalysis, VideoCamera } from '@element-plus/icons-vue'
import { getDeviceDetail, getOpticState, getUavState, getRadarStationDetail } from '@/api/device'

/**
 * 设备详情抽屉
 * 展示设备档案、运行参数、最近操作记录，并提供联动控制页快捷入口
 */
const props = defineProps<{ visible: boolean; deviceId: number | null }>()
const emit = defineEmits<{ 'update:visible': [value: boolean]; link: [deviceId: number] }>()
const router = useRouter()

const loading = ref(false)
const detail = ref<any>(null)
const runtime = ref<any>({})

const statusLabel: Record<number, string> = { 1: '在线', 0: '离线', 2: '故障' }
const statusTag: Record<number, 'success' | 'info' | 'danger'> = { 1: 'success', 0: 'info', 2: 'danger' }

/** 按设备类型加载专属运行参数 */
async function loadRuntime(device: any) {
  if (device.type === 'optic') {
    const { data } = await getOpticState(device.id)
    runtime.value = data || {}
  } else if (device.type === 'uav') {
    const { data } = await getUavState(device.id)
    runtime.value = data || {}
  } else if (device.type === 'radar') {
    const { data } = await getRadarStationDetail(device.id)
    runtime.value = data || {}
  } else {
    runtime.value = { signal: device.signalStrength }
  }
}

async function loadDetail() {
  if (!props.deviceId) return
  loading.value = true
  try {
    const { data } = await getDeviceDetail(props.deviceId)
    detail.value = data
    await loadRuntime(data)
  } finally {
    loading.value = false
  }
}

function goLink(path: string) {
  emit('update:visible', false)
  emit('link', props.deviceId!)
  router.push({ path, query: { deviceId: String(props.deviceId) } })
}

watch(() => props.visible, (val) => { if (val) loadDetail() })
</script>

<style lang="scss" scoped>
.detail-body { min-height: 300px; }
.detail-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.detail-name { font-size: 18px; font-weight: 600; }
.runtime-box { margin-top: 16px; }
.link-actions { display: flex; gap: 8px; margin-top: 16px; }
.ops-title { margin: 20px 0 12px; font-size: 15px; font-weight: 600; }
.op-row { display: flex; align-items: center; gap: 8px; }
.op-content { color: var(--el-text-color-regular); font-size: 13px; }
</style>
