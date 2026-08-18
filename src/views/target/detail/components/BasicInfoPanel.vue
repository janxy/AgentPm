<template>
  <ElCard shadow="never" class="realtime-panel annot-target-detail-realtime">
    <div class="realtime-grid">
      <div class="realtime-main">
        <div class="section-title">基础属性</div>
        <div class="attr-grid">
          <div class="attr-item">
            <span class="attr-label">船名</span>
            <span class="attr-value">{{ target.name }}</span>
          </div>
          <div class="attr-item">
            <span class="attr-label">MMSI/显示编号</span>
            <span class="attr-value">{{ target.mmsi || `${target.displayId}（无MMSI）` }}</span>
          </div>
          <div class="attr-item">
            <span class="attr-label">船型</span>
            <span class="attr-value">{{ target.shipType }}</span>
          </div>
          <div class="attr-item">
            <span class="attr-label">尺寸</span>
            <span class="attr-value">{{ target.length }} × {{ target.width }} 米</span>
          </div>
          <div class="attr-item">
            <span class="attr-label">国籍</span>
            <span class="attr-value">{{ target.nationality || '-' }}</span>
          </div>
          <div class="attr-item">
            <span class="attr-label">呼号</span>
            <span class="attr-value">{{ target.callsign || '-' }}</span>
          </div>
        </div>

        <div class="section-title">位置示意</div>
        <div class="position-sketch annot-target-detail-map">
          <div class="sketch-grid"></div>
          <div class="sketch-ring ring-1"></div>
          <div class="sketch-ring ring-2"></div>
          <div class="sketch-center">
            <span class="center-dot"></span>
            <span class="center-label">监控中心</span>
          </div>
          <div class="sketch-target" :style="targetStyle">
            <span class="target-arrow" :style="{ transform: `rotate(${target.heading}deg)` }"></span>
            <span class="target-dot"></span>
            <span class="target-label">目标</span>
          </div>
          <div class="sketch-info">
            <span>距离 {{ target.distance }} km</span>
            <span>航向 {{ target.heading }}°</span>
          </div>
        </div>

        <div class="section-title">动态信息</div>
        <div class="dyn-grid">
          <div class="dyn-item">
            <span>实时位置</span>
            <strong>{{ target.lng }}, {{ target.lat }}</strong>
          </div>
          <div class="dyn-item">
            <span>航向</span>
            <strong>{{ target.heading }}°</strong>
          </div>
          <div class="dyn-item">
            <span>航速</span>
            <strong>{{ target.speed }} 节</strong>
          </div>
          <div class="dyn-item">
            <span>转向率</span>
            <strong>{{ target.turnRate }}°/min</strong>
          </div>
          <div class="dyn-item">
            <span>更新时间</span>
            <strong>{{ target.updateTime }}</strong>
          </div>
        </div>

        <div class="section-title">风险等级与判定依据</div>
        <div class="risk-basis">
          <div class="risk-strip">
            <div
              v-for="level in RISK_LEVEL_OPTIONS"
              :key="level.value"
              class="risk-seg"
              :class="{ active: level.value === target.riskLevel }"
              :style="{ background: RISK_LEVEL_COLORS[level.value] }"
            >
              <span>{{ level.label }}</span>
            </div>
          </div>
          <ul class="basis-list">
            <li v-for="(reason, index) in target.riskReasons" :key="index">
              <span class="basis-dot"></span>
              <span>{{ reason }}</span>
            </li>
          </ul>
        </div>

      </div>

      <div class="realtime-side">
        <div class="section-title">多源融合置信度</div>
        <div class="confidence-wrap">
          <div class="confidence-value" :class="{ 'confidence-low': target.confidence < 80 }">
            {{ target.confidence }}%
          </div>
          <ElTag :type="target.confirmStatus === 'pending' ? 'danger' : 'success'" size="small" effect="plain" disable-transitions>
            {{ CONFIRM_STATUS_LABELS[target.confirmStatus] }}
          </ElTag>
        </div>
        <div class="confidence-tip">融合置信度低于 80% 时进入待人工确认</div>

        <ElTable :data="target.sourceDetails || []" border stripe size="small" class="source-table" empty-text="暂无来源明细">
          <ElTableColumn prop="source" label="参与来源" width="112" />
          <ElTableColumn label="状态" width="90" align="center">
            <template #default="{ row }">
              <ElTag :type="sourceStatusType(row.status)" size="small" disable-transitions>{{ row.status }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="detail" label="匹配结果" min-width="150" show-overflow-tooltip />
        </ElTable>
      </div>
    </div>

  </ElCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CONFIRM_STATUS_LABELS,
  RISK_LEVEL_COLORS,
  RISK_LEVEL_OPTIONS
} from '@/utils/target'

