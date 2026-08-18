// @ts-nocheck
/**
 * 目标管控 Mock 数据
 * 基于 src/mock/json/fusionTargets.json 精选 15 条融合目标，补齐船名、船型、风险等级、
 * 融合置信度、历史轨迹、报警历史与人工标注状态。变更通过 localStorage 持久化，
 * resetTargetDataMock 可恢复初始演示数据。
 */

import rawFusionTargets from './json/fusionTargets.json'

const STORAGE_KEY = 'targetDemoStateV1'
const BASE_NOW = '2026-08-18 09:45:00'
const CENTER = { lng: 118.14, lat: 24.35 }
const RISK_ORDER = { low: 1, lower: 2, medium: 3, higher: 4, high: 5 }

// ==================== 工具函数 ====================

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function formatTime(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function parseTime(text: string) {
  const [datePart, timePart = '00:00:00'] = text.split(' ')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm, ss] = timePart.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm, ss)
}

function addMinutes(timeText: string, minutes: number) {
  const date = parseTime(timeText)
  date.setMinutes(date.getMinutes() + minutes)
  return formatTime(date)
}

function nowTime() {
  return formatTime(new Date())
}

function hashCode(text: string) {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  }
  return hash
}

function hashRange(text: string, min: number, max: number) {
  return min + (hashCode(text) % (max - min + 1))
}

function calcDistance(lng: number, lat: number, lng2 = CENTER.lng, lat2 = CENTER.lat) {
  const rad = Math.PI / 180
  const dLat = (lat2 - lat) * rad
  const dLng = (lng2 - lng) * rad
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2
  return +(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1)
}

function cloneJson(value: any) {
  return JSON.parse(JSON.stringify(value))
}

// ==================== 初始业务配置 ====================

const initialTags = [
  { id: 1, name: '重点跟踪', color: '#f56c6c', createTime: '2026-08-13 10:00:00' },
  { id: 2, name: '夜间作业', color: '#e6a23c', createTime: '2026-08-14 09:20:00' },
  { id: 3, name: '走私嫌疑', color: '#c45656', createTime: '2026-08-15 08:30:00' },
  { id: 4, name: '禁航区靠近', color: '#d46b08', createTime: '2026-08-16 14:10:00' },
  { id: 5, name: '待核验', color: '#409eff', createTime: '2026-08-17 16:40:00' },
  { id: 6, name: '设备异常', color: '#909399', createTime: '2026-08-18 07:30:00' }
]

const UPDATE_TIMES = [
  '2026-08-18 09:45:00',
  '2026-08-18 09:44:32',
  '2026-08-18 09:44:05',
  '2026-08-18 09:43:48',
  '2026-08-18 09:43:21',
  '2026-08-18 09:42:56',
  '2026-08-18 09:42:30',
  '2026-08-18 09:42:04',
  '2026-08-18 09:41:37',
  '2026-08-18 09:41:12',
  '2026-08-18 09:40:46',
  '2026-08-18 09:40:21',
  '2026-08-18 09:39:58',
  '2026-08-18 09:39:32',
  '2026-08-18 09:39:08'
]

