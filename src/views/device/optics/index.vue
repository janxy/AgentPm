<template>
  <div class="optic-page">
    <!-- 预警事件联动上下文条 -->
    <div v-if="linkContext?.eventId" class="context-bar annot-device-optics-context">
      <div class="context-info">
        <strong>联动事件 #{{ linkContext.eventId }}</strong>
        <span>{{ linkContext.targetName || '-' }} / {{ linkContext.targetMmsi || '-' }}</span>
        <span>{{ linkContext.ruleName || '触发规则未提供' }}</span>
        <ElTag :type="alertLevelTag[linkContext.alertLevel || ''] || 'info'" size="small" disable-transitions>
          {{ alertLevelLabel[linkContext.alertLevel || ''] || '未知级别' }}
        </ElTag>
        <ElTag :type="statusTag[linkContext.status || ''] || 'info'" size="small" disable-transitions>
          {{ eventStatusLabel[linkContext.status || ''] || '未知状态' }}
        </ElTag>
        <span v-if="linkContext.location" class="context-coord">
          告警坐标 {{ linkContext.location?.lat?.toFixed(4) }}, {{ linkContext.location?.lng?.toFixed(4) }} {{ linkContext.location?.address || '' }}
        </span>
        <span v-if="linkContext.triggerTime" class="context-time">{{ linkContext.triggerTime }}</span>
        <ElTag v-if="targetDistance !== null" :type="targetDistance > 10 || selectedDevice?.status !== 1 ? 'warning' : 'success'" size="small" disable-transitions>
          光电距告警点 {{ targetDistanceText }}
        </ElTag>
      </div>
      <div class="context-actions">
        <ElButton size="small" type="primary" :icon="Promotion" @click="goUavLinkage">无人机联动</ElButton>
        <ElButton size="small" :icon="Back" @click="backToEvent">返回事件</ElButton>
      </div>
    </div>

    <div class="main-row">
      <!-- 左侧设备列表 -->
      <ElCard shadow="never" class="device-list-card annot-device-optics-list">
        <div class="list-header">光电设备</div>
        <div class="list-tools annot-device-optics-filter">
          <ElRadioGroup v-model="statusFilter" size="small">
            <ElRadioButton value="all">全部</ElRadioButton>
            <ElRadioButton value="online">在线</ElRadioButton>
            <ElRadioButton value="offline">离线</ElRadioButton>
          </ElRadioGroup>
        </div>
        <div
          v-for="device in filteredDevices"
          :key="device.id"
          class="device-item"
          :class="{ active: device.id === selectedDevice?.id, offline: device.status !== 1 }"
          @click="selectDevice(device)"
        >
          <div class="device-name">{{ device.name }}</div>
          <div class="device-meta">{{ device.model }} · {{ statusLabel[device.status] }}</div>
          <div class="device-state">{{ device.pan?.toFixed(1) }}° / ×{{ device.zoom ?? '-' }}</div>
        </div>
        <ElEmpty v-if="filteredDevices.length === 0" description="暂无匹配设备" :image-size="60" />
      </ElCard>

      <!-- 中间视频墙 -->
      <ElCard shadow="never" class="video-card">
        <OpticVideoWall
          :device="selectedDevice"
          :state="opticState"
          :recording="recording"
          @capture="handleCapture"
          @record-toggle="toggleRecording"
        />
      </ElCard>

      <!-- 右侧控制面板 -->
      <div class="control-column">
        <GimbalControlPanel :device="selectedDevice" :state="opticState" @control="handleControl" />
        <PresetCruisePanel
          :device="selectedDevice"
          :presets="presets"
          :cruise-plans="cruisePlans"
          :running-plan-id="opticState?.runningPlanId || null"
          @preset-add="handlePresetAdd"
          @preset-call="handlePresetCall"
          @preset-rename="handlePresetRename"
          @preset-delete="handlePresetDelete"
          @cruise-save="handleCruiseSave"
          @cruise-start="handleCruiseStart"
          @cruise-stop="handleCruiseStop"
          @cruise-delete="handleCruiseDelete"
        />
      </div>
    </div>

    <ElButton class="evidence-fab annot-device-optics-evidence-btn" type="primary" :icon="FolderOpened" @click="evidenceVisible = true">取证与喊话记录</ElButton>
    <OpticEvidenceDrawer v-model:visible="evidenceVisible" :device="selectedDevice" :event-context="linkContext" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back, FolderOpened, Promotion } from '@element-plus/icons-vue'
