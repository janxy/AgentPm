<template>
  <div class="device-tree-panel">
    <div class="tree-tools annot-device-overview-tree-tools">
      <ElRadioGroup v-model="groupMode" size="small">
        <ElRadioButton value="type">按类型</ElRadioButton>
        <ElRadioButton value="region">按区域</ElRadioButton>
      </ElRadioGroup>
      <ElInput v-model="keyword" placeholder="搜索设备名称/编码" clearable size="small" class="tree-search" />
    </div>
    <ElTree
      :data="treeData"
      node-key="key"
      :props="treeProps"
      highlight-current
      :current-node-key="selectedKey"
      default-expand-all
      ref="treeRef"
      class="device-tree annot-device-overview-tree"
      @node-click="handleNodeClick"
    >
      <template #default="{ data }">
        <div class="tree-node">
          <span class="node-label" :class="{ 'is-leaf': !!data.device }">{{ data.label }}</span>
          <span v-if="data.device" class="status-dot" :class="'dot-' + data.device.status" />
          <div v-if="data.device" class="node-actions" @click.stop>
            <ElButton v-if="linkPath(data.device.type)" link type="primary" size="small" @click="emit('quickLink', data.device)">联动</ElButton>
            <ElButton link type="primary" size="small" @click="emit('detail', data.device)">详情</ElButton>
          </div>
        </div>
      </template>
    </ElTree>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/**
 * 设备树面板
 * 支持按类型/区域分组、关键字搜索，节点状态着色并触发选中/详情/快速联动
 */
const props = defineProps<{ devices: any[]; selectedId: number | null }>()
const emit = defineEmits<{ select: [device: any]; detail: [device: any]; quickLink: [device: any] }>()

const groupMode = ref<'type' | 'region'>('type')
const keyword = ref('')
const treeProps = { children: 'children', label: 'label' }
const treeRef = ref()

const typeLabel: Record<string, string> = { optic: '光电设备', uav: '无人机', radar: '雷达站', weather: '气象站' }
const linkPath = (type: string) => ['optic', 'uav', 'radar'].includes(type)

/** 按当前分组模式与关键字生成树数据 */
const treeData = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const filtered = props.devices.filter(
    (d) => !kw || d.name.toLowerCase().includes(kw) || d.code.toLowerCase().includes(kw)
  )
  if (groupMode.value === 'region') {
    const regions = Array.from(new Set(filtered.map((d) => d.regionName)))
    return regions.map((region) => ({
      key: `region-${region}`,
      label: region,
      children: filtered.filter((d) => d.regionName === region).map(toLeaf)
    }))
  }
  return Object.entries(typeLabel).map(([type, label]) => ({
    key: `type-${type}`,
    label,
    children: filtered.filter((d) => d.type === type).map(toLeaf)
  }))
})

function toLeaf(device: any) {
  return { key: `device-${device.id}`, label: device.name, device }
}

const selectedKey = computed(() => (props.selectedId ? `device-${props.selectedId}` : ''))

function handleNodeClick(data: any) {
  if (data.device) emit('select', data.device)
}

/** 外部选中设备时同步树节点高亮 */
watch(() => props.selectedId, (id) => {
  if (id) treeRef.value?.setCurrentKey(`device-${id}`)
})
</script>

<style lang="scss" scoped>
.device-tree-panel { display: flex; flex-direction: column; height: 100%; }
.tree-tools { display: flex; flex-direction: column; gap: 10px; padding: 12px 12px 8px; border-bottom: 1px solid var(--el-border-color-lighter); }
.tree-search { width: 100%; }
.device-tree { flex: 1; overflow: auto; padding: 8px; }
.tree-node { display: flex; align-items: center; gap: 8px; padding-right: 8px; }
.node-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.node-label.is-leaf { color: var(--el-text-color-primary); }
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.dot-1 { background: var(--el-color-success); }
.dot-0 { background: var(--el-color-info); }
.dot-2 { background: var(--el-color-danger); }
.node-actions { display: flex; flex: none; opacity: 0; transition: opacity 0.15s ease; }
.tree-node:hover .node-actions { opacity: 1; }
</style>
