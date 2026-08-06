<template>
  <ElDialog
    :model-value="visible"
    title="算法服务详情"
    width="880px"
    destroy-on-close
      class="service-detail-dialog annot-ai-algorithm-service-detail-dialog"
    @update:model-value="handleVisibleChange"
  >
    <div v-loading="loading" class="detail-body">
      <template v-if="detail">
        <div class="detail-actions">
          <ElButton v-if="!editing" :icon="Setting" @click="enterEdit">编辑配置</ElButton>
        </div>
        <ElDescriptions title="基本信息" :column="2" border size="small">
          <ElDescriptionsItem label="服务名称">{{ detail.name }}</ElDescriptionsItem>
          <ElDescriptionsItem label="服务类型">{{ detail.type }}</ElDescriptionsItem>
          <ElDescriptionsItem label="运行状态">
            <ElTag :type="(statusTagMap as any)[detail.status]" size="small" disable-transitions>{{ statusLabelMap[detail.status] || detail.status }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="当前版本">{{ detail.version }}</ElDescriptionsItem>
          <ElDescriptionsItem label="服务可用性">{{ detail.metrics?.availability ?? '-' }}%</ElDescriptionsItem>
        </ElDescriptions>

        <template v-if="editing">
          <div class="detail-section-title">关联数据源</div>
          <ElCheckboxGroup v-model="form.dataSources" class="config-checkbox-group">
            <ElCheckbox v-for="source in availableDataSources" :key="source" :label="source" />
          </ElCheckboxGroup>

          <div class="detail-section-title">授权设备</div>
          <ElCheckboxGroup v-model="form.authorizedDevices" class="config-checkbox-group">
            <ElCheckbox v-for="device in availableDevices" :key="device" :label="device" />
          </ElCheckboxGroup>

          <div class="edit-actions">
            <ElButton @click="cancelEdit">取消</ElButton>
            <ElButton type="primary" :loading="saving" @click="saveConfig">保存配置</ElButton>
          </div>
        </template>
        <template v-else>
          <div class="detail-section-title">数据源配置</div>
          <ElTable :data="detail.dataSourceConfig" border stripe size="small">
            <ElTableColumn prop="type" label="数据源类型" min-width="120" />
            <ElTableColumn label="接入状态" width="100" align="center">
              <template #default="{ row }">
                <ElTag :type="row.accessStatus === '正常' ? 'success' : 'danger'" size="small" disable-transitions>{{ row.accessStatus }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="updateFrequency" label="更新频率" min-width="120" />
          </ElTable>

          <div class="detail-section-title">授权设备</div>
          <ElTable :data="detail.authorizedDeviceList" border stripe size="small">
            <ElTableColumn prop="name" label="设备名称" min-width="150" />
            <ElTableColumn prop="type" label="设备类型" min-width="120" />
            <ElTableColumn label="接入状态" width="100" align="center">
              <template #default="{ row }">
                <ElTag :type="row.accessStatus === '正常' ? 'success' : 'danger'" size="small" disable-transitions>{{ row.accessStatus }}</ElTag>
              </template>
            </ElTableColumn>
          </ElTable>
        </template>

        <div class="detail-section-title">近期调用趋势</div>
        <ArtLineChart
          height="260px"
          :x-axis-data="trendTimes"
          :data="trendSeries"
          show-legend
          legend-position="bottom"
        />
      </template>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'
import ArtLineChart from '@/components/core/charts/art-line-chart/index.vue'
import { useAiStore } from '@/store/modules/ai'

/**
 * 算法服务详情弹窗
 * 展示服务基本信息、数据源配置、授权设备明细与近期调用趋势
 */
defineOptions({ name: 'ServiceDetailDialog' })

const props = defineProps<{ visible: boolean; serviceId: number | null }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

const aiStore = useAiStore()
const detail = computed(() => aiStore.serviceDetail)
const loading = ref(false)
const editing = ref(false)
const saving = ref(false)
const form = reactive<{ dataSources: string[]; authorizedDevices: string[] }>({
  dataSources: [],
  authorizedDevices: []
})

const statusLabelMap: Record<string, string> = { running: '运行中', abnormal: '异常', stopped: '已停止', restarting: '启动中', switching: '版本切换中' }
const statusTagMap: Record<string, string> = { running: 'success', abnormal: 'danger', stopped: 'info', restarting: 'warning', switching: 'warning' }

// 趋势图横轴取时间段的时分，纵轴展示调用量/成功率/延迟
const trendTimes = computed(() => (detail.value?.trend || []).map((t: any) => t.time.slice(11, 16)))
const trendSeries = computed(() => [
  { name: '调用量', data: (detail.value?.trend || []).map((t: any) => t.calls) },
  { name: '成功率', data: (detail.value?.trend || []).map((t: any) => t.successRate) },
  { name: '延迟', data: (detail.value?.trend || []).map((t: any) => t.latency) }
])
const availableDataSources = computed(() => detail.value?.availableDataSources || [])
const availableDevices = computed(() => detail.value?.availableDevices || [])

function syncConfigForm() {
  form.dataSources = [...(detail.value?.dataSources || [])]
  form.authorizedDevices = [...(detail.value?.authorizedDevices || [])]
}

function enterEdit() {
  syncConfigForm()
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

async function saveConfig() {
  if (props.serviceId == null) return
  saving.value = true
  try {
    const result: any = await aiStore.updateServiceConfig(
      props.serviceId,
      form.dataSources,
      form.authorizedDevices
    )
    if (result?.error) {
      ElMessage.error(result.error)
      return
    }
    ElMessage.success('算法服务配置已更新')
    editing.value = false
  } finally {
    saving.value = false
  }
}

function handleVisibleChange(value: boolean) {
  emit('update:visible', value)
}

// 打开弹窗时加载服务详情
watch(
  () => props.visible,
  async (value) => {
    if (!value || props.serviceId == null) return
    loading.value = true
    editing.value = false
    try {
      await aiStore.loadServiceDetail(props.serviceId)
      syncConfigForm()
    } finally {
      loading.value = false
    }
  }
)
</script>

<style lang="scss" scoped>
.detail-body {
  min-height: 220px;
}
.detail-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
.detail-section-title {
  margin: 18px 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.config-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 18px;
}
.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}
</style>