const PROFILES = [
  { name: '浙岭渔23888', callsign: 'BZQ3', shipType: '渔船', nationality: '中国', length: 32, width: 6.5, tonnage: 168, riskLevel: 'lower', confidence: 96, speed: 3.2, heading: 74.6, turnRate: 0.2, region: '厦门湾', tags: ['重点跟踪'], followed: false, note: '' },
  { name: '闽狮渔02166', callsign: 'BZR8', shipType: '渔船', nationality: '中国', length: 28, width: 5.8, tonnage: 96, riskLevel: 'medium', confidence: 88, speed: 4.1, heading: 298, turnRate: 0.4, region: '厦门湾', tags: ['夜间作业'], followed: false, note: '夜间航速稳定，暂未发现异常行为。' },
  { name: '闽龙渔66177', callsign: 'BZS6', shipType: '渔船', nationality: '中国', length: 31, width: 6.2, tonnage: 128, riskLevel: 'lower', confidence: 92, speed: 7.7, heading: 158, turnRate: 0.6, region: '厦门湾', tags: [], followed: false, note: '' },
  { name: '厦港货0198', callsign: 'BXXX', shipType: '货船', nationality: '中国', length: 88, width: 15.5, tonnage: 4200, riskLevel: 'lower', confidence: 95, speed: 5.6, heading: 125.6, turnRate: 0.3, region: '厦门湾', tags: [], followed: false, note: '' },
  { name: '三无船-1000017', callsign: '', shipType: '三无船', nationality: '-', length: 12, width: 3.2, tonnage: 0, riskLevel: 'higher', confidence: 62, speed: 6.8, heading: 214, turnRate: 1.2, region: '厦门湾', tags: ['走私嫌疑', '待核验'], followed: true, followTime: '2026-08-18 08:12:00', note: '已持续 3 小时未开启 AIS，待现场核验。' },
  { name: '三无船-1038193', callsign: '', shipType: '三无船', nationality: '-', length: 8.5, width: 2.6, tonnage: 0, riskLevel: 'medium', confidence: 71, speed: 3.5, heading: 158, turnRate: 0.5, region: '厦门湾', tags: ['夜间作业', '待核验'], followed: false, note: '' },
  { name: '三无船-998186', callsign: '', shipType: '三无船', nationality: '-', length: 9.8, width: 2.8, tonnage: 0, riskLevel: 'high', confidence: 55, speed: 7.6, heading: 302, turnRate: 1.8, region: '漳州湾', tags: ['走私嫌疑'], followed: true, followTime: '2026-08-18 08:40:00', note: '多次关闭 AIS，存在走私嫌疑。' },
  { name: '三无船-0717', callsign: '', shipType: '三无船', nationality: '-', length: 7.2, width: 2.4, tonnage: 0, riskLevel: 'higher', confidence: 68, speed: 4.4, heading: 12, turnRate: 0.8, region: '泉州湾', tags: ['待核验'], followed: false, note: '' },
  { name: '三无船-1038262', callsign: '', shipType: '三无船', nationality: '-', length: 8.1, width: 2.5, tonnage: 0, riskLevel: 'medium', confidence: 79, speed: 2.9, heading: 88, turnRate: 0.3, region: '厦门湾', tags: ['设备异常'], followed: false, note: '' },
  { name: '三无船-990327', callsign: '', shipType: '三无船', nationality: '-', length: 11.4, width: 3.1, tonnage: 0, riskLevel: 'high', confidence: 58, speed: 5.2, heading: 47, turnRate: 1.1, region: '泉州湾', tags: ['走私嫌疑', '禁航区靠近'], followed: true, followTime: '2026-08-17 18:20:00', note: '接近禁航区边缘，重点关注。' },
  { name: '三无船-1000076', callsign: '', shipType: '三无船', nationality: '-', length: 6.9, width: 2.2, tonnage: 0, riskLevel: 'higher', confidence: 81, speed: 4.1, heading: 354, turnRate: 0.4, region: '厦门湾', tags: ['禁航区靠近', '重点跟踪'], followed: true, followTime: '2026-08-17 09:30:00', note: '现场已核实为无证作业船舶，已转交执法处置。' },
  { name: '三无船-1035042', callsign: '', shipType: '三无船', nationality: '-', length: 7.5, width: 2.3, tonnage: 0, riskLevel: 'medium', confidence: 84, speed: 0, heading: 314, turnRate: 0, region: '漳州湾', tags: [], followed: false, stationary: true, note: '目标当前静止，无移动轨迹。' },
  { name: '闽龙渔66669', callsign: 'BZR2', shipType: '渔船', nationality: '中国', length: 26, width: 5.6, tonnage: 82, riskLevel: 'lower', confidence: 100, speed: 2.8, heading: 232, turnRate: 0.2, region: '厦门湾', tags: [], followed: false, note: '' },
  { name: '安盛20', callsign: 'BZP5', shipType: '货船', nationality: '中国', length: 96, width: 16, tonnage: 5200, riskLevel: 'medium', confidence: 100, speed: 10.7, heading: 93, turnRate: 0.6, region: '厦门湾', tags: ['重点跟踪'], followed: true, followTime: '2026-08-18 09:05:00', note: '高速驶离主航道，需持续关注航线。' },
  { name: 'YICK BARGE 606', callsign: 'BZQ9', shipType: '驳船', nationality: '新加坡', length: 72, width: 12.8, tonnage: 2600, riskLevel: 'higher', confidence: 99, speed: 6.3, heading: 189, turnRate: 0.5, region: '厦门湾', tags: ['重点跟踪', '夜间作业'], followed: false, note: '' }
]

