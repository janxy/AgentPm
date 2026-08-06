<template>
  <ElDialog
    :model-value="visible"
    title="人工复核"
    width="520px"
    destroy-on-close
    class="annot-ai-algorithm-ship-review-dialog"
    @update:model-value="handleVisibleChange"
  >
    <div v-if="record" class="review-summary">
      <div class="review-item">
        <span class="review-label">目标</span>
        <span>{{ record.target }}</span>
      </div>
      <div class="review-item">
        <span class="review-label">当前识别</span>
        <span>{{ record.shipType }} / 置信度 {{ record.confidence }}%</span>
      </div>
    </div>
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="识别船型" prop="shipType">
        <ElSelect v-model="form.shipType" placeholder="选择船型" :disabled="form.conclusion === '确认无误'" style="width: 100%">
          <ElOption v-for="type in shipTypes" :key="type" :label="type" :value="type" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="复核结论" prop="conclusion">
        <ElRadioGroup v-model="form.conclusion">
          <ElRadio value="确认无误">确认无误</ElRadio>
          <ElRadio value="修改船型">修改船型</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="复核说明" prop="note">
        <ElInput
          v-model="form.note"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="修改船型时建议填写原因（选填）"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="handleVisibleChange(false)">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">提交复核</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAiStore } from '@/store/modules/ai'
import { useUserStore } from '@/store/modules/user'

/**
 * 船型识别人工复核弹窗
 * 支持确认无误或修改船型，提交后结果进入识别研判库
 */
defineOptions({ name: 'ShipReviewDialog' })

const props = defineProps<{ visible: boolean; record: any }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void; (e: 'success'): void }>()

const aiStore = useAiStore()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const shipTypes = ['渔船', '货船', '客船', '快艇', '橡皮艇', '三无船']
const form = reactive({ shipType: '', conclusion: '确认无误', note: '' })

const rules: FormRules = {
  shipType: [{ required: true, message: '请选择识别船型', trigger: 'change' }],
  conclusion: [{ required: true, message: '请选择复核结论', trigger: 'change' }]
}

function handleVisibleChange(value: boolean) {
  if (!value) {
    form.shipType = ''
    form.conclusion = '确认无误'
    form.note = ''
  }
  emit('update:visible', value)
}

/** 提交复核结果，成功后通知父级刷新列表 */
async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const operator =
      userStore.getUserInfo?.name ||
      userStore.getUserInfo?.nickName ||
      userStore.getUserInfo?.username ||
      '值班员'
    await aiStore.reviewShipRecord(props.record.id, {
      shipType: form.shipType,
      conclusion: form.conclusion,
      note: form.note,
      operator
    })
    ElMessage.success('复核成功')
    emit('success')
    handleVisibleChange(false)
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.visible,
  (value) => {
    if (value && props.record) {
      form.shipType = props.record.shipType
      form.conclusion = '确认无误'
      form.note = props.record.reviewNote || ''
      formRef.value?.clearValidate()
    }
  }
)
</script>

<style lang="scss" scoped>
.review-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.review-item {
  display: flex;
  gap: 8px;
}
.review-label {
  color: var(--el-text-color-secondary);
}
</style>
