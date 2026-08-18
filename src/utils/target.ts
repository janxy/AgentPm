/**
 * 目标管控公共字典
 * 目标总览、单目标研判与目标标注共享同一套状态标签与颜色定义。
 */

export const RISK_LEVEL_LABELS: Record<string, string> = {
  low: '低',
  lower: '较低',
  medium: '中',
  higher: '较高',
  high: '高'
}

export const RISK_LEVEL_COLORS: Record<string, string> = {
  low: '#67c23a',
  lower: '#95d475',
  medium: '#e6a23c',
  higher: '#d46b08',
  high: '#f56c6c'
}

export const RISK_LEVEL_OPTIONS = [
  { label: '低', value: 'low' },
  { label: '较低', value: 'lower' },
  { label: '中', value: 'medium' },
  { label: '较高', value: 'higher' },
  { label: '高', value: 'high' }
]

export const TARGET_TYPE_LABELS: Record<string, string> = {
  normal: '正常船只',
  three_no: '三无船只'
}

export const CONFIRM_STATUS_LABELS: Record<string, string> = {
  confirmed: '已确认',
  pending: '待人工确认'
}

export const ALERT_LEVEL_LABELS: Record<string, string> = {
  urgent: '紧急',
  important: '重要',
  normal: '一般',
  tip: '提示'
}

export const ALERT_STATUS_LABELS: Record<string, string> = {
  pending: '待处置',
  disposing: '处置中',
  closed: '已处置',
  archived: '已归档'
}

export const ALERT_TYPE_OPTIONS = ['越界报警', '三无船只', '异常行为', '其他']

export const ALERT_LEVEL_OPTIONS = [
  { label: '紧急', value: 'urgent' },
  { label: '重要', value: 'important' },
  { label: '一般', value: 'normal' },
  { label: '提示', value: 'tip' }
]

export const ALERT_STATUS_OPTIONS = [
  { label: '待处置', value: 'pending' },
  { label: '处置中', value: 'disposing' },
  { label: '已处置', value: 'closed' },
  { label: '已归档', value: 'archived' }
]

export const ALERT_LEVEL_COLORS: Record<string, string> = {
  urgent: 'danger',
  important: 'warning',
  normal: 'info',
  tip: 'info'
}

export const ALERT_STATUS_COLORS: Record<string, string> = {
  pending: 'danger',
  disposing: 'warning',
  closed: 'success',
  archived: 'info'
}

export const CHANGE_TYPE_OPTIONS = [
  { label: '关注', value: '关注' },
  { label: '标签', value: '标签' },
  { label: '备注', value: '备注' },
  { label: '风险确认', value: '风险确认' }
]

export const REGION_OPTIONS = ['厦门湾', '漳州湾', '泉州湾']

export const DATA_SOURCE_OPTIONS = ['AIS', '雷达', '电子围栏', '海兰信', '厦漳泉']
