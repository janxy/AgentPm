<template>
  <ElCard shadow="never" class="alert-history-panel annot-target-detail-alert">
    <div class="alert-filter">
      <ElSelect v-model="filterForm.type" placeholder="告警类型" clearable class="filter-select">
        <ElOption v-for="type in ALERT_TYPE_OPTIONS" :key="type" :label="type" :value="type" />
      </ElSelect>
      <ElSelect v-model="filterForm.level" placeholder="告警级别" clearable class="filter-select">
        <ElOption v-for="item in ALERT_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
      </ElSelect>
      <ElSelect v-model="filterForm.status" placeholder="处置状态" clearable class="filter-select">
        <ElOption v-for="item in ALERT_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
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
      <ElButton type="primary" :icon="Search" @click="search">查询</ElButton>
      <ElButton :icon="Refresh" @click="resetFilter">重置</ElButton>
    </div>

    <ElTable v-loading="loading" :data="targetStore.alertHistory" border stripe class="alert-table" empty-text="暂无报警数据">
      <ElTableColumn prop="id" label="告警编号" width="180" show-overflow-tooltip />
      <ElTableColumn prop="type" label="告警类型" width="110" align="center" />
      <ElTableColumn label="告警级别" width="90" align="center">
        <template #default="{ row }">
          <ElTag :type="(ALERT_LEVEL_COLORS as any)[row.level]" size="small" disable-transitions>
            {{ ALERT_LEVEL_LABELS[row.level] || row.level }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="triggerTime" label="触发时间" width="165" />
      <ElTableColumn label="处置状态" width="95" align="center">
        <template #default="{ row }">
          <ElTag :type="(ALERT_STATUS_COLORS as any)[row.status]" size="small" effect="plain" disable-transitions>
            {{ ALERT_STATUS_LABELS[row.status] || row.status }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="result" label="处置结果" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">{{ row.result || '-' }}</template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="90" align="center">
        <template #default="{ row }">
          <ElButton link type="primary" @click="openDetail(row)">查看详情</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
    <ElPagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="targetStore.alertTotal"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      class="list-pagination"
      @size-change="loadAlerts"
      @current-change="loadAlerts"
    />

    <ElDialog v-model="detailVisible" title="报警详情" width="640px" class="annot-target-detail-alert-dialog">
      <ElDescriptions v-if="currentAlert" :column="2" border size="small">
        <ElDescriptionsItem label="告警编号">{{ currentAlert.id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="目标">{{ targetName }}（{{ displayId }}）</ElDescriptionsItem>
        <ElDescriptionsItem label="告警类型">{{ currentAlert.type }}</ElDescriptionsItem>
        <ElDescriptionsItem label="告警级别">
          <ElTag :type="(ALERT_LEVEL_COLORS as any)[currentAlert.level]" size="small" disable-transitions>
            {{ ALERT_LEVEL_LABELS[currentAlert.level] || currentAlert.level }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="触发时间">{{ currentAlert.triggerTime }}</ElDescriptionsItem>
        <ElDescriptionsItem label="处置状态">
          <ElTag :type="(ALERT_STATUS_COLORS as any)[currentAlert.status]" size="small" effect="plain" disable-transitions>
            {{ ALERT_STATUS_LABELS[currentAlert.status] || currentAlert.status }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="告警描述" :span="2">{{ currentAlert.description }}</ElDescriptionsItem>
        <ElDescriptionsItem label="证据信息" :span="2">{{ currentAlert.evidence }}</ElDescriptionsItem>
        <ElDescriptionsItem label="处置人">{{ currentAlert.operator || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="处置时间">{{ currentAlert.disposeTime || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="处置结果" :span="2">{{ currentAlert.result || '-' }}</ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>
  </ElCard>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import { useTargetStore } from '@/store/modules/target'
import {
  ALERT_LEVEL_COLORS,
  ALERT_LEVEL_LABELS,
  ALERT_LEVEL_OPTIONS,
  ALERT_STATUS_COLORS,
  ALERT_STATUS_LABELS,
  ALERT_STATUS_OPTIONS,
  ALERT_TYPE_OPTIONS
} from '@/utils/target'

/**
 * 单目标报警历史
 * 按告警类型、级别、时间范围与处置状态筛选，查看告警详情；本轮不提供关联视频查询。
 */
defineOptions({ name: 'TargetDetailAlertHistoryPanel' })

const props = defineProps<{ fusionId: string; targetName: string; displayId: string }>()
const targetStore = useTargetStore()
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)
const currentAlert = ref<any>(null)

const filterForm = reactive({
  type: '',
  level: '',
  status: '',
  timeRange: [] as string[]
})

function buildParams() {
  const [startTime = '', endTime = ''] = filterForm.timeRange || []
  return {
    type: filterForm.type,
    level: filterForm.level,
    status: filterForm.status,
    startTime,
    endTime,
    page: page.value,
    pageSize: pageSize.value
  }
}

async function loadAlerts() {
  loading.value = true
  try {
    await targetStore.loadAlertHistory(props.fusionId, buildParams())
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  loadAlerts()
}

function resetFilter() {
  filterForm.type = ''
  filterForm.level = ''
  filterForm.status = ''
  filterForm.timeRange = []
  page.value = 1
  loadAlerts()
}

function openDetail(row: any) {
  currentAlert.value = row
  detailVisible.value = true
}

onMounted(() => {
  loadAlerts()
})
</script>

<style lang="scss" scoped>
.alert-history-panel {
  :deep(.el-card__body) { padding: 16px; }
}
.alert-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.filter-select {
  width: 130px;
}
.filter-time {
  width: 330px;
}
.alert-table {
  width: 100%;
}
.list-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
