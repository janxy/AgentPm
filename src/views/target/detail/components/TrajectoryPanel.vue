<template>
  <ElCard shadow="never" class="trajectory-panel annot-target-detail-trajectory">
    <div class="panel-head">
      <div class="trajectory-tools">
        <ElButton v-roles="['值班员', '指挥员']" size="small" :icon="Download" :disabled="!canExport" @click="exportKml">导出KML</ElButton>
        <ElButton v-roles="['值班员', '指挥员']" size="small" :icon="Document" :disabled="!canExport" @click="exportCsv">导出CSV</ElButton>
        <ElButton v-roles="['值班员', '指挥员']" size="small" :icon="Camera" :disabled="!canExport" @click="takeSnapshot">截图取证</ElButton>
      </div>
    </div>

    <div class="trajectory-filter">
      <ElDatePicker
        v-model="queryTime"
        type="datetimerange"
        range-separator="-"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        value-format="YYYY-MM-DD HH:mm:ss"
        class="trajectory-time"
      />
      <ElButton type="primary" :icon="Search" @click="query">查询</ElButton>
    </div>

    <div class="trajectory-stage">
      <div class="trajectory-map">
        <svg v-if="points.length" class="trajectory-svg" viewBox="0 0 900 340" preserveAspectRatio="xMidYMid meet">
          <circle
            v-for="(point, index) in mappedPoints"
            :key="index"
            class="trajectory-point"
            :class="{
              'trajectory-event': point.eventType,
              'trajectory-current': index === currentIndex
            }"
            :cx="point.x"
            :cy="point.y"
            :r="point.eventType ? 9 : 5"
            @click="selectPoint(index)"
          />
          <path v-if="linePath" :d="linePath" class="trajectory-line" />
          <text v-if="startPoint" :x="startPoint.x" :y="startPoint.y - 12" class="trajectory-label">起</text>
          <text v-if="endPoint" :x="endPoint.x" :y="endPoint.y - 12" class="trajectory-label">终</text>
        </svg>
        <div v-if="stationary" class="trajectory-overlay">目标未移动</div>
        <div v-else-if="!points.length" class="trajectory-overlay">暂无轨迹数据</div>
      </div>

      <div class="event-info">
        <span class="event-info-label">事件点</span>
        <span v-if="activeEvent" class="event-info-text">
          {{ activeEvent.eventType }} · {{ activeEvent.time }} · {{ activeEvent.eventDesc }}
        </span>
        <span v-else class="event-info-text">点击轨迹中的事件标记查看详情</span>
      </div>

      <div class="playback-bar">
        <ElButton circle :icon="playing ? VideoPause : VideoPlay" :disabled="!canPlay" @click="togglePlay" />
        <ElButton circle :icon="Back" :disabled="!canPlay" @click="step(-1)" />
        <ElButton circle :icon="Right" :disabled="!canPlay" @click="step(1)" />
        <ElSelect v-model="speed" class="speed-select" :disabled="!canPlay" @change="handleSpeedChange">
          <ElOption v-for="item in SPEEDS" :key="item" :label="`${item}x`" :value="item" />
        </ElSelect>
        <div class="progress-wrap">
          <ElSlider v-model="progressValue" :min="0" :max="100" :step="0.01" :disabled="!canPlay" />
          <div class="progress-time">{{ currentPoint?.time || '-' }}</div>
        </div>
        <div class="playback-meta">
          <span v-if="currentPoint">位置 {{ currentPoint.lng }}, {{ currentPoint.lat }}</span>
          <span v-if="currentPoint">航速 {{ currentPoint.speed }} 节</span>
        </div>
      </div>
    </div>

    <ElDialog v-model="snapshotDialogVisible" title="取证记录" width="560px" class="annot-target-detail-snapshot">
      <div v-if="evidenceRecords.length" class="snapshot-list">
        <div v-for="record in evidenceRecords" :key="record.id" class="snapshot-item">
          <div class="snapshot-main">
            <span class="snapshot-name">{{ record.name }}</span>
            <span class="snapshot-time">{{ record.time }}</span>
          </div>
          <ElButton link type="primary" :icon="Download" @click="downloadSnapshot(record)">下载</ElButton>
        </div>
      </div>
      <div v-else class="snapshot-empty">暂无取证记录，点击“截图取证”生成带时间水印的记录</div>
    </ElDialog>
  </ElCard>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Back, Camera, Document, Download, Right, Search, VideoPause, VideoPlay } from '@element-plus/icons-vue'
