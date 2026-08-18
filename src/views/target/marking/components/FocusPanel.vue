<template>
  <div class="focus-panel annot-target-marking-focus">
    <ElCard shadow="never" class="filter-card annot-target-marking-focus-filter">
      <div class="filter-row">
        <ElSelect v-model="filterForm.riskLevel" placeholder="风险等级" clearable class="filter-select">
          <ElOption v-for="level in RISK_LEVEL_OPTIONS" :key="level.value" :label="level.label" :value="level.value" />
        </ElSelect>
        <ElSelect v-model="filterForm.tag" placeholder="目标标签" clearable class="filter-select">
          <ElOption v-for="tag in targetStore.tags" :key="tag.id" :label="tag.name" :value="tag.name" />
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
        <ElButton type="primary" :icon="Search" @click="loadFocusList">查询</ElButton>
        <ElButton :icon="Refresh" @click="resetFilter">重置</ElButton>
        <div class="filter-spacer" />
        <ElButton v-roles="['值班员', '指挥员']" :icon="Download" @click="exportFocusList('excel')">导出Excel</ElButton>
        <ElButton v-roles="['值班员', '指挥员']" :icon="Document" @click="exportFocusList('csv')">导出CSV</ElButton>
      </div>
    </ElCard>

    <ElCard shadow="never" class="table-card annot-target-marking-focus-table">
      <div class="table-header">
        <span class="table-title">重点关注列表</span>
        <div class="batch-bar">
          <span v-if="selectedRows.length" class="selected-tip">已选 {{ selectedRows.length }} 条</span>
          <ElButton v-roles="['值班员', '指挥员']" size="small" type="danger" plain :disabled="!selectedRows.length" @click="batchUnfollow">
            批量取消关注
          </ElButton>
        </div>
      </div>
      <ElTable
        v-loading="loading"
        :data="targetStore.focusList"
        row-key="fusionId"
        border
        stripe
        class="focus-table"
        empty-text="暂无重点关注目标"
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn type="selection" width="46" />
        <ElTableColumn label="目标名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="target-name-cell">
              <span class="target-name">{{ row.name }}</span>
              <span class="target-sub">{{ row.displayId || row.fusionId }}</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="MMSI/编号" width="150">
          <template #default="{ row }">
            <div>{{ row.mmsi || row.displayId }}</div>
            <div class="cell-sub">{{ row.sourceId ? `Source: ${row.sourceId}` : 'Source: -' }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="目标类型" width="95" align="center">
          <template #default="{ row }">
            <ElTag :type="row.targetType === 'three_no' ? 'danger' : 'success'" size="small" disable-transitions>
              {{ TARGET_TYPE_LABELS[row.targetType] || row.targetType }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="dataSource" label="数据来源" width="150" show-overflow-tooltip />
        <ElTableColumn label="风险等级" width="100" align="center">
          <template #default="{ row }">
            <ElTag :color="RISK_LEVEL_COLORS[row.riskLevel]" size="small" effect="dark" disable-transitions>
              {{ RISK_LEVEL_LABELS[row.riskLevel] || row.riskLevel }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="标签" min-width="140">
          <template #default="{ row }">
            <div class="tag-list">
              <ElTag v-for="tag in row.tags || []" :key="tag" size="small" type="info" effect="plain" disable-transitions>{{ tag }}</ElTag>
              <span v-if="!row.tags?.length" class="cell-empty">-</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="followTime" label="关注时间" width="165" />
        <ElTableColumn label="操作" width="150" align="center" fixed="right" class-name="annot-target-marking-focus-actions">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openDetail(row)">详情</ElButton>
            <ElButton v-roles="['值班员', '指挥员']" link type="warning" @click="unfollow(row)">取消关注</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="targetStore.focusTotal"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        class="list-pagination"
        @size-change="loadFocusList"
        @current-change="loadFocusList"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Download, Refresh, Search } from '@element-plus/icons-vue'
import { getFocusList } from '@/api/target'
import { useTargetStore } from '@/store/modules/target'
import { exportToCsv } from '@/utils/csv'
import { exportToExcel, ExcelColumn } from '@/utils/excel'
import { RISK_LEVEL_COLORS, RISK_LEVEL_LABELS, RISK_LEVEL_OPTIONS, TARGET_TYPE_LABELS } from '@/utils/target'

/**
 * 目标标注-重点关注
 * 筛选、批量取消关注、详情跳转与当前筛选结果导出。
 */
defineOptions({ name: 'TargetMarkingFocusPanel' })

const router = useRouter()
const targetStore = useTargetStore()
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const selectedRows = ref<any[]>([])

const filterForm = reactive({
  riskLevel: '',
  tag: '',
  timeRange: [] as string[]
})

function buildFilterParams() {
  const [startTime = '', endTime = ''] = filterForm.timeRange || []
  return {
    riskLevel: filterForm.riskLevel,
    tag: filterForm.tag,
    startTime,
    endTime
  }
}

async function loadFocusList() {
  loading.value = true
  try {
    await targetStore.loadFocusList({
      ...buildFilterParams(),
      page: page.value,
      pageSize: pageSize.value
    })
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterForm.riskLevel = ''
  filterForm.tag = ''
  filterForm.timeRange = []
  page.value = 1
  loadFocusList()
}

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows || []
}

async function unfollow(row: any) {
  await targetStore.updateAttentionRecord([row.fusionId], false)
  ElMessage.success(`已取消关注 ${row.name}`)
  await loadFocusList()
}

async function batchUnfollow() {
  if (!selectedRows.value.length) return
  try {
    await ElMessageBox.confirm(`确认取消关注选中的 ${selectedRows.value.length} 个目标？`, '批量取消关注', { type: 'warning' })
  } catch {
    return
  }
  const ids = selectedRows.value.map((row) => row.fusionId)
  await targetStore.updateAttentionRecord(ids, false)
  ElMessage.success('已批量取消关注')
  selectedRows.value = []
  await loadFocusList()
}

function openDetail(row: any) {
  router.push({ name: 'TargetDetail', params: { fusionId: row.fusionId } })
}

interface FocusExportRow {
  name: string
  mmsi: string
  displayId: string
  sourceId: string
  targetType: string
  dataSource: string
  riskLevel: string
  tags: string
  followTime: string
}

function buildExportRows(rows: any[]): FocusExportRow[] {
  return rows.map((row) => ({
    name: row.name,
    mmsi: String(row.mmsi || row.displayId),
    displayId: row.displayId,
    sourceId: String(row.sourceId || '-'),
    targetType: TARGET_TYPE_LABELS[row.targetType] || row.targetType,
    dataSource: row.dataSource,
    riskLevel: RISK_LEVEL_LABELS[row.riskLevel] || row.riskLevel,
    tags: String((row.tags || []).join('、') || '-'),
    followTime: String(row.followTime || '-')
  }))
}

const exportColumns: ExcelColumn<FocusExportRow>[] = [
  { header: '目标名称', field: 'name' },
  { header: 'MMSI', field: 'mmsi' },
  { header: '显示编号', field: 'displayId' },
  { header: 'Source ID', field: 'sourceId' },
  { header: '目标类型', field: 'targetType' },
  { header: '数据来源', field: 'dataSource' },
  { header: '风险等级', field: 'riskLevel' },
  { header: '标签', field: 'tags' },
  { header: '关注时间', field: 'followTime' }
]

async function exportFocusList(type: 'excel' | 'csv') {
  if (!targetStore.focusTotal) {
    ElMessage.warning('暂无重点关注数据可导出')
    return
  }
  const { data } = await getFocusList({
    ...buildFilterParams(),
    page: 1,
    pageSize: 1000
  })
  const rows = buildExportRows((data as any)?.list || [])
  const fileName = `重点关注-${fileTime()}`
  if (type === 'excel') {
    exportToExcel(exportColumns, rows, fileName, '重点关注')
  } else {
    exportToCsv(exportColumns, rows, fileName)
  }
  ElMessage.success(`已导出 ${rows.length} 条重点关注目标`)
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function fileTime() {
  const now = new Date()
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
}

onMounted(async () => {
  await Promise.all([targetStore.loadTags(), loadFocusList()])
})
</script>

<style lang="scss" scoped>
.filter-card {
  margin-bottom: 12px;
  :deep(.el-card__body) { padding: 12px 16px; }
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.filter-select { width: 130px; }
.filter-time { width: 330px; }
.filter-spacer { flex: 1; }
.table-card :deep(.el-card__body) { padding: 16px; }
.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.table-title {
  font-size: 14px;
  font-weight: 600;
}
.batch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.selected-tip {
  font-size: 12px;
  color: var(--el-color-primary);
}
.target-name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.target-name { font-weight: 600; }
.target-sub, .cell-sub, .cell-empty { color: var(--el-text-color-secondary); font-size: 12px; }
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.list-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

@media (max-width: 900px) {
  .filter-time {
    width: 100%;
  }
  .table-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
