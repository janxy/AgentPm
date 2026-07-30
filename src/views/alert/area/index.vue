<template>
  <div class="area-manage-page">
    <!-- 筛选区 -->
    <ElCard shadow="never" class="filter-card">
      <ElForm :inline="true" :model="filterForm" class="annot-alert-area-filter">
        <ElFormItem label="区域名称">
          <ElInput v-model="filterForm.name" placeholder="输入区域名称" clearable class="annot-alert-area-filter-name" />
        </ElFormItem>
        <ElFormItem label="区域类型">
          <ElSelect v-model="filterForm.type" placeholder="全部" clearable class="annot-alert-area-filter-type">
            <ElOption label="重点区域" value="重点区域" />
            <ElOption label="禁入区域" value="禁入区域" />
            <ElOption label="巡检区域" value="巡检区域" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="filterForm.status" placeholder="全部" clearable class="annot-alert-area-filter-status">
            <ElOption label="生效" :value="1" />
            <ElOption label="待审批" :value="0" />
            <ElOption label="已失效" :value="2" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" :icon="Search" @click="handleSearch" class="annot-alert-area-filter-search">搜索</ElButton>
          <ElButton @click="handleReset" class="annot-alert-area-filter-reset">重置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <!-- 操作栏 + 表格 -->
    <ElCard shadow="never" class="table-card">
      <div class="table-header">
        <ElButton type="primary" :icon="Plus" @click="handleAdd" class="annot-alert-area-action-add">新增</ElButton>
        <ElButton v-if="pendingCount > 0" :icon="Bell" @click="showApprovalDialog = true" class="annot-alert-area-action-approval">
          审批({{ pendingCount }})
        </ElButton>
      </div>
      <ElTable v-loading="loading" :data="tableData" row-key="id" class="area-table annot-alert-area-table">
        <ElTableColumn prop="name" label="区域名称" min-width="140" />
        <ElTableColumn label="类型" width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="typeTagMap[row.type]" size="small" disable-transitions>{{ row.type }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="有效期" min-width="200">
          <template #default="{ row }">{{ row.startDate || '-' }} 至 {{ row.endDate || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="90" align="center">
          <template #default="{ row }">
            <ElTag :type="statusTagMap[row.status]?.tagType" size="small" disable-transitions>
              {{ statusTagMap[row.status]?.label }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="handleEdit(row)">编辑</ElButton>
            <ElButton link type="primary" @click="openBindDialog(row)">绑定规则</ElButton>
            <ElButton link type="danger" @click="handleDelete(row)" class="annot-alert-area-table-delete">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadAreaList"
        @current-change="loadAreaList"
        class="area-pagination annot-alert-area-pagination"
      />
    </ElCard>

    <!-- 新增/编辑弹窗 -->
    <ElDialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑区域' : '新增区域'"
      width="600px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <ElFormItem label="区域名称" prop="name">
          <ElInput v-model="form.name" placeholder="2-50字" maxlength="50" class="annot-alert-area-form-name" />
        </ElFormItem>
        <ElFormItem label="区域类型" prop="type">
          <ElSelect v-model="form.type" placeholder="请选择区域类型" class="annot-alert-area-form-type">
            <ElOption label="重点区域" value="重点区域" />
            <ElOption label="禁入区域" value="禁入区域" />
            <ElOption label="巡检区域" value="巡检区域" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="有效期" prop="dateRange">
          <ElDatePicker
            v-model="form.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="w-full annot-alert-area-form-date"
          />
        </ElFormItem>
        <ElFormItem label="负责人">
          <ElInput v-model="form.managerName" placeholder="选填" class="annot-alert-area-form-manager" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="form.remark" type="textarea" placeholder="不超过200字" maxlength="200" :rows="3" class="annot-alert-area-form-remark" />
        </ElFormItem>

        <!-- 区域范围绘制 -->
        <ElFormItem label="区域范围" prop="geoData">
          <ElButton type="primary" :icon="Edit" @click="openDrawDialog" class="annot-alert-area-form-draw">绘制区域</ElButton>
          <span v-if="form.geoData" class="geo-info">
            {{ formatGeoInfo(form.geoData) }}
          </span>
        </ElFormItem>
        <!-- 小地图预览 -->
        <ElFormItem v-if="form.geoData" label="">
          <div ref="miniMapContainer" class="mini-map-container annot-alert-area-form-minimap"></div>
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
      title="绘制区域"
      fullscreen
      :close-on-click-modal="false"
      :show-close="false"
      class="draw-map-dialog"
    >
      <div class="draw-map-toolbar">
        <div class="toolbar-left">
          <ElButtonGroup size="small">
            <ElButton :type="drawMode === 'point' ? 'primary' : ''" @click="setDrawMode('point')" class="annot-alert-area-draw-point">绘点</ElButton>
            <ElButton :type="drawMode === 'line' ? 'primary' : ''" @click="setDrawMode('line')" class="annot-alert-area-draw-line">绘线</ElButton>
            <ElButton :type="drawMode === 'polygon' ? 'primary' : ''" @click="setDrawMode('polygon')" class="annot-alert-area-draw-polygon">绘面</ElButton>
          </ElButtonGroup>
          <ElButton size="small" @click="importBoundaryFile" class="annot-alert-area-draw-import">导入边界文件</ElButton>
          <input ref="fileInput" type="file" accept=".geojson,.kml,.json" style="display:none" @change="handleFileImport" />
          <ElButton size="small" @click="undoLast" :disabled="drawPoints.length === 0" class="annot-alert-area-draw-undo">撤销</ElButton>
          <ElButton size="small" @click="clearDrawData" class="annot-alert-area-draw-clear">清除</ElButton>
          <span v-if="drawAreaInfo" class="draw-info-label annot-alert-area-draw-info">{{ drawAreaInfo }}</span>
        </div>
        <div class="toolbar-right">
          <ElSelect v-model="baseMapType" size="small" class="map-type-select annot-alert-area-draw-basemap">
            <ElOption label="矢量地图" value="vector" />
            <ElOption label="卫星影像" value="satellite" />
          </ElSelect>
        </div>
      </div>
      <div ref="fullMapContainer" class="full-map-container annot-alert-area-draw-map"></div>
      <div class="draw-map-footer">
        <ElButton @click="cancelDraw" class="annot-alert-area-draw-cancel">取消</ElButton>
        <ElButton type="primary" :disabled="!canSaveDraw" @click="saveDraw" class="annot-alert-area-draw-save">保存区域</ElButton>
      </div>
    </ElDialog>

    <!-- 绑定规则弹窗 -->
    <ElDialog v-model="bindDialogVisible" title="绑定预警规则" width="560px">
      <ElCheckboxGroup v-model="bindForm.ruleIds" class="annot-alert-area-bind-rules">
        <div v-for="rule in fenceRules" :key="rule.id" class="bind-rule-item">
          <ElCheckbox :value="rule.id">{{ rule.name }}</ElCheckbox>
          <ElSelect
            v-if="bindForm.ruleIds.includes(rule.id)"
            v-model="bindForm.levels[rule.id]"
            placeholder="触发等级"
            size="small"
            class="bind-level-select annot-alert-area-bind-level"
          >
            <ElOption label="提示" value="tip" />
            <ElOption label="一般" value="normal" />
            <ElOption label="重要" value="important" />
            <ElOption label="紧急" value="urgent" />
          </ElSelect>
        </div>
      </ElCheckboxGroup>
      <div v-if="fenceRules.length === 0" class="bind-empty">暂无可用围栏规则</div>
      <template #footer>
        <ElButton @click="bindDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="saveBindRules" class="annot-alert-area-bind-save">保存</ElButton>
      </template>
    </ElDialog>

    <!-- 审批弹窗 -->
    <ElDialog v-model="showApprovalDialog" title="区域变更审批" width="800px">
      <ElTable :data="approvalList" v-loading="approvalLoading" class="annot-alert-area-approval-table">
        <ElTableColumn prop="areaName" label="区域名称" width="140" />
        <ElTableColumn label="变更内容" min-width="280">
          <template #default="{ row }">
            <div class="approval-compare">
              <span class="approval-before">{{ row.before?.name }} / {{ row.before?.type }}</span>
              <span class="approval-arrow">→</span>
              <span class="approval-after">{{ row.after?.name }} / {{ row.after?.type }}</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="submitter" label="提交人" width="100" />
        <ElTableColumn prop="submitTime" label="提交时间" width="180" />
        <ElTableColumn label="操作" width="180" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <ElButton link type="success" @click="handleApprove(row, 'approved')" class="annot-alert-area-approval-pass">通过</ElButton>
              <ElButton link type="danger" @click="handleApprove(row, 'rejected')" class="annot-alert-area-approval-reject">驳回</ElButton>
            </template>
            <ElTag v-else :type="row.status === 'approved' ? 'success' : 'danger'" size="small">
              {{ row.status === 'approved' ? '已通过' : '已驳回' }}
            </ElTag>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus, Bell, Edit } from '@element-plus/icons-vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  getAreaList, addArea, updateArea, deleteArea,
  getApprovalList, approveArea, getFenceRulesAll
} from '@/api/alert'