const SOURCE_CONFIG = [
  { sources: ['AIS'], dataSource: 'AIS' },
  { sources: ['AIS', '海兰信'], dataSource: 'AIS+海兰信' },
  { sources: ['AIS', '海兰信'], dataSource: 'AIS+海兰信' },
  { sources: ['AIS', '厦漳泉', '电子围栏'], dataSource: 'AIS+厦漳泉+电子围栏' },
  { sources: ['雷达', '厦漳泉'], dataSource: '雷达+厦漳泉' },
  { sources: ['雷达', '海兰信'], dataSource: '雷达+海兰信' },
  { sources: ['雷达', '厦漳泉'], dataSource: '雷达+厦漳泉' },
  { sources: ['电子围栏'], dataSource: '电子围栏' },
  { sources: ['电子围栏'], dataSource: '电子围栏' },
  { sources: ['电子围栏'], dataSource: '电子围栏' },
  { sources: ['雷达', '厦漳泉'], dataSource: '雷达+厦漳泉' },
  { sources: ['雷达', '海兰信'], dataSource: '雷达+海兰信' },
  { sources: ['雷达', 'AIS', '海兰信'], dataSource: '雷达+AIS+海兰信' },
  { sources: ['雷达', 'AIS', '海兰信'], dataSource: '雷达+AIS+海兰信' },
  { sources: ['雷达', 'AIS', '海兰信'], dataSource: '雷达+AIS+海兰信' }
]

// ==================== 数据构建 ====================

function buildSourceDetails(target) {
  const details = []
  const lowConfidence = target.confidence < 80
  const sourceMeta = {
    '雷达': { source: '海兰信雷达', detail: '轨迹匹配度 96%' },
    'AIS': { source: 'AIS 基站', detail: 'MMSI 解析一致' },
    '电子围栏': { source: '电子围栏', detail: `围栏编号 ${target.sourceId || 'FENCE-20260812'}` },
    '海兰信': { source: '海兰信数据', detail: '目标轨迹连续' },
    '厦漳泉': { source: '厦漳泉感知网', detail: '位置校验通过' }
  }
  target.dataSources.forEach((label) => {
    const meta = sourceMeta[label]
    if (!meta) return
    details.push({
      source: meta.source,
      sourceLabel: label,
      status: lowConfidence && ['AIS', '雷达'].includes(label) ? '匹配失败' : '匹配成功',
      detail: lowConfidence && ['AIS', '雷达'].includes(label) ? '信号弱，待人工核验' : meta.detail
    })
  })
  details.push({ source: '北斗', sourceLabel: '北斗', status: '未参与', detail: '该目标未接入北斗定位' })
  if (details.length < 4) {
    details.push({ source: '光电识别', sourceLabel: '光电', status: '未参与', detail: '暂无光电抓拍记录' })
  }
  return details
}

function buildRiskHistory(target) {
  const history = []
  const lowConfidence = target.confidence < 80
  const previous = target.riskLevel === 'high' ? 'higher' : target.riskLevel === 'higher' ? 'medium' : 'low'
  history.push({
    time: addMinutes(BASE_NOW, -26 * 60 - hashCode(target.fusionId) % 60),
    fromLevel: previous,
    toLevel: target.riskLevel,
    reason: lowConfidence ? '多源融合置信度不足，系统综合研判上调风险' : target.riskReasons.join('、'),
    operator: '系统'
  })
  if (target.threeNoStatus === 'confirmed') {
    history.push({
      time: addMinutes(BASE_NOW, -20 * 60 - hashCode(target.fusionId + 'confirm') % 120),
      fromLevel: target.riskLevel === 'higher' ? 'medium' : 'lower',
      toLevel: target.riskLevel,
      reason: '人工核实三无状态，风险等级人工确认',
      operator: '值班员'
    })
  }
  if (['high'].includes(target.riskLevel)) {
    history.push({
      time: addMinutes(BASE_NOW, -8 * 60 - hashCode(target.fusionId + 'up') % 90),
      fromLevel: 'higher',
      toLevel: 'high',
      reason: '航速异常加剧且多次关闭 AIS，风险上调',
      operator: '系统'
    })
  }
  return history.sort((a, b) => (a.time < b.time ? 1 : -1))
}