import { useTargetStore } from '@/store/modules/target'
import { exportToCsv, CsvColumn } from '@/utils/csv'

/**
 * 单目标历史轨迹
 * 支持时间范围查询、静态轨迹示意、多档倍速回放、逐帧控制、KML/CSV导出与模拟截图取证。
 */
defineOptions({ name: 'TargetDetailTrajectoryPanel' })

const props = defineProps<{ fusionId: string; targetName: string; displayId: string }>()
const targetStore = useTargetStore()
const queryTime = ref<[string, string]>(['', ''])
const points = ref<any[]>([])
const stationary = ref(false)
const loading = ref(false)
const playing = ref(false)
const speed = ref(1)
const currentIndex = ref(0)
const snapshotDialogVisible = ref(false)
const evidenceRecords = ref<Array<{ id: number; name: string; time: string; dataUrl: string }>>([])
const SPEEDS = [1, 2, 4, 8, 16]
let timer: ReturnType<typeof setInterval> | null = null

const canPlay = computed(() => !stationary.value && points.value.length > 1)
const canExport = computed(() => points.value.length > 0)
const currentPoint = computed(() => points.value[currentIndex.value])
const activeEvent = computed(() => (currentPoint.value?.eventType ? currentPoint.value : null))

const W = 900
const H = 340
const PAD = 34

const mappedPoints = computed(() => {
  if (!points.value.length) return []
  const lngs = points.value.map((item) => item.lng)
  const lats = points.value.map((item) => item.lat)
  let minLng = Math.min(...lngs)
  let maxLng = Math.max(...lngs)
  let minLat = Math.min(...lats)
  let maxLat = Math.max(...lats)
  if (maxLng === minLng) {
    minLng -= 0.001
    maxLng += 0.001
  }
  if (maxLat === minLat) {
    minLat -= 0.001
    maxLat += 0.001
  }
  return points.value.map((item) => ({
    ...item,
    x: PAD + ((item.lng - minLng) / (maxLng - minLng)) * (W - PAD * 2),
    y: H - PAD - ((item.lat - minLat) / (maxLat - minLat)) * (H - PAD * 2)
  }))
})

const linePath = computed(() =>
  mappedPoints.value.map((item, index) => `${index === 0 ? 'M' : 'L'} ${item.x.toFixed(1)} ${item.y.toFixed(1)}`).join(' ')
)
const startPoint = computed(() => mappedPoints.value[0])
const endPoint = computed(() => mappedPoints.value[mappedPoints.value.length - 1])

const progressValue = computed({
  get: () => (points.value.length > 1 ? (currentIndex.value / (points.value.length - 1)) * 100 : 0),
  set: (value: number) => {
    currentIndex.value = Math.round((Number(value) / 100) * (points.value.length - 1))
  }
})

function formatTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function addHours(timeText: string, hours: number) {
  const date = new Date(timeText.replace(/-/g, '/'))
  date.setHours(date.getHours() + hours)
  return formatTime(date)
}

function setDefaultRange() {
  const latest = points.value.reduce((max, item) => (item.time > max ? item.time : max), points.value[0]?.time || '')
  if (!latest) return
  queryTime.value = [addHours(latest, -24), latest]
}

async function query() {
  const [startTime, endTime] = queryTime.value
  if (!startTime || !endTime) {
    ElMessage.warning('请选择轨迹查询时间范围')
    return
  }
  if (startTime > endTime) {
    ElMessage.warning('开始时间不能晚于结束时间')
    return
  }
  pause()
  loading.value = true
  try {
    const data = await targetStore.loadTrajectory(props.fusionId, { startTime, endTime })
    points.value = data?.points || []
    stationary.value = Boolean(data?.stationary)
    currentIndex.value = 0
  } finally {
    loading.value = false
  }
}

function togglePlay() {
  if (playing.value) {
    pause()
  } else {
    play()
  }
}

function play() {
  if (!canPlay.value) return
  playing.value = true
  startTimer()
}

function pause() {
  playing.value = false
  stopTimer()
}