defineOptions({ name: 'AlertArea' })

// ---- 常量 ----
const typeTagMap: Record<string, 'warning' | 'danger' | 'primary'> = { '重点区域': 'warning', '禁入区域': 'danger', '巡检区域': 'primary' }
const statusTagMap: Record<number, { tagType: 'warning' | 'success' | 'info' | 'danger'; label: string }> = {
  0: { tagType: 'warning', label: '待审批' },
  1: { tagType: 'success', label: '生效' },
  2: { tagType: 'info', label: '已失效' },
}
const tileUrl = 'https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=5f23a6c8375bf184bbd6f8fa9d552029'
const satelliteUrl = 'https://t{s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=5f23a6c8375bf184bbd6f8fa9d552029'

// ---- 表格筛选 ----
const filterForm = reactive({ name: '', type: '', status: '' as number | string })
const loading = ref(false)
const tableData = ref<any[]>([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

// ---- 编辑弹窗 ----
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<any>({
  name: '', type: '重点区域', dateRange: [] as string[],
  managerName: '', remark: '', geoData: null as any,
})

const validateGeoData = (_rule: any, _value: any, callback: any) => {
  if (!form.geoData) callback(new Error('请绘制区域范围'))
  else callback()
}

const formRules: FormRules = {
  name: [{ required: true, message: '请输入区域名称', trigger: 'blur' }, { min: 2, max: 50, message: '2-50字', trigger: 'blur' }],
  type: [{ required: true, message: '请选择区域类型', trigger: 'change' }],
  dateRange: [{ required: true, message: '请选择有效期', trigger: 'change' }],
  geoData: [{ required: true, validator: validateGeoData, trigger: 'change' }],
}

// ---- 绘制弹窗 ----
const drawDialogVisible = ref(false)
const fullMapContainer = ref<HTMLDivElement>()
let fullMap: L.Map | null = null
let drawFeatureGroup: L.FeatureGroup | null = null
let currentTileLayer: L.TileLayer | null = null
const drawMode = ref('polygon')
const drawPoints = ref<L.LatLng[]>([])
const drawAreaInfo = ref('')
const baseMapType = ref('vector')
const fileInput = ref<HTMLInputElement>()
const canSaveDraw = ref(false)

// ---- 小地图 ----
const miniMapContainer = ref<HTMLDivElement>()
let miniMap: L.Map | null = null

// ---- 绑定规则 ----
const bindDialogVisible = ref(false)
const bindAreaId = ref<number | null>(null)
const fenceRules = ref<any[]>([])
const bindForm = reactive<{ ruleIds: number[]; levels: Record<number, string> }>({ ruleIds: [], levels: {} })

// ---- 审批 ----
const showApprovalDialog = ref(false)
const approvalList = ref<any[]>([])
const approvalLoading = ref(false)
const pendingCount = ref(0)

// ========== 格式化 ==========
function formatGeoInfo(geoData: any): string {
  if (!geoData) return ''
  if (geoData.type === 'Point') return '点位：' + geoData.coordinates.join(', ')
  if (geoData.type === 'LineString') return `线段：${geoData.coordinates.length} 个顶点`
  if (geoData.type === 'Polygon') {
    const ring = geoData.coordinates[0]
    const pts = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
      ? ring.slice(0, -1) : ring
    const area = polygonAreaKm2(pts.map((c: number[]) => L.latLng(c[1], c[0])))
    if (area < 0.01) return `多边形：${(area * 1_000_000).toFixed(0)} m²`
    return `多边形：${area.toFixed(2)} km²`
  }
  return '已绘制'
}

function polygonAreaKm2(points: L.LatLng[]): number {
  if (points.length < 3) return 0
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += toRad(points[j].lng - points[i].lng) *
      (2 + Math.sin(toRad(points[i].lat)) + Math.sin(toRad(points[j].lat)))
  }
  return Math.abs((area * R * R) / 2)
}

// ========== 列表加载 ==========
async function loadAreaList() {
  loading.value = true
  try {
    const { data } = await getAreaList({
      name: filterForm.name, type: filterForm.type,
      status: filterForm.status === '' ? undefined : filterForm.status,
      page: pagination.page, pageSize: pagination.pageSize,
    })
    tableData.value = (data as any)?.list || []
    pagination.total = (data as any)?.pagination?.total || 0
  } finally { loading.value = false }
}

function handleSearch() { pagination.page = 1; loadAreaList() }
function handleReset() { filterForm.name = ''; filterForm.type = ''; filterForm.status = ''; pagination.page = 1; loadAreaList() }

// ========== 编辑弹窗 ==========
function handleAdd() {
  isEditing.value = false; editingId.value = null
  form.name = ''; form.type = '重点区域'; form.dateRange = []
  form.managerName = ''; form.remark = ''; form.geoData = null
  destroyMiniMap()
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEditing.value = true; editingId.value = row.id
  form.name = row.name; form.type = row.type
  form.dateRange = [row.startDate, row.endDate]
  form.managerName = row.managerName || ''; form.remark = row.remark || ''
  form.geoData = row.geoData ? JSON.parse(JSON.stringify(row.geoData)) : null
  destroyMiniMap()
  dialogVisible.value = true
  nextTick(() => renderMiniMap())
}

watch(dialogVisible, (val) => { if (!val) destroyMiniMap() })

// ========== 小地图预览 ==========
function destroyMiniMap() {
  if (miniMap) { miniMap.remove(); miniMap = null }
}

function renderMiniMap() {
  if (!miniMapContainer.value || !form.geoData) return
  destroyMiniMap()
  miniMap = L.map(miniMapContainer.value, {
    attributionControl: false, zoomControl: false,
    dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
  }).setView([30, 122], 10)
  L.tileLayer(tileUrl, { maxZoom: 18, subdomains: ['0','1','2','3','4','5','6','7'] }).addTo(miniMap)
  addGeoToMap(miniMap, form.geoData)
  fitGeoBounds(miniMap, form.geoData)
}

function addGeoToMap(map: L.Map, gd: any) {
  if (gd.type === 'Point') {
    L.circleMarker([gd.coordinates[1], gd.coordinates[0]], {
      radius: 8, color: '#409eff', fillColor: '#409eff', fillOpacity: 0.4,
    }).addTo(map)
  } else if (gd.type === 'LineString') {
    const pts = gd.coordinates.map((c: number[]) => [c[1], c[0]])
    L.polyline(pts as any, { color: '#409eff', weight: 3 }).addTo(map)
  } else if (gd.type === 'Polygon') {
    const pts = gd.coordinates[0].map((c: number[]) => [c[1], c[0]])
    L.polygon(pts as any, {
      color: '#409eff', fillColor: '#409eff', fillOpacity: 0.2, weight: 2,
    }).addTo(map)
  }
}

function fitGeoBounds(map: L.Map, gd: any) {
  if (gd.type === 'Point') {
    map.setView([gd.coordinates[1], gd.coordinates[0]], 14)
  } else if (gd.type === 'LineString') {
    const lats = gd.coordinates.map((c: number[]) => c[1])
    const lngs = gd.coordinates.map((c: number[]) => c[0])
    map.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [20, 20] })
  } else if (gd.type === 'Polygon') {
    const ring = gd.coordinates[0]
    const lats = ring.map((c: number[]) => c[1])
    const lngs = ring.map((c: number[]) => c[0])
    map.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [20, 20] })
  }
}