function buildAlerts(target, seq) {
  const alerts = []
  const noMmsi = !target.mmsi
  const highRisk = ['higher', 'high'].includes(target.riskLevel)
  const hoursAgo1 = 2 + seq % 8
  const hoursAgo2 = 18 + seq * 2
  const hoursAgo3 = 72 + seq * 5
  const alertId = (offset) => `AL${parseTime(BASE_NOW).toISOString().slice(0, 10).replace(/-/g, '')}-${String(1000 + seq * 3 + offset)}`

  alerts.push({
    id: alertId(0),
    type: noMmsi ? '三无船只' : '越界报警',
    level: highRisk ? 'urgent' : 'important',
    triggerTime: addMinutes(BASE_NOW, -hoursAgo1 * 60),
    status: seq % 2 === 0 ? 'pending' : 'disposing',
    result: seq % 2 === 0 ? '' : '已安排就近力量现场核验',
    description: noMmsi
      ? '系统识别到无 MMSI 目标进入重点监控水域，三无状态尚未确认，需人工核实身份。'
      : '目标进入电子围栏告警区域，触发越界报警规则，需确认是否偏离计划航线。',
    evidence: `位置 ${target.lat.toFixed(4)}, ${target.lng.toFixed(4)}；来源 ${target.dataSource}`,
    operator: seq % 2 === 0 ? '' : '值班员',
    disposeTime: seq % 2 === 0 ? '' : addMinutes(BASE_NOW, -hoursAgo1 * 60 + 22)
  })

  alerts.push({
    id: alertId(1),
    type: highRisk ? '异常行为' : '其他',
    level: highRisk ? 'important' : 'normal',
    triggerTime: addMinutes(BASE_NOW, -hoursAgo2 * 60),
    status: 'closed',
    result: '已闭环，未发现明显违法行为，保持关注。',
    description: highRisk
      ? '目标航速与航向变化频率异常，系统判定存在异常行为风险。'
      : '目标在监控区域内正常航行，触发常规关注记录。',
    evidence: `航速 ${target.speed} 节，航向 ${target.heading}°，连续轨迹 ${target.trajectories.length} 个点`,
    operator: '值班员',
    disposeTime: addMinutes(BASE_NOW, -hoursAgo2 * 60 + 35)
  })

  alerts.push({
    id: alertId(2),
    type: noMmsi ? '三无船只' : '越界报警',
    level: 'normal',
    triggerTime: addMinutes(BASE_NOW, -hoursAgo3 * 60),
    status: 'archived',
    result: '已归档，未发现持续异常。',
    description: noMmsi
      ? '目标曾进入监控区域，未匹配到有效身份信息，已记录归档。'
      : '目标曾接近重点区域边缘，未越界，已记录归档。',
    evidence: `历史位置 ${target.lat.toFixed(4)}, ${target.lng.toFixed(4)}`,
    operator: '系统',
    disposeTime: addMinutes(BASE_NOW, -hoursAgo3 * 60 + 50)
  })

  return alerts
}

function buildTrajectories(target) {
  if (target.stationary) {
    return [{ time: target.updateTime, lng: target.lng, lat: target.lat, speed: 0, heading: target.heading }]
  }
  const points = []
  const speedKmh = target.speed * 1.852
  const headingRad = (target.heading * Math.PI) / 180
  const latCos = Math.cos((target.lat * Math.PI) / 180) || 1
  for (let offset = 24 * 60; offset >= 0; offset -= 30) {
    const elapsedHours = offset / 60
    const seed = hashCode(target.fusionId + String(offset))
    const jitter = ((seed % 100) / 100) * 0.006 - 0.003
    const latOffset = (-elapsedHours * speedKmh * Math.cos(headingRad)) / 111 + jitter
    const lngOffset = (-elapsedHours * speedKmh * Math.sin(headingRad)) / (111 * latCos) + jitter
    points.push({
      time: addMinutes(target.updateTime, -offset),
      lng: +(target.lng + lngOffset).toFixed(6),
      lat: +(target.lat + latOffset).toFixed(6),
      speed: +(target.speed + ((seed % 7) / 10 - 0.3)).toFixed(1),
      heading: +(target.heading + ((seed % 9) - 4)).toFixed(1)
    })
  }
  const eventConfigs = [
    { index: hashRange(target.fusionId + 'e1', 4, 14), type: '进入重点区域', desc: '目标进入厦门湾重点监控区域' },
    { index: hashRange(target.fusionId + 'e2', 18, 28), type: '航速变化', desc: '目标航速较上一时段提升超过 30%' },
    { index: hashRange(target.fusionId + 'e3', 32, 42), type: target.threeNoStatus ? '三无船只告警' : '越界告警', desc: target.threeNoStatus ? '无 MMSI 目标触发三无船只告警' : '目标接近围栏告警区域' }
  ]
  eventConfigs.forEach((event) => {
    const point = points[event.index]
    if (point) {
      point.eventType = event.type
      point.eventDesc = event.desc
    }
  })
  return points
}

