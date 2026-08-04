<template>
  <div class="device-overview-page">
    <!-- 顶部状态统计 -->
    <ElCard shadow="never" class="stats-card">
      <div class="stats-grid annot-device-overview-stats">
        <div class="stat-item">
          <div class="stat-value">{{ deviceStore.stats.total }}</div>
          <div class="stat-label">设备总数</div>
        </div>
        <div class="stat-item stat-online">
          <div class="stat-value">{{ deviceStore.stats.online }}</div>
          <div class="stat-label">在线</div>
        </div>
        <div class="stat-item stat-offline">
          <div class="stat-value">{{ deviceStore.stats.offline }}</div>
          <div class="stat-label">离线</div>
        </div>
        <div class="stat-item stat-fault">
          <div class="stat-value">{{ deviceStore.stats.fault }}</div>
          <div class="stat-label">故障</div>
        </div>
      </div>
    </ElCard>

    <div class="main-row">
      <!-- 左侧设备树 -->
      <ElCard shadow="never" class="tree-card">
        <DeviceTreePanel
          :devices="deviceStore.deviceList"
          :selected-id="deviceStore.selectedDeviceId"
          @select="handleSelect"
          @detail="openDetail"
          @quick-link="quickLink"
        />
      </ElCard>
      <!-- 右侧地图 -->
      <ElCard shadow="never" class="map-card">
        <div ref="mapContainer" class="map-container annot-device-overview-map"></div>
        <div class="map-legend annot-device-overview-legend">
          <span class="legend-item"><i class="legend-dot dot-online"></i>在线</span>
          <span class="legend-item"><i class="legend-dot dot-offline"></i>离线</span>
          <span class="legend-item"><i class="legend-dot dot-fault"></i>故障</span>
        </div>
      </ElCard>
    </div>

    <!-- 设备详情抽屉 -->
    <DeviceDetailDrawer
      v-model:visible="drawerVisible"
      :device-id="detailDeviceId"
      @link="quickLinkById"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useDeviceStore } from '@/store/modules/device'
import DeviceTreePanel from './components/DeviceTreePanel.vue'
import DeviceDetailDrawer from './components/DeviceDetailDrawer.vue'

/**
 * 设备总览页
 * 提供设备状态统计、分组设备树、地图点位分布与设备详情/快速联动入口
 */
defineOptions({ name: 'DeviceOverview' })

const router = useRouter()
const deviceStore = useDeviceStore()
const mapContainer = ref<HTMLDivElement>()
const drawerVisible = ref(false)
const detailDeviceId = ref<number | null>(null)
let map: L.Map | null = null
let markerLayer: L.LayerGroup | null = null

const tileUrl = 'https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=5f23a6c8375bf184bbd6f8fa9d552029'
const typeRoute: Record<string, string> = { optic: '/device/optics', uav: '/device/uav', radar: '/device/radar' }
const typeLabel: Record<string, string> = { optic: '光电', uav: '无人机', radar: '雷达', weather: '气象' }
const statusLabel: Record<number, string> = { 1: '在线', 0: '离线', 2: '故障' }
const statusColor: Record<number, string> = { 1: '#67c23a', 0: '#909399', 2: '#f56c6c' }