// ========== 绘制弹窗 ==========
function openDrawDialog() {
  drawDialogVisible.value = true
  drawPoints.value = []
  drawAreaInfo.value = ''
  drawMode.value = 'polygon'
  canSaveDraw.value = false
  nextTick(() => initFullMap())
}

function initFullMap() {
  if (!fullMapContainer.value) return
  if (fullMap) { fullMap.remove(); fullMap = null }
  drawFeatureGroup = null

  fullMap = L.map(fullMapContainer.value).setView([30, 122], 7)
  switchBaseMap()
  drawFeatureGroup = L.featureGroup().addTo(fullMap)

  // 编辑模式：回显已有区域
  if (form.geoData) {
    addGeoToMap(fullMap, form.geoData)
    fitGeoBounds(fullMap, form.geoData)
    canSaveDraw.value = true
    // 加载点到 drawPoints（仅对 polygon 回显）
    if (form.geoData.type === 'Polygon') {
      const ring = form.geoData.coordinates[0]
      const pts = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
        ? ring.slice(0, -1) : ring
      drawPoints.value = pts.map((c: number[]) => L.latLng(c[1], c[0]))
      drawMode.value = 'polygon'
      redrawFullPreview()
      drawAreaInfo.value = `面积：${polygonAreaKm2(drawPoints.value).toFixed(2)} km²`
    } else if (form.geoData.type === 'LineString') {
      drawMode.value = 'line'
      drawPoints.value = form.geoData.coordinates.map((c: number[]) => L.latLng(c[1], c[0]))
      redrawFullPreview()
      drawAreaInfo.value = `线段：${drawPoints.value.length} 个顶点`
    } else if (form.geoData.type === 'Point') {
      drawMode.value = 'point'
      drawPoints.value = [L.latLng(form.geoData.coordinates[1], form.geoData.coordinates[0])]
      redrawFullPreview()
    }
  }

  fullMap.on('click', onFullMapClick)
  fullMap.on('dblclick', onFullMapDblClick)
  setTimeout(() => fullMap?.invalidateSize(), 100)
}