function buildInitialState() {
  const targets = rawFusionTargets.map((raw, index) => {
    const profile = PROFILES[index]
    const sourceConfig = SOURCE_CONFIG[index]
    const targetType = raw.three_no_status ? 'three_no' : 'normal'
    const riskReasons = [
      ...(raw.three_no_status ? ['三无船只未确认'] : []),
      ...(!raw.mmsi ? ['无 MMSI 标识'] : []),
      ...(profile.riskLevel === 'higher' || profile.riskLevel === 'high' ? ['接近重点区域', '航速异常'] : ['AIS 信号稳定'])
    ]
    const target = {
      fusionId: raw.fusion_id,
      displayId: raw.display_id,
      mmsi: raw.mmsi,
      sourceId: raw.source_id || '',
      name: profile.name,
      callsign: profile.callsign,
      shipType: profile.shipType,
      nationality: profile.nationality,
      length: profile.length,
      width: profile.width,
      tonnage: profile.tonnage,
      targetType,
      threeNoStatus: raw.three_no_status || '',
      dataSource: sourceConfig.dataSource,
      dataSources: sourceConfig.sources,
      riskLevel: profile.riskLevel,
      riskReasons,
      confidence: profile.confidence,
      confirmStatus: profile.confidence < 80 ? 'pending' : 'confirmed',
      lng: raw.longitude,
      lat: raw.latitude,
      heading: profile.heading,
      speed: profile.speed,
      turnRate: profile.turnRate,
      updateTime: UPDATE_TIMES[index],
      distance: calcDistance(raw.longitude, raw.latitude),
      region: profile.region,
      followed: profile.followed || false,
      followTime: profile.followTime || null,
      followOperator: profile.followed ? '值班员' : '',
      tags: profile.tags || [],
      note: profile.note || '',
      noteOperator: profile.note ? '值班员' : '',
      noteTime: profile.note ? addMinutes(BASE_NOW, -hashRange(raw.fusion_id + 'note', 20, 90)) : '',
      stationary: profile.stationary || false
    }
    target.riskReasons = riskReasons
    target.sourceDetails = buildSourceDetails(target)
    target.riskHistory = buildRiskHistory(target)
    target.trajectories = buildTrajectories(target)
    return target
  })

  const changeHistory = []
  let nextChangeId = 1
  targets.forEach((target) => {
    if (target.followed) {
      changeHistory.push({
        id: nextChangeId++,
        time: target.followTime,
        operator: target.followOperator || '值班员',
        type: '关注',
        fusionId: target.fusionId,
        targetName: target.name,
        displayId: target.displayId,
        content: '加入重点关注'
      })
    }
    if (target.tags.length) {
      changeHistory.push({
        id: nextChangeId++,
        time: addMinutes(BASE_NOW, -hashRange(target.fusionId + 'tag', 120, 300)),
        operator: '值班员',
        type: '标签',
        fusionId: target.fusionId,
        targetName: target.name,
        displayId: target.displayId,
        content: `添加标签：${target.tags.join('、')}`
      })
    }
    if (target.note) {
      changeHistory.push({
        id: nextChangeId++,
        time: target.noteTime,
        operator: target.noteOperator || '值班员',
        type: '备注',
        fusionId: target.fusionId,
        targetName: target.name,
        displayId: target.displayId,
        content: `更新备注：${target.note}`
      })
    }
    if (target.threeNoStatus === 'confirmed') {
      changeHistory.push({
        id: nextChangeId++,
        time: addMinutes(BASE_NOW, -20 * 60 - hashRange(target.fusionId + 'risk', 0, 60)),
        operator: '值班员',
        type: '风险确认',
        fusionId: target.fusionId,
        targetName: target.name,
        displayId: target.displayId,
        content: `人工确认三无状态，风险等级确认为【${target.riskLevel}】`
      })
    }
  })

  let alertSeq = 1
  targets.forEach((target) => {
    target.alertHistory = buildAlerts(target, alertSeq)
    alertSeq += 1
  })

  return {
    targets,
    tags: cloneJson(initialTags),
    changeHistory: changeHistory.sort((a, b) => (a.time < b.time ? 1 : -1)),
    nextChangeId,
    nextTagId: 100
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && Array.isArray(parsed.targets) && parsed.targets.length === 15) {
        return parsed
      }
    }
  } catch {
    // 忽略损坏数据，回退初始状态
  }
  return buildInitialState()
}

