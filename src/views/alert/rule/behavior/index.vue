<template>
  <div class="behavior-page">
    <ElCard shadow="never" class="ship-filter-card">
      <span class="filter-label">适用船型：</span>
      <ElCheckboxGroup v-model="activeShipTypes" @change="loadRules">
        <ElCheckboxButton v-for="s in shipTypes" :key="s" :value="s">{{ s }}</ElCheckboxButton>
        <ElCheckboxButton value="全部">全部</ElCheckboxButton>
      </ElCheckboxGroup>
    </ElCard>

    <div v-loading="loading" class="behavior-cards">
      <ElCard v-for="rule in filteredRules" :key="rule.id" shadow="hover" class="behavior-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">{{ ruleNameMap[rule.behaviorType] }}</span>
            <ElSwitch v-model="rule.status" :active-value="1" :inactive-value="0" size="small" @change="(val: any) => saveRule(rule, { status: val })" />
          </div>
        </template>

        <!-- 航速异常 -->
        <template v-if="rule.behaviorType === 'speed'">
          <ElForm label-width="100px" size="small">
            <ElFormItem label="航速上限(节)">
              <ElInputNumber v-model="rule.params.speedMax" :min="1" :max="100" @change="saveRule(rule)" />
            </ElFormItem>
            <ElFormItem label="航速下限(节)">
              <ElInputNumber v-model="rule.params.speedMin" :min="0" :max="99" @change="saveRule(rule)" />
            </ElFormItem>
            <ElFormItem label="持续时长(秒)">
              <ElInputNumber v-model="rule.params.duration" :min="1" :max="3600" @change="saveRule(rule)" />
            </ElFormItem>
          </ElForm>
        </template>

        <!-- 航向异常 -->
        <template v-if="rule.behaviorType === 'course'">
          <ElForm label-width="110px" size="small">
            <ElFormItem label="航向偏差(度)">
              <ElInputNumber v-model="rule.params.courseAngle" :min="1" :max="180" @change="saveRule(rule)" />
            </ElFormItem>
            <ElFormItem label="持续时长(秒)">
              <ElInputNumber v-model="rule.params.duration" :min="1" :max="3600" @change="saveRule(rule)" />
            </ElFormItem>
          </ElForm>
        </template>

        <!-- 异常停留 -->
        <template v-if="rule.behaviorType === 'stay'">
          <ElForm label-width="120px" size="small">
            <ElFormItem label="停留时长(分钟)">
              <ElInputNumber v-model="rule.params.stayDuration" :min="1" :max="1440" @change="saveRule(rule)" />
            </ElFormItem>
          </ElForm>
        </template>

        <!-- 轨迹断线 -->
        <template v-if="rule.behaviorType === 'disconnect'">
          <ElForm label-width="120px" size="small">
            <ElFormItem label="断线判定(秒)">
              <ElInputNumber v-model="rule.params.disconnectDuration" :min="1" :max="3600" @change="saveRule(rule)" />
            </ElFormItem>
            <ElFormItem label="自动研判分类">
              <ElCheckboxGroup v-model="rule.params.autoClassify" @change="saveRule(rule)">
                <ElCheckbox value="信号丢失" /><ElCheckbox value="设备故障" /><ElCheckbox value="目标消失" /><ElCheckbox value="未知" />
              </ElCheckboxGroup>
            </ElFormItem>
          </ElForm>
        </template>

        <div class="card-footer">
          <div class="card-meta">
            <span>适用船型：</span><ElTag v-for="s in rule.shipTypes" :key="s" size="small" class="ship-tag">{{ s }}</ElTag>
          </div>
          <div class="alert-level-row">
            <span>告警级别：</span>
            <ElSelect v-model="rule.alertLevel" size="small" style="width:100px" @change="saveRule(rule)">
              <ElOption label="提示" value="tip" /><ElOption label="一般" value="normal" /><ElOption label="重要" value="important" /><ElOption label="紧急" value="urgent" />
            </ElSelect>
          </div>
        </div>
      </ElCard>
    </div>

    <ElEmpty v-if="!loading && filteredRules.length === 0" description="暂无行为预警规则" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getBehaviorRuleList, updateBehaviorRule } from '@/api/alert'

defineOptions({ name: 'AlertRuleBehavior' })

const ruleNameMap: Record<string, string> = { speed: '航速异常', course: '航向异常', stay: '异常停留', disconnect: '轨迹断线' }
const shipTypes = ['渔船', '货船', '客船', '快艇', '橡皮艇', '三无船']

const loading = ref(false)
const rules = ref<any[]>([])
const activeShipTypes = ref<string[]>(['全部'])

const filteredRules = computed(() => {
  if (activeShipTypes.value.includes('全部')) return rules.value
  return rules.value.filter((r) => r.shipTypes.some((s: string) => activeShipTypes.value.includes(s)))
})

async function loadRules() {
  loading.value = true
  try {
    const shipType = activeShipTypes.value.includes('全部') ? '全部' : activeShipTypes.value[0] || '全部'
    const { data } = await getBehaviorRuleList({ shipType })
    rules.value = (data as any)?.list || []
  } finally { loading.value = false }
}

async function saveRule(rule: any, overrides?: any) {
  try {
    const updateData = { ...rule, ...overrides }
    await updateBehaviorRule(rule.id, updateData)
    ElMessage.success('规则已更新')
  } catch { ElMessage.error('保存失败') }
}

onMounted(() => { loadRules() })
</script>

<style lang="scss" scoped>
.ship-filter-card {
  margin-bottom: 16px;
  :deep(.el-card__body) { padding: 12px 16px; display: flex; align-items: center; gap: 8px; }
}
.filter-label { font-weight: 500; white-space: nowrap; }
.behavior-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
}
.behavior-card {
  :deep(.el-card__header) { padding: 12px 16px; }
  :deep(.el-card__body) { padding: 16px; }
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title { font-weight: 600; font-size: 15px; }
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.card-meta { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.ship-tag { margin: 0 2px; }
.alert-level-row { display: flex; align-items: center; gap: 4px; }
</style>