import { useDeviceStore } from '@/store/modules/device'
import {
  getOpticDeviceList, getOpticState, controlOptic,
  getPresetList, addPreset, updatePreset, deletePreset, callPreset,
  getCruisePlanList, saveCruisePlan, deleteCruisePlan, startCruise, stopCruise, tickCruise,
  addEvidence
} from '@/api/device'
import OpticVideoWall from './components/OpticVideoWall.vue'
import GimbalControlPanel from './components/GimbalControlPanel.vue'
import PresetCruisePanel from './components/PresetCruisePanel.vue'
import OpticEvidenceDrawer from './components/OpticEvidenceDrawer.vue'

/**
 * 光电联动页
 * 提供设备选择、视频墙、云台控制、预置位与巡航、取证喊话，并承接预警事件联动上下文
 */
defineOptions({ name: 'DeviceOptics' })

const route = useRoute()
const router = useRouter()
const deviceStore = useDeviceStore()

const opticDevices = ref<any[]>([])
const statusFilter = ref('all')
const selectedDevice = ref<any>(null)
const opticState = ref<any>(null)
const presets = ref<any[]>([])
const cruisePlans = ref<any[]>([])
const evidenceVisible = ref(false)
const recording = ref(false)
let recordStart = 0
let cruiseTimer: ReturnType<typeof setInterval> | null = null

const alertLevelLabel: Record<string, string> = { urgent: '紧急', important: '重要', normal: '一般', tip: '提示' }
const alertLevelTag: Record<string, 'danger' | 'warning' | 'primary' | 'info'> = { urgent: 'danger', important: 'warning', normal: 'primary', tip: 'info' }
const statusLabel: Record<number, string> = { 1: '在线', 0: '离线', 2: '故障' }
const statusTag: Record<string, 'success' | 'info' | 'warning' | 'danger'> = { pending: 'danger', disposing: 'warning', closed: 'success', archived: 'info' }
const eventStatusLabel: Record<string, string> = { pending: '待核验', disposing: '处置中', closed: '已闭环', archived: '已归档' }
const linkContext = computed(() => deviceStore.linkContext)
const filteredDevices = computed(() => opticDevices.value.filter((d) => statusFilter.value === 'all' || (statusFilter.value === 'online' ? d.status === 1 : d.status !== 1)))

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** 当前光电设备与告警目标的距离（km） */
const targetDistance = computed(() => {
  const loc = linkContext.value?.location
  const device = selectedDevice.value
  if (!loc || !device || device.lat == null || device.lng == null) return null
  return haversine(loc.lat, loc.lng, device.lat, device.lng)
})
const targetDistanceText = computed(() => (targetDistance.value == null ? '-' : `${targetDistance.value.toFixed(1)}km`))

/** 加载光电设备列表 */
async function loadDevices() {
  const { data } = await getOpticDeviceList()
  opticDevices.value = (data as any)?.list || []
}

/** 加载选中设备的实时状态、预置位与巡航计划 */
async function loadOpticDetail(device: any) {
  const [stateRes, presetRes, cruiseRes] = await Promise.all([
    getOpticState(device.id), getPresetList(device.id), getCruisePlanList(device.id)
  ])
  opticState.value = (stateRes.data as any) || {}
  presets.value = (presetRes.data as any)?.list || []
  cruisePlans.value = (cruiseRes.data as any)?.list || []
  Object.assign(device, opticState.value)
}

/** 选中设备并同步列表状态 */
function selectDevice(device: any) {
  if (selectedDevice.value?.id === device.id) return
  selectedDevice.value = device
  deviceStore.selectDevice(device.id)
  loadOpticDetail(device)
}

/** 云台控制并提示软限位 */
async function handleControl(action: string, step = 1) {
  if (!selectedDevice.value || selectedDevice.value.status !== 1) return
  const { data } = await controlOptic(selectedDevice.value.id, action, step)
  if (data?.warning === 'panLimit') ElMessage.warning('已达到方位角软限位')
  if (data?.warning === 'tiltLimit') ElMessage.warning('已达到俯仰角软限位')
  opticState.value = data?.state || opticState.value
  Object.assign(selectedDevice.value, opticState.value)
}

