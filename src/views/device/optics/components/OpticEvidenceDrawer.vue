<template>
  <ElDrawer
    :model-value="visible"
    title="取证与喊话记录"
    direction="rtl"
    size="620px"
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-if="eventContext?.eventId" class="event-badge">
      联动事件：{{ eventContext.eventId }} / {{ eventContext.targetId || '未关联目标' }}
    </div>

    <ElCard shadow="never" class="hailer-card annot-device-optics-hailer">
      <template #header><span class="card-title">喊话广播</span></template>
      <div class="hailer-presets">
        <ElButton v-for="text in presetTexts" :key="text" size="small" :disabled="!canOperate" @click="sendHailer(text, 'tts')">
          {{ text }}
        </ElButton>
      </div>
      <div class="hailer-input">
        <ElInput v-model="hailerContent" placeholder="输入喊话内容（实时喊话模拟）" size="small" maxlength="100" :disabled="!canOperate" />
        <ElButton type="primary" size="small" :disabled="!canOperate || !hailerContent.trim()" @click="sendHailer(hailerContent, 'realtime')">实时喊话</ElButton>
      </div>
    </ElCard>

    <ElCard shadow="never" class="evidence-card annot-device-optics-evidence-list">
      <template #header><span class="card-title">取证记录</span></template>
      <ElTable :data="evidenceList" size="small" v-loading="loading" empty-text="暂无取证记录">
        <ElTableColumn label="类型" width="80" align="center">
          <template #default="{ row }">
            <ElTag :type="row.type === 'screenshot' ? 'primary' : 'warning'" size="small" disable-transitions>
              {{ row.type === 'screenshot' ? '截图' : '录像' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="内容" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.content }}</template>
        </ElTableColumn>
        <ElTableColumn prop="operatorName" label="操作人" width="90" />
        <ElTableColumn prop="createTime" label="时间" width="165" />
        <ElTableColumn label="操作" width="80" align="center">
          <template #default="{ row }">
            <ElButton link type="primary" size="small" @click="downloadEvidence(row)">下载</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElCard shadow="never" class="hailer-record-card annot-device-optics-hailer-record">
      <template #header><span class="card-title">喊话记录</span></template>
      <ElTimeline v-if="hailerList.length">
        <ElTimelineItem v-for="h in hailerList" :key="h.id" :timestamp="h.createTime" placement="top" type="warning">
          <div class="hailer-row">
            <ElTag size="small" disable-transitions>{{ h.mode === 'tts' ? 'TTS' : '实时' }}</ElTag>
            <span class="hailer-content">{{ h.content }}</span>
          </div>
        </ElTimelineItem>
      </ElTimeline>
      <ElEmpty v-else description="暂无喊话记录" :image-size="60" />
    </ElCard>
  </ElDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getEvidenceList, addEvidence, getHailerList, addHailer } from '@/api/device'

/**
 * 取证与喊话抽屉
 * 支持预设/实时喊话，展示截图、录像与喊话记录，联动场景自动携带事件编号
 */
const props = defineProps<{ visible: boolean; device: any; eventContext: any }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const loading = ref(false)
const evidenceList = ref<any[]>([])
const hailerList = ref<any[]>([])
const hailerContent = ref('')
const presetTexts = ['驱离警告：请立即驶离禁航区域', '警示：您已进入限制水域', '引导：请沿航道安全通过']
const canOperate = computed(() => !!props.device && props.device.status === 1)

async function loadData() {
  if (!props.device) return
  loading.value = true
  try {
    const [ev, hl] = await Promise.all([
      getEvidenceList({ deviceId: props.device.id, eventId: props.eventContext?.eventId }),
      getHailerList(props.device.id)
    ])
    evidenceList.value = (ev.data as any)?.list || []
    hailerList.value = (hl.data as any)?.list || []
  } finally {
    loading.value = false
  }
}

async function sendHailer(content: string, mode: string) {
  if (!props.device) return
  await addHailer({ deviceId: props.device.id, content: content.trim(), mode })
  ElMessage.success('喊话已广播并留痕')
  hailerContent.value = ''
  loadData()
}

async function downloadEvidence(row: any) {
  const { data } = await getEvidenceList({ deviceId: row.deviceId, eventId: row.eventId })
  const target = (data as any)?.list?.find((e: any) => e.id === row.id)
  if (!target?.fileUrl) { ElMessage.info('模拟下载已开始'); return }
  const link = document.createElement('a')
  link.href = target.fileUrl
  link.download = `${target.type}-${target.id}.png`
  link.click()
  ElMessage.success('取证文件下载完成')
}

watch(() => props.visible, (val) => { if (val) loadData() })
watch(() => props.device?.id, () => { if (props.visible) loadData() })
</script>

<style lang="scss" scoped>
.event-badge { margin-bottom: 12px; padding: 8px 12px; border-radius: 8px; background: var(--el-color-primary-light-9); color: var(--el-color-primary); font-size: 13px; }
.hailer-card, .evidence-card, .hailer-record-card { margin-bottom: 12px; }
.card-title { font-size: 15px; font-weight: 600; }
.hailer-presets { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.hailer-input { display: flex; gap: 8px; }
.hailer-row { display: flex; align-items: center; gap: 8px; }
.hailer-content { font-size: 13px; color: var(--el-text-color-regular); }
</style>
