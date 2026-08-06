<template>
  <ElDialog
    :model-value="visible"
    title="识别快照"
    width="820px"
    destroy-on-close
    class="annot-ai-algorithm-ship-snapshot-dialog"
    @update:model-value="handleVisibleChange"
  >
    <div v-loading="loading" class="snapshot-body">
      <template v-if="detail">
        <ElAlert
          v-if="!detail.deviceOnline"
          type="warning"
          :closable="false"
          show-icon
          title="来源设备离线，历史识别结果仍可查看，新增识别暂停"
          class="snapshot-alert"
        />

        <div class="snapshot-canvas">
          <div class="snapshot-grid" />
          <div
            class="target-box"
            :style="{
              left: `${detail.snapshot?.box?.x || 45}%`,
              top: `${detail.snapshot?.box?.y || 40}%`,
              width: `${detail.snapshot?.box?.width || 20}%`,
              height: `${detail.snapshot?.box?.height || 12}%`
            }"
          >
            <span class="target-box-label">{{ detail.target }}</span>
          </div>
          <div class="snapshot-ship">
            <el-icon :size="64"><Ship /></el-icon>
            <span class="snapshot-ship-type">{{ detail.shipType }}</span>
          </div>
          <div class="snapshot-meta">
            <span>{{ detail.snapshot?.cameraNo || detail.device }}</span>
            <span>{{ detail.time }}</span>
            <span>{{ detail.snapshot?.resolution || '1280x720' }}</span>
          </div>
          <div class="snapshot-crosshair crosshair-h" />
          <div class="snapshot-crosshair crosshair-v" />
        </div>

        <ElDescriptions title="识别信息" :column="3" border size="small" class="snapshot-descriptions">
          <ElDescriptionsItem label="识别时间">{{ detail.time }}</ElDescriptionsItem>
          <ElDescriptionsItem label="目标">{{ detail.target }}</ElDescriptionsItem>
          <ElDescriptionsItem label="来源设备">{{ detail.device }}</ElDescriptionsItem>
          <ElDescriptionsItem label="识别船型">{{ detail.shipType }}</ElDescriptionsItem>
          <ElDescriptionsItem label="置信度">{{ detail.confidence }}%</ElDescriptionsItem>
          <ElDescriptionsItem label="复核状态">{{ detail.reviewStatus }}</ElDescriptionsItem>
          <ElDescriptionsItem label="画面场景">{{ detail.snapshot?.scene || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="画面视角">{{ detail.snapshot?.frameType || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="亮度/变焦">{{ detail.snapshot?.brightness || '-' }} / {{ detail.snapshot?.zoom || '-' }}</ElDescriptionsItem>
        </ElDescriptions>
      </template>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Ship } from '@element-plus/icons-vue'
import { useAiStore } from '@/store/modules/ai'

/**
 * 船型识别快照弹窗
 * 展示模拟光电画面、目标框与识别字段信息
 */
defineOptions({ name: 'ShipSnapshotDialog' })

const props = defineProps<{ visible: boolean; record: any }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

const aiStore = useAiStore()
const loading = ref(false)
const detail = ref<any>(null)

function handleVisibleChange(value: boolean) {
  if (!value) detail.value = null
  emit('update:visible', value)
}

watch(
  () => props.visible,
  async (value) => {
    if (!value || !props.record) return
    loading.value = true
    try {
      detail.value = await aiStore.loadShipDetail(props.record.id)
    } finally {
      loading.value = false
    }
  }
)
</script>

<style lang="scss" scoped>
.snapshot-body {
  min-height: 260px;
}
.snapshot-alert {
  margin-bottom: 14px;
}
.snapshot-canvas {
  position: relative;
  height: 340px;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(180deg, #dfe8e6 0%, #c9d8d4 55%, #aebfb9 100%);
  border: 1px solid var(--el-border-color-lighter);
}
.snapshot-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.24) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.24) 1px, transparent 1px);
  background-size: 48px 48px;
}
.target-box {
  position: absolute;
  transform: translate(-50%, -50%);
  border: 2px solid #e6a23c;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25) inset;
}
.target-box-label {
  position: absolute;
  top: -24px;
  left: 0;
  padding: 2px 6px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.68);
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
}
.snapshot-ship {
  position: absolute;
  left: 50%;
  top: 54%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #4b5e5a;
}
.snapshot-ship-type {
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  color: #344a45;
}
.snapshot-meta {
  position: absolute;
  left: 10px;
  top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: #2e423d;
}
.snapshot-crosshair {
  position: absolute;
  background: rgba(230, 162, 60, 0.75);
}
.crosshair-h {
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
}
.crosshair-v {
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
}
.snapshot-descriptions {
  margin-top: 16px;
}
</style>