function startTimer() {
  stopTimer()
  timer = setInterval(() => {
    if (currentIndex.value >= points.value.length - 1) {
      pause()
      return
    }
    currentIndex.value += 1
  }, 1000 / speed.value)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function handleSpeedChange() {
  if (playing.value) {
    startTimer()
  }
}

function step(direction: number) {
  if (!canPlay.value) return
  pause()
  const max = points.value.length - 1
  currentIndex.value = Math.min(max, Math.max(0, currentIndex.value + direction))
}

function selectPoint(index: number) {
  if (!canPlay.value && points.value.length === 1) {
    currentIndex.value = 0
    return
  }
  pause()
  currentIndex.value = index
}

function escapeXml(text: string) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fileName() {
  return `${props.targetName || '目标'}-${props.displayId}-${formatTime(new Date()).slice(0, 10)}`
}

function downloadBlob(content: string, name: string, mime: string, extension: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${name}.${extension}`
  link.click()
  URL.revokeObjectURL(url)
}

function exportKml() {
  if (!canExport.value) {
    ElMessage.warning('暂无轨迹数据可导出')
    return
  }
  const coordinates = points.value.map((item) => `${item.lng},${item.lat},0`).join('\n')
  const events = points.value
    .filter((item) => item.eventType)
    .map(
      (item) => `  <Placemark>\n    <name>${escapeXml(item.eventType)}</name>\n    <description>${escapeXml(item.eventDesc || '')}</description>\n    <Point><coordinates>${item.lng},${item.lat},0</coordinates></Point>\n  </Placemark>`
    )
    .join('\n')
  const kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n  <Document>\n    <name>${escapeXml(props.targetName)}-历史轨迹</name>\n    <Placemark>\n      <name>轨迹路线</name>\n      <LineString>\n        <coordinates>${coordinates}</coordinates>\n      </LineString>\n    </Placemark>\n${events}\n  </Document>\n</kml>`
  downloadBlob(kml, `${fileName()}-轨迹`, 'application/vnd.google-earth.kml+xml', 'kml')
  ElMessage.success('轨迹已导出')
}

const csvColumns: CsvColumn<Record<string, any>>[] = [
  { header: '时间', field: 'time' },
  { header: '经度', field: 'lng' },
  { header: '纬度', field: 'lat' },
  { header: '航速(节)', field: 'speed' },
  { header: '航向(°)', field: 'heading' },
  { header: '事件类型', field: 'eventType' },
  { header: '事件描述', field: 'eventDesc' }
]

function exportCsv() {
  if (!canExport.value) {
    ElMessage.warning('暂无轨迹数据可导出')
    return
  }
  const rows = points.value.map((item) => ({
    time: item.time,
    lng: item.lng,
    lat: item.lat,
    speed: item.speed,
    heading: item.heading,
    eventType: item.eventType || '',
    eventDesc: item.eventDesc || ''
  }))
  exportToCsv(csvColumns, rows, `${fileName()}-轨迹`)
  ElMessage.success('轨迹已导出')
}

function takeSnapshot() {
  if (!canExport.value) return
  const canvas = document.createElement('canvas')
  canvas.width = 1000
  canvas.height = 480
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#f6f9fc'
  ctx.fillRect(0, 0, 1000, 480)
  ctx.fillStyle = '#1f2d3d'
  ctx.font = 'bold 26px sans-serif'
  ctx.fillText('目标历史轨迹取证', 32, 48)
  ctx.font = '15px sans-serif'
  ctx.fillText(`${props.targetName} · ${props.displayId} · ${queryTime.value[0]} ~ ${queryTime.value[1]}`, 32, 78)

  const box = { x: 32, y: 100, width: 936, height: 300 }
  ctx.fillStyle = '#eaf4ff'
  ctx.fillRect(box.x, box.y, box.width, box.height)
  ctx.strokeStyle = '#cfe3fb'
  ctx.lineWidth = 1
  for (let i = 1; i < 10; i++) {
    ctx.beginPath()
    ctx.moveTo(box.x + (box.width / 10) * i, box.y)
    ctx.lineTo(box.x + (box.width / 10) * i, box.y + box.height)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(box.x, box.y + (box.height / 10) * i)
    ctx.lineTo(box.x + box.width, box.y + (box.height / 10) * i)
    ctx.stroke()
  }

  if (mappedPoints.value.length > 1) {
    ctx.beginPath()
    mappedPoints.value.forEach((item, index) => {
      const x = box.x + (item.x / W) * box.width
      const y = box.y + (item.y / H) * box.height
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = '#409eff'
    ctx.lineWidth = 2.5
    ctx.stroke()
  }
  mappedPoints.value.forEach((item) => {
    const x = box.x + (item.x / W) * box.width
    const y = box.y + (item.y / H) * box.height
    ctx.beginPath()
    ctx.arc(x, y, item.eventType ? 7 : 4, 0, Math.PI * 2)
    ctx.fillStyle = item.eventType ? '#e6a23c' : '#409eff'
    ctx.fill()
    if (item.eventType) {
      ctx.fillStyle = '#7a4d00'
      ctx.font = '12px sans-serif'
      ctx.fillText(item.eventType, x + 10, y - 6)
    }
  })

  ctx.fillStyle = 'rgba(96, 98, 102, 0.8)'
  ctx.font = '13px sans-serif'
  ctx.fillText(`取证时间 ${formatTime(new Date())} · 目标管控原型演示截图`, 32, box.y + box.height + 34)

  const record = {
    id: Date.now(),
    name: `取证记录-${props.targetName || '目标'}`,
    time: formatTime(new Date()),
    dataUrl: canvas.toDataURL('image/png')
  }
  evidenceRecords.value.unshift(record)
  snapshotDialogVisible.value = true
  ElMessage.success('取证记录已生成')
}

function downloadSnapshot(record: { dataUrl: string; name: string }) {
  const link = document.createElement('a')
  link.href = record.dataUrl
  link.download = `${record.name}.png`
  link.click()
}

onMounted(async () => {
  const data = await targetStore.loadTrajectory(props.fusionId)
  points.value = data?.points || []
  stationary.value = Boolean(data?.stationary)
  setDefaultRange()
})

onBeforeUnmount(() => {
  stopTimer()
})
</script>

<style lang="scss" scoped>
.trajectory-panel {
  margin-bottom: 12px;
  :deep(.el-card__body) { padding: 16px; }
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 12px;
}
.trajectory-tools {
  display: flex;
  gap: 8px;
}
.trajectory-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.trajectory-time {
  width: 380px;
}
.trajectory-stage {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  overflow: hidden;
}
.trajectory-map {
  position: relative;
  height: 300px;
  background:
    linear-gradient(rgba(148, 187, 233, 0.2) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 187, 233, 0.2) 1px, transparent 1px),
    linear-gradient(160deg, #eaf4ff 0%, #f6fbff 100%);
  background-size: 34px 34px, 34px 34px, 100% 100%;
}
.trajectory-svg {
  display: block;
  width: 100%;
  height: 100%;
}
.trajectory-line {
  fill: none;
  stroke: #409eff;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.trajectory-point {
  fill: #409eff;
  stroke: #fff;
  stroke-width: 1.5;
  cursor: pointer;
  transition: r 0.2s;

  &:hover {
    r: 8;
  }
}
.trajectory-event {
  fill: #e6a23c;
}
.trajectory-current {
  fill: #f56c6c;
  stroke-width: 3;
  animation: current-pulse 1.4s ease-in-out infinite;
}
.trajectory-label {
  fill: #606266;
  font-size: 13px;
  font-weight: 600;
  text-anchor: middle;
}
.trajectory-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(246, 251, 255, 0.72);
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
.event-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: #fff;
}
.event-info-label {
  flex-shrink: 0;
  color: var(--el-color-warning);
  font-size: 12px;
  font-weight: 600;
}
.event-info-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.playback-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: #fafcfe;
}
.speed-select {
  width: 86px;
}
.progress-wrap {
  flex: 1;
  min-width: 0;
}
.progress-time {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.playback-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}
.snapshot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.snapshot-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}
.snapshot-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.snapshot-name {
  font-weight: 600;
}
.snapshot-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.snapshot-empty {
  padding: 24px 0;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

@keyframes current-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

@media (max-width: 900px) {
  .panel-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .playback-bar {
    flex-wrap: wrap;
  }
  .trajectory-time {
    width: 100%;
  }
}
</style>
