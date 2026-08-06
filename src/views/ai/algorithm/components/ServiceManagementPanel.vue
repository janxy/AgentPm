<template>
  <div class="service-panel">
    <ElCard shadow="never" class="stats-card">
      <div class="stats-grid annot-ai-algorithm-service-stats">
        <div v-for="item in statItems" :key="item.key" class="stat-item">
          <span class="stat-label">{{ item.label }}</span>
          <span class="stat-value" :class="{ 'value-danger': item.key === 'abnormal' && item.value > 0 }">
            {{ item.value }}
          </span>
        </div>
      </div>
    </ElCard>

    <ElAlert
      v-if="abnormalServiceCount > 0"
      type="warning"
      :closable="false"
      show-icon
      class="service-alert annot-ai-algorithm-service-alert"
      :title="`检测到 ${abnormalServiceCount} 个算法服务异常，已自动告警`"
    />

    <ElCard shadow="never" class="table-card">
      <div class="toolbar">
        <div class="filter-row annot-ai-algorithm-service-filter">
          <ElInput v-model="filterForm.name" placeholder="服务名称" clearable class="filter-name" @keyup.enter="loadData" />
          <ElSelect v-model="filterForm.type" class="filter-select">
            <ElOption label="全部服务类型" value="全部" />
            <ElOption v-for="type in serviceTypes" :key="type" :label="type" :value="type" />
          </ElSelect>
          <ElSelect v-model="filterForm.status" class="filter-select">
            <ElOption label="全部运行状态" value="全部" />
            <ElOption label="运行中" value="running" />
            <ElOption label="异常" value="abnormal" />
            <ElOption label="已停止" value="stopped" />
          </ElSelect>
          <ElButton type="primary" :icon="Search" @click="loadData">查询</ElButton>
          <ElButton :icon="Refresh" @click="resetFilter">重置</ElButton>
        </div>
      </div>

      <ElTable
        v-loading="loading"
        :data="aiStore.algorithmServices"
        row-key="id"
        border
        stripe
        class="data-table annot-ai-algorithm-service-table"
        empty-text="暂无算法服务"
      >
        <ElTableColumn prop="name" label="服务名称" min-width="170" show-overflow-tooltip />
        <ElTableColumn prop="type" label="服务类型" width="110" />
        <ElTableColumn label="运行状态" width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="(statusTagMap as any)[row.status] || 'info'" size="small" disable-transitions>
              {{ statusLabelMap[row.status] || row.status }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="当前版本" width="120" align="center">
          <template #default="{ row }">
            <span>{{ row.version }}</span>
            <ElTag v-if="row.status === 'switching'" size="small" type="warning" effect="plain" class="version-tag">
              切换中
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="数据源" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ (row.dataSources || []).join('、') || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn label="授权设备" width="100" align="center">
          <template #default="{ row }">{{ (row.authorizedDevices || []).length }} 个</template>
        </ElTableColumn>
        <ElTableColumn label="可用性" width="110" align="center">
          <template #default="{ row }">
            <span>{{ row.metrics?.availability ?? '-' }}%</span>
            <span class="availability-sub">{{ row.metrics?.latency || 0 }}ms</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="最近心跳" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.metrics?.lastHeartbeat || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="240" align="center" fixed="right" class-name="annot-ai-algorithm-service-actions">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openDetail(row)">详情</ElButton>
            <ElButton
              v-if="row.status === 'abnormal'"
              v-roles="['运维管理员', '值班员']"
              link
              type="danger"
              @click="openException(row)"
            >异常处理</ElButton>
            <ElButton
              v-roles="['运维管理员']"
              link
              type="warning"
              :disabled="row.status === 'restarting' || row.status === 'switching'"
              @click="handleRestart(row)"
            >重启</ElButton>
            <ElButton
              v-roles="['运维管理员']"
              link
              type="primary"
              :disabled="row.status === 'restarting' || row.status === 'switching'"
              @click="openVersion(row)"
            >版本切换</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="aiStore.algorithmTotal"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        class="event-pagination annot-ai-algorithm-service-pagination"
        @size-change="loadData"
        @current-change="loadData"
      />
    </ElCard>

    <ServiceDetailDialog v-model:visible="detailVisible" :service-id="currentService?.id" />
    <VersionSwitchDialog v-model:visible="versionVisible" :service="currentService" @success="loadData" />
    <ExceptionDialog v-model:visible="exceptionVisible" :service="currentService" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { useAiStore } from '@/store/modules/ai'
import ServiceDetailDialog from './ServiceDetailDialog.vue'
import VersionSwitchDialog from './VersionSwitchDialog.vue'
import ExceptionDialog from './ExceptionDialog.vue'

/**
 * 算法服务管理面板
 * 查看算法服务运行状态、版本与可用性，支持重启、版本切换与异常处理
 */
defineOptions({ name: 'ServiceManagementPanel' })

const aiStore = useAiStore()
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)
const versionVisible = ref(false)
const exceptionVisible = ref(false)
const currentService = ref<any>(null)
const filterForm = reactive({ name: '', type: '全部', status: '全部' })

