<template>
  <div class="fence-rule-page">
    <!-- 筛选区 -->
    <ElCard shadow="never" class="filter-card annot-alert-rule-fence-filter">
      <ElForm :inline="true" :model="filterForm">
        <ElFormItem label="规则名称">
          <ElInput v-model="filterForm.name" placeholder="输入规则名称" clearable />
        </ElFormItem>
        <ElFormItem label="所属区域">
          <ElSelect v-model="filterForm.areaId" placeholder="全部" clearable>
            <ElOption v-for="a in areaOptions" :key="a.id" :label="a.name" :value="a.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="filterForm.status" placeholder="全部" clearable>
            <ElOption label="启用" :value="1" />
            <ElOption label="禁用" :value="0" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" :icon="Search" @click="handleSearch">搜索</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <!-- 操作栏 + 表格 -->
    <ElCard shadow="never" class="table-card annot-alert-rule-fence-table">
      <div class="table-header">
        <ElButton type="primary" :icon="Plus" @click="openAddDialog" class="annot-alert-rule-fence-add-btn">新增规则</ElButton>
      </div>
      <ElTable v-loading="loading" :data="tableData" row-key="id" class="fence-table">
        <ElTableColumn prop="name" label="规则名称" min-width="160" />
        <ElTableColumn label="所属区域" width="150" align="center">
          <template #default="{ row }">{{ row.areaName || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn label="围栏面积" width="120" align="center" class-name="annot-alert-rule-fence-area-col">
          <template #default="{ row }">{{ formatArea(row.geoData) }}</template>
        </ElTableColumn>
        <ElTableColumn label="生效时段" min-width="180">
          <template #default="{ row }">
            {{ row.startDate }} ~ {{ row.endDate }}<br />
            <small class="text-muted">{{ formatTimeSlots(row.timeSlots) }}</small>
          </template>
        </ElTableColumn>
        <ElTableColumn label="适用目标" min-width="160">
          <template #default="{ row }">{{ formatShipTypes(row) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="priority" label="优先级" width="80" align="center" />
        <ElTableColumn label="告警级别" width="90" align="center">
          <template #default="{ row }">
            <ElTag :type="(alertLevelTagMap as any)[row.alertLevel]" size="small" disable-transitions>
              {{ alertLevelLabel[row.alertLevel] }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="80" align="center" class-name="annot-alert-rule-fence-status-col">
          <template #default="{ row }">
            <ElSwitch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              size="small"
              @change="(val: any) => handleStatusChange(row, val)"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openEditDialog(row)">编辑</ElButton>
            <ElButton link type="danger" @click="handleDelete(row)">删除</ElButton>
            <ElButton link type="primary" @click="showHitHistory(row)">命中历史</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadList"
        @current-change="loadList"
        class="fence-pagination"
      />
    </ElCard>

    <!-- 新增/编辑弹窗 -->
    <ElDialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑围栏规则' : '新增围栏规则'"
      width="720px"
      :close-on-click-modal="false"
      @closed="resetForm"
      class="annot-alert-rule-fence-dialog"
    >
      <ElForm ref="formRef" :model="form" :rules="formRules" label-width="110px">
        <ElFormItem label="规则名称" prop="name">
          <ElInput v-model="form.name" placeholder="2-50字" maxlength="50" />
        </ElFormItem>

        <ElFormItem label="所属区域" prop="areaId">
          <ElSelect v-model="form.areaId" placeholder="请选择所属区域" filterable :loading="areaLoading">
            <ElOption v-for="a in areaOptions" :key="a.id" :label="areaOptionLabel(a)" :value="a.id" />
          </ElSelect>
        </ElFormItem>

        <!-- 围栏区域绘制 -->
        <ElFormItem label="围栏区域" prop="geoData">
          <ElButton type="primary" :icon="Edit" @click="openDrawDialog" class="annot-alert-rule-fence-draw-btn">绘制围栏区域</ElButton>
          <span v-if="form.geoData" class="area-info">
            {{ formatArea(form.geoData) }}
          </span>
        </ElFormItem>
        <!-- 小地图预览 -->
        <ElFormItem v-if="form.geoData" label="">
          <div ref="miniMapContainer" class="mini-map-container annot-alert-rule-fence-minimap"></div>
        </ElFormItem>

        <ElFormItem label="生效日期" class="annot-alert-rule-fence-time-config">
          <ElDatePicker
            v-model="form.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </ElFormItem>
        <ElFormItem label="每日时间段">
          <div v-for="(slot, idx) in form.timeSlots" :key="idx" class="time-slot-row">
            <ElTimePicker
              v-model="form.timeSlots[idx]"
              is-range
              range-separator="-"
              start-placeholder="开始"
              end-placeholder="结束"
              format="HH:mm"
              value-format="HH:mm"
            />
            <ElButton
              :icon="Delete"
              circle
              size="small"
              @click="form.timeSlots.splice(idx, 1)"
              :disabled="form.timeSlots.length <= 1"
            />
          </div>
          <ElButton size="small" :icon="Plus" @click="form.timeSlots.push(['08:00', '18:00'])">添加时段</ElButton>
        </ElFormItem>
        <ElFormItem label="按星期重复">
          <ElCheckboxGroup v-model="form.repeatDays">
            <ElCheckboxButton v-for="(d, idx) in weekDays" :key="idx" :value="d.value">
              {{ d.label }}
            </ElCheckboxButton>
          </ElCheckboxGroup>
          <ElButton size="small" style="margin-left: 8px" @click="form.repeatDays = [1, 2, 3, 4, 5]">工作日</ElButton>
          <ElButton size="small" @click="form.repeatDays = [1, 2, 3, 4, 5, 6, 7]">全选</ElButton>
        </ElFormItem>
        <ElFormItem label="适用船型" class="annot-alert-rule-fence-target-config">
          <ElSelect v-model="form.shipTypes" multiple placeholder="多选船型">
            <ElOption v-for="s in shipTypeOptions" :key="s" :label="s" :value="s" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="吨位范围(吨)">
          <ElInput
            v-model.number="form.tonnageMin"
            placeholder="最小"
            type="number"
            style="width: 120px"
          />
          <span class="mx-2">~</span>
          <ElInput
            v-model.number="form.tonnageMax"
            placeholder="最大"
            type="number"
            style="width: 120px"
          />
        </ElFormItem>
        <ElFormItem label="目标来源">
          <ElSelect v-model="form.sourceTypes" multiple placeholder="多选来源">
            <ElOption v-for="s in sourceTypeOptions" :key="s" :label="s" :value="s" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="优先级" prop="priority" class="annot-alert-rule-fence-priority-alert">
          <ElInputNumber v-model="form.priority" :min="1" :max="999" />
        </ElFormItem>
        <ElFormItem label="告警级别" prop="alertLevel">
          <ElSelect v-model="form.alertLevel" placeholder="请选择">
            <ElOption label="提示" value="tip" />
            <ElOption label="一般" value="normal" />
            <ElOption label="重要" value="important" />
            <ElOption label="紧急" value="urgent" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">确定</ElButton>
      </template>
    </ElDialog>

    <!-- 绘制地图弹窗（盖在编辑框上面） -->
    <ElDialog
      v-model="drawDialogVisible"
      title="绘制围栏区域"
      fullscreen
      :close-on-click-modal="false"
      :show-close="false"
      class="draw-map-dialog annot-alert-rule-fence-draw-dialog"
    >
      <div class="draw-map-toolbar">
        <div class="toolbar-left">
          <span v-if="selectedAreaName" class="area-boundary-label">所属区域：{{ selectedAreaName }}</span>
          <ElButton size="small" :disabled="drawPoints.length === 0" @click="undoLastPoint">撤销</ElButton>
          <ElButton size="small" :disabled="drawPoints.length === 0" @click="clearDrawing">清除</ElButton>
          <span v-if="drawPolygonArea > 0" class="draw-area-label">面积：{{ drawPolygonArea.toFixed(2) }} km²</span>
        </div>
        <div class="toolbar-right">
          <span class="draw-hint">点击地图添加顶点，点击起点（或双击）闭合多边形</span>
        </div>
      </div>
      <div ref="drawMapContainer" class="draw-map-container"></div>
      <div class="draw-map-footer">
        <ElButton @click="cancelDraw">取消</ElButton>
        <ElButton type="primary" :disabled="drawPoints.length < 3" @click="saveDraw">保存区域</ElButton>
      </div>
    </ElDialog>

    <!-- 命中历史弹窗 -->
    <ElDialog v-model="hitDialogVisible" title="命中历史" width="600px">
      <ElTable :data="hitHistoryData" size="small">
        <ElTableColumn prop="triggerTime" label="触发时间" width="170" />
        <ElTableColumn prop="targetName" label="目标" width="120" />
        <ElTableColumn label="位置" min-width="180">
          <template #default="{ row }">
            {{ row.location?.lat }}, {{ row.location?.lng }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" width="90" />
      </ElTable>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus, Delete, Edit } from '@element-plus/icons-vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  getAreaList,
  getFenceRuleList,
  addFenceRule,
  updateFenceRule,
  deleteFenceRule,
  updateFenceRuleStatus,
  getAlertEventList,
} from '@/api/alert'