function switchBaseMap() {
  if (!fullMap) return
  if (currentTileLayer) { fullMap.removeLayer(currentTileLayer) }
  currentTileLayer = L.tileLayer(
    baseMapType.value === 'satellite' ? satelliteUrl : tileUrl,
    { maxZoom: 18, subdomains: ['0','1','2','3','4','5','6','7'] }
  ).addTo(fullMap)
}

watch(baseMapType, () => switchBaseMap())

function setDrawMode(mode: string) {
  drawMode.value = mode
  drawPoints.value = []
  drawAreaInfo.value = ''
  canSaveDraw.value = false
  drawFeatureGroup?.clearLayers()
  // 重新监听（finishPolygon 后取消了）
  fullMap?.on('click', onFullMapClick)
  fullMap?.on('dblclick', onFullMapDblClick)
}

function onFullMapClick(e: L.LeafletMouseEvent) {
  const pts = drawPoints.value
  if (drawMode.value === 'point') {
    drawPoints.value = [e.latlng]
    canSaveDraw.value = true
    drawAreaInfo.value = `坐标：${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`
    redrawFullPreview()
    return
  }

  if (drawMode.value === 'polygon' && pts.length >= 3) {
    const dist = haversineKm(pts[0], e.latlng)
    if (dist < 0.5) { finishPolygon(); return }
  }

  pts.push(e.latlng)
  drawPoints.value = [...pts]
  redrawFullPreview()

  if (drawMode.value === 'line' && pts.length >= 2) {
    canSaveDraw.value = true
    drawAreaInfo.value = `线段：${pts.length} 个顶点`
  }
  if (drawMode.value === 'polygon' && pts.length >= 3) {
    canSaveDraw.value = true
    drawAreaInfo.value = `面积：${polygonAreaKm2(pts).toFixed(2)} km²`
  }
}

