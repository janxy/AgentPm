<template>
  <ElDialog
    :model-value="visible"
    title="误报/漏报反馈"
    width="560px"
    destroy-on-close
    class="annot-ai-assistant-feedback-dialog"
    @update:model-value="handleVisibleChange"
  >
    <ElForm ref="formRef" :model="form" :rules="formRules" label-width="100px">
      <ElFormItem label="样本目标">
        <ElInput :model-value="target" disabled />
      </ElFormItem>
      <ElFormItem label="关联事件">
        <ElInput :model-value="alarmNo" disabled />
      </ElFormItem>
      <ElFormItem label="反馈类型" prop="type">
        <ElRadioGroup v-model="form.type">
          <ElRadioButton label="误报" />
          <ElRadioButton label="漏报" />
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="反馈原因" prop="reasons">
        <ElCheckboxGroup v-model="form.reasons" class="reason-group">
          <ElCheckbox v-for="reason in reasonOptions" :key="reason" :label="reason" />
        </ElCheckboxGroup>
      </ElFormItem>
      <ElFormItem label="样本说明" prop="description">
        <ElInput
          v-model="form.description"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="补充样本描述（选填）"
          resize="none"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="handleVisibleChange(false)">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">提交反馈</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAiStore } from '@/store/modules/ai'

/**
 * 误报/漏报反馈弹窗
 * 提交反馈类型、原因与样本说明，同一类型样本不可重复提交
 */
defineOptions({ name: 'AssistantFeedbackDialog' })

const props = defineProps<{ visible: boolean; target: string; alarmNo: string }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void; (e: 'success'): void }>()

const aiStore = useAiStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const reasonOptions = ['天气干扰', '算法误判', '参数不当', '其他']

const form = reactive<{ type: string; reasons: string[]; description: string }>({
  type: '',
  reasons: [],
  description: ''
})

const formRules: FormRules = {
  type: [{ required: true, message: '请选择反馈类型', trigger: 'change' }],
  reasons: [{ required: true, type: 'array', min: 1, message: '请至少选择一项反馈原因', trigger: 'change' }]
}

function handleVisibleChange(value: boolean) {
  if (!value) emit('update:visible', false)
}

/** 提交反馈，成功后将反馈记录加入误报治理 */
async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const result: any = await aiStore.submitAssistantFeedbackRecord({
      target: props.target,
      alarmNo: props.alarmNo,
      type: form.type,
      reasons: form.reasons,
      description: form.description
    })
    if (result?.error) {
      ElMessage.error(result.error)
      return
    }
    ElMessage.success('反馈已提交')
    emit('success')
    handleVisibleChange(false)
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.reason-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}
</style>
