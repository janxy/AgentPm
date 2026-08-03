<template>
  <div class="radar-page">
    <!-- 雷达站信息与参数 -->
    <ElCard shadow="never" class="station-card annot-device-radar-station">
      <div class="station-row">
        <div class="station-block">
          <span class="block-label">雷达站</span>
          <ElSelect v-model="selectedStationId" class="station-select" @change="selectStation">
            <ElOption v-for="s in stations" :key="s.id" :label="s.name" :value="s.id" />
          </ElSelect>
          <ElTag v-if="stationDetail" :type="statusTag[stationDetail.status]" size="small" disable-transitions>
            {{ statusLabel[stationDetail.status] }}
          </ElTag>
          <span v-if="stationDetail" class="station-code">{{ stationDetail.code }}</span>
        </div>
        <div class="metric-block">
          <div class="metric-item">
            <span>信号强度</span>
            <ElProgress :percentage="stationDetail?.signalStrength || 0" :stroke-width="8" :show-text="false" class="metric-bar" :color="stationOnline ? '#67c23a' : '#909399'" />
            <strong>{{ stationDetail?.signalStrength ?? 0 }}%</strong>
          </div>
          <div class="metric-item">
            <span>天线转速</span>
            <strong>{{ stationDetail?.antennaRpm ?? 0 }} r/min</strong>
          </div>
          <div class="metric-item">
            <span>设备温度</span>
            <strong :class="{ 'temp-warn': (stationDetail?.temperature || 0) > 40 }">{{ stationDetail?.temperature ?? 0 }}℃</strong>
          </div>
        </div>
        <div v-if="stationDetail" class="param-block annot-device-radar-param">
          <div class="param-item">
            <span class="block-label">量程</span>
            <ElRadioGroup v-model="stationDetail.range" size="small" :disabled="!stationOnline" @change="updateParams">
              <ElRadioButton :value="12">12km</ElRadioButton>
              <ElRadioButton :value="24">24km</ElRadioButton>
              <ElRadioButton :value="36">36km</ElRadioButton>
              <ElRadioButton :value="48">48km</ElRadioButton>
            </ElRadioGroup>
          </div>
          <div class="param-item">
            <span class="block-label">增益</span>
            <ElSlider v-model="stationDetail.gain" :min="20" :max="100" size="small" :disabled="!stationOnline" class="gain-slider" @change="updateParams" />
            <strong class="param-value">{{ stationDetail.gain }}</strong>
          </div>
          <div class="param-item">
            <span class="block-label">色标</span>
            <ElSelect v-model="stationDetail.colorScheme" size="small" :disabled="!stationOnline" class="scheme-select" @change="updateParams">
              <ElOption label="标准" value="standard" />
              <ElOption label="冷色" value="cool" />
              <ElOption label="热色" value="hot" />
            </ElSelect>
            <span class="block-label">显示</span>
            <ElRadioGroup v-model="stationDetail.mode" size="small" :disabled="!stationOnline" @change="updateParams">
              <ElRadioButton value="R">R式</ElRadioButton>
              <ElRadioButton value="AR">A-R式</ElRadioButton>
            </ElRadioGroup>
          </div>
        </div>
      </div>
    </ElCard>

    <div class="radar-main">
      <ElCard shadow="never" class="ppi-card">
        <RadarPpiPanel
          :station="stationDetail"
          :targets="visibleTargets"
          :selected-target-id="selectedTargetId"
          :active="stationOnline"
          @select-target="selectTarget"
        />
      </ElCard>

      <ElCard shadow="never" class="target-card">
        <div class="target-head annot-device-radar-target-toolbar">
          <span class="target-title">目标列表</span>
          <ElSelect v-model="sortKey" size="small" class="sort-select" @change="toggleSort">
            <ElOption label="按距离" value="distance" />
            <ElOption label="按方位" value="bearing" />
            <ElOption label="按速度" value="speed" />
            <ElOption label="按强度" value="strength" />
          </ElSelect>
          <ElButton :icon="sortDir === 'asc' ? Top : Bottom" size="small" @click="toggleSort">{{ sortDir === 'asc' ? '升序' : '降序' }}</ElButton>
        </div>
        <div class="range-filter annot-device-radar-range-filter">
          <span>范围筛选 ≤ {{ maxDistance }}km</span>
          <ElSlider v-model="maxDistance" :min="3" :max="stationDetail?.range || 24" :disabled="!stationOnline" size="small" class="filter-slider" />
        </div>
        <ElTable
          v-loading="targetLoading"
          :data="visibleTargets"
          size="small"
          class="target-table annot-device-radar-target-table"
          empty-text="无目标数据"
          :row-class-name="rowClassName"
          @row-click="onTargetRowClick"
        >
          <ElTableColumn prop="targetNo" label="编号" width="70" />
          <ElTableColumn label="距离" width="76">
            <template #default="{ row }">{{ row.distance.toFixed(1) }}km</template>
          </ElTableColumn>
          <ElTableColumn label="方位" width="68">
            <template #default="{ row }">{{ row.bearing.toFixed(1) }}°</template>
          </ElTableColumn>
          <ElTableColumn prop="speed" label="速度" width="62">
            <template #default="{ row }">{{ row.speed }}kn</template>
          </ElTableColumn>
          <ElTableColumn label="等级" width="70">
            <template #default="{ row }">
              <ElTag :type="levelTag[row.level]" size="small" disable-transitions>{{ levelLabel[row.level] }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="强度" min-width="90">
            <template #default="{ row }">
              <ElProgress :percentage="row.strength" :stroke-width="6" :show-text="false" />
            </template>
          </ElTableColumn>
        </ElTable>
        <div class="target-foot">当前显示 {{ visibleTargets.length }} 个目标</div>
      </ElCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Bottom, Top } from '@element-plus/icons-vue'
