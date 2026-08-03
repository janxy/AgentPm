<template>
  <div class="route-map-panel">
    <div class="map-area">
      <div ref="mapContainer" class="map-container"></div>
      <div class="map-hint">点击地图添加航点，拖动标记调整位置</div>
      <div class="route-summary">
        <span>总航程 <strong :class="{ danger: metrics.exceed }">{{ metrics.totalDistance.toFixed(1) }}km</strong></span>
        <span>预估续航距离 <strong>{{ metrics.enduranceDistance.toFixed(1) }}km</strong></span>
        <ElTag v-if="metrics.exceed" type="danger" size="small">超出续航</ElTag>
        <ElTag v-else type="success" size="small">续航充足</ElTag>
      </div>
    </div>

    <div class="waypoint-area">
      <div class="waypoint-head">
        <span class="waypoint-title">航线航点</span>
        <ElButton size="small" type="primary" :disabled="!canEdit" @click="saveRoute">保存航线</ElButton>
        <ElButton size="small" :disabled="!canEdit" @click="saveAsTemplate">存为模板</ElButton>
      </div>
      <div class="template-row">
        <ElSelect v-model="selectedTemplate" placeholder="复用航线模板" size="small" class="template-select" :disabled="!canEdit">
          <ElOption v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
        </ElSelect>
        <ElButton size="small" :disabled="!selectedTemplate || !canEdit" @click="applyTemplate">复用</ElButton>
      </div>
      <div class="waypoint-list">
        <div v-for="(wp, idx) in route?.waypoints || []" :key="wp.id" class="waypoint-row">
          <span class="wp-index">{{ idx + 1 }}</span>
          <div class="wp-coords">
            <ElInputNumber v-model="wp.lat" :precision="5" :step="0.0001" :min="-90" :max="90" size="small" controls-position="right" />
            <ElInputNumber v-model="wp.lng" :precision="5" :step="0.0001" :min="-180" :max="180" size="small" controls-position="right" />
          </div>
          <div class="wp-flight">
            <ElInputNumber v-model="wp.altitude" :min="10" :max="500" size="small" controls-position="right" title="高度m" />
            <ElInputNumber v-model="wp.speed" :min="1" :max="30" size="small" controls-position="right" title="速度m/s" />
          </div>
          <div class="wp-actions">
            <ElButton :icon="Top" circle size="small" :disabled="idx === 0" @click="moveWaypoint(idx, -1)" />
            <ElButton :icon="Bottom" circle size="small" :disabled="idx === (route?.waypoints?.length || 0) - 1" @click="moveWaypoint(idx, 1)" />
            <ElButton :icon="Delete" circle size="small" type="danger" @click="removeWaypoint(idx)" />
          </div>
        </div>
        <ElEmpty v-if="!route?.waypoints?.length" description="暂无航点，点击地图添加" :image-size="60" />
      </div>
      <div class="point-info">
        <div class="point-row"><i class="point-dot dot-takeoff"></i>起降点（可拖动）</div>
        <div class="point-row"><i class="point-dot dot-wp"></i>航点（可拖动）</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Top, Bottom } from '@element-plus/icons-vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * 无人机航线规划地图
 * Leaflet 展示起降点与航点，支持点击添加、拖拽、增删、顺序调整与高度速度配置
 */
const props = defineProps<{ uav: any; route: any; metrics: any; templates: any[] }>()
const emit = defineEmits<{
  update: [route: any]
  save: [route: any]
  'save-template': [route: any]
  'apply-template': [templateId: number]
}>()

const mapContainer = ref<HTMLDivElement>()
const selectedTemplate = ref<number | null>(null)
let map: L.Map | null = null
let layerGroup: L.LayerGroup | null = null
let waypointIdSeed = 1000
const canEdit = computed(() => !!props.uav && props.uav.status === 1)

const tileUrl = 'https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=5f23a6c8375bf184bbd6f8fa9d552029'

