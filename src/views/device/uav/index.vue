<template>
  <div class="uav-page">
    <!-- 上区：状态面板 + 航线规划 -->
    <div class="main-row">
      <ElCard shadow="never" class="status-card">
        <UavStatusPanel :uavs="uavs" :selected-id="selectedUav?.id || null" @select="selectUav" />
      </ElCard>
      <ElCard shadow="never" class="route-card">
        <UavRouteMap
          :uav="selectedUav"
          :route="routeData"
          :metrics="metrics"
          :templates="templates"
          @update="handleRouteUpdate"
          @save="handleSaveRoute"
          @save-template="handleSaveTemplate"
          @apply-template="handleApplyTemplate"
        />
      </ElCard>
    </div>

    <!-- 下区：任务控制与记录 -->
    <ElCard shadow="never" class="task-card">
      <div class="task-columns">
        <div class="task-col control-col annot-device-uav-control">
          <div class="col-title">飞行控制</div>
          <div class="control-uav">
            <span class="uav-name">{{ selectedUav?.name || '未选择无人机' }}</span>
            <ElTag :type="selectedUav?.status === 1 ? 'success' : selectedUav?.status === 2 ? 'danger' : 'info'" size="small" disable-transitions>
              {{ selectedUav ? statusLabel[selectedUav.status] : '-' }}
            </ElTag>
          </div>
          <div class="control-buttons">
            <ElButton :icon="Promotion" :disabled="!canControl" @click="doControl('takeoff', '起飞')">起飞</ElButton>
            <ElButton :icon="VideoPause" :disabled="!canControl" @click="doControl('hover', '悬停')">悬停</ElButton>
            <ElButton :icon="Back" :disabled="!canControl" @click="doControl('return', '返航')">返航</ElButton>
          </div>
          <div class="dispatch-row">
            <ElButton type="primary" :icon="Aim" :disabled="!canDispatch" @click="dispatchTask">下发任务</ElButton>
            <span class="dispatch-tip">{{ dispatchTip }}</span>
          </div>
        </div>

        <div class="task-col progress-col annot-device-uav-progress">
          <div class="col-title">任务执行</div>
          <template v-if="activeTask">
            <div class="progress-head">
              <span class="task-name">任务 #{{ activeTask.id }}</span>
              <ElTag type="success" size="small" disable-transitions>执行中</ElTag>
              <ElButton size="small" type="warning" plain :icon="CircleClose" @click="abortTask">终止</ElButton>
            </div>
            <ElProgress :percentage="activeTask.progress || 0" :stroke-width="12" />
            <div class="progress-grid">
              <div><span>当前航点</span><strong>{{ activeTask.currentWaypointIndex || 0 }} / {{ activeTask.waypoints?.length || 0 }}</strong></div>
              <div><span>已飞</span><strong>{{ (activeTask.flownDistance || 0).toFixed(1) }}km</strong></div>
              <div><span>剩余</span><strong>{{ Math.max(0, metrics.totalDistance - (activeTask.flownDistance || 0)).toFixed(1) }}km</strong></div>
              <div><span>预计剩余</span><strong>{{ remainMinutes }}min</strong></div>
            </div>
          </template>
          <ElEmpty v-else description="暂无执行中任务" :image-size="52" />
        </div>

        <div class="task-col record-col annot-device-uav-record">
          <div class="record-tabs">
            <span class="col-title">任务与异常</span>
            <ElRadioGroup v-model="recordTab" size="small">
              <ElRadioButton value="task">任务</ElRadioButton>
              <ElRadioButton value="anomaly">异常</ElRadioButton>
            </ElRadioGroup>
          </div>
          <ElTable v-if="recordTab === 'task'" :data="tasks" size="small" class="record-table" empty-text="暂无任务记录">
            <ElTableColumn prop="id" label="任务" width="62" />
            <ElTableColumn label="状态" width="70">
              <template #default="{ row }">
                <ElTag :type="row.status === 'finished' ? 'info' : 'success'" size="small" disable-transitions>
                  {{ row.status === 'finished' ? '已完成' : '执行中' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="进度" width="74">
              <template #default="{ row }">{{ row.progress }}%</template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="64" align="center">
              <template #default="{ row }"><ElButton link type="primary" size="small" @click="openTaskDetail(row)">详情</ElButton></template>
            </ElTableColumn>
          </ElTable>
          <ElTable v-else :data="anomalyRecords" size="small" class="record-table" empty-text="暂无异常记录">
            <ElTableColumn prop="time" label="时间" width="112" show-overflow-tooltip />
            <ElTableColumn prop="type" label="类型" width="68" />
            <ElTableColumn prop="content" label="内容" min-width="120" show-overflow-tooltip />
          </ElTable>
        </div>
      </div>
    </ElCard>

    <!-- 任务详情抽屉 -->
    <ElDrawer v-model="taskDetailVisible" title="任务详情" direction="rtl" size="480px" class="annot-device-uav-task-detail">
      <template v-if="taskDetail">
        <ElDescriptions :column="2" border size="small">
          <ElDescriptionsItem label="任务编号">{{ taskDetail.id }}</ElDescriptionsItem>
          <ElDescriptionsItem label="无人机">{{ selectedUav?.name || taskDetail.uavId }}</ElDescriptionsItem>
          <ElDescriptionsItem label="开始时间">{{ taskDetail.startTime || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="结束时间">{{ taskDetail.endTime || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="飞行距离">{{ taskDetail.flownDistance }}km</ElDescriptionsItem>
          <ElDescriptionsItem label="执行进度">{{ taskDetail.progress }}%</ElDescriptionsItem>
        </ElDescriptions>
        <div class="detail-title">途经航点</div>
        <ElTable :data="taskDetail.waypoints || []" size="small" empty-text="暂无航点">
          <ElTableColumn type="index" label="#" width="44" align="center" />
          <ElTableColumn label="坐标" min-width="130">
            <template #default="{ row }">{{ row.lat.toFixed(5) }}, {{ row.lng.toFixed(5) }}</template>
          </ElTableColumn>
          <ElTableColumn prop="altitude" label="高度m" width="70" />
          <ElTableColumn prop="speed" label="速度" width="70" />
        </ElTable>
        <div class="detail-title">异常事件</div>
        <ElTimeline v-if="taskDetail.events?.length">
          <ElTimelineItem v-for="(e, idx) in taskDetail.events" :key="idx" :timestamp="e.time" type="warning">
            <p><strong>{{ e.type }}</strong></p>
            <p class="event-content">{{ e.content }}</p>
          </ElTimelineItem>
        </ElTimeline>
        <ElEmpty v-else description="无异常事件" :image-size="50" />
      </template>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Aim, Back, CircleClose, Promotion, VideoPause } from '@element-plus/icons-vue'
import { useDeviceStore } from '@/store/modules/device'
import {
  getUavList, getUavState, controlUav, getUavRoute, saveUavRoute,
  getRouteTemplateList, saveRouteTemplate, getUavTaskList, createUavTask,
  updateUavTask, addUavEvent
} from '@/api/device'
import UavStatusPanel from './components/UavStatusPanel.vue'
import UavRouteMap from './components/UavRouteMap.vue'

/**
 * 无人机联动页
 * 状态监控、航线规划、飞行控制、任务下发与任务/异常记录
 */
defineOptions({ name: 'DeviceUav' })

const route = useRoute()
const deviceStore = useDeviceStore()

const uavs = ref<any[]>([])
const selectedUav = ref<any>(null)
const routeData = ref<any>(null)
const templates = ref<any[]>([])
const tasks = ref<any[]>([])
const activeTask = ref<any>(null)
const recordTab = ref('task')
const taskDetailVisible = ref(false)
const taskDetail = ref<any>(null)
let taskTimer: ReturnType<typeof setInterval> | null = null
let statusTimer: ReturnType<typeof setInterval> | null = null

const statusLabel: Record<number, string> = { 1: '在线', 0: '离线', 2: '故障' }

function haversine(a: any, b: any) {
  const rad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** 航程与续航校验，用于下发前拦截 */
const metrics = computed(() => {
  const uav = selectedUav.value
  const r = routeData.value
  if (!uav || !r) return { totalDistance: 0, enduranceDistance: 0, exceed: false }
  const points = [r.takeoffPoint, ...(r.waypoints || []), r.landingPoint]
  let total = 0
  for (let i = 1; i < points.length; i++) total += haversine(points[i - 1], points[i])
  const avgSpeed = Math.max(10, uav.speed || 15)
  const enduranceDistance = ((uav.enduranceMinutes || 0) * 60 * avgSpeed) / 1000
  return { totalDistance: total, enduranceDistance, exceed: total > enduranceDistance }
})

const canControl = computed(() => !!selectedUav.value && selectedUav.value.status === 1)
const isTaskRunning = computed(() => !!activeTask.value && activeTask.value.status !== 'finished')
const canDispatch = computed(() => {
  if (!canControl.value || isTaskRunning.value) return false
  if (!routeData.value || (routeData.value.waypoints || []).length < 2) return false
  return !metrics.value.exceed
})
const dispatchTip = computed(() => {
  if (isTaskRunning.value) return '任务执行中，禁止重复下发'
  if (!routeData.value || (routeData.value.waypoints || []).length < 2) return '至少 2 个航点才能下发'
  if (metrics.value.exceed) return '航线超出预估续航'
  return '校验通过，可下发'
})
const remainMinutes = computed(() => {
  if (!activeTask.value) return 0
  const left = Math.max(0, metrics.value.totalDistance - (activeTask.value.flownDistance || 0))
  const speed = Math.max(10, selectedUav.value?.speed || 15)
  return Math.ceil((left * 1000) / (speed * 60)) || 0
})
const anomalyRecords = computed(() =>
  tasks.value.flatMap((t) => (t.events || []).map((e: any) => ({ ...e, taskId: t.id }))).reverse()
)

async function loadUavs() {
  const { data } = await getUavList()
  uavs.value = (data as any)?.list || []
  const queryId = Number(route.query.deviceId)
  const target = uavs.value.find((u) => u.id === queryId)
    || uavs.value.find((u) => u.id === deviceStore.selectedDeviceId)
    || uavs.value.find((u) => u.status === 1)
    || uavs.value[0]
  if (target) await selectUav(target)
}

async function selectUav(uav: any) {
  stopTaskTimer()
  activeTask.value = null
  selectedUav.value = uav
  deviceStore.selectDevice(uav.id)
  await Promise.all([refreshUavState(), loadRoute(), loadTasks()])
}

async function refreshUavState() {
  if (!selectedUav.value) return
  const { data } = await getUavState(selectedUav.value.id)
  Object.assign(selectedUav.value, data || {})
}

async function loadRoute() {
  if (!selectedUav.value) return
  const { data } = await getUavRoute(selectedUav.value.id)
  routeData.value = data || { takeoffPoint: { lat: 29.95, lng: 122.1 }, landingPoint: { lat: 29.95, lng: 122.1 }, waypoints: [] }
}

async function loadTemplates() {
  const { data } = await getRouteTemplateList()
  templates.value = (data as any)?.list || []
}

async function loadTasks() {
  if (!selectedUav.value) return
  const { data } = await getUavTaskList(selectedUav.value.id)
  tasks.value = (data as any)?.list || []
  activeTask.value = tasks.value.find((t) => t.status === 'running' || t.status === 'planned') || null
  if (activeTask.value?.status === 'running') startTaskTimer(activeTask.value)
}

function handleRouteUpdate(routeDataPatch: any) {
  routeData.value = routeDataPatch
}

async function handleSaveRoute(r: any) {
  await saveUavRoute(selectedUav.value.id, r)
  ElMessage.success('航线已保存')
}

async function handleSaveTemplate(r: any) {
  let name = ''
  try {
    const res = await ElMessageBox.prompt('请输入航线模板名称', '保存为航线模板', {
      inputValue: `${selectedUav.value?.name || '无人机'}巡检线`,
      inputPattern: /\S+/,
      inputErrorMessage: '模板名称不能为空'
    })
    name = res.value.trim()
  } catch { return }
  await saveRouteTemplate({
    name, uavId: selectedUav.value?.id, ...r,
    totalDistance: Number(metrics.value.totalDistance.toFixed(1))
  })
  ElMessage.success('航线模板已保存')
  loadTemplates()
}

async function handleApplyTemplate(templateId: number) {
  const t = templates.value.find((item) => item.id === templateId)
  if (!t || !selectedUav.value) return
  routeData.value = {
    takeoffPoint: { ...t.takeoffPoint },
    landingPoint: { ...t.landingPoint },
    waypoints: (t.waypoints || []).map((w: any) => ({ ...w }))
  }
  await saveUavRoute(selectedUav.value.id, routeData.value)
  ElMessage.success(`已复用模板「${t.name}」`)
}

async function doControl(action: string, label: string) {
  if (!canControl.value) { ElMessage.warning('当前无人机不在线，无法执行该操作'); return }
  const { data } = await controlUav(selectedUav.value.id, action)
  Object.assign(selectedUav.value, data || {})
  ElMessage.success(`${label}指令已下发`)
  refreshUavState()
}

async function dispatchTask() {
  if (!canDispatch.value) { ElMessage.warning(dispatchTip.value); return }
  const { data } = await createUavTask({ uavId: selectedUav.value.id, waypoints: routeData.value.waypoints })
  const task = data
  tasks.value = [task, ...tasks.value.filter((t) => t.id !== task.id)]
  const started = await updateUavTask(task.id, { status: 'running', startTime: formatNow() })
  activeTask.value = started?.data || { ...task, status: 'running', startTime: formatNow() }
  ElMessage.success(`任务 #${task.id} 已下发`)
  startTaskTimer(activeTask.value)
}

/** 模拟任务推进，按航点数量分步更新进度与异常记录 */
function startTaskTimer(task: any) {
  stopTaskTimer()
  const totalSteps = Math.max(4, (task.waypoints?.length || 2) * 4)
  let ticks = Math.round(((task.progress || 0) / 100) * totalSteps)
  taskTimer = setInterval(async () => {
    ticks += 1
    const progress = Math.min(100, Math.round((ticks / totalSteps) * 100))
    const idx = Math.min(task.waypoints?.length || 1, Math.ceil(ticks / 4))
    const patch: any = {
      progress, currentWaypointIndex: idx,
      flownDistance: Number((metrics.value.totalDistance * progress / 100).toFixed(1))
    }
    if (progress >= 100) {
      patch.status = 'finished'
      patch.endTime = formatNow()
    }
    const { data } = await updateUavTask(task.id, patch)
    const taskIndex = tasks.value.findIndex((t) => t.id === task.id)
    if (taskIndex >= 0) tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...patch }
    if (progress === 50) {
      await addUavEvent({ uavId: task.uavId, type: '弱信号', content: '回传信号抖动，已自动切换通信链路' })
      loadTasks()
    }
    if (data?.status === 'finished') {
      stopTaskTimer()
      activeTask.value = null
      ElMessage.success(`任务 #${task.id} 执行完成`)
      loadTasks()
      refreshUavState()
    } else {
      activeTask.value = data
    }
  }, 1200)
}

function stopTaskTimer() {
  if (taskTimer) { clearInterval(taskTimer); taskTimer = null }
}

async function abortTask() {
  if (!activeTask.value) return
  const task = activeTask.value
  await updateUavTask(task.id, { status: 'finished', endTime: formatNow(), progress: task.progress || 0 })
  await addUavEvent({ uavId: task.uavId, type: '任务中断', content: '处置人员手动终止任务执行' })
  stopTaskTimer()
  activeTask.value = null
  ElMessage.success('任务已终止')
  loadTasks()
}

function openTaskDetail(task: any) {
  taskDetail.value = task
  taskDetailVisible.value = true
}

onMounted(async () => {
  await Promise.all([loadUavs(), loadTemplates()])
  statusTimer = setInterval(refreshUavState, 10000)
})

onBeforeUnmount(() => {
  stopTaskTimer()
  if (statusTimer) { clearInterval(statusTimer); statusTimer = null }
})
</script>

<style lang="scss" scoped>
.uav-page { display: flex; flex-direction: column; gap: 12px; height: 100%; }
.main-row { display: flex; gap: 12px; flex: 1; min-height: 0; }
.status-card { width: 240px; flex: none; :deep(.el-card__body) { height: 100%; padding: 12px; } }
.route-card { flex: 1; min-width: 0; :deep(.el-card__body) { height: 100%; padding: 0; } }
.task-card { flex: none; :deep(.el-card__body) { padding: 0; } }
.task-columns { display: flex; height: 216px; }
.task-col { display: flex; flex-direction: column; padding: 12px 14px; border-right: 1px solid var(--el-border-color-lighter); min-width: 0; }
.task-col:last-child { border-right: none; }
.control-col { width: 270px; flex: none; gap: 10px; }
.progress-col { flex: 1; gap: 10px; justify-content: center; }
.record-col { width: 430px; flex: none; }
.col-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.control-uav { display: flex; align-items: center; justify-content: space-between; }
.uav-name { font-size: 13px; font-weight: 600; }
.control-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
.dispatch-row { display: flex; align-items: center; gap: 10px; }
.dispatch-tip { font-size: 12px; color: var(--el-text-color-secondary); }
.progress-head { display: flex; align-items: center; gap: 10px; }
.task-name { font-size: 13px; font-weight: 600; flex: 1; }
.progress-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.progress-grid div { display: flex; flex-direction: column; gap: 2px; }
.progress-grid span { font-size: 11px; color: var(--el-text-color-secondary); }
.progress-grid strong { font-size: 13px; color: var(--el-text-color-primary); }
.record-tabs { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.record-tabs .col-title { margin-bottom: 0; }
.record-table { :deep(.el-table__row) { cursor: pointer; } }
.detail-title { margin: 18px 0 10px; font-size: 14px; font-weight: 600; }
.event-content { color: var(--el-text-color-secondary); font-size: 12px; }
</style>