import { getRadarStationList, getRadarStationDetail, getRadarTargetList, updateRadarStationParams } from '@/api/device'
import RadarPpiPanel from './components/RadarPpiPanel.vue'

/**
 * 雷达监测页
 * 雷达站参数调节、PPI 回波展示与目标列表双向联动
 */
defineOptions({ name: 'DeviceRadar' })

const route = useRoute()

const stations = ref<any[]>([])
const selectedStationId = ref<number | null>(null)
const stationDetail = ref<any>(null)
const targets = ref<any[]>([])
const targetLoading = ref(false)
const selectedTargetId = ref<number | null>(null)
const sortKey = ref('distance')
const sortDir = ref('asc')
const maxDistance = ref(24)

const statusLabel: Record<number, string> = { 1: '在线', 0: '离线', 2: '故障' }
const statusTag: Record<number, 'success' | 'info' | 'danger'> = { 1: 'success', 0: 'info', 2: 'danger' }
const levelLabel: Record<string, string> = { high: '强', normal: '中', weak: '弱' }
const levelTag: Record<string, 'danger' | 'warning' | 'success'> = { high: 'danger', normal: 'warning', weak: 'success' }

const stationOnline = computed(() => stationDetail.value?.status === 1)

/** 目标按排序键与筛选范围展示 */
const visibleTargets = computed(() => {
  if (!stationOnline.value) return []
  const list = targets.value.filter((t) => t.distance <= maxDistance.value)
  const dir = sortDir.value === 'asc' ? 1 : -1
  return list.sort((a, b) => (Number(a[sortKey.value]) - Number(b[sortKey.value])) * dir)
})

function rowClassName({ row }: any) {
  return row.id === selectedTargetId.value ? 'target-selected' : ''
}

async function selectStation(id: number) {
  selectedStationId.value = id
  selectedTargetId.value = null
  stationDetail.value = null
  targets.value = []
  targetLoading.value = true
  try {
    const [detailRes, targetRes] = await Promise.all([getRadarStationDetail(id), getRadarTargetList(id)])
    stationDetail.value = detailRes.data || null
    maxDistance.value = stationDetail.value?.range || 24
    const list = (targetRes.data as any)?.list || []
    targets.value = stationOnline.value ? list : []
  } finally {
    targetLoading.value = false
  }
}

async function loadStations() {
  const { data } = await getRadarStationList()
  stations.value = (data as any)?.list || []
  const queryId = Number(route.query.deviceId)
  const target = stations.value.find((s) => s.id === queryId)
    || stations.value.find((s) => s.status === 1)
    || stations.value[0]
  if (target) await selectStation(target.id)
}

async function updateParams() {
  if (!stationDetail.value || !stationOnline.value) return
  const { data } = await updateRadarStationParams(stationDetail.value.id, {
    range: stationDetail.value.range,
    gain: stationDetail.value.gain,
    colorScheme: stationDetail.value.colorScheme,
    mode: stationDetail.value.mode
  })
  if (data) Object.assign(stationDetail.value, data)
  if (maxDistance.value > stationDetail.value.range) maxDistance.value = stationDetail.value.range
}

function toggleSort() {
  sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
}

function selectTarget(id: number) {
  selectedTargetId.value = selectedTargetId.value === id ? null : id
}

function onTargetRowClick(row: any) {
  selectTarget(row.id)
}

onMounted(loadStations)
</script>

<style lang="scss" scoped>
.radar-page { display: flex; flex-direction: column; gap: 12px; height: 100%; }
.station-card { flex: none; :deep(.el-card__body) { padding: 12px 16px; } }
.station-row { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
.station-block, .metric-block, .param-block { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.station-block { min-width: 300px; }
.station-select { width: 160px; }
.station-code { font-size: 12px; color: var(--el-text-color-secondary); }
.metric-block { flex: 1; min-width: 260px; }
.metric-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--el-text-color-regular); }
.metric-item span { color: var(--el-text-color-secondary); font-size: 12px; }
.metric-item strong { min-width: 56px; }
.metric-bar { width: 100px; }
.temp-warn { color: var(--el-color-warning); }
.block-label { font-size: 13px; color: var(--el-text-color-secondary); }
.param-block { gap: 16px; }
.param-item { display: flex; align-items: center; gap: 8px; }
.gain-slider { width: 130px; }
.param-value { min-width: 24px; text-align: right; font-size: 13px; }
.scheme-select { width: 90px; }
.radar-main { display: flex; gap: 12px; flex: 1; min-height: 0; }
.ppi-card { flex: 1; min-width: 0; :deep(.el-card__body) { height: 100%; padding: 0; } }
.target-card { width: 340px; flex: none; :deep(.el-card__body) { height: 100%; padding: 12px; display: flex; flex-direction: column; } }
.target-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.target-title { flex: 1; font-size: 15px; font-weight: 600; }
.sort-select { width: 96px; }
.range-filter { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 12px; color: var(--el-text-color-secondary); }
.filter-slider { flex: 1; }
.target-table { flex: 1; min-height: 0; :deep(.el-table__row) { cursor: pointer; } }
.target-foot { margin-top: 8px; font-size: 12px; color: var(--el-text-color-secondary); text-align: center; }
:deep(.target-selected) { background: var(--el-color-primary-light-9); }
</style>