function initMap() {
  if (!mapContainer.value || map) return
  map = L.map(mapContainer.value, { zoomControl: true }).setView([29.95, 122.12], 11)
  L.tileLayer(tileUrl, { maxZoom: 18, subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'], attribution: '' }).addTo(map)
  layerGroup = L.layerGroup().addTo(map)
  map.on('click', onMapClick)
  setTimeout(() => map?.invalidateSize(), 200)
}

/** 渲染起降点、航点与航线连线 */
function renderRoute() {
  if (!map || !layerGroup || !props.route) return
  layerGroup.clearLayers()
  const points: [number, number][] = []
  const addPointMarker = (lat: number, lng: number, label: string, cls: string, draggable: boolean, onChange: (lat: number, lng: number) => void) => {
    const icon = L.divIcon({ className: 'route-div-icon', html: `<div class="${cls}">${label}</div>`, iconSize: [22, 22], iconAnchor: [11, 11] })
    const marker = L.marker([lat, lng], { icon, draggable: draggable && canEdit.value })
    marker.on('dragend', () => { const p = marker.getLatLng(); onChange(p.lat, p.lng) })
    marker.addTo(layerGroup!)
  }
  const takeoff = props.route.takeoffPoint
  const landing = props.route.landingPoint
  addPointMarker(takeoff.lat, takeoff.lng, '起', 'takeoff-dot', true, (lat, lng) => updatePoint('takeoffPoint', lat, lng))
  addPointMarker(landing.lat, landing.lng, '降', 'landing-dot', true, (lat, lng) => updatePoint('landingPoint', lat, lng))
  props.route.waypoints.forEach((wp: any, idx: number) => {
    addPointMarker(wp.lat, wp.lng, String(idx + 1), 'wp-dot', true, (lat, lng) => updateWaypoint(idx, { lat, lng }))
    points.push([wp.lat, wp.lng])
  })
  if (points.length > 0) {
    const linePoints = [[takeoff.lat, takeoff.lng], ...points, [landing.lat, landing.lng]] as [number, number][]
    L.polyline(linePoints, { color: '#409eff', weight: 2, dashArray: '6 4' }).addTo(layerGroup)
    map.fitBounds(L.latLngBounds(linePoints), { padding: [40, 40], maxZoom: 13 })
  } else {
    map.setView([takeoff.lat, takeoff.lng], 12)
  }
}

function onMapClick(e: L.LeafletMouseEvent) {
  if (!canEdit.value || !props.route) { ElMessage.warning('当前无人机不可编辑航线'); return }
  const wp = { id: waypointIdSeed++, lat: e.latlng.lat, lng: e.latlng.lng, altitude: 120, speed: 18 }
  emitUpdate({ ...props.route, waypoints: [...props.route.waypoints, wp] })
}

function updatePoint(key: 'takeoffPoint' | 'landingPoint', lat: number, lng: number) {
  if (!props.route) return
  emitUpdate({ ...props.route, [key]: { ...props.route[key], lat, lng } })
}

function updateWaypoint(idx: number, patch: any) {
  if (!props.route) return
  const waypoints = props.route.waypoints.map((wp: any, i: number) => (i === idx ? { ...wp, ...patch } : wp))
  emitUpdate({ ...props.route, waypoints })
}

function removeWaypoint(idx: number) {
  if (!props.route) return
  const waypoints = props.route.waypoints.filter((_: any, i: number) => i !== idx)
  emitUpdate({ ...props.route, waypoints })
}

function moveWaypoint(idx: number, dir: number) {
  if (!props.route) return
  const waypoints = [...props.route.waypoints]
  const target = idx + dir
  if (target < 0 || target >= waypoints.length) return
  ;[waypoints[idx], waypoints[target]] = [waypoints[target], waypoints[idx]]
  emitUpdate({ ...props.route, waypoints })
}

function emitUpdate(route: any) {
  emit('update', route)
}

function saveRoute() {
  if (!props.route || props.route.waypoints.length < 2) { ElMessage.warning('至少 2 个航点才能保存航线'); return }
  emit('save', props.route)
}

function saveAsTemplate() {
  if (!props.route || props.route.waypoints.length < 2) { ElMessage.warning('至少 2 个航点才能保存为模板'); return }
  emit('save-template', props.route)
}

function applyTemplate() {
  if (!selectedTemplate.value) return
  emit('apply-template', selectedTemplate.value)
}

watch(() => props.route, () => renderRoute(), { deep: true })
watch(() => props.uav?.status, () => renderRoute())

onMounted(() => { initMap(); renderRoute() })
onBeforeUnmount(() => { if (map) { map.remove(); map = null } })
</script>

<style lang="scss" scoped>
.route-map-panel { display: flex; height: 100%; min-height: 0; }
.map-area { position: relative; flex: 1; min-width: 0; }
.map-container { width: 100%; height: 100%; }
.map-hint { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); z-index: 500; padding: 4px 12px; border-radius: 20px; background: rgba(255, 255, 255, 0.92); font-size: 12px; color: var(--el-text-color-secondary); box-shadow: 0 1px 4px rgb(0 0 0 / 10%); }
.route-summary { position: absolute; left: 12px; bottom: 12px; z-index: 500; display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 8px; background: rgba(255, 255, 255, 0.94); font-size: 12px; color: var(--el-text-color-regular); }
.route-summary strong { font-size: 13px; color: var(--el-color-primary); }
.route-summary strong.danger { color: var(--el-color-danger); }
.waypoint-area { width: 300px; flex: none; display: flex; flex-direction: column; border-left: 1px solid var(--el-border-color-lighter); }
.waypoint-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--el-border-color-lighter); }
.waypoint-title { flex: 1; font-size: 14px; font-weight: 600; }
.template-row { display: flex; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--el-border-color-lighter); }
.template-select { flex: 1; }
.waypoint-list { flex: 1; overflow: auto; padding: 10px 12px; }
.waypoint-row { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.wp-index { width: 18px; height: 18px; border-radius: 50%; background: var(--el-color-primary); color: #fff; font-size: 11px; display: flex; align-items: center; justify-content: center; flex: none; }
.wp-coords, .wp-flight { display: flex; flex-direction: column; gap: 4px; }
.wp-coords :deep(.el-input-number), .wp-flight :deep(.el-input-number) { width: 92px; }
.wp-actions { display: flex; flex-direction: column; gap: 2px; }
.point-info { padding: 8px 12px; border-top: 1px solid var(--el-border-color-lighter); font-size: 12px; color: var(--el-text-color-secondary); }
.point-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.point-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dot-takeoff { background: var(--el-color-success); }
.dot-wp { background: var(--el-color-primary); }
:deep(.takeoff-dot), :deep(.landing-dot), :deep(.wp-dot) { width: 22px; height: 22px; border-radius: 50%; color: #fff; font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 1px 4px rgb(0 0 0 / 30%); }
:deep(.takeoff-dot) { background: var(--el-color-success); }
:deep(.landing-dot) { background: var(--el-color-danger); }
:deep(.wp-dot) { background: var(--el-color-primary); }
:deep(.route-div-icon) { background: transparent; border: none; }
</style>