/** 初始化地图 */
function initMap() {
  if (!mapContainer.value || map) return
  map = L.map(mapContainer.value).setView([29.9, 122.1], 8)
  L.tileLayer(tileUrl, { maxZoom: 18, subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'], attribution: '' }).addTo(map)
  markerLayer = L.layerGroup().addTo(map)
  setTimeout(() => map?.invalidateSize(), 200)
}

/** 渲染设备点位，弹窗信息使用 DOM 节点避免注入风险 */
function renderMarkers() {
  if (!markerLayer) return
  markerLayer.clearLayers()
  deviceStore.deviceList.forEach((device) => {
    const marker = L.circleMarker([device.lat, device.lng], {
      radius: 9,
      color: '#ffffff',
      weight: 1,
      fillColor: statusColor[device.status],
      fillOpacity: 0.9
    })
    const box = document.createElement('div')
    box.className = 'map-popup'
    const title = document.createElement('strong')
    title.textContent = device.name
    const info = document.createElement('span')
    info.textContent = `${typeLabel[device.type]} · ${statusLabel[device.status]}`
    const actions = document.createElement('div')
    const detailBtn = document.createElement('button')
    detailBtn.textContent = '详情'
    detailBtn.onclick = () => { openDetail(device); map?.closePopup() }
    actions.appendChild(detailBtn)
    if (typeRoute[device.type]) {
      const linkBtn = document.createElement('button')
      linkBtn.textContent = '联动'
      linkBtn.onclick = () => { quickLink(device); map?.closePopup() }
      actions.appendChild(linkBtn)
    }
    box.append(title, info, actions)
    marker.bindPopup(box)
    marker.on('click', () => handleSelect(device))
    marker.addTo(markerLayer!)
  })
}

/** 选中设备并聚焦地图点位 */
function handleSelect(device: any) {
  deviceStore.selectDevice(device.id)
  if (map) map.setView([device.lat, device.lng], Math.max(map.getZoom(), 9))
}

/** 打开设备详情抽屉 */
function openDetail(device: any) {
  deviceStore.selectDevice(device.id)
  detailDeviceId.value = device.id
  drawerVisible.value = true
}

/** 快速联动跳转 */
function quickLink(device: any) {
  const path = typeRoute[device.type]
  if (!path) { ElMessage.info('该设备暂无联动控制页'); return }
  quickLinkById(device.id)
}

function quickLinkById(id: number) {
  const device = deviceStore.deviceList.find((d) => d.id === id)
  const path = typeRoute[device?.type || '']
  if (!path) { ElMessage.info('该设备暂无联动控制页'); return }
  deviceStore.selectDevice(id)
  router.push({ path, query: { deviceId: String(id) } })
}

watch(() => deviceStore.deviceList, () => renderMarkers(), { deep: true })

onMounted(async () => {
  await deviceStore.refreshDevices()
  initMap()
  nextTick(renderMarkers)
  deviceStore.startHeartbeat()
})

onBeforeUnmount(() => {
  deviceStore.stopHeartbeat()
  if (map) { map.remove(); map = null }
})
</script>

<style lang="scss" scoped>
.device-overview-page { display: flex; flex-direction: column; gap: 12px; height: 100%; }
.stats-card { flex: none; :deep(.el-card__body) { padding: 16px; } }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); }
.stat-item { text-align: center; border-right: 1px solid var(--el-border-color-lighter); }
.stat-item:last-child { border-right: none; }
.stat-value { font-size: 26px; font-weight: 700; line-height: 1.2; color: var(--el-text-color-primary); }
.stat-label { margin-top: 4px; font-size: 13px; color: var(--el-text-color-secondary); }
.stat-online .stat-value { color: var(--el-color-success); }
.stat-offline .stat-value { color: var(--el-color-info); }
.stat-fault .stat-value { color: var(--el-color-danger); }
.main-row { display: flex; gap: 12px; flex: 1; min-height: 0; }
.tree-card { width: 300px; flex: none; :deep(.el-card__body) { height: 100%; padding: 0; } }
.map-card { flex: 1; position: relative; min-width: 0; :deep(.el-card__body) { height: 100%; padding: 0; } }
.map-container { width: 100%; height: 100%; }
.map-legend { position: absolute; right: 12px; bottom: 16px; display: flex; gap: 12px; padding: 6px 10px; background: var(--el-bg-color); border-radius: 6px; box-shadow: 0 1px 4px rgb(0 0 0 / 12%); z-index: 500; }
.legend-item { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--el-text-color-regular); }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.dot-online { background: var(--el-color-success); }
.dot-offline { background: var(--el-color-info); }
.dot-fault { background: var(--el-color-danger); }
:deep(.map-popup) { min-width: 150px; display: flex; flex-direction: column; gap: 6px; }
:deep(.map-popup strong) { font-size: 14px; }
:deep(.map-popup span) { font-size: 12px; color: var(--el-text-color-secondary); }
:deep(.map-popup button) { border: 1px solid var(--el-border-color); background: var(--el-bg-color); color: var(--el-color-primary); border-radius: 4px; font-size: 12px; padding: 2px 10px; margin-right: 6px; cursor: pointer; }
</style>
