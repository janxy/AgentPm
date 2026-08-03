<template>
  <ElCard shadow="never" class="gimbal-card">
    <template #header><span class="card-title">云台控制</span></template>
    <div class="angle-grid">
      <div class="angle-item">
        <span class="angle-label">方位角</span>
        <strong class="angle-value">{{ state?.pan?.toFixed(1) ?? '-' }}°</strong>
      </div>
      <div class="angle-item">
        <span class="angle-label">俯仰角</span>
        <strong class="angle-value">{{ state?.tilt?.toFixed(1) ?? '-' }}°</strong>
      </div>
      <div class="angle-item">
        <span class="angle-label">倍率</span>
        <strong class="angle-value">×{{ state?.zoom ?? '-' }}</strong>
      </div>
      <div class="angle-item">
        <span class="angle-label">聚焦</span>
        <strong class="angle-value">{{ state?.focus ?? '-' }}</strong>
      </div>
    </div>

    <div class="step-row">
      <span>步长</span>
      <ElSelect v-model="step" size="small" class="step-select" :disabled="!canControl">
        <ElOption label="0.1°" :value="0.1" />
        <ElOption label="0.5°" :value="0.5" />
        <ElOption label="1°" :value="1" />
        <ElOption label="5°" :value="5" />
      </ElSelect>
    </div>

    <div class="pad-grid">
      <ElButton :icon="TopLeft" circle :disabled="!canControl" @click="emit('control', 'leftUp', step)" />
      <ElButton :icon="ArrowUpBold" circle :disabled="!canControl" @click="emit('control', 'up', step)" />
      <ElButton :icon="TopRight" circle :disabled="!canControl" @click="emit('control', 'rightUp', step)" />
      <ElButton :icon="ArrowLeftBold" circle :disabled="!canControl" @click="emit('control', 'left', step)" />
      <div class="pad-center">云台</div>
      <ElButton :icon="ArrowRightBold" circle :disabled="!canControl" @click="emit('control', 'right', step)" />
      <ElButton :icon="BottomLeft" circle :disabled="!canControl" @click="emit('control', 'leftDown', step)" />
      <ElButton :icon="ArrowDownBold" circle :disabled="!canControl" @click="emit('control', 'down', step)" />
      <ElButton :icon="BottomRight" circle :disabled="!canControl" @click="emit('control', 'rightDown', step)" />
    </div>

    <div class="lens-row">
      <ElButton size="small" :disabled="!canControl" @click="emit('control', 'zoomIn')">变倍 +</ElButton>
      <ElButton size="small" :disabled="!canControl" @click="emit('control', 'zoomOut')">变倍 -</ElButton>
      <ElButton size="small" :disabled="!canControl" @click="emit('control', 'focusNear')">聚焦近</ElButton>
      <ElButton size="small" :disabled="!canControl" @click="emit('control', 'focusFar')">聚焦远</ElButton>
    </div>
  </ElCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowUpBold, ArrowDownBold, ArrowLeftBold, ArrowRightBold,
  TopLeft, TopRight, BottomLeft, BottomRight
} from '@element-plus/icons-vue'

/**
 * 云台控制面板
 * 提供八方向转动、步长选择、变倍聚焦与角度状态展示
 */
const props = defineProps<{ device: any; state: any }>()
const emit = defineEmits<{ control: [action: string, step?: number] }>()

const step = ref(0.5)
const canControl = computed(() => !!props.device && props.device.status === 1)
</script>

<style lang="scss" scoped>
.gimbal-card { height: 100%; }
.card-title { font-size: 15px; font-weight: 600; }
.angle-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.angle-item { padding: 10px 12px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; background: var(--el-fill-color-light); display: flex; flex-direction: column; gap: 4px; }
.angle-label { font-size: 12px; color: var(--el-text-color-secondary); }
.angle-value { font-size: 18px; font-weight: 600; color: var(--el-color-primary); }
.step-row { display: flex; align-items: center; gap: 8px; margin: 12px 0; font-size: 13px; color: var(--el-text-color-regular); }
.step-select { width: 100px; }
.pad-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; justify-items: center; padding: 12px; background: var(--el-fill-color-light); border-radius: 8px; }
.pad-center { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; background: var(--el-bg-color); font-size: 12px; color: var(--el-text-color-secondary); }
.lens-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
</style>