defineOptions({ name: 'AlertRuleFence' })

// ---- 常量 ----
const alertLevelLabel: Record<string, string> = {
  tip: '提示', normal: '一般', important: '重要', urgent: '紧急',
}
const alertLevelTagMap: Record<string, string> = {
  tip: 'info', normal: 'warning', important: '', urgent: 'danger',
}
const weekDays = [
  { label: '一', value: 1 }, { label: '二', value: 2 }, { label: '三', value: 3 },
  { label: '四', value: 4 }, { label: '五', value: 5 }, { label: '六', value: 6 }, { label: '日', value: 7 },
]
const shipTypeOptions = ['渔船', '货船', '客船', '快艇', '橡皮艇', '三无船']
const sourceTypeOptions = ['雷达', 'AIS', '北斗', '光电', '融合']
const tileUrl = 'https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=5f23a6c8375bf184bbd6f8fa9d552029'

// ---- 表格筛选 ----
const filterForm = reactive({ name: '', areaId: '' as number | string, status: '' as number | string })
const loading = ref(false)
const tableData = ref<any[]>([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

// ---- 所属区域选项 ----
const areaOptions = ref<any[]>([])
const areaLoading = ref(false)

// ---- 编辑弹窗 ----
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
let syncingAreaId = false
const form = reactive<any>({
  name: '',
  areaId: undefined as number | undefined,
  geoData: null as any,
  dateRange: [] as string[],
  timeSlots: [['08:00', '18:00']] as string[][],
  repeatDays: [1, 2, 3, 4, 5] as number[],
  shipTypes: [] as string[],
  tonnageMin: 0,
  tonnageMax: 50000,
  sourceTypes: [] as string[],
  priority: 1,
  alertLevel: 'normal',
})

const selectedArea = computed(() => areaOptions.value.find((a) => a.id === form.areaId))
const selectedAreaName = computed(() => selectedArea.value?.name || '')

const validateGeoData = (_rule: any, _value: any, callback: any) => {
  if (!form.geoData) callback(new Error('请绘制围栏区域'))
  else callback()
}

const formRules: FormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  areaId: [{ required: true, message: '请选择所属区域', trigger: 'change' }],
  geoData: [{ required: true, validator: validateGeoData, trigger: 'change' }],
  alertLevel: [{ required: true, message: '请选择告警级别', trigger: 'change' }],
}

// ---- 绘制弹窗（盖在编辑框上面） ----
const drawDialogVisible = ref(false)
const drawMapContainer = ref<HTMLDivElement>()
let drawMap: L.Map | null = null
let drawFeatureGroup: L.FeatureGroup | null = null
let drawPolylinePreview: L.Polyline | null = null
const drawPoints = ref<L.LatLng[]>([])
const drawPolygonArea = ref(0)

// ---- 小地图预览 ----
const miniMapContainer = ref<HTMLDivElement>()
let miniMap: L.Map | null = null

// ---- 命中历史 ----
const hitDialogVisible = ref(false)
const hitHistoryData = ref<any[]>([])

// ========== 面积计算 ==========
function toRad(deg: number) { return (deg * Math.PI) / 180 }

/** Shoelace 公式计算多边形面积 (km²) */
function polygonAreaKm2(points: L.LatLng[]): number {
  if (points.length < 3) return 0
  const n = points.length
  let area = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += toRad(points[j].lng - points[i].lng) * (2 + Math.sin(toRad(points[i].lat)) + Math.sin(toRad(points[j].lat)))
  }
  return Math.abs((area * 6371 * 6371) / 2)
}

