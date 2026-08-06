<template>
  <ElDialog
    :model-value="visible"
    title="版本切换"
    width="520px"
    destroy-on-close
    class="annot-ai-algorithm-service-version-dialog"
    @update:model-value="handleVisibleChange"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="目标版本" prop="version">
        <ElSelect v-model="form.version" placeholder="选择目标版本" style="width: 100%">
          <ElOption v-for="v in service?.versions || []" :key="v" :label="v" :value="v" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="切换原因" prop="reason">
        <ElInput
          v-model="form.reason"
          type="textarea"
          :rows="4"
          maxlength="200"
          show-word-limit
          placeholder="请输入切换原因（2-200字）"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="handleVisibleChange(false)">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认切换</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAiStore } from '@/store/modules/ai'

/**
 * 算法服务版本切换弹窗
 * 选择目标版本并填写切换原因，提交成功后由模拟引擎完成版本切换
 */
defineOptions({ name: 'VersionSwitchDialog' })

const props = defineProps<{ visible: boolean; service: any }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void; (e: 'success'): void }>()

const aiStore = useAiStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const form = reactive({ version: '', reason: '' })

const rules: FormRules = {
  version: [{ required: true, message: '请选择目标版本', trigger: 'change' }],
  reason: [
    { required: true, message: '请输入切换原因', trigger: 'blur' },
    { min: 2, max: 200, message: '切换原因需为2-200字', trigger: 'blur' }
  ]
}

function handleVisibleChange(value: boolean) {
  if (!value) {
    form.version = ''
    form.reason = ''
  }
  emit('update:visible', value)
}

/** 提交版本切换，成功后通知父级刷新 */
async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    await aiStore.switchServiceVersion(props.service.id, form.version, form.reason)
    ElMessage.success('版本切换成功')
    emit('success')
    handleVisibleChange(false)
  } finally {
    submitting.value = false
  }
}

// 每次打开时清空表单，避免残留上一次内容
watch(
  () => props.visible,
  (value) => {
    if (value) {
      form.version = ''
      form.reason = ''
      formRef.value?.clearValidate()
    }
  }
)
</script>