const serviceTypes = ['船型识别', '行为分析', '风险评估', '融合推理', '事件推荐']
const statusLabelMap: Record<string, string> = {
  running: '运行中',
  abnormal: '异常',
  stopped: '已停止',
  restarting: '启动中',
  switching: '版本切换中'
}
const statusTagMap: Record<string, string> = {
  running: 'success',
  abnormal: 'danger',
  stopped: 'info',
  restarting: 'warning',
  switching: 'warning'
}

const statItems = computed(() => {
  const overview = aiStore.engineOverview || {}
  return [
    { key: 'total', label: '服务总数', value: overview.serviceTotal ?? 0 },
    { key: 'running', label: '运行中', value: overview.running ?? 0 },
    { key: 'abnormal', label: '异常', value: overview.abnormal ?? 0 },
    { key: 'stopped', label: '已停止', value: overview.stopped ?? 0 },
    { key: 'calls', label: '今日调用', value: overview.todayCalls ?? 0 },
    { key: 'latency', label: '平均时延', value: overview.avgLatency ? `${overview.avgLatency}ms` : '-' }
  ]
})
const abnormalServiceCount = computed(() => aiStore.engineOverview?.abnormal ?? 0)

async function loadData() {
  loading.value = true
  try {
    await aiStore.loadAlgorithmServices({
      name: filterForm.name,
      type: filterForm.type,
      status: filterForm.status,
      page: page.value,
      pageSize: pageSize.value
    })
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterForm.name = ''
  filterForm.type = '全部'
  filterForm.status = '全部'
  page.value = 1
  loadData()
}

function openDetail(row: any) {
  currentService.value = row
  detailVisible.value = true
}

function openException(row: any) {
  currentService.value = row
  exceptionVisible.value = true
}

function openVersion(row: any) {
  currentService.value = row
  versionVisible.value = true
}

async function handleRestart(row: any) {
  try {
    await ElMessageBox.confirm(`确定重启算法服务“${row.name}”吗？`, '重启服务', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  await aiStore.restartService(row.id)
  ElMessage.success('重启指令已下发')
}

onMounted(async () => {
  await Promise.all([aiStore.loadEngineOverview(), loadData()])
})
</script>

<style lang="scss" scoped>
.service-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}
.stats-card {
  flex: none;
  :deep(.el-card__body) {
    padding: 14px 16px;
  }
}
.service-alert {
  flex: none;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-left: 3px solid var(--el-color-primary);
  background: var(--el-fill-color-lighter);
}
.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.value-danger {
  color: var(--el-color-danger);
}
.table-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  :deep(.el-card__body) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 16px;
  }
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  flex: none;
  margin-bottom: 12px;
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.filter-name {
  width: 180px;
}
.filter-select {
  width: 150px;
}
.version-tag {
  margin-left: 4px;
}
.availability-sub {
  margin-left: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.data-table {
  flex: 1;
}
.event-pagination {
  margin-top: 12px;
  justify-content: flex-end;
  flex: none;
}
@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