async function handlePresetAdd(name: string) {
  const { data } = await addPreset(selectedDevice.value.id, name)
  if (data?.error === 'duplicate') { ElMessage.error('同一设备内预置位名称不能重复'); return }
  ElMessage.success('预置位已记录')
  refreshPresets()
}

async function handlePresetCall(preset: any) {
  const { data } = await callPreset(selectedDevice.value.id, preset.id)
  if (data?.state) { opticState.value = data.state; Object.assign(selectedDevice.value, data.state) }
  ElMessage.success(`已调用预置位「${preset.name}」`)
}

async function handlePresetRename(preset: any, name: string) {
  const { data } = await updatePreset(preset.id, { name })
  if (data?.error === 'duplicate') { ElMessage.error('同一设备内预置位名称不能重复'); return }
  ElMessage.success('预置位已重命名')
  refreshPresets()
}

async function handlePresetDelete(preset: any) {
  await deletePreset(preset.id)
  ElMessage.success('预置位已删除')
  refreshPresets()
}

async function refreshPresets() {
  const { data } = await getPresetList(selectedDevice.value.id)
  presets.value = (data as any)?.list || []
}

async function handleCruiseSave(plan: any) {
  await saveCruisePlan(plan)
  ElMessage.success('巡航计划已保存')
  loadCruisePlans()
}

async function handleCruiseStart(plan: any) {
  if (!plan || plan.presetIds.length < 2) { ElMessage.warning('至少选择 2 个预置位才能启动巡航'); return }
  const { data } = await startCruise(selectedDevice.value.id, plan.id)
  if (!data) { ElMessage.error('巡航启动失败'); return }
  opticState.value = data.state
  ElMessage.success(`已启动巡航「${plan.name}」`)
  startCruiseTimer(plan.dwellSeconds)
}

async function handleCruiseStop() {
  await stopCruise(selectedDevice.value.id)
  stopCruiseTimer()
  loadOpticDetail(selectedDevice.value)
  ElMessage.success('巡航已停止')
}

async function handleCruiseDelete(plan: any) {
  await deleteCruisePlan(plan.id)
  ElMessage.success('巡航计划已删除')
  loadCruisePlans()
}

async function loadCruisePlans() {
  const { data } = await getCruisePlanList(selectedDevice.value.id)
  cruisePlans.value = (data as any)?.list || []
}

/** 按停留时长推进巡航到下一预置位 */
function startCruiseTimer(dwellSeconds: number) {
  stopCruiseTimer()
  cruiseTimer = setInterval(async () => {
    const { data } = await tickCruise(selectedDevice.value.id)
    opticState.value = data.state
    if (!data.state?.runningPlanId) stopCruiseTimer()
  }, Math.max(dwellSeconds, 2) * 1000)
}

function stopCruiseTimer() {
  if (cruiseTimer) { clearInterval(cruiseTimer); cruiseTimer = null }
}

/** 截图取证，自动携带联动事件编号 */
async function handleCapture(dataUrl: string) {
  if (!selectedDevice.value) return
  await addEvidence({
    deviceId: selectedDevice.value.id, deviceType: 'optic', type: 'screenshot',
    fileUrl: dataUrl, size: '1MB',
    content: `${selectedDevice.value.name} 现场截图`,
    eventId: linkContext.value?.eventId ?? null,
    targetId: linkContext.value?.targetId ?? null
  })
  ElMessage.success('截图已保存到取证记录')
}

/** 开始/停止录像并生成取证记录 */
async function toggleRecording() {
  if (recording.value) {
    const seconds = Math.max(1, Math.round((Date.now() - recordStart) / 1000))
    await addEvidence({
      deviceId: selectedDevice.value.id, deviceType: 'optic', type: 'video',
      content: `${selectedDevice.value.name} 录像片段（${seconds}s）`,
      eventId: linkContext.value?.eventId ?? null,
      targetId: linkContext.value?.targetId ?? null
    })
    ElMessage.success('录像已停止并生成取证记录')
  } else {
    recordStart = Date.now()
    ElMessage.success('开始录像')
  }
  recording.value = !recording.value
}

