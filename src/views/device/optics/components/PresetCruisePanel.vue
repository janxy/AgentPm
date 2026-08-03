<template>
  <ElCard shadow="never" class="preset-card">
    <template #header><span class="card-title">预置位与巡航</span></template>

    <div class="preset-add">
      <ElInput v-model="newPresetName" placeholder="预置位名称" size="small" maxlength="20" :disabled="!canControl" />
      <ElButton type="primary" size="small" :disabled="!canControl || !newPresetName.trim()" @click="addPreset">记录当前位置</ElButton>
    </div>

    <ElTable :data="presets" size="small" class="preset-table" empty-text="暂无预置位">
      <ElTableColumn prop="name" label="名称" min-width="90" show-overflow-tooltip>
        <template #default="{ row }">
          <ElInput v-if="editingId === row.id" v-model="editName" size="small" @keyup.enter="saveRename(row)" />
          <span v-else>{{ row.name }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="方位/倍率" width="110">
        <template #default="{ row }">{{ row.pan.toFixed(1) }}° / ×{{ row.zoom }}</template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="150" align="center">
        <template #default="{ row }">
          <template v-if="editingId === row.id">
            <ElButton link type="success" size="small" @click="saveRename(row)">保存</ElButton>
            <ElButton link size="small" @click="editingId = null">取消</ElButton>
          </template>
          <template v-else>
            <ElButton link type="primary" size="small" :disabled="!canControl" @click="emit('presetCall', row)">调用</ElButton>
            <ElButton link size="small" @click="startRename(row)">重命名</ElButton>
            <ElButton link type="danger" size="small" @click="emit('presetDelete', row)">删除</ElButton>
          </template>
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="cruise-form">
      <div class="form-title">新增巡航计划</div>
      <ElInput v-model="cruiseName" placeholder="计划名称" size="small" maxlength="20" :disabled="!canControl" />
      <ElSelect v-model="cruisePresetIds" multiple placeholder="按顺序选择预置位" size="small" class="preset-select" :disabled="!canControl">
        <ElOption v-for="p in presets" :key="p.id" :label="p.name" :value="p.id" />
      </ElSelect>
      <div class="dwell-row">
        <span>停留</span>
        <ElInputNumber v-model="dwellSeconds" :min="2" :max="60" size="small" />
        <span>秒</span>
        <ElButton type="primary" size="small" :disabled="!canControl || cruisePresetIds.length < 2 || !cruiseName.trim()" @click="saveCruise">保存计划</ElButton>
      </div>
    </div>

    <ElTable :data="cruisePlans" size="small" class="cruise-table" empty-text="暂无巡航计划">
      <ElTableColumn prop="name" label="计划" min-width="90" show-overflow-tooltip />
      <ElTableColumn label="预置位" width="80" align="center">
        <template #default="{ row }">{{ row.presetIds.length }} 个</template>
      </ElTableColumn>
      <ElTableColumn label="状态" width="80" align="center">
        <template #default="{ row }">
          <ElTag v-if="runningPlanId === row.id" type="success" size="small">执行中</ElTag>
          <ElTag v-else type="info" size="small">待机</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="120" align="center">
        <template #default="{ row }">
          <ElButton v-if="runningPlanId !== row.id" link type="primary" size="small" :disabled="!canControl || row.presetIds.length < 2" @click="emit('cruiseStart', row)">启动</ElButton>
          <ElButton v-else link type="warning" size="small" :disabled="!canControl" @click="emit('cruiseStop')">停止</ElButton>
          <ElButton link type="danger" size="small" :disabled="runningPlanId === row.id" @click="emit('cruiseDelete', row)">删除</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </ElCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * 预置位与巡航面板
 * 预置位新增/调用/重命名/删除，巡航计划配置、启动与停止
 */
const props = defineProps<{ device: any; presets: any[]; cruisePlans: any[]; runningPlanId: number | null }>()
const emit = defineEmits<{
  presetAdd: [name: string]
  presetCall: [preset: any]
  presetRename: [preset: any, name: string]
  presetDelete: [preset: any]
  cruiseSave: [plan: any]
  cruiseStart: [plan: any]
  cruiseStop: []
  cruiseDelete: [plan: any]
}>()

const newPresetName = ref('')
const editingId = ref<number | null>(null)
const editName = ref('')
const cruiseName = ref('')
const cruisePresetIds = ref<number[]>([])
const dwellSeconds = ref(5)
const canControl = computed(() => !!props.device && props.device.status === 1)

function addPreset() {
  emit('presetAdd', newPresetName.value.trim())
  newPresetName.value = ''
}

function startRename(preset: any) {
  editingId.value = preset.id
  editName.value = preset.name
}

function saveRename(preset: any) {
  if (!editName.value.trim()) return
  emit('presetRename', preset, editName.value.trim())
  editingId.value = null
}

function saveCruise() {
  emit('cruiseSave', {
    deviceId: props.device?.id,
    name: cruiseName.value.trim(),
    presetIds: [...cruisePresetIds.value],
    dwellSeconds: dwellSeconds.value
  })
  cruiseName.value = ''
  cruisePresetIds.value = []
}
</script>

<style lang="scss" scoped>
.preset-card { height: 100%; overflow: auto; }
.card-title { font-size: 15px; font-weight: 600; }
.preset-add { display: flex; gap: 8px; margin-bottom: 10px; }
.preset-table { margin-bottom: 14px; }
.cruise-form { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.form-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-regular); }
.preset-select { width: 100%; }
.dwell-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--el-text-color-regular); }
.cruise-table { :deep(.el-table__row) { cursor: default; } }
</style>