// ========== 格式化 ==========
function formatArea(geoData: any) {
  if (!geoData) return '-'
  if (geoData.type === 'Polygon' && geoData.coordinates?.[0]) {
    // 去掉闭合点（首尾相同），算面积用不闭合的点集
    const ring = geoData.coordinates[0]
    const pts = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
      ? ring.slice(0, -1)
      : ring
    const latlngs = pts.map((c: number[]) => L.latLng(c[1], c[0]))
    const area = polygonAreaKm2(latlngs)
    if (area < 0.01) return (area * 1_000_000).toFixed(0) + ' m²'
    return area.toFixed(2) + ' km²'
  }
  if (geoData.type === 'Circle') {
    // 兼容旧数据
    const center = L.latLng(geoData.center[1], geoData.center[0])
    const edge = L.latLng(geoData.edge[1], geoData.edge[0])
    const r = haversineKm(center, edge)
    const area = Math.PI * r * r
    return area.toFixed(2) + ' km²'
  }
  return '-'
}

function haversineKm(p1: L.LatLng, p2: L.LatLng): number {
  const R = 6371
  const dLat = toRad(p2.lat - p1.lat)
  const dLng = toRad(p2.lng - p1.lng)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatTimeSlots(slots: Array<{ start: string; end: string }>) {
  if (!slots?.length) return '-'
  return slots.map((s) => `${s.start}-${s.end}`).join(', ')
}

function formatShipTypes(row: any) {
  const parts = [
    (row.shipTypes || []).join('/'),
    row.tonnageMin || 0, '-', row.tonnageMax || 0, '吨',
    (row.sourceTypes || []).join('/'),
  ]
  return parts.filter(Boolean).join(' ')
}

function areaOptionLabel(area: any) {
  return area.areaText ? `${area.name}（${area.areaText}）` : area.name
}

async function loadAreaOptions() {
  areaLoading.value = true
  try {
    const { data } = await getAreaList({ page: 1, pageSize: 1000 })
    areaOptions.value = (data as any)?.list || []
  } finally {
    areaLoading.value = false
  }
}

// ========== 列表加载 ==========
async function loadList() {
  loading.value = true
  try {
    const { data } = await getFenceRuleList({
      name: filterForm.name,
      areaId: filterForm.areaId === '' ? undefined : filterForm.areaId,
      status: filterForm.status === '' ? undefined : filterForm.status,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    tableData.value = (data as any)?.list || []
    pagination.total = (data as any)?.pagination?.total || 0
  } finally {
    loading.value = false
  }
}

function handleSearch() { pagination.page = 1; loadList() }
function handleReset() { filterForm.name = ''; filterForm.areaId = ''; filterForm.status = ''; pagination.page = 1; loadList() }

// ========== 编辑弹窗 ==========
function openAddDialog() {
  isEditing.value = false; editingId.value = null
  form.name = ''; form.areaId = undefined; form.geoData = null
  form.dateRange = []; form.timeSlots = [['08:00', '18:00']]
  form.repeatDays = [1, 2, 3, 4, 5]; form.shipTypes = []
  form.tonnageMin = 0; form.tonnageMax = 50000; form.sourceTypes = []
  form.priority = 1; form.alertLevel = 'normal'
  destroyMiniMap()
  loadAreaOptions()
  dialogVisible.value = true
}

function openEditDialog(row: any) {
  isEditing.value = true; editingId.value = row.id
  syncingAreaId = true
  loadAreaOptions()
  form.name = row.name
  form.areaId = row.areaId
  form.geoData = row.geoData ? JSON.parse(JSON.stringify(row.geoData)) : null
  form.dateRange = [row.startDate, row.endDate]
  form.timeSlots = (row.timeSlots || [{ start: '08:00', end: '18:00' }]).map((s: any) => [s.start, s.end])
  form.repeatDays = row.repeatDays || [1, 2, 3, 4, 5]
  form.shipTypes = row.shipTypes || []
  form.tonnageMin = row.tonnageMin ?? 0; form.tonnageMax = row.tonnageMax ?? 50000
  form.sourceTypes = row.sourceTypes || []
  form.priority = row.priority ?? 1; form.alertLevel = row.alertLevel || 'normal'
  destroyMiniMap()
  dialogVisible.value = true
  nextTick(() => {
    syncingAreaId = false
    renderMiniMap()
  })
}

watch(dialogVisible, (val) => {
  if (!val) destroyMiniMap()
})

watch(() => form.areaId, () => {
  if (syncingAreaId) return
  if (form.geoData) {
    form.geoData = null
    destroyMiniMap()
  }
})

// ========== 小地图预览 ==========
function destroyMiniMap() {
  if (miniMap) { miniMap.remove(); miniMap = null }
}

function renderMiniMap() {
  if (!miniMapContainer.value || !form.geoData) return
  destroyMiniMap()
  const gd = form.geoData
  let center: [number, number] = [30.0, 122.0]

  if (gd.type === 'Polygon' && gd.coordinates?.[0]?.length) {
    const pts = gd.coordinates[0]
    const lats = pts.map((c: number[]) => c[1])
    const lngs = pts.map((c: number[]) => c[0])
    center = [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2]
  } else if (gd.type === 'Circle' && gd.center) {
    center = [gd.center[1], gd.center[0]]
  }

  miniMap = L.map(miniMapContainer.value, {
    attributionControl: false, zoomControl: false,
    dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
  }).setView(center, 10)

  L.tileLayer(tileUrl, { maxZoom: 18, subdomains: ['0','1','2','3','4','5','6','7'] }).addTo(miniMap)
  addGeoJSONToMap(miniMap, gd)
  // 自适应视野
  fitMapToGeoData(miniMap, gd)
}

function addGeoJSONToMap(map: L.Map, gd: any) {
  if (gd.type === 'Polygon') {
    const coords = gd.coordinates[0].map((c: number[]) => [c[1], c[0]])
    L.polygon(coords as any, {
      color: '#409eff', fillColor: '#409eff', fillOpacity: 0.2, weight: 2,
    }).addTo(map)
  } else if (gd.type === 'Circle') {
    const center = L.latLng(gd.center[1], gd.center[0])
    const edge = L.latLng(gd.edge[1], gd.edge[0])
    L.circle(center, {
      radius: haversineKm(center, edge) * 1000,
      color: '#409eff', fillColor: '#409eff', fillOpacity: 0.2, weight: 2,
    }).addTo(map)
  }
}

function fitMapToGeoData(map: L.Map, gd: any) {
  if (gd.type === 'Polygon' && gd.coordinates?.[0]?.length) {
    const ring = gd.coordinates[0]
    const lats = ring.map((c: number[]) => c[1])
    const lngs = ring.map((c: number[]) => c[0])
    map.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [20, 20] })
  } else if (gd.type === 'Circle') {
    map.setView([gd.center[1], gd.center[0]], 12)
  }
}

// ========== 绘制弹窗 ==========
function openDrawDialog() {
  if (!form.areaId) {
    ElMessage.warning('请先选择所属区域')
    return
  }
  drawDialogVisible.value = true
  drawPoints.value = []
  drawPolygonArea.value = 0
  nextTick(() => initDrawMap())
}

function initDrawMap() {
  if (!drawMapContainer.value) return
  if (drawMap) { drawMap.remove(); drawMap = null }
  drawFeatureGroup = null
  drawPolylinePreview = null

  drawMap = L.map(drawMapContainer.value).setView([30.0, 122.0], 7)
  L.tileLayer(tileUrl, { maxZoom: 18, subdomains: ['0','1','2','3','4','5','6','7'] }).addTo(drawMap)
  addAreaBoundaryLayer()
  drawFeatureGroup = L.featureGroup().addTo(drawMap)

  // 编辑模式：回显已有区域
  if (form.geoData) {
    const gd = form.geoData
    if (gd.type === 'Polygon' && gd.coordinates?.[0]) {
      // 去掉闭合点（首尾相同）
      const ring = gd.coordinates[0]
      const pts = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
        ? ring.slice(0, -1)
        : ring
      drawPoints.value = pts.map((c: number[]) => L.latLng(c[1], c[0]))
      redrawPolygon()
      drawPolygonArea.value = polygonAreaKm2(drawPoints.value)
      fitDrawMapBounds()
    }
  } else {
    fitDrawMapToArea()
  }

  // 点击绘制
  drawMap.on('click', onDrawMapClick)
  drawMap.on('dblclick', onDrawMapDblClick)
  setTimeout(() => drawMap?.invalidateSize(), 100)
}

function addAreaBoundaryLayer() {
  if (!drawMap || !selectedArea.value?.geoData) return
  const gd = selectedArea.value.geoData
  const style = {
    style: {
      color: '#f59e0b',
      weight: 2,
      dashArray: '8 6',
      fillColor: '#f59e0b',
      fillOpacity: 0.05,
    },
  }
  if (gd.type === 'Circle' && gd.center && gd.edge) {
    const center = L.latLng(gd.center[1], gd.center[0])
    const edge = L.latLng(gd.edge[1], gd.edge[0])
    L.circle(center, {
      radius: haversineKm(center, edge) * 1000,
      color: '#f59e0b',
      weight: 2,
      dashArray: '8 6',
      fillColor: '#f59e0b',
      fillOpacity: 0.05,
    }).bindTooltip(selectedArea.value.name, { sticky: true }).addTo(drawMap)
  } else if (gd.type === 'Polygon') {
    L.geoJSON(gd, style).bindTooltip(selectedArea.value.name, { sticky: true }).addTo(drawMap)
  }
}

function fitDrawMapToArea() {
  const gd = selectedArea.value?.geoData
  if (!drawMap || !gd) return
  if (gd.type === 'Circle' && gd.center) {
    drawMap.setView([gd.center[1], gd.center[0]], 12)
    return
  }
  const boundsLayer = L.geoJSON(gd)
  drawMap.fitBounds(boundsLayer.getBounds(), { padding: [40, 40] })
}

function onDrawMapClick(e: L.LeafletMouseEvent) {
  const pts = drawPoints.value
  // 已有 >=3 个点 且 点击起点附近 → 闭合
  if (pts.length >= 3) {
    const dist = haversineKm(pts[0], e.latlng)
    if (dist < 0.5) {
      finishPolygon()
      return
    }
  }
  pts.push(e.latlng)
  drawPoints.value = [...pts]
  redrawPolygon()
  if (pts.length >= 3) {
    drawPolygonArea.value = polygonAreaKm2(pts)
  }
}

function onDrawMapDblClick() {
  if (drawPoints.value.length >= 3) finishPolygon()
}

function finishPolygon() {
  if (drawPoints.value.length < 3) return
  redrawPolygon()
  drawPolygonArea.value = polygonAreaKm2(drawPoints.value)
  // 禁止继续添加点
  drawMap?.off('click', onDrawMapClick)
  drawMap?.off('dblclick', onDrawMapDblClick)
}

function redrawPolygon() {
  if (!drawFeatureGroup) return
  drawFeatureGroup.clearLayers()
  const pts = drawPoints.value

  // 顶点标记
  pts.forEach((p, i) =>
    L.circleMarker(p, {
      radius: 5, color: '#409eff', fillColor: '#409eff', fillOpacity: 0.6,
    }).bindTooltip(String(i + 1), { permanent: false, direction: 'top' }).addTo(drawFeatureGroup!),
  )

  // 虚线连线
  if (pts.length >= 2) {
    L.polyline(pts as any, { color: '#409eff', weight: 2, dashArray: '6 4' }).addTo(drawFeatureGroup!)
  }

  // 填充面
  if (pts.length >= 3) {
    L.polygon(pts as any, {
      color: '#409eff', fillColor: '#409eff', fillOpacity: 0.15, weight: 2,
    }).addTo(drawFeatureGroup!)
  }
}

function fitDrawMapBounds() {
  if (!drawMap || drawPoints.value.length === 0) return
  const lats = drawPoints.value.map((p) => p.lat)
  const lngs = drawPoints.value.map((p) => p.lng)
  drawMap.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [40, 40] })
}