let state = loadState()

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 存储不可用时保持内存状态
  }
}

function findTarget(fusionId: string) {
  return state.targets.find((item) => item.fusionId === fusionId)
}

function findTargetOrThrow(fusionId: string) {
  const target = findTarget(fusionId)
  if (!target) throw new Error('目标不存在')
  return target
}

function addChange(type: string, fusionId: string, content: string, operator = '值班员') {
  const target = findTarget(fusionId)
  state.changeHistory.unshift({
    id: state.nextChangeId++,
    time: nowTime(),
    operator,
    type,
    fusionId,
    targetName: target?.name || fusionId,
    displayId: target?.displayId || fusionId,
    content
  })
  saveState()
}

function applyFilters(list, params = {}) {
  const {
    keyword = '',
    targetType = '',
    dataSource = '',
    riskLevel = '',
    timeRange = '',
    startTime = '',
    endTime = '',
    region = '',
    tag = '',
    followed = ''
  } = params

  let filtered = [...list]
  if (keyword) {
    const kw = String(keyword).trim().toLowerCase()
    filtered = filtered.filter((item) =>
      [item.fusionId, item.displayId, item.mmsi, item.sourceId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(kw))
    )
  }
  if (targetType) filtered = filtered.filter((item) => item.targetType === targetType)
  if (dataSource) filtered = filtered.filter((item) => item.dataSources?.includes(dataSource))
  if (riskLevel) filtered = filtered.filter((item) => item.riskLevel === riskLevel)
  if (region) filtered = filtered.filter((item) => item.region === region)
  if (tag) filtered = filtered.filter((item) => item.tags?.includes(tag))
  if (followed === true || followed === 'true') filtered = filtered.filter((item) => item.followed)
  if (followed === false || followed === 'false') filtered = filtered.filter((item) => !item.followed)
  if (timeRange) {
    const base = parseTime(BASE_NOW)
    if (timeRange === '1h') filtered = filtered.filter((item) => parseTime(item.updateTime) >= new Date(base.getTime() - 60 * 60 * 1000))
    if (timeRange === '6h') filtered = filtered.filter((item) => parseTime(item.updateTime) >= new Date(base.getTime() - 6 * 60 * 60 * 1000))
    if (timeRange === '24h') filtered = filtered.filter((item) => parseTime(item.updateTime) >= new Date(base.getTime() - 24 * 60 * 60 * 1000))
  }
  if (startTime) filtered = filtered.filter((item) => parseTime(item.updateTime) >= parseTime(startTime))
  if (endTime) filtered = filtered.filter((item) => parseTime(item.updateTime) <= parseTime(endTime))
  return filtered
}

function sortList(list, params = {}) {
  const { sortField = 'updateTime', sortOrder = 'descending' } = params
  const dir = sortOrder === 'ascending' ? 1 : -1
  return [...list].sort((a, b) => {
    let av
    let bv
    if (sortField === 'riskLevel') {
      av = RISK_ORDER[a.riskLevel] || 0
      bv = RISK_ORDER[b.riskLevel] || 0
    } else if (sortField === 'distance') {
      av = a.distance
      bv = b.distance
    } else if (sortField === 'speed') {
      av = a.speed
      bv = b.speed
    } else {
      av = a.updateTime
      bv = b.updateTime
    }
    if (av === bv) return 0
    return av > bv ? dir : -dir
  })
}

function paginate(list, params = {}) {
  const page = Number(params.page || 1)
  const pageSize = Number(params.pageSize || 10)
  return {
    list: list.slice((page - 1) * pageSize, page * pageSize),
    total: list.length,
    page,
    pageSize
  }
}

function toRow(target) {
  return {
    fusionId: target.fusionId,
    displayId: target.displayId,
    mmsi: target.mmsi,
    sourceId: target.sourceId,
    name: target.name,
    shipType: target.shipType,
    targetType: target.targetType,
    threeNoStatus: target.threeNoStatus,
    dataSource: target.dataSource,
    dataSources: target.dataSources,
    riskLevel: target.riskLevel,
    confidence: target.confidence,
    confirmStatus: target.confirmStatus,
    followed: target.followed,
    followTime: target.followTime,
    tags: target.tags,
    note: target.note,
    lng: target.lng,
    lat: target.lat,
    heading: target.heading,
    speed: target.speed,
    turnRate: target.turnRate,
    updateTime: target.updateTime,
    distance: target.distance,
    region: target.region,
    stationary: target.stationary
  }
}