function onFullMapDblClick() {
  if (drawMode.value === 'polygon' && drawPoints.value.length >= 3) finishPolygon()
}

function finishPolygon() {
  if (drawPoints.value.length < 3) return
  redrawFullPreview()
  drawAreaInfo.value = `面积：${polygonAreaKm2(drawPoints.value).toFixed(2)} km²`
  canSaveDraw.value = true
  fullMap?.off('click', onFullMapClick)
  fullMap?.off('dblclick', onFullMapDblClick)
}

function redrawFullPreview() {
  if (!drawFeatureGroup) return
  drawFeatureGroup.clearLayers()
  const pts = drawPoints.value

  if (drawMode.value === 'point' && pts.length > 0) {
    L.circleMarker(pts[0], {
      radius: 8, color: '#409eff', fillColor: '#409eff', fillOpacity: 0.4,
    }).addTo(drawFeatureGroup!)
    return
  }

  if (pts.length >= 2) {
    L.polyline(pts as any, {
      color: '#409eff', weight: 2,
      dashArray: drawMode.value === 'polygon' ? '6 4' : undefined,
    }).addTo(drawFeatureGroup!)
  }

  pts.forEach((p, i) =>
    L.circleMarker(p, {
      radius: 5, color: '#409eff', fillColor: '#409eff', fillOpacity: 0.6,
    }).bindTooltip(String(i + 1), { direction: 'top' }).addTo(drawFeatureGroup!),
  )

  if (drawMode.value === 'polygon' && pts.length >= 3) {
    L.polygon(pts as any, {
      color: '#409eff', fillColor: '#409eff', fillOpacity: 0.15, weight: 2,
    }).addTo(drawFeatureGroup!)
  }
}

