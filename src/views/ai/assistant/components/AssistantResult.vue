<template>
  <div class="assistant-result">
    <template v-if="targetSection">
      <div class="result-block annot-ai-assistant-result-target">
        <div class="block-title">
          <span>目标查询</span>
          <ElTag size="small" effect="plain" type="primary">{{ targets.length }} 个目标</ElTag>
        </div>
        <div ref="targetMapRef" class="result-map"></div>
        <ElTable :data="targets" border stripe class="result-table" empty-text="未找到相关结果">
          <ElTableColumn prop="name" label="目标名称" min-width="130" />
          <ElTableColumn label="状态" width="80" align="center">
            <template #default="{ row }">
              <ElTag :type="(targetStatusMap as any)[row.status]" size="small" disable-transitions>{{ row.status }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="sources" label="数据来源" min-width="140" />
          <ElTableColumn label="操作" width="80" align="center">
            <template #default="{ row }">
              <ElButton link type="primary" @click="focusTarget(row)">定位</ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
    </template>

    <template v-if="alarmSection">
      <div class="result-block annot-ai-assistant-result-alarm">
        <div class="block-title">
          <span>告警查询</span>
          <ElTag size="small" effect="plain" type="danger">{{ alarms.length }} 条告警</ElTag>
        </div>
        <div class="distribution-row">
          <div v-for="item in alarmDistribution" :key="item.level" class="distribution-item">
            <span class="distribution-level">{{ item.level }}</span>
            <span class="distribution-count">{{ item.count }}</span>
          </div>
        </div>
        <ElTable :data="alarms" border stripe class="result-table" empty-text="未找到相关结果">
          <ElTableColumn prop="alarmNo" label="告警编号" width="140" />
          <ElTableColumn prop="type" label="告警类型" min-width="110" />
          <ElTableColumn prop="target" label="目标" min-width="120" />
          <ElTableColumn label="等级" width="80" align="center">
            <template #default="{ row }">
              <ElTag :type="(alarmLevelMap as any)[row.level]" size="small" disable-transitions>{{ row.level }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="time" label="发生时间" width="170" />
          <ElTableColumn prop="status" label="处置状态" min-width="90" />
        </ElTable>
      </div>
    </template>

    <template v-if="areaSection">
      <div class="result-block annot-ai-assistant-result-area">
        <div class="block-title">
          <span>区域查询</span>
          <ElTag size="small" effect="plain" type="primary">{{ areas.length }} 个区域</ElTag>
        </div>
        <div ref="areaMapRef" class="result-map"></div>
        <ElTable :data="areas" border stripe class="result-table" empty-text="未找到相关区域">
          <ElTableColumn prop="name" label="区域名称" min-width="130" />
          <ElTableColumn prop="code" label="区域编码" min-width="120" />
          <ElTableColumn label="管控状态" width="100" align="center">
            <template #default="{ row }">
              <ElTag :type="(areaStatusMap as any)[row.status]" size="small" disable-transitions>{{ row.status }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="操作" width="80" align="center">
            <template #default="{ row }">
              <ElButton link type="primary" @click="focusArea(row)">定位</ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
    </template>

    <template v-if="guideSection">
      <div class="result-block annot-ai-assistant-result-guide">
        <div class="block-title">
          <span>操作指引</span>
          <ElTag size="small" effect="plain" type="primary">{{ guide.title }}</ElTag>
        </div>
        <div class="guide-list">
          <div v-for="(step, index) in guide.steps" :key="step" class="guide-item">
            <span class="guide-index">{{ index + 1 }}</span>
            <span class="guide-text">{{ step }}</span>
          </div>
        </div>
        <ElButton type="primary" plain :icon="Position" @click="emit('guide', guide.path)">进入对应功能页面</ElButton>
      </div>
    </template>

    <template v-if="assistSection">
      <div class="result-block annot-ai-assistant-result-assist">
        <div class="block-title">
          <span>辅助研判</span>
        </div>
        <ElDescriptions :column="2" border size="small" class="assist-descriptions">
          <ElDescriptionsItem label="事件摘要" :span="2">{{ assist.summary }}</ElDescriptionsItem>
          <ElDescriptionsItem label="AI结论" :span="2">{{ assist.conclusion }}</ElDescriptionsItem>
          <ElDescriptionsItem label="数据来源">{{ assist.sources.join('、') }}</ElDescriptionsItem>
          <ElDescriptionsItem label="事件编号">{{ assist.eventNo }}</ElDescriptionsItem>
        </ElDescriptions>
        <div class="suggest-title">处置建议</div>
        <div class="suggest-list">
          <div v-for="(item, index) in assist.suggestions" :key="item" class="suggest-item">
            <span class="guide-index">{{ index + 1 }}</span>
            <span>{{ item }}</span>
          </div>
        </div>
        <ElButton v-roles="['值班员', '指挥员']" :icon="Warning" @click="emit('feedback', { target: assist.target, alarmNo: assist.eventNo })">反馈</ElButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Position, Warning } from '@element-plus/icons-vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps<{ message: any }>()
const emit = defineEmits<{
  (e: 'guide', path?: string): void
  (e: 'feedback', payload: { target: string; alarmNo: string }): void
}>()

const targetMapRef = ref<HTMLDivElement>()
const areaMapRef = ref<HTMLDivElement>()

const targetStatusMap: Record<string, string> = { 正常: 'success', 关注: 'warning', 异常: 'danger' }
const alarmLevelMap: Record<string, string> = { 紧急: 'danger', 重要: 'warning', 一般: 'info', 提示: '' }
const areaStatusMap: Record<string, string> = { 常规: 'info', 管控中: 'primary', 重点管控: 'danger' }

const tileUrl = 'https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=5f23a6c8375bf184bbd6f8fa9d552029'

let targetMap: L.Map | null = null
let areaMap: L.Map | null = null
let targetMarkerLayer: L.LayerGroup | null = null
let areaMarkerLayer: L.LayerGroup | null = null

const sections = computed(() => props.message?.sections || [])
const resultData = computed(() => props.message?.data || {})
const targetSection = computed(() => sections.value.some((s: any) => s.key === 'targets'))
const alarmSection = computed(() => sections.value.some((s: any) => s.key === 'alarms'))
const areaSection = computed(() => sections.value.some((s: any) => s.key === 'areas'))
const guideSection = computed(() => sections.value.some((s: any) => s.key === 'guide'))
const assistSection = computed(() => sections.value.some((s: any) => s.key === 'assist'))
const targets = computed(() => resultData.value.targets || [])
const alarms = computed(() => resultData.value.alarms || [])
const alarmDistribution = computed(() => resultData.value.alarmDistribution || [])
const areas = computed(() => resultData.value.areas || [])
const guide = computed(() => resultData.value.guide || { steps: [] })
const assist = computed(() => resultData.value.assist || { suggestions: [], sources: [] })

function renderMaps() {
  renderTargetMap()
  renderAreaMap()
}

function renderTargetMap() {
  if (!targetSection.value || !targetMapRef.value) return
  if (!targetMap) {
    targetMap = L.map(targetMapRef.value).setView([29.9, 122.1], 9)
    L.tileLayer(tileUrl, { maxZoom: 18, subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'], attribution: '' }).addTo(targetMap)
    targetMarkerLayer = L.layerGroup().addTo(targetMap)
  }
  targetMarkerLayer?.clearLayers()
  targets.value.forEach((target: any) => {
    const marker = L.circleMarker(target.position, {
      radius: 8,
      color: '#ffffff',
      weight: 1,
      fillColor: targetStatusMap[target.status] === 'danger' ? '#f56c6c' : targetStatusMap[target.status] === 'warning' ? '#e6a23c' : '#67c23a',
      fillOpacity: 0.9
    })
    const box = document.createElement('div')
    box.className = 'map-popup'
    const title = document.createElement('strong')
    title.textContent = target.name
    const info = document.createElement('span')
    info.textContent = `${target.status} · ${target.sources}`
    box.append(title, info)
    marker.bindPopup(box)
    marker.addTo(targetMarkerLayer!)
  })
  setTimeout(() => targetMap?.invalidateSize(), 120)
}

function renderAreaMap() {
  if (!areaSection.value || !areaMapRef.value) return
  if (!areaMap) {
    areaMap = L.map(areaMapRef.value).setView([29.95, 122.1], 9)
    L.tileLayer(tileUrl, { maxZoom: 18, subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'], attribution: '' }).addTo(areaMap)
    areaMarkerLayer = L.layerGroup().addTo(areaMap)
  }
  areaMarkerLayer?.clearLayers()
  areas.value.forEach((area: any) => {
    const circle = L.circle(area.center, { radius: 2600, color: '#409eff', weight: 1, fillColor: '#409eff', fillOpacity: 0.14 })
    const box = document.createElement('div')
    box.className = 'map-popup'
    const title = document.createElement('strong')
    title.textContent = area.name
    const info = document.createElement('span')
    info.textContent = `${area.code} · ${area.status}`
    box.append(title, info)
    circle.bindPopup(box)
    circle.addTo(areaMarkerLayer!)
  })
  setTimeout(() => areaMap?.invalidateSize(), 120)
}

function focusTarget(target: any) {
  if (targetMap) targetMap.setView(target.position, Math.max(targetMap.getZoom(), 11))
}

function focusArea(area: any) {
  if (areaMap) areaMap.setView(area.center, Math.max(areaMap.getZoom(), 11))
}

onMounted(() => {
  nextTick(renderMaps)
})

watch(sections, () => nextTick(renderMaps), { deep: true })

onBeforeUnmount(() => {
  if (targetMap) { targetMap.remove(); targetMap = null }
  if (areaMap) { areaMap.remove(); areaMap = null }
})
</script>

<style lang="scss" scoped>
.assistant-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  max-width: 100%;
}
.result-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  max-width: 100%;
}
.block-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.result-map {
  width: 100%;
  height: 190px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}
.result-table {
  width: 100%;
  max-width: 100%;
}
.distribution-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.distribution-item {
  padding: 8px 6px;
  text-align: center;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}
.distribution-level {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.distribution-count {
  display: block;
  margin-top: 2px;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.guide-list,
.suggest-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.guide-item,
.suggest-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.guide-index {
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  background: var(--el-color-primary);
}
.assist-descriptions {
  width: 100%;
  max-width: 100%;
}
.suggest-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
:deep(.map-popup) {
  min-width: 140px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
:deep(.map-popup strong) {
  font-size: 14px;
}
:deep(.map-popup span) {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
