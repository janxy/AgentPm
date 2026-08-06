<template>
  <div class="ai-mifa-page">
    <ElCard shadow="never" class="agent-console">
      <div class="console-main">
        <div class="orbit-panel annot-ai-mifa-orbit">
          <div class="orbit-head">
            <span class="orbit-kicker">MIFA</span>
            <span class="orbit-title">多源融合智能体</span>
          </div>
          <div class="agent-orbit">
            <svg class="orbit-svg" viewBox="0 0 320 320" aria-hidden="true">
              <defs>
                <marker id="orbit-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path d="M0 0 L8 4 L0 8 Z" fill="currentColor"></path>
                </marker>
              </defs>
              <path class="orbit-path" d="M160 40 L280 160" marker-end="url(#orbit-arrow)"></path>
              <path class="orbit-path" d="M280 160 L160 280" marker-end="url(#orbit-arrow)"></path>
              <path class="orbit-path" d="M160 280 L40 160" marker-end="url(#orbit-arrow)"></path>
              <path class="orbit-path" d="M40 160 L160 40" marker-end="url(#orbit-arrow)"></path>
            </svg>
            <div
              v-for="node in orbitNodes"
              :key="node.key"
              class="orbit-node"
              :class="[
                `orbit-node-${node.key}`,
                { 'orbit-node-attention': node.key === 'fusion' && pendingFusion > 0 }
              ]"
            >
              <div class="orbit-node-icon">
                <el-icon :size="16"><component :is="node.icon" /></el-icon>
              </div>
              <span class="orbit-node-name">{{ node.name }}</span>
              <span class="orbit-node-value">{{ node.value }}</span>
            </div>
            <div class="orbit-core" :class="{ 'orbit-core-attention': pendingFusion > 0 }">
              <span class="orbit-core-label">闭环中枢</span>
              <span class="orbit-core-status">{{ coreStatus }}</span>
            </div>
          </div>
        </div>

        <div class="console-side">
          <div class="console-head">
            <div class="console-heading">
              <span class="console-title">融合研判工作台</span>
            </div>
          </div>

          <div class="metric-grid annot-ai-mifa-metrics">
            <div v-for="metric in metrics" :key="metric.label" class="metric" :class="`metric-${metric.tone}`">
              <span class="metric-label">{{ metric.label }}</span>
              <span class="metric-value">{{ metric.value }}</span>
            </div>
          </div>

          <div class="pending-panel annot-ai-mifa-pending" :class="{ 'pending-empty': pendingFusion === 0 }">
            <div class="pending-head">
              <el-icon :size="16" class="pending-icon"><Select /></el-icon>
              <span class="pending-title">待确认</span>
              <ElTag v-if="pendingFusion > 0" size="small" type="warning" effect="dark">{{ pendingFusion }}</ElTag>
            </div>
            <template v-if="pendingFusion > 0">
              <div class="pending-list">
                <div v-for="target in pendingTargets" :key="target.id" class="pending-item">
                  <div class="pending-meta">
                    <span class="pending-name">{{ target.name }}</span>
                    <span class="pending-source">{{ target.sources }}</span>
                  </div>
                  <ElButton
                    v-roles="['指挥员']"
                    link
                    type="primary"
                    :disabled="confirmingId === target.id"
                    @click="confirmTarget(target)"
                  >
                    <el-icon><Check /></el-icon>
                    确认
                  </ElButton>
                </div>
              </div>
            </template>
            <div v-else class="pending-ok">
              <span class="pending-empty-dot"></span>
              <span>无待确认</span>
            </div>
          </div>

          <div class="recent-loop annot-ai-mifa-loop">
            <span class="recent-loop-label">最近闭环</span>
            <span class="recent-loop-text">{{ latestLoop }}</span>
          </div>
        </div>
      </div>
    </ElCard>

    <ElCard shadow="never" class="exec-queue annot-ai-mifa-exec-queue">
      <div class="exec-queue-head">
        <div class="exec-queue-title">
          <el-icon :size="16"><Loading /></el-icon>
          <span>执行队列</span>
        </div>
        <div class="exec-queue-meta">
          <ElTag size="small" type="primary" effect="plain">{{ runningExecutions }} 进行中</ElTag>
        </div>
      </div>
      <TransitionGroup name="exec" tag="div" class="exec-queue-list">
        <div
          v-for="exec in executions"
          :key="exec.id"
          class="exec-item"
          :class="`exec-item-${exec.stage}`"
        >
          <div class="exec-item-head">
            <div class="exec-item-target">
              <span class="exec-item-name">{{ exec.targetName }}</span>
              <span v-if="exec.chain?.inference" class="exec-item-type">{{ exec.chain.inference.abnormalType }}</span>
            </div>
            <ElTag size="small" :type="execStatusType(exec.stage)" effect="dark">
              {{ execStatusLabel(exec.stage) }}
            </ElTag>
          </div>
          <div class="exec-item-track">
            <div
              class="exec-segment"
              :class="{
                'exec-segment-active': exec.stage === 'fusion',
                'exec-segment-done': execSegmentDone(exec.stage, 'fusion')
              }"
            >
              <el-icon :size="13"><Connection /></el-icon>
              <span>融合确认</span>
            </div>
            <span class="exec-segment-arrow"><el-icon :size="12"><Right /></el-icon></span>
            <div
              class="exec-segment"
              :class="{
                'exec-segment-active': exec.stage === 'inference',
                'exec-segment-done': execSegmentDone(exec.stage, 'inference')
              }"
            >
              <el-icon :size="13"><DataAnalysis /></el-icon>
              <span>推理识别</span>
            </div>
            <span class="exec-segment-arrow"><el-icon :size="12"><Right /></el-icon></span>
            <div
              class="exec-segment"
              :class="{
                'exec-segment-active': exec.stage === 'linkage',
                'exec-segment-done': execSegmentDone(exec.stage, 'linkage')
              }"
            >
              <el-icon :size="13"><Aim /></el-icon>
              <span>联动调度</span>
            </div>
          </div>
          <div class="exec-item-progress">
            <div class="exec-item-progress-bar" :class="`exec-progress-${exec.stage}`" :style="{ width: `${exec.progress}%` }"></div>
          </div>
          <div v-if="exec.stage === 'linkage' && exec.chain?.link" class="exec-item-result">
            <el-icon :size="14"><Loading /></el-icon>
            <span>{{ exec.chain.link.device }} · {{ exec.chain.link.action }} 执行中</span>
          </div>
        </div>
      </TransitionGroup>
      <div v-if="!executions.length" class="exec-queue-empty">暂无进行中任务</div>
    </ElCard>

    <div class="pipeline-grid">
      <ElCard shadow="never" class="layer-card layer-perception annot-ai-mifa-layer-perception">
        <div class="layer-head">
          <div class="layer-icon"><el-icon :size="16"><Compass /></el-icon></div>
          <span class="layer-name">感知层</span>
          <ElTag size="small" effect="plain" type="success">{{ onlineSourceCount }}/{{ sourceTotal }} 在线</ElTag>
        </div>
        <div class="layer-body">
          <ElTable :data="sources" border stripe size="small" class="layer-table" empty-text="暂无数据源数据">
            <ElTableColumn prop="name" label="数据源" width="90" />
            <ElTableColumn label="接入状态" width="90" align="center">
              <template #default="{ row }">
                <ElTag :type="(sourceStatusMap as any)[row.status]" size="small" disable-transitions>{{ row.status }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="dataCount" label="实时数据量" width="100" align="right" />
            <ElTableColumn label="对齐成功率" width="100" align="right">
              <template #default="{ row }">{{ row.alignRate }}%</template>
            </ElTableColumn>
            <ElTableColumn label="格式标准化" width="100" align="right">
              <template #default="{ row }">{{ row.stdRate }}%</template>
            </ElTableColumn>
            <ElTableColumn prop="updateTime" label="最近更新" min-width="150" />
          </ElTable>
        </div>
      </ElCard>

      <ElCard shadow="never" class="layer-card layer-fusion annot-ai-mifa-layer-fusion" :class="{ 'layer-card-attention': pendingFusion > 0 }">
        <div class="layer-head">
          <div class="layer-icon"><el-icon :size="16"><Connection /></el-icon></div>
          <span class="layer-name">融合层</span>
          <ElTag v-if="pendingFusion > 0" size="small" effect="dark" type="warning">{{ pendingFusion }} 个待确认</ElTag>
          <ElTag v-else size="small" effect="plain" type="success">全部已确认</ElTag>
        </div>
        <div class="layer-body">
          <ElTable :data="fusionTargets" border stripe size="small" class="layer-table" empty-text="暂无融合目标数据">
            <ElTableColumn prop="name" label="目标名称" min-width="120" />
            <ElTableColumn prop="sources" label="数据源组合" min-width="130" />
            <ElTableColumn label="匹配结果" width="90" align="center">
              <template #default="{ row }">
                <ElTag :type="(fusionStatusMap as any)[row.result]" size="small" disable-transitions>{{ row.result }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="position" label="最近位置" min-width="140" />
            <ElTableColumn label="操作" width="80" align="center">
              <template #default="{ row }">
                <ElButton
                  v-if="row.result === '待确认'"
                  v-roles="['指挥员']"
                  link
                  type="primary"
                  :disabled="confirmingId === row.id"
                  @click="confirmTarget(row)"
                >确认</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </ElCard>

      <ElCard shadow="never" class="layer-card layer-inference annot-ai-mifa-layer-inference">
        <div class="layer-head">
          <div class="layer-icon"><el-icon :size="16"><DataAnalysis /></el-icon></div>
          <span class="layer-name">推理层</span>
          <ElTag size="small" effect="plain" type="danger">{{ highSeverity }} 条高严重度</ElTag>
        </div>
        <div class="layer-body">
          <ElTable :data="inferenceResults" border stripe size="small" class="layer-table" empty-text="暂无推理结果数据">
            <ElTableColumn prop="time" label="推理时间" width="160" />
            <ElTableColumn prop="target" label="目标" min-width="110" />
            <ElTableColumn prop="abnormalType" label="异常类型" min-width="110" />
            <ElTableColumn prop="basis" label="交叉依据" min-width="190" show-overflow-tooltip />
            <ElTableColumn label="严重程度" width="80" align="center">
              <template #default="{ row }">
                <ElTag :type="(severityMap as any)[row.severity]" size="small" disable-transitions>{{ row.severity }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="scope" label="影响范围" min-width="150" show-overflow-tooltip />
          </ElTable>
        </div>
      </ElCard>

      <ElCard shadow="never" class="layer-card layer-linkage annot-ai-mifa-layer-linkage">
        <div class="layer-head">
          <div class="layer-icon"><el-icon :size="16"><Aim /></el-icon></div>
          <span class="layer-name">联动层</span>
          <ElTag size="small" effect="plain" type="primary">{{ executingLinks }} 项执行中</ElTag>
        </div>
        <div class="layer-body">
          <ElTable :data="linkActions" border stripe size="small" class="layer-table" empty-text="暂无联动动作数据">
            <ElTableColumn prop="action" label="联动动作" min-width="100" />
            <ElTableColumn prop="device" label="目标设备" min-width="120" />
            <ElTableColumn prop="trigger" label="触发来源" min-width="160" show-overflow-tooltip />
            <ElTableColumn label="执行状态" width="90" align="center">
              <template #default="{ row }">
                <ElTag :type="(linkStatusMap as any)[row.status]" size="small" disable-transitions>{{ row.status }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="result" label="执行结果" min-width="160" show-overflow-tooltip />
            <ElTableColumn label="执行时间" width="160">
              <template #default="{ row }">{{ row.time || '-' }}</template>
            </ElTableColumn>
          </ElTable>
        </div>
      </ElCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Aim,
  Check,
  Compass,
  Connection,
  DataAnalysis,
  Loading,
  Right,
  Select
} from '@element-plus/icons-vue'
import { useAiStore } from '@/store/modules/ai'

/**
 * AI智能研判-多源融合智能体
 * 按感知-融合-推理-联动四层展示自动闭环流水线
 */
defineOptions({ name: 'AiMifa' })

const aiStore = useAiStore()
const confirmingId = ref<number | null>(null)

type ExecStage = 'fusion' | 'inference' | 'linkage'
interface ExecItem {
  id: number
  targetName: string
  chain: any
  stage: ExecStage
  progress: number
}

const executions = ref<ExecItem[]>([])
const execId = ref(0)
const execStageOrder: ExecStage[] = ['fusion', 'inference', 'linkage']
const execIntervals: number[] = []

const sourceStatusMap: Record<string, string> = { 在线: 'success', 异常: 'danger', 离线: 'info' }
const fusionStatusMap: Record<string, string> = { 已确认: 'success', 待确认: 'warning', 已分离: 'info' }
const severityMap: Record<string, string> = { 高: 'danger', 中: 'warning', 低: 'info' }
const linkStatusMap: Record<string, string> = { 待执行: 'info', 执行中: 'primary', 成功: 'success', 失败: 'danger' }

const sources = computed(() => aiStore.mifa?.sources || [])
const fusionTargets = computed(() => aiStore.mifa?.fusionTargets || [])
const inferenceResults = computed(() => aiStore.mifa?.inferenceResults || [])
const linkActions = computed(() => aiStore.mifa?.linkActions || [])
const onlineSourceCount = computed(() => sources.value.filter((s: any) => s.status === '在线').length)
const sourceTotal = computed(() => sources.value.length)
const pendingFusion = computed(() => fusionTargets.value.filter((t: any) => t.result === '待确认').length)
const pendingTargets = computed(() => fusionTargets.value.filter((t: any) => t.result === '待确认'))
const highSeverity = computed(() => inferenceResults.value.filter((r: any) => r.severity === '高').length)
const executingLinks = computed(() => linkActions.value.filter((a: any) => a.status === '执行中').length)
const coreStatus = computed(() => (pendingFusion.value > 0 ? '等待人工确认' : '自动闭环中'))
const runningExecutions = computed(() => executions.value.length)
const orbitNodes = computed(() => [
  { key: 'perception', name: '感知层', value: `${onlineSourceCount.value}/${sourceTotal.value} 在线`, icon: Compass },
  { key: 'fusion', name: '融合层', value: `${pendingFusion.value} 待确认`, icon: Connection },
  { key: 'inference', name: '推理层', value: `${highSeverity.value} 高严重度`, icon: DataAnalysis },
  { key: 'linkage', name: '联动层', value: `${executingLinks.value} 执行中`, icon: Aim }
])
const metrics = computed(() => [
  { label: '数据源在线', value: `${onlineSourceCount.value}/${sourceTotal.value}`, tone: 'success' },
  { label: '融合待确认', value: `${pendingFusion.value}`, tone: 'warning' },
  { label: '高严重度', value: `${highSeverity.value}`, tone: 'danger' },
  { label: '联动执行中', value: `${executingLinks.value}`, tone: 'primary' }
])
const latestLoop = computed(() => {
  const done = linkActions.value
    .filter((a: any) => a.status === '成功')
    .sort((a: any, b: any) => (a.time < b.time ? 1 : -1))
  const item = done[0]
  return item ? `${item.action} · ${item.device}（${item.time}）` : '暂无闭环记录'
})

function execStatusLabel(stage: ExecStage) {
  const map: Record<ExecStage, string> = {
    fusion: '融合确认中',
    inference: '推理识别中',
    linkage: '联动调度中'
  }
  return map[stage]
}

function execStatusType(stage: ExecStage): 'primary' | 'success' | 'info' | 'warning' | 'danger' {
  const map: Record<ExecStage, 'primary' | 'success' | 'info' | 'warning' | 'danger'> = {
    fusion: 'warning',
    inference: 'danger',
    linkage: 'primary'
  }
  return map[stage]
}

function execSegmentDone(stage: ExecStage, segment: ExecStage) {
  return execStageOrder.indexOf(stage) > execStageOrder.indexOf(segment)
}

function clearExecTimers() {
  execIntervals.forEach((interval) => window.clearInterval(interval))
  execIntervals.length = 0
}

async function confirmTarget(row: any) {
  confirmingId.value = row.id
  try {
    const result: any = await aiStore.confirmMifaTargetRecord(row.id)
    if (result?.error) {
      ElMessage.error(result.error)
      return
    }
    ElMessage.success('融合层：目标身份已确认')
    const chain = result?.chain
    const item: ExecItem = {
      id: ++execId.value,
      targetName: row.name,
      chain: chain || null,
      stage: 'fusion',
      progress: 0
    }
    executions.value.push(item)
    const totalMs = 5600
    const fusionMs = 1600
    const inferenceMs = 3400
    const startedAt = Date.now()
    let lastStage: ExecStage = 'fusion'
    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      item.progress = Math.min(100, Math.round((elapsed / totalMs) * 100))
      const nextStage: ExecStage = elapsed < fusionMs ? 'fusion' : elapsed < inferenceMs ? 'inference' : 'linkage'
      if (nextStage !== lastStage) {
        lastStage = nextStage
        item.stage = nextStage
        if (chain) {
          if (nextStage === 'inference') {
            ElMessage.info(`推理层：交叉识别发现“${chain.inference.abnormalType}”`)
          } else if (nextStage === 'linkage') {
            ElMessage.info(`联动层：已自动调度${chain.link.device}执行${chain.link.action}`)
          }
        }
      }
      if (elapsed >= totalMs) {
        window.clearInterval(progressTimer)
        executions.value = executions.value.filter((execution) => execution.id !== item.id)
        if (chain) ElMessage.success(`联动闭环完成：${chain.link.device} · ${chain.link.action}`)
      }
    }, 100)
    execIntervals.push(progressTimer)
  } finally {
    confirmingId.value = null
  }
}

onMounted(async () => {
  await aiStore.loadMifa()
  aiStore.startEngineHeartbeat()
})

onBeforeUnmount(() => {
  clearExecTimers()
  aiStore.stopEngineHeartbeat()
})
</script>

<style lang="scss" scoped>
.ai-mifa-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}
.agent-console {
  flex: none;
  :deep(.el-card__body) {
    padding: 16px;
  }
}
.console-main {
  display: flex;
  align-items: stretch;
  gap: 24px;
}
.orbit-panel {
  flex: 1 1 360px;
  min-width: 320px;
}
.orbit-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.orbit-kicker {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-color-primary);
}
.orbit-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.agent-orbit {
  position: relative;
  width: min(320px, 100%);
  aspect-ratio: 1;
  margin: 0 auto;
  background-color: rgb(var(--art-grey100));
  background-image:
    linear-gradient(to right, rgba(93, 135, 255, 0.07) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(93, 135, 255, 0.07) 1px, transparent 1px);
  background-size: 20px 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}
