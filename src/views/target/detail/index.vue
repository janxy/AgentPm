<template>
  <div v-loading="loading" class="target-detail-page">
    <div class="detail-header annot-target-detail-header">
      <ElButton circle :icon="Back" class="back-button" @click="goBack" />
      <div class="header-main">
        <div class="header-title">
          <span class="target-name">{{ target?.name || '单目标研判' }}</span>
          <span class="target-meta">{{ target?.mmsi || target?.displayId || fusionId }}</span>
        </div>
        <div class="header-sub">
          <span v-if="target">{{ target.shipType }} · {{ target.region }}</span>
          <span v-else>目标详情加载中</span>
        </div>
      </div>
      <div class="header-tags">
        <ElButton
          v-if="target"
          v-roles="['值班员', '指挥员']"
          size="small"
          :type="target.followed ? 'warning' : 'primary'"
          plain
          :icon="target.followed ? StarFilled : Star"
          @click="toggleFollow"
        >
          {{ target.followed ? '取消关注' : '关注' }}
        </ElButton>
      </div>
    </div>

    <template v-if="target">
      <ElTabs v-model="activeTab" class="detail-tabs">
        <ElTabPane label="基础信息" name="basic">
          <BasicInfoPanel :target="target" />
        </ElTabPane>
        <ElTabPane label="历史轨迹" name="trajectory">
          <TrajectoryPanel v-if="activeTab === 'trajectory'" :fusion-id="fusionId" :target-name="target.name" :display-id="target.displayId" />
        </ElTabPane>
        <ElTabPane label="报警历史" name="alert">
          <AlertHistoryPanel v-if="activeTab === 'alert'" :fusion-id="fusionId" :target-name="target.name" :display-id="target.displayId" />
        </ElTabPane>
      </ElTabs>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back, Star, StarFilled } from '@element-plus/icons-vue'
import { useTargetStore } from '@/store/modules/target'
import BasicInfoPanel from './components/BasicInfoPanel.vue'
import TrajectoryPanel from './components/TrajectoryPanel.vue'
import AlertHistoryPanel from './components/AlertHistoryPanel.vue'

/**
 * 单目标研判详情
 * 隐藏路由页面，聚合基础信息、历史轨迹与报警历史三个页签。
 */
defineOptions({ name: 'TargetDetail' })

const route = useRoute()
const router = useRouter()
const targetStore = useTargetStore()
const loading = ref(false)
const activeTab = ref('basic')
const fusionId = computed(() => String(route.params.fusionId || ''))
const target = computed(() => targetStore.targetDetail)

async function loadDetail() {
  if (!fusionId.value) return
  loading.value = true
  try {
    await targetStore.loadTargetDetail(fusionId.value)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'TargetOverview' })
}

async function toggleFollow() {
  const current = target.value
  if (!current) return
  const next = !current.followed
  await targetStore.updateAttentionRecord([current.fusionId], next)
  ElMessage.success(next ? '已加入重点关注' : '已取消重点关注')
  await loadDetail()
}

watch(fusionId, loadDetail, { immediate: true })
</script>

<style lang="scss" scoped>
.target-detail-page {
  padding: 4px;
}
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border-radius: 4px;
}
.back-button {
  flex-shrink: 0;
}
.header-main {
  flex: 1;
  min-width: 0;
}
.header-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}
.target-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.target-meta {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.header-sub {
  margin-top: 3px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.header-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.detail-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
    background: var(--el-bg-color);
    padding: 0 16px;
  }
  :deep(.el-tabs__content) {
    padding: 0;
  }
}

@media (max-width: 900px) {
  .detail-header {
    flex-wrap: wrap;
  }
  .header-tags {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