function haversineKm(p1: L.LatLng, p2: L.LatLng): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(p2.lat - p1.lat)
  const dLng = toRad(p2.lng - p1.lng)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function undoLast() {
  const pts = drawPoints.value
  if (pts.length === 0) return
  pts.pop()
  drawPoints.value = [...pts]
  redrawFullPreview()
  canSaveDraw.value = drawMode.value === 'point' ? pts.length > 0
    : drawMode.value === 'line' ? pts.length >= 2
    : pts.length >= 3
  if (canSaveDraw.value && drawMode.value === 'polygon') {
    drawAreaInfo.value = `面积：${polygonAreaKm2(pts).toFixed(2)} km²`
  } else if (canSaveDraw.value && drawMode.value === 'line') {
    drawAreaInfo.value = `线段：${pts.length} 个顶点`
  } else {
    drawAreaInfo.value = ''
  }
  fullMap?.on('click', onFullMapClick)
  fullMap?.on('dblclick', onFullMapDblClick)
}

function clearDrawData() {
  drawPoints.value = []
  drawAreaInfo.value = ''
  canSaveDraw.value = false
  drawFeatureGroup?.clearLayers()
  fullMap?.on('click', onFullMapClick)
  fullMap?.on('dblclick', onFullMapDblClick)
}

function importBoundaryFile() {
  fileInput.value?.dispatchEvent(new MouseEvent('click'))
}

function handleFileImport(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const geojson = JSON.parse(ev.target?.result as string)
      if (!fullMap) return
      drawFeatureGroup?.clearLayers()
      const layer = L.geoJSON(geojson, {
        style: { color: '#409eff', fillColor: '#409eff', fillOpacity: 0.2, weight: 2 },
      })
      layer.addTo(drawFeatureGroup!)
      fullMap.fitBounds(layer.getBounds(), { padding: [50, 50] })
      canSaveDraw.value = true
      drawAreaInfo.value = '已导入'
      // 存储导入的 GeoJSON
      form.geoData = geojson.type === 'FeatureCollection'
        ? geojson.features[0]?.geometry
        : geojson
    } catch {
      ElMessage.error('文件格式错误，仅支持 GeoJSON')
    }
  }
  reader.readAsText(file)
  input.value = ''
}

function cancelDraw() {
  drawDialogVisible.value = false
  if (fullMap) { fullMap.remove(); fullMap = null }
  drawFeatureGroup = null
  currentTileLayer = null
}

function saveDraw() {
  if (!canSaveDraw.value) return

  const pts = drawPoints.value
  if (drawMode.value === 'point' && pts.length > 0) {
    form.geoData = { type: 'Point', coordinates: [pts[0].lng, pts[0].lat] }
  } else if (drawMode.value === 'line' && pts.length >= 2) {
    const coords = pts.map((p) => [p.lng, p.lat])
    form.geoData = { type: 'LineString', coordinates: coords }
  } else if (drawMode.value === 'polygon' && pts.length >= 3) {
    const coords = pts.map((p) => [p.lng, p.lat])
    coords.push([coords[0][0], coords[0][1]])
    form.geoData = { type: 'Polygon', coordinates: [coords] }
  }

  formRef.value?.validateField('geoData')
  drawDialogVisible.value = false
  if (fullMap) { fullMap.remove(); fullMap = null }
  drawFeatureGroup = null
  currentTileLayer = null
  nextTick(() => renderMiniMap())
}

