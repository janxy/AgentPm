<template>
  <div class="target-marking-page">
    <ElTabs v-model="activeTab" class="marking-tabs">
      <ElTabPane label="重点关注" name="focus">
        <FocusPanel v-if="activeTab === 'focus'" />
      </ElTabPane>
      <ElTabPane label="标签管理" name="tag">
        <TagPanel v-if="activeTab === 'tag'" />
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FocusPanel from './components/FocusPanel.vue'
import TagPanel from './components/TagPanel.vue'

/**
 * 目标标注
 * 重点关注、标签管理两个协作面板。
 */
defineOptions({ name: 'TargetMarking' })

const activeTab = ref('focus')
</script>

<style lang="scss" scoped>
.target-marking-page {
  padding: 4px;
}
.marking-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 12px;
    background: var(--el-bg-color);
    padding: 0 16px;
  }
  :deep(.el-tabs__content) {
    padding: 0;
  }
}
</style>
