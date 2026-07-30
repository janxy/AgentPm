<template>
  <div class="alert-rule-page">
    <ElTabs v-model="activeTab" @tab-change="handleTabChange" class="rule-tabs">
      <ElTabPane label="电子围栏预警" name="fence">
        <keep-alive><FenceRule /></keep-alive>
      </ElTabPane>
      <ElTabPane label="身份识别预警" name="blacklist">
        <keep-alive><BlacklistRule /></keep-alive>
      </ElTabPane>
      <ElTabPane label="行为预警" name="behavior">
        <keep-alive><BehaviorRule /></keep-alive>
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FenceRule from './fence/index.vue'
import BlacklistRule from './blacklist/index.vue'
import BehaviorRule from './behavior/index.vue'

defineOptions({ name: 'AlertRule' })

const route = useRoute()
const router = useRouter()

// 从路由路径推断当前Tab
const tabMap: Record<string, string> = { fence: 'fence', blacklist: 'blacklist', behavior: 'behavior' }
const activeTab = ref(tabMap[route.path.split('/').pop() || ''] || 'fence')

function handleTabChange(tab: any) {
  router.replace(`/alert/rule/${tab}`)
}

watch(() => route.path, (path) => {
  const name = path.split('/').pop() || ''
  if (tabMap[name]) activeTab.value = tabMap[name]
})
</script>

<style lang="scss" scoped>
.alert-rule-page {
  padding: 0;
  height: 100%;
}
.rule-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
    background: var(--el-bg-color);
    padding: 0 16px;
  }
}
</style>