/**
 * 单目标基础信息
 * 展示基础属性、动态信息、五级风险与多源融合置信度。
 */
defineOptions({ name: 'TargetDetailBasicInfoPanel' })

const props = defineProps<{ target: any }>()

const targetStyle = computed(() => {
  const dx = ((props.target?.lng || 118.14) - 118.14) * 40
  const dy = ((props.target?.lat || 24.35) - 24.35) * 40
  const max = Math.max(1, Math.abs(dx), Math.abs(dy))
  const left = Math.min(88, Math.max(10, 50 + (dx / max) * 38))
  const top = Math.min(84, Math.max(12, 50 - (dy / max) * 38))
  return { left: `${left}%`, top: `${top}%` }
})

function sourceStatusType(status: string) {
  if (status === '匹配成功') return 'success'
  if (status === '未参与') return 'info'
  return 'danger'
}
</script>

<style lang="scss" scoped>
.realtime-panel {
  margin-bottom: 12px;
  :deep(.el-card__body) { padding: 16px; }
}
.realtime-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
}
.realtime-main {
  min-width: 0;
}
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 14px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  &:first-child {
    margin-top: 0;
  }
}
.attr-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 10px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}
.attr-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  padding: 6px 8px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}
.attr-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.attr-value {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.position-sketch {
  position: relative;
  height: 190px;
  overflow: hidden;
  background: linear-gradient(160deg, #eaf4ff 0%, #f8fbff 70%, #eef7f0 100%);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}
.sketch-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(148, 187, 233, 0.22) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 187, 233, 0.22) 1px, transparent 1px);
  background-size: 28px 28px;
}
.sketch-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 1px dashed rgba(64, 158, 255, 0.45);
  border-radius: 50%;
}
.ring-1 {
  width: 120px;
  height: 120px;
}
.ring-2 {
  width: 210px;
  height: 210px;
}
.sketch-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.center-dot {
  width: 8px;
  height: 8px;
  background: var(--el-color-primary);
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
}
.center-label {
  font-size: 11px;
  color: var(--el-color-primary);
}
.sketch-target {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.target-arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 14px solid var(--el-color-danger);
  transform-origin: 50% 100%;
}
.target-dot {
  width: 10px;
  height: 10px;
  background: var(--el-color-danger);
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(245, 108, 108, 0.25);
  animation: target-pulse 2s ease-in-out infinite;
}
.target-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-color-danger);
  background: #fff;
  padding: 0 4px;
  border-radius: 2px;
}
.sketch-info {
  position: absolute;
  right: 10px;
  bottom: 8px;
  display: flex;
  gap: 12px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 3px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}
.dyn-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
.dyn-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;

  span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
  strong {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
.risk-basis {
  padding: 10px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}
.risk-strip {
  display: flex;
  height: 26px;
  overflow: hidden;
  border-radius: 3px;
}
.risk-seg {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  opacity: 0.55;
  transition: opacity 0.2s;

  &.active {
    opacity: 1;
    font-weight: 700;
    box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.18);
  }
}
.basis-list {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;

  li {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
}
.basis-dot {
  width: 5px;
  height: 5px;
  flex-shrink: 0;
  background: var(--el-color-primary);
  border-radius: 50%;
}
.realtime-side {
  padding-left: 16px;
  border-left: 1px solid var(--el-border-color-lighter);
}
.confidence-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.confidence-value {
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
  color: var(--el-color-success);

  &.confidence-low {
    color: var(--el-color-danger);
  }
}
.confidence-tip {
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.source-table {
  width: 100%;
}

@keyframes target-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(245, 108, 108, 0.25); }
  50% { box-shadow: 0 0 0 9px rgba(245, 108, 108, 0.08); }
}

@media (max-width: 1280px) {
  .realtime-grid {
    grid-template-columns: 1fr;
  }
  .realtime-side {
    padding-left: 0;
    padding-top: 14px;
    border-left: none;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
@media (max-width: 900px) {
  .attr-grid,
  .dyn-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
