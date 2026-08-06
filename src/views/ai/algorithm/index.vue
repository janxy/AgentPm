<template>
  <div class="ai-algorithm-page">
    <ElTabs v-model="activeTab" class="algorithm-tabs annot-ai-algorithm-tabs">
      <ElTabPane label="算法服务管理" name="service">
        <ServiceManagementPanel />
      </ElTabPane>

      <ElTabPane label="船型识别" name="ship">
        <ShipRecognitionPanel />
      </ElTabPane>

      <ElTabPane label="异常行为检测" name="behavior">
        <BehaviorAnalysisPanel />
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ServiceManagementPanel from './components/ServiceManagementPanel.vue'
import ShipRecognitionPanel from './components/ShipRecognitionPanel.vue'
import BehaviorAnalysisPanel from './components/BehaviorAnalysisPanel.vue'

/**
 * AI智能研判页面
 * 算法中台：算法服务管理、船型识别与异常行为检测
 */
defineOptions({ name: 'AiAlgorithm' })

const activeTab = ref('service')
</script>

<style lang="scss" scoped>
.ai-algorithm-page {
  height: 100%;
  padding: 4px;
}
.algorithm-tabs {
  height: 100%;
  :deep(.el-tabs__content) {
    height: calc(100% - 42px);
    overflow: auto;
  }
  :deep(.el-tab-pane) {
    height: 100%;
  }
}
</style>
