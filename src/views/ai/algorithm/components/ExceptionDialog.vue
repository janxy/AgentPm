<template>
  <ElDialog
    :model-value="visible"
    title="异常处理"
    width="560px"
    destroy-on-close
    class="annot-ai-algorithm-service-exception-dialog"
    @update:model-value="handleVisibleChange"
  >
    <template v-if="service?.exception">
      <ElAlert
        :type="service.exception.recovered ? 'success' : 'error'"
        :closable="false"
        show-icon
        :title="service.exception.recovered ? '服务已恢复，识别请求自动恢复' : '服务异常，识别请求可能延迟或缺失'"
        class="exception-alert"
      />
      <ElDescriptions :column="1" border size="small">
        <ElDescriptionsItem label="异常时间">{{ service.exception.time }}</ElDescriptionsItem>
        <ElDescriptionsItem label="异常类型">{{ service.exception.type }}</ElDescriptionsItem>
        <ElDescriptionsItem label="异常描述">{{ service.exception.description }}</ElDescriptionsItem>
        <ElDescriptionsItem label="影响范围">{{ service.exception.scope }}</ElDescriptionsItem>
        <ElDescriptionsItem label="恢复状态">
          <ElTag :type="service.exception.recovered ? 'success' : 'danger'" size="small" disable-transitions>
            {{ service.exception.recovered ? '已恢复' : '未恢复' }}
          </ElTag>
        </ElDescriptionsItem>
      </ElDescriptions>
    </template>
    <ElEmpty v-else description="暂无异常信息" />
  </ElDialog>
</template>

<script setup lang="ts">
/**
 * 算法服务异常详情弹窗
 * 展示异常时间、类型、描述、影响范围与恢复状态
 */
defineOptions({ name: 'ExceptionDialog' })

defineProps<{ visible: boolean; service: any }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

function handleVisibleChange(value: boolean) {
  emit('update:visible', value)
}
</script>

<style lang="scss" scoped>
.exception-alert {
  margin-bottom: 16px;
}
</style>