.orbit-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: var(--el-color-primary);
}
.orbit-path {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-dasharray: 6 10;
  animation: orbit-flow 1.4s linear infinite;
}
@keyframes orbit-flow {
  to {
    stroke-dashoffset: -16;
  }
}
.orbit-node {
  position: absolute;
  width: 104px;
  min-height: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  box-shadow: var(--art-box-shadow-xs);
  text-align: center;
}
.orbit-node-perception {
  top: 37px;
  left: 50%;
  transform: translate(-50%, -50%);
}
.orbit-node-fusion {
  top: 50%;
  left: 100%;
  transform: translate(-100%, -50%);
}
.orbit-node-inference {
  top: 100%;
  left: 50%;
  transform: translate(-50%, -100%);
}
.orbit-node-linkage {
  top: 50%;
  left: 0;
  transform: translate(0, -50%);
}
.orbit-node-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
}
.orbit-node-perception .orbit-node-icon {
  background: rgb(var(--art-bg-primary));
  color: var(--el-color-primary);
}
.orbit-node-fusion .orbit-node-icon {
  background: rgb(var(--art-bg-warning));
  color: var(--el-color-warning);
}
.orbit-node-inference .orbit-node-icon {
  background: rgb(var(--art-bg-danger));
  color: var(--el-color-danger);
}
.orbit-node-linkage .orbit-node-icon {
  background: rgb(var(--art-bg-success));
  color: var(--el-color-success);
}
.orbit-node-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.orbit-node-value {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.orbit-node-attention {
  border-color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}
.orbit-core {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 108px;
  min-height: 86px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  background: var(--art-gray-900);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(7, 20, 55, 0.18);
}
html.dark .orbit-core {
  background: #2d3446;
  color: #f4f6fb;
  border-color: rgba(255, 255, 255, 0.14);
}
.orbit-core-attention {
  border-color: var(--el-color-warning);
}
.orbit-core-label {
  font-size: 11px;
  opacity: 0.72;
}
.orbit-core-status {
  font-size: 13px;
  font-weight: 700;
}
.console-side {
  flex: 1 1 400px;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.console-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.console-heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.console-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}
.metric-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.metric-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  color: var(--el-text-color-primary);
}
.metric-success .metric-value {
  color: var(--el-color-success);
}
.metric-warning .metric-value {
  color: var(--el-color-warning);
}
.metric-danger .metric-value {
  color: var(--el-color-danger);
}
.metric-primary .metric-value {
  color: var(--el-color-primary);
}
.exec-queue {
  flex: none;
  :deep(.el-card__body) {
    padding: 14px 16px;
  }
}
.exec-queue-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.exec-queue-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.exec-queue-title .el-icon {
  color: var(--el-color-primary);
}
.exec-queue-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}
.exec-queue-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 320px;
  overflow: auto;
}
.exec-queue-empty {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.exec-enter-active {
  animation: exec-enter 0.3s ease;
}
.exec-move {
  transition: transform 0.3s ease;
}
@keyframes exec-enter {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.exec-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-left-width: 3px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}
.exec-item-fusion {
  border-left-color: var(--el-color-warning);
}
.exec-item-inference {
  border-left-color: var(--el-color-danger);
}
.exec-item-linkage {
  border-left-color: var(--el-color-primary);
}
.exec-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.exec-item-target {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.exec-item-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.exec-item-type {
  flex: none;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.exec-item-track {
  display: flex;
  align-items: center;
  gap: 4px;
}
.exec-item-progress {
  height: 4px;
  border-radius: 2px;
  background: var(--el-border-color-lighter);
  overflow: hidden;
}
.exec-item-progress-bar {
  position: relative;
  height: 100%;
  border-radius: 2px;
  background-size: 200% 100%;
  transition: width 0.35s ease;
  animation: exec-shimmer 1.1s linear infinite;
}
.exec-item-progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -35%;
  width: 35%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  animation: exec-light 1.1s linear infinite;
}
@keyframes exec-light {
  to {
    left: 110%;
  }
}
.exec-progress-fusion {
  background-image: linear-gradient(90deg, var(--el-color-warning), #ffd666);
}
.exec-progress-inference {
  background-image: linear-gradient(90deg, var(--el-color-danger), #ff9f43);
}
.exec-progress-linkage {
  background-image: linear-gradient(90deg, var(--el-color-success), #57d9a3);
}
@keyframes exec-shimmer {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}
.exec-segment {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 6px;
  border-radius: 6px;
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}
.exec-segment-active {
  background: var(--el-color-primary);
  color: #fff;
  box-shadow: 0 0 0 4px rgba(93, 135, 255, 0.14);
  animation: exec-segment-glow-primary 0.9s ease-in-out infinite;
}
.exec-item-fusion .exec-segment-active {
  background: var(--el-color-warning);
  box-shadow: 0 0 0 4px rgba(255, 174, 31, 0.14);
  animation-name: exec-segment-glow-warning;
}
.exec-item-inference .exec-segment-active {
  background: var(--el-color-danger);
  box-shadow: 0 0 0 4px rgba(244, 77, 70, 0.14);
  animation-name: exec-segment-glow-danger;
}
.exec-item-linkage .exec-segment-active {
  background: var(--el-color-success);
  box-shadow: 0 0 0 4px rgba(80, 200, 120, 0.16);
  animation-name: exec-segment-glow-success;
}
@keyframes exec-segment-glow-primary {
  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(93, 135, 255, 0.12);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(93, 135, 255, 0.24);
  }
}
@keyframes exec-segment-glow-warning {
  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(255, 174, 31, 0.12);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 174, 31, 0.24);
  }
}
@keyframes exec-segment-glow-danger {
  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(244, 77, 70, 0.12);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(244, 77, 70, 0.24);
  }
}
@keyframes exec-segment-glow-success {
  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(80, 200, 120, 0.14);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(80, 200, 120, 0.26);
  }
}
.exec-segment-done {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}
.exec-segment-arrow {
  display: flex;
  align-items: center;
  flex: none;
  color: var(--el-border-color);
}
.exec-item-result {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-color-primary);
}
.exec-item-result .el-icon {
  animation: exec-result-spin 1s linear infinite;
}
@keyframes exec-result-spin {
  to {
    transform: rotate(360deg);
  }
}
.pending-panel {
  flex: none;
  height: 190px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--el-color-warning);
  border-radius: 8px;
  background: var(--el-color-warning-light-9);
}
.pending-panel.pending-empty {
  border-color: var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
}
.pending-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.pending-icon {
  color: var(--el-color-warning);
}
.pending-empty .pending-icon {
  color: var(--el-text-color-secondary);
}
.pending-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.pending-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  align-content: start;
  padding-right: 2px;
}
.pending-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--el-bg-color);
}
.pending-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.pending-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.pending-source {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pending-ok {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.pending-empty-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-text-color-secondary);
}
.recent-loop {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.recent-loop-label {
  flex: none;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.recent-loop-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--el-text-color-regular);
}
.pipeline-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  flex: 1;
  min-height: 0;
}
.layer-card {
  position: relative;
  min-height: 0;
  overflow: hidden;
  :deep(.el-card__body) {
    height: 100%;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
}
.layer-perception {
  border-top: 3px solid var(--el-color-primary);
}
.layer-fusion {
  border-top: 3px solid var(--el-color-warning);
}
.layer-inference {
  border-top: 3px solid var(--el-color-danger);
}
.layer-linkage {
  border-top: 3px solid var(--el-color-success);
}
.layer-card-attention {
  border-color: var(--el-color-warning);
}
.layer-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  margin-bottom: 10px;
}
.layer-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgb(var(--art-bg-primary));
  color: var(--el-color-primary);
}
.layer-fusion .layer-icon {
  background: rgb(var(--art-bg-warning));
  color: var(--el-color-warning);
}
.layer-inference .layer-icon {
  background: rgb(var(--art-bg-danger));
  color: var(--el-color-danger);
}
.layer-linkage .layer-icon {
  background: rgb(var(--art-bg-success));
  color: var(--el-color-success);
}
.layer-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.layer-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.layer-table {
  width: 100%;
}
@media (max-width: 1100px) {
  .ai-mifa-page {
    height: auto;
    overflow: visible;
  }
  .console-main {
    flex-direction: column;
  }
  .orbit-panel {
    min-width: 0;
  }
  .agent-orbit {
    width: min(300px, 100%);
  }
  .console-side {
    min-width: 0;
  }
  .pipeline-grid {
    grid-template-columns: 1fr;
  }
}
</style>