// ==================== Mock 业务函数 ====================

/** 目标列表（筛选+排序+分页） */
export function getTargetListMock(params = {}) {
  const filtered = applyFilters(state.targets, params)
  return paginate(sortList(filtered, params), params)
}

/** 目标统计 */
export function getTargetStatsMock() {
  return {
    total: state.targets.length,
    followed: state.targets.filter((item) => item.followed).length,
    pending: state.targets.filter((item) => item.confirmStatus === 'pending').length,
    highRisk: state.targets.filter((item) => item.riskLevel === 'high').length
  }
}

/** 目标详情 */
export function getTargetDetailMock(fusionId: string) {
  return cloneJson(findTargetOrThrow(fusionId))
}

/** 历史轨迹 */
export function getTrajectoryMock(fusionId: string, params = {}) {
  const target = findTargetOrThrow(fusionId)
  const { startTime = '', endTime = '' } = params || {}
  let points = cloneJson(target.trajectories)
  if (target.stationary) {
    return { points, stationary: true }
  }
  if (startTime) points = points.filter((point) => parseTime(point.time) >= parseTime(startTime))
  if (endTime) points = points.filter((point) => parseTime(point.time) <= parseTime(endTime))
  return { points, stationary: false }
}

/** 报警历史 */
export function getAlertHistoryMock(fusionId: string, params = {}) {
  const target = findTargetOrThrow(fusionId)
  const {
    type = '',
    level = '',
    status = '',
    startTime = '',
    endTime = ''
  } = params || {}
  let filtered = target.alertHistory || []
  if (type) filtered = filtered.filter((item) => item.type === type)
  if (level) filtered = filtered.filter((item) => item.level === level)
  if (status) filtered = filtered.filter((item) => item.status === status)
  if (startTime) filtered = filtered.filter((item) => parseTime(item.triggerTime) >= parseTime(startTime))
  if (endTime) filtered = filtered.filter((item) => parseTime(item.triggerTime) <= parseTime(endTime))
  return paginate(filtered, params)
}

/** 重点关注列表 */
export function getFocusListMock(params = {}) {
  const { riskLevel = '', tag = '', startTime = '', endTime = '' } = params || {}
  let filtered = state.targets.filter((item) => item.followed)
  if (riskLevel) filtered = filtered.filter((item) => item.riskLevel === riskLevel)
  if (tag) filtered = filtered.filter((item) => item.tags?.includes(tag))
  if (startTime) filtered = filtered.filter((item) => item.followTime && parseTime(item.followTime) >= parseTime(startTime))
  if (endTime) filtered = filtered.filter((item) => item.followTime && parseTime(item.followTime) <= parseTime(endTime))
  return paginate(sortList(filtered.map(toRow), params), params)
}

/** 重点关注统计 */
export function getFocusStatsMock() {
  const todayStart = `${BASE_NOW.slice(0, 10)} 00:00:00`
  return {
    total: state.targets.filter((item) => item.followed).length,
    highRisk: state.targets.filter((item) => item.followed && item.riskLevel === 'high').length,
    todayNew: state.targets.filter((item) => item.followed && item.followTime && item.followTime >= todayStart).length
  }
}

/** 更新关注状态（批量） */
export function updateAttentionMock(ids: string[], followed: boolean, operator = '值班员') {
  const list = ids || []
  list.forEach((id) => {
    const target = findTarget(id)
    if (!target) return
    const changed = target.followed !== followed
    target.followed = followed
    target.followTime = followed ? nowTime() : null
    target.followOperator = followed ? operator : ''
    if (changed) {
      addChange('关注', id, followed ? '加入重点关注' : '取消重点关注', operator)
    }
  })
  saveState()
  return { success: true, count: list.length }
}

/** 更新备注 */
export function updateNoteMock(fusionId: string, content: string, operator = '值班员') {
  const target = findTargetOrThrow(fusionId)
  target.note = content
  target.noteTime = nowTime()
  target.noteOperator = operator
  addChange('备注', fusionId, `更新备注：${content}`, operator)
  return cloneJson(target)
}

