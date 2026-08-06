<template>
  <div class="behavior-panel">
    <ElCard shadow="never" class="filter-card">
      <div class="filter-row annot-ai-algorithm-behavior-filter">
        <ElSelect v-model="filterForm.abnormalType" class="filter-select">
          <ElOption label="全部异常类型" value="全部" />
          <ElOption v-for="type in abnormalTypes" :key="type" :label="type" :value="type" />
        </ElSelect>
        <ElSelect v-model="filterForm.severity" class="filter-select">
          <ElOption label="全部严重程度" value="全部" />
          <ElOption label="低" value="低" />
          <ElOption label="中" value="中" />
          <ElOption label="高" value="高" />
        </ElSelect>
        <ElInput v-model="filterForm.target" placeholder="目标名称" clearable class="filter-target" @keyup.enter="loadData" />
        <ElButton type="primary" :icon="Search" @click="loadData">查询</ElButton>
        <ElButton :icon="Refresh" @click="resetFilter">重置</ElButton>
      </div>
    </ElCard>

    <ElCard shadow="never" class="table-card">
      <ElTable
        v-loading="loading"
        :data="aiStore.behaviorAnalysis"
        row-key="id"
        border
        stripe
        class="data-table annot-ai-algorithm-behavior-table"
        empty-text="暂无行为分析结果"
      >
        <ElTableColumn prop="time" label="分析时间" min-width="150" show-overflow-tooltip />
        <ElTableColumn prop="target" label="目标" min-width="130" show-overflow-tooltip />
        <ElTableColumn prop="workMode" label="作业模式" min-width="90" align="center" class-name="annot-ai-algorithm-behavior-workmode" />
        <ElTableColumn prop="abnormalType" label="异常类型" min-width="130" />
        <ElTableColumn label="严重程度" min-width="90" align="center" class-name="annot-ai-algorithm-behavior-severity">
          <template #default="{ row }">
            <ElTag :type="(severityTagMap as any)[row.severity] || 'info'" size="small" disable-transitions>
              {{ row.severity }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="研判依据" min-width="280" show-overflow-tooltip class-name="annot-ai-algorithm-behavior-basis">
          <template #default="{ row }">{{ formatBasis(row) }}</template>
        </ElTableColumn>
      </ElTable>
      <ElPagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="aiStore.behaviorAnalysisTotal"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        class="event-pagination annot-ai-algorithm-behavior-pagination"
        @size-change="loadData"
        @current-change="loadData"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import { useAiStore } from '@/store/modules/ai'

/**
 * 行为分析面板
 * 作业模式识别、异常行为分级与研判依据展示
 */
defineOptions({ name: 'BehaviorAnalysisPanel' })

const aiStore = useAiStore()
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const filterForm = reactive({ abnormalType: '全部', severity: '全部', target: '' })

const abnormalTypes = ['作业模式异常', '异常绕行', '频繁变向', '接近重点目标']
const severityTagMap: Record<string, string> = { 低: 'info', 中: 'warning', 高: 'danger' }

async function loadData() {
  loading.value = true
  try {
    await aiStore.loadBehaviorAnalysis({
      abnormalType: filterForm.abnormalType,
      severity: filterForm.severity,
      target: filterForm.target,
      page: page.value,
      pageSize: pageSize.value
    })
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterForm.abnormalType = '全部'
  filterForm.severity = '全部'
  filterForm.target = ''
  page.value = 1
  loadData()
}

function formatBasis(row: any) {
  const steps = (row.evidence || []).map((item: any) => item.step)
  return steps.length ? steps.join('；') : '-'
}

onMounted(async () => {
  loadData()
})
</script>

<style lang="scss" scoped>
.behavior-panel {
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
.filter-target {
  width: 180px;
}
.event-pagination {
  margin-top: 14px;
  justify-content: flex-end;
}
</style>