// ========== 提交 ==========
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const data: any = {
      name: form.name, type: form.type,
      startDate: form.dateRange[0], endDate: form.dateRange[1],
      managerName: form.managerName, remark: form.remark,
      geoData: form.geoData,
    }
    if (isEditing.value && editingId.value) {
      await updateArea(editingId.value, data)
      ElMessage.success('已提交审批')
    } else {
      await addArea(data)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadAreaList(); loadApprovalList()
  } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false }
}

// ========== 绑定规则 ==========
function openBindDialog(row: any) {
  bindAreaId.value = row.id
  bindForm.ruleIds = (row.bindRules || []).map((r: any) => r.ruleId)
  bindForm.levels = {}
  ;(row.bindRules || []).forEach((r: any) => { bindForm.levels[r.ruleId] = r.level || 'normal' })
  bindDialogVisible.value = true
}

async function saveBindRules() {
  try {
    await updateArea(bindAreaId.value!, {
      bindRules: bindForm.ruleIds.map((id) => ({
        ruleId: id,
        ruleName: fenceRules.value.find((r: any) => r.id === id)?.name || '',
        level: bindForm.levels[id] || 'normal',
        notifyChannels: ['弹窗'],
      })),
    })
    ElMessage.success('绑定成功')
    bindDialogVisible.value = false; loadAreaList()
  } catch { ElMessage.error('绑定失败') }
}

// ========== 删除 / 审批 ==========
async function handleDelete(row: any) {
  const hasBind = (row.bindRules || []).length > 0
  try {
    if (hasBind) {
      await ElMessageBox.confirm(
        `该区域已被 ${row.bindRules.length} 条规则关联，删除后关联规则将失效，确定删除？`,
        '警告', { type: 'warning', confirmButtonText: '确定删除' },
      )
    } else {
      await ElMessageBox.confirm('确定删除该区域吗？删除后不可恢复。', '确认删除', { type: 'warning' })
    }
    await deleteArea(row.id)
    ElMessage.success('删除成功'); loadAreaList()
  } catch { /* cancel */ }
}

async function loadApprovalList() {
  approvalLoading.value = true
  try {
    const { data } = await getApprovalList()
    approvalList.value = (data as any)?.list || []
    pendingCount.value = approvalList.value.filter((a: any) => a.status === 'pending').length
  } finally { approvalLoading.value = false }
}

async function handleApprove(row: any, result: string) {
  try {
    await approveArea(row.id, result)
    ElMessage.success(result === 'approved' ? '审批通过' : '已驳回')
    loadAreaList(); loadApprovalList()
  } catch { ElMessage.error('操作失败') }
}

// ========== 生命周期 ==========
async function loadFenceRules() {
  try { const { data } = await getFenceRulesAll(); fenceRules.value = (data as any) || [] } catch { /* ignore */ }
}

function resetForm() {
  formRef.value?.resetFields()
  destroyMiniMap()
}

onMounted(() => {
  loadAreaList()
  loadFenceRules()
  loadApprovalList()
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
.table-header {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}
.area-table {
  :deep(.el-table__body tr) { cursor: default; }
}
.area-pagination {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}
.w-full { width: 100%; }

.geo-info {
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

.bind-rule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.bind-level-select { width: 100px; }
.bind-empty {
  padding: 40px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.approval-compare {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.approval-before { color: var(--el-color-danger); text-decoration: line-through; }
.approval-after { color: var(--el-color-success); font-weight: 500; }
.approval-arrow { color: var(--el-text-color-secondary); }
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
  .toolbar-right {
    display: flex;
    align-items: center;
  }
}

.draw-info-label {
  font-size: 13px;
  color: var(--el-color-primary);
  font-weight: 600;
  padding: 2px 10px;
  background: var(--el-color-primary-light-9);
  border-radius: 4px;
}

.map-type-select { width: 100px; }

.full-map-container {
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