/** 更新标签 */
export function updateTagsMock(fusionId: string, tags: string[], operator = '值班员') {
  const target = findTargetOrThrow(fusionId)
  const oldTags = target.tags || []
  const added = tags.filter((tag) => !oldTags.includes(tag))
  const removed = oldTags.filter((tag) => !tags.includes(tag))
  target.tags = tags
  if (added.length || removed.length) {
    const parts = [
      ...added.map((tag) => `添加标签：${tag}`),
      ...removed.map((tag) => `移除标签：${tag}`)
    ]
    addChange('标签', fusionId, parts.join('；'), operator)
  }
  saveState()
  return cloneJson(target)
}

/** 风险确认 */
export function updateRiskConfirmMock(fusionId: string, data = {}) {
  const target = findTargetOrThrow(fusionId)
  const { riskLevel = target.riskLevel, reason = '', operator = '值班员' } = data
  const fromLevel = target.riskLevel
  target.riskLevel = riskLevel
  target.confirmStatus = 'confirmed'
  target.riskHistory.unshift({
    time: nowTime(),
    fromLevel,
    toLevel: riskLevel,
    reason,
    operator
  })
  addChange('风险确认', fusionId, `风险等级由【${fromLevel}】确认为【${riskLevel}】，确认依据：${reason}`, operator)
  saveState()
  return cloneJson(target)
}

/** 标签列表（含目标统计） */
export function getTagsMock() {
  return state.tags.map((tag) => ({
    ...tag,
    targetCount: state.targets.filter((item) => item.tags?.includes(tag.name)).length
  }))
}

/** 新增标签 */
export function addTagMock(data = {}) {
  const name = String(data.name || '').trim()
  if (!name) throw new Error('标签名称不能为空')
  if (state.tags.some((tag) => tag.name === name)) {
    throw new Error(`标签名称【${name}】已存在，请更换`)
  }
  const tag = {
    id: state.nextTagId++,
    name,
    color: data.color || '#409eff',
    createTime: nowTime()
  }
  state.tags.push(tag)
  saveState()
  return cloneJson(tag)
}

/** 更新标签 */
export function updateTagMock(id: number, data = {}) {
  const tag = state.tags.find((item) => item.id === Number(id))
  if (!tag) throw new Error('标签不存在')
  const name = String(data.name || '').trim()
  if (!name) throw new Error('标签名称不能为空')
  if (state.tags.some((item) => item.id !== Number(id) && item.name === name)) {
    throw new Error(`标签名称【${name}】已存在，请更换`)
  }
  const oldName = tag.name
  const oldColor = tag.color
  tag.name = name
  tag.color = data.color || tag.color
  state.targets.forEach((target) => {
    if (target.tags?.includes(oldName)) {
      const changed = oldName !== name
      if (changed) {
        target.tags = target.tags.map((item) => (item === oldName ? name : item))
        addChange('标签', target.fusionId, `标签【${oldName}】更新为【${name}】`, '值班员')
      } else if (oldColor !== tag.color) {
        addChange('标签', target.fusionId, `标签【${name}】颜色更新`, '值班员')
      }
    }
  })
  saveState()
  return cloneJson(tag)
}

/** 删除标签 */
export function deleteTagMock(id: number) {
  const index = state.tags.findIndex((item) => item.id === Number(id))
  if (index === -1) throw new Error('标签不存在')
  const tag = state.tags[index]
  state.tags.splice(index, 1)
  state.targets.forEach((target) => {
    if (target.tags?.includes(tag.name)) {
      target.tags = target.tags.filter((item) => item !== tag.name)
      addChange('标签', target.fusionId, `移除标签：${tag.name}（标签删除）`, '值班员')
    }
  })
  saveState()
  return { success: true }
}

/** 变更历史 */
export function getChangeHistoryMock(params = {}) {
  const { type = '', keyword = '' } = params || {}
  let filtered = [...state.changeHistory]
  if (type) filtered = filtered.filter((item) => item.type === type)
  if (keyword) {
    const kw = String(keyword).trim().toLowerCase()
    filtered = filtered.filter((item) =>
      [item.targetName, item.displayId, item.content].some((value) => String(value || '').toLowerCase().includes(kw))
    )
  }
  return paginate(filtered, params)
}

/** 重置演示数据 */
export function resetTargetDataMock() {
  localStorage.removeItem(STORAGE_KEY)
  state = buildInitialState()
  saveState()
  return { success: true }
}
