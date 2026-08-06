<template>
  <div class="ship-recognition-panel">
    <ElCard shadow="never" class="filter-card">
      <div class="filter-row annot-ai-algorithm-ship-filter">
        <ElSelect v-model="filterForm.deviceStatus" class="filter-select" placeholder="设备状态">
          <ElOption label="全部设备" value="全部" />
          <ElOption label="在线设备" value="在线" />
          <ElOption label="离线设备" value="离线" />
        </ElSelect>
        <ElSelect v-model="filterForm.reviewStatus" class="filter-select" placeholder="复核状态">
          <ElOption label="全部复核状态" value="全部" />
          <ElOption label="待复核" value="待复核" />
          <ElOption label="已通过" value="已通过" />
          <ElOption label="已修改" value="已修改" />
        </ElSelect>
        <ElDatePicker
          v-model="filterForm.timeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="filter-date"
        />
        <ElButton type="primary" :icon="Search" @click="loadData">查询</ElButton>
        <ElButton :icon="Refresh" @click="resetFilter">重置</ElButton>
      </div>
    </ElCard>

    <ElCard shadow="never" class="table-card">
      <ElTable
        v-loading="loading"
        :data="aiStore.shipRecognition"
        row-key="id"
        border
        stripe
        class="data-table annot-ai-algorithm-ship-table"
        empty-text="暂无船型识别结果"
      >
        <ElTableColumn prop="time" label="识别时间" min-width="150" show-overflow-tooltip />
        <ElTableColumn prop="target" label="目标" min-width="130" show-overflow-tooltip />
        <ElTableColumn prop="device" label="来源设备" min-width="140" show-overflow-tooltip />
        <ElTableColumn prop="shipType" label="识别船型" min-width="100" />
        <ElTableColumn label="置信度" min-width="130" class-name="annot-ai-algorithm-ship-confidence">
          <template #default="{ row }">
            <div class="confidence-cell">
              <ElProgress
                :percentage="row.confidence"
                :stroke-width="8"
                :show-text="false"
                :color="row.confidence >= 80 ? 'var(--el-color-success)' : 'var(--el-color-warning)'"
              />
              <span>{{ row.confidence }}%</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="复核状态" min-width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="(reviewTagMap as any)[row.reviewStatus] || 'info'" size="small" disable-transitions>
              {{ row.reviewStatus }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="220" align="center" fixed="right" class-name="annot-ai-algorithm-ship-actions">
          <template #default="{ row }">
            <ElButton link type="primary" :icon="VideoCamera" @click="openSnapshot(row)">查看快照</ElButton>
            <ElButton
              v-if="row.reviewStatus === '待复核'"
              v-roles="['值班员', '指挥员']"
              link
              type="warning"
              :icon="EditPen"
              @click="openReview(row)"
            >人工复核</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="aiStore.shipTotal"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        class="event-pagination annot-ai-algorithm-ship-pagination"
        @size-change="loadData"
        @current-change="loadData"
      />
    </ElCard>

    <ShipSnapshotDialog v-model:visible="snapshotVisible" :record="currentRow" />
    <ShipReviewDialog v-model:visible="reviewVisible" :record="currentRow" @success="loadData" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { EditPen, Refresh, Search, VideoCamera } from '@element-plus/icons-vue'
import { useAiStore } from '@/store/modules/ai'
import ShipSnapshotDialog from './ShipSnapshotDialog.vue'
import ShipReviewDialog from './ShipReviewDialog.vue'

/**
 * 船型识别面板
 * 设备/时间/复核状态筛选、识别结果列表、快照查看、人工复核
 */
defineOptions({ name: 'ShipRecognitionPanel' })

const aiStore = useAiStore()
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const filterForm = reactive({
  deviceStatus: '全部',
  reviewStatus: '全部',
  timeRange: [] as string[]
})
const snapshotVisible = ref(false)
const reviewVisible = ref(false)
const currentRow = ref<any>(null)

const reviewTagMap: Record<string, string> = { 待复核: 'warning', 已通过: 'success', 已修改: 'primary' }

/** 加载识别结果列表，按当前筛选与分页查询 */
async function loadData() {
  loading.value = true
  try {
    const [startTime, endTime] = filterForm.timeRange || []
    await aiStore.loadShipRecognition({
      deviceStatus: filterForm.deviceStatus,
      reviewStatus: filterForm.reviewStatus,
      startTime,
      endTime,
      page: page.value,
      pageSize: pageSize.value
    })
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterForm.deviceStatus = '全部'
  filterForm.reviewStatus = '全部'
  filterForm.timeRange = []
  page.value = 1
  loadData()
}

function openSnapshot(row: any) {
  currentRow.value = row
  snapshotVisible.value = true
}

function openReview(row: any) {
  currentRow.value = row
  reviewVisible.value = true
}

onMounted(async () => {
  await aiStore.loadShipDevices()
  loadData()
})
</script>

<style lang="scss" scoped>
.ship-recognition-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.filter-card,
.table-card {
  flex: none;
  :deep(.el-card__body) {
    padding: 16px;
  }
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.filter-select {
  width: 150px;
}
.filter-date {
  width: 300px;
}
.confidence-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 110px;
  :deep(.el-progress) {
    flex: 1;
  }
}
.event-pagination {
  margin-top: 14px;
  justify-content: flex-end;
}
</style>