function backToEvent() {
  router.push(linkContext.value?.sourceRoute || '/alert/event')
}

/** 从查询参数重建联动上下文，保证刷新或从无人机页返回后信息完整 */
function readLinkContextFromQuery() {
  const q = route.query
  const eventId = Number(q.eventId)
  if (!eventId) return
  const lat = Number(q.lat)
  const lng = Number(q.lng)
  deviceStore.setLinkContext({
    eventId,
    targetId: String(q.targetId || ''),
    deviceId: Number(q.deviceId) || undefined,
    opticDeviceId: Number(q.opticDeviceId) || undefined,
    sourceRoute: String(q.sourceRoute || '/alert/event'),
    eventName: String(q.eventName || ''),
    targetName: String(q.targetName || ''),
    targetMmsi: String(q.targetMmsi || ''),
    ruleName: String(q.ruleName || ''),
    alertLevel: String(q.alertLevel || ''),
    status: String(q.status || ''),
    location: lat && lng ? { lat, lng, address: String(q.address || '') } : undefined,
    triggerTime: String(q.triggerTime || ''),
    fromOptics: q.fromOptics === '1'
  })
}

/** 跳转新无人机联动页，携带完整事件上下文与光电设备信息 */
function goUavLinkage() {
  const ctx = linkContext.value
  if (!ctx) return
  const query: Record<string, string> = {
    eventId: String(ctx.eventId || ''),
    targetId: ctx.targetId || '',
    eventName: ctx.eventName || '',
    targetName: ctx.targetName || '',
    targetMmsi: ctx.targetMmsi || '',
    ruleName: ctx.ruleName || '',
    alertLevel: ctx.alertLevel || '',
    status: ctx.status || '',
    triggerTime: ctx.triggerTime || '',
    sourceRoute: ctx.sourceRoute || '/alert/event',
    opticDeviceId: String(selectedDevice.value?.id || ctx.deviceId || ''),
    fromOptics: '1'
  }
  if (ctx.location) {
    query.lat = String(ctx.location.lat ?? '')
    query.lng = String(ctx.location.lng ?? '')
    query.address = String(ctx.location.address || '')
  }
  router.push({ path: '/device/uav-linkage', query })
}

onMounted(async () => {
  await loadDevices()
  const queryDeviceId = Number(route.query.deviceId)
  readLinkContextFromQuery()
  const target = opticDevices.value.find((d) => d.id === queryDeviceId)
    || opticDevices.value.find((d) => d.id === deviceStore.selectedDeviceId)
    || opticDevices.value.find((d) => d.status === 1)
    || opticDevices.value[0]
  if (target) selectDevice(target)
  deviceStore.startHeartbeat()
})

onBeforeUnmount(() => {
  stopCruiseTimer()
  deviceStore.stopHeartbeat()
  deviceStore.clearLinkContext()
})
</script>

<style lang="scss" scoped>
.optic-page { display: flex; flex-direction: column; gap: 12px; height: 100%; position: relative; }
.context-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; border-radius: 8px; background: var(--el-color-warning-light-9); }
.context-info { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 13px; color: var(--el-text-color-regular); }
.context-actions { display: flex; align-items: center; gap: 8px; flex: none; }
.context-coord, .context-time { color: var(--el-text-color-secondary); }
.main-row { display: flex; gap: 12px; flex: 1; min-height: 0; }
.device-list-card { width: 230px; flex: none; :deep(.el-card__body) { height: 100%; padding: 10px; overflow: auto; } }
.list-header { font-size: 15px; font-weight: 600; margin-bottom: 10px; }
.list-tools { margin-bottom: 10px; }
.device-item { padding: 10px 12px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: opacity 0.15s ease; }
.device-item.active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.device-item.offline { opacity: 0.55; }
.device-name { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.device-meta { margin-top: 4px; font-size: 12px; color: var(--el-text-color-secondary); }
.device-state { margin-top: 4px; font-size: 12px; color: var(--el-color-primary); }
.video-card { flex: 1; min-width: 0; :deep(.el-card__body) { height: 100%; padding: 0; } }
.control-column { width: 340px; flex: none; display: flex; flex-direction: column; gap: 12px; overflow: auto; }
.evidence-fab { position: absolute; right: 356px; bottom: 16px; z-index: 5; }
</style>