function undoLastPoint() {
  const pts = drawPoints.value
  if (pts.length === 0) return
  pts.pop()
  drawPoints.value = [...pts]
  redrawPolygon()
  drawPolygonArea.value = pts.length >= 3 ? polygonAreaKm2(pts) : 0
  // 恢复点击
  drawMap?.on('click', onDrawMapClick)
  drawMap?.on('dblclick', onDrawMapDblClick)
}

function clearDrawing() {
  drawPoints.value = []
  drawPolygonArea.value = 0
  drawFeatureGroup?.clearLayers()
  drawMap?.on('click', onDrawMapClick)
  drawMap?.on('dblclick', onDrawMapDblClick)
}

function cancelDraw() {
  drawDialogVisible.value = false
  if (drawMap) { drawMap.remove(); drawMap = null }
  drawFeatureGroup = null
}

function saveDraw() {
  if (drawPoints.value.length < 3) return
  const coords = drawPoints.value.map((p) => [p.lng, p.lat])
  coords.push([coords[0][0], coords[0][1]]) // 闭合

  form.geoData = { type: 'Polygon', coordinates: [coords] }
  formRef.value?.validateField('geoData')

  // 关闭绘制弹窗，回到编辑弹窗
  drawDialogVisible.value = false
  if (drawMap) { drawMap.remove(); drawMap = null }
  drawFeatureGroup = null

  // 编辑弹窗内渲染小地图
  nextTick(() => renderMiniMap())
}

