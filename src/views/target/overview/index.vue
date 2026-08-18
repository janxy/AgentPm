<template>
  <div class="target-overview-page">
    <div class="stats-row annot-target-overview-stats">
      <ElCard shadow="never" class="stat-card stat-total">
        <div class="stat-value">{{ targetStore.targetStats.total }}</div>
        <div class="stat-label">目标总数</div>
      </ElCard>
      <ElCard shadow="never" class="stat-card stat-followed">
        <div class="stat-value">{{ targetStore.targetStats.followed }}</div>
        <div class="stat-label">重点关注</div>
      </ElCard>
      <ElCard shadow="never" class="stat-card stat-pending">
        <div class="stat-value">{{ targetStore.targetStats.pending }}</div>
        <div class="stat-label">待人工确认</div>
      </ElCard>
      <ElCard shadow="never" class="stat-card stat-high">
        <div class="stat-value">{{ targetStore.targetStats.highRisk }}</div>
        <div class="stat-label">高风险</div>
      </ElCard>
    </div>

    <ElCard shadow="never" class="filter-card annot-target-overview-filter">
      <div class="filter-row">
        <ElInput v-model="filterForm.keyword" placeholder="关键字：MMSI/编号/Source ID" clearable class="filter-keyword" @keyup.enter="loadTargets" @clear="loadTargets" />
        <ElSelect v-model="filterForm.targetType" placeholder="目标类型" clearable class="filter-select">
          <ElOption v-for="(label, value) in TARGET_TYPE_LABELS" :key="value" :label="label" :value="value" />
        </ElSelect>
        <ElSelect v-model="filterForm.dataSource" placeholder="数据来源" clearable class="filter-select">
          <ElOption v-for="source in DATA_SOURCE_OPTIONS" :key="source" :label="source" :value="source" />
        </ElSelect>
        <ElSelect v-model="filterForm.riskLevel" placeholder="风险等级" clearable class="filter-select">
          <ElOption v-for="level in RISK_LEVEL_OPTIONS" :key="level.value" :label="level.label" :value="level.value" />
        </ElSelect>
        <ElDatePicker
          v-model="filterForm.timeRange"
          type="datetimerange"
          range-separator="-"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="filter-time"
        />
        <ElSelect v-model="filterForm.region" placeholder="区域范围" clearable class="filter-select">
          <ElOption v-for="region in REGION_OPTIONS" :key="region" :label="region" :value="region" />
        </ElSelect>
        <ElButton type="primary" :icon="Search" @click="loadTargets">查询</ElButton>
        <ElButton :icon="Refresh" @click="resetFilter">重置</ElButton>
        <div class="filter-spacer" />
        <ElButton v-roles="['值班员', '指挥员']" :icon="Download" @click="exportList('excel')">导出Excel</ElButton>
        <ElButton v-roles="['值班员', '指挥员']" :icon="Document" @click="exportList('csv')">导出CSV</ElButton>
        <ElButton v-roles="['指挥员', '运维管理员']" :icon="RefreshLeft" @click="resetDemoData">重置演示数据</ElButton>
      </div>
    </ElCard>

    <ElCard shadow="never" class="table-card annot-target-overview-table">
      <ElTable
        v-loading="loading"
        :data="targetStore.targetList"
        row-key="fusionId"
        border
        stripe
        class="target-table"
        empty-text="暂无目标数据"
        :default-sort="{ prop: 'updateTime', order: 'descending' }"
        @sort-change="handleSortChange"
      >
        <ElTableColumn label="目标名称" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="target-name-cell">
              <span class="target-name">{{ row.name }}</span>
              <span class="target-sub">{{ row.displayId || row.fusionId }}</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="目标类型" width="95" align="center">
          <template #default="{ row }">
            <ElTag :type="row.targetType === 'three_no' ? 'danger' : 'success'" size="small" disable-transitions>
              {{ TARGET_TYPE_LABELS[row.targetType] || row.targetType }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="MMSI/编号" width="140">
          <template #default="{ row }">
            <div>{{ row.mmsi || row.displayId }}</div>
            <div class="cell-sub">{{ row.sourceId ? `Source: ${row.sourceId}` : 'Source: -' }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="dataSource" label="数据来源" width="150" show-overflow-tooltip />
        <ElTableColumn prop="riskLevel" label="风险等级" width="100" align="center" sortable="custom">
          <template #default="{ row }">
            <ElTag :color="RISK_LEVEL_COLORS[row.riskLevel]" size="small" effect="dark" disable-transitions>
              {{ RISK_LEVEL_LABELS[row.riskLevel] || row.riskLevel }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="融合置信度" width="105" align="center">
          <template #default="{ row }">
            <span :class="['confidence', { 'confidence-low': row.confidence < 80 }]">{{ row.confidence }}%</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="120" align="center">
          <template #default="{ row }">
            <div class="status-tags">
              <ElTag v-if="row.followed" type="warning" size="small" disable-transitions>重点关注</ElTag>
              <ElTag v-if="row.confirmStatus === 'pending'" type="danger" size="small" effect="plain" disable-transitions>待人工确认</ElTag>
              <span v-if="!row.followed && row.confirmStatus !== 'pending'" class="status-normal">正常</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="speed" label="航速(节)" width="90" align="center" sortable="custom">
          <template #default="{ row }">{{ row.speed }}</template>
        </ElTableColumn>
        <ElTableColumn prop="heading" label="航向(°)" width="90" align="center">
          <template #default="{ row }">{{ row.heading }}</template>
        </ElTableColumn>
        <ElTableColumn prop="updateTime" label="更新时间" width="165" sortable="custom" />
        <ElTableColumn prop="distance" label="距离(km)" width="100" align="center" sortable="custom">
          <template #default="{ row }">{{ row.distance }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="140" align="center" fixed="right" class-name="annot-target-overview-actions">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openDetail(row)">详情</ElButton>
            <ElButton v-roles="['值班员', '指挥员']" link :type="row.followed ? 'warning' : 'primary'" @click="toggleFollow(row)">
              {{ row.followed ? '取消关注' : '关注' }}
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="targetStore.targetTotal"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        class="list-pagination annot-target-overview-pagination"
        @size-change="loadTargets"
        @current-change="loadTargets"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Download, Refresh, RefreshLeft, Search } from '@element-plus/icons-vue'
import { getTargetList } from '@/api/target'
import { useTargetStore } from '@/store/modules/target'
import { exportToExcel, ExcelColumn } from '@/utils/excel'
import { exportToCsv } from '@/utils/csv'
import {
  DATA_SOURCE_OPTIONS,
  REGION_OPTIONS,
  RISK_LEVEL_COLORS,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_OPTIONS,
  TARGET_TYPE_LABELS
} from '@/utils/target'

/**
 * 目标总览
 * 提供目标统计、组合筛选、多列排序、结果导出与关注等行内操作。
 */
defineOptions({ name: 'TargetOverview' })

const router = useRouter()
const targetStore = useTargetStore()
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const sortField = ref('updateTime')
const sortOrder = ref<'ascending' | 'descending'>('descending')

const filterForm = reactive({
  keyword: '',
  targetType: '',
  dataSource: '',
  riskLevel: '',
  timeRange: [] as string[],
  region: ''
})

function buildFilterParams() {
  const [startTime = '', endTime = ''] = filterForm.timeRange || []
  return {
    keyword: filterForm.keyword,
    targetType: filterForm.targetType,
    dataSource: filterForm.dataSource,
    riskLevel: filterForm.riskLevel,
    startTime,
    endTime,
    region: filterForm.region
  }
}

async function loadTargets() {
  loading.value = true
  try {
    await targetStore.loadTargets({
      ...buildFilterParams(),
      page: page.value,
      pageSize: pageSize.value,
      sortField: sortField.value,
      sortOrder: sortOrder.value
    })
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterForm.keyword = ''
  filterForm.targetType = ''
  filterForm.dataSource = ''
  filterForm.riskLevel = ''
  filterForm.timeRange = []
  filterForm.region = ''
  page.value = 1
  sortField.value = 'updateTime'
  sortOrder.value = 'descending'
  loadTargets()
}

function handleSortChange({ prop, order }: { prop: string; order: string | null }) {
  if (!prop || !order) return
  sortField.value = prop
  sortOrder.value = order as 'ascending' | 'descending'
  loadTargets()
}

async function toggleFollow(row: any) {
  const next = !row.followed
  await targetStore.updateAttentionRecord([row.fusionId], next)
  ElMessage.success(next ? '已加入重点关注' : '已取消重点关注')
  await loadTargets()
}

function openDetail(row: any) {
  router.push({ name: 'TargetDetail', params: { fusionId: row.fusionId } })
}

interface TargetExportRow {
  name: string
  mmsi: string
  displayId: string
  sourceId: string
  targetType: string
  dataSource: string
  riskLevel: string
  confidence: string
  status: string
  speed: number
  heading: number
  turnRate: number
  updateTime: string
  distance: number
  region: string
  tags: string
}

function buildExportRows(rows: any[]): TargetExportRow[] {
  return rows.map((row) => ({
    name: row.name,
    mmsi: String(row.mmsi || row.displayId),
    displayId: row.displayId,
    sourceId: String(row.sourceId || '-'),
    targetType: TARGET_TYPE_LABELS[row.targetType] || row.targetType,
    dataSource: row.dataSource,
    riskLevel: RISK_LEVEL_LABELS[row.riskLevel] || row.riskLevel,
    confidence: `${row.confidence}%`,
    status: [row.followed ? '重点关注' : '', row.confirmStatus === 'pending' ? '待人工确认' : ''].filter(Boolean).join('/') || '正常',
    speed: row.speed,
    heading: row.heading,
    turnRate: row.turnRate,
    updateTime: row.updateTime,
    distance: row.distance,
    region: row.region,
    tags: (row.tags || []).join('、')
  }))
}

const exportColumns: ExcelColumn<TargetExportRow>[] = [
  { header: '目标名称', field: 'name' },
  { header: 'MMSI', field: 'mmsi' },
  { header: '显示编号', field: 'displayId' },
  { header: 'Source ID', field: 'sourceId' },
  { header: '目标类型', field: 'targetType' },
  { header: '数据来源', field: 'dataSource' },
  { header: '风险等级', field: 'riskLevel' },
  { header: '融合置信度', field: 'confidence' },
  { header: '状态', field: 'status' },
  { header: '航速(节)', field: 'speed' },
  { header: '航向(°)', field: 'heading' },
  { header: '转向率', field: 'turnRate' },
  { header: '更新时间', field: 'updateTime' },
  { header: '距离(km)', field: 'distance' },
  { header: '区域', field: 'region' },
  { header: '标签', field: 'tags' }
]

async function exportList(type: 'excel' | 'csv') {
  if (!targetStore.targetTotal) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  const { data } = await getTargetList({
    ...buildFilterParams(),
    page: 1,
    pageSize: 1000,
    sortField: sortField.value,
    sortOrder: sortOrder.value
  })
  const rows = buildExportRows((data as any)?.list || [])
  const fileName = `目标总览-${fileTime()}`
  if (type === 'excel') {
    exportToExcel(exportColumns, rows, fileName, '目标总览')
  } else {
    exportToCsv(exportColumns, rows, fileName)
  }
  ElMessage.success(`已导出 ${rows.length} 条目标`)
}

async function resetDemoData() {
  try {
    await ElMessageBox.confirm('重置后关注、标签与风险状态将恢复为初始演示数据，是否继续？', '重置演示数据', { type: 'warning' })
  } catch {
    return
  }
  await targetStore.resetDemoData()
  await loadTargets()
  ElMessage.success('演示数据已重置')
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function fileTime() {
  const now = new Date()
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
}

onMounted(async () => {
  await Promise.all([targetStore.loadTargetStats(), loadTargets()])
})
</script>

<style lang="scss" scoped>
.target-overview-page {
  padding: 4px;
}
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.stat-card {
  :deep(.el-card__body) {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 16px 20px;
  }
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
  }
  .stat-label {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}
.stat-total .stat-value { color: var(--el-color-primary); }
.stat-followed .stat-value { color: var(--el-color-warning); }
.stat-pending .stat-value { color: var(--el-color-danger); }
.stat-high .stat-value { color: #d46b08; }
.filter-card {
  margin-bottom: 12px;
  :deep(.el-card__body) { padding: 12px 16px; }
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.filter-keyword { width: 220px; }
.filter-select { width: 130px; }
.filter-time { width: 330px; }
.filter-spacer { flex: 1; }
.table-card :deep(.el-card__body) { padding: 16px; }
.target-name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.target-name { font-weight: 600; }
.target-sub, .cell-sub { color: var(--el-text-color-secondary); font-size: 12px; }
.confidence { font-weight: 600; }
.confidence-low { color: var(--el-color-danger); }
.status-tags { display: flex; flex-direction: column; gap: 4px; align-items: center; }
.status-normal { color: var(--el-text-color-secondary); }
.list-pagination { margin-top: 12px; display: flex; justify-content: flex-end; }
</style>