// ========== 提交 / 状态 / 删除 ==========
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const data = {
      name: form.name,
      areaId: form.areaId,
      geoData: form.geoData,
      startDate: form.dateRange?.[0] || '',
      endDate: form.dateRange?.[1] || '',
      timeSlots: form.timeSlots.map(([start, end]: string[]) => ({ start, end })),
      repeatDays: form.repeatDays,
      shipTypes: form.shipTypes,
      tonnageMin: form.tonnageMin,
      tonnageMax: form.tonnageMax,
      sourceTypes: form.sourceTypes,
      priority: form.priority,
      alertLevel: form.alertLevel,
      status: 1,
    }
    if (isEditing.value && editingId.value) {
      await updateFenceRule(editingId.value, data)
      ElMessage.success('更新成功')
    } else {
      await addFenceRule(data)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadList()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleStatusChange(row: any, val: any) {
  try {
    await updateFenceRuleStatus(row.id, val)
    ElMessage.success(val === 1 ? '已启用' : '已禁用')
  } catch {
    row.status = val === 1 ? 0 : 1
    ElMessage.error('操作失败')
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确定删除该围栏规则吗？删除后不可恢复。', '确认删除', { type: 'warning' })
    await deleteFenceRule(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch { /* cancel */ }
}

async function showHitHistory(row: any) {
  try {
    const { data } = await getAlertEventList({ ruleName: row.name, page: 1, pageSize: 50 })
    hitHistoryData.value = (data as any)?.list || []
    hitDialogVisible.value = true
  } catch { /* ignore */ }
}

function resetForm() { formRef.value?.resetFields() }

onMounted(() => {
  loadList()
  loadAreaOptions()
})
</script>

<style lang="scss" scoped>
.filter-card {
  margin-bottom: 12px;
  :deep(.el-card__body) { padding: 12px 16px 4px; }
}
.table-card {
  :deep(.el-card__body) { padding: 16px; }
}
.table-header { margin-bottom: 12px; }
.fence-pagination { margin-top: 12px; display: flex; justify-content: center; }
.time-slot-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.text-muted { color: var(--el-text-color-secondary); }
.mx-2 { margin: 0 8px; }
.w-full { width: 100%; }

.area-info {
  margin-left: 12px;
  font-size: 13px;
  color: var(--el-color-primary);
  font-weight: 500;
}

.mini-map-container {
  width: 100%;
  height: 200px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  overflow: hidden;
}
</style>

<!-- 绘制弹窗（全屏，非 scoped） -->
<style lang="scss">
.draw-map-dialog {
  .el-dialog__body {
    padding: 0;
    display: flex;
    flex-direction: column;
    height: calc(100vh - 56px);
  }
}

.draw-map-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
  flex-shrink: 0;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toolbar-right .draw-hint {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

.draw-area-label {
  font-size: 13px;
  color: var(--el-color-primary);
  font-weight: 600;
  padding: 2px 10px;
  background: var(--el-color-primary-light-9);
  border-radius: 4px;
}

.area-boundary-label {
  font-size: 13px;
  color: #b45309;
  font-weight: 600;
  padding: 2px 10px;
  background: #fef3c7;
  border-radius: 4px;
}

.draw-map-container {
  flex: 1;
  min-height: 0;
}

.draw-map-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 12px 16px;
  border-top: 1px solid #e4e7ed;
  background: #fafafa;
  flex-shrink: 0;
}
</style>
