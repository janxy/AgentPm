// @ts-nocheck
/**
 * 预警事件 Mock 数据（地图区域 / 预警规则 / 告警事件）
 * 增删改查全部基于模块级变量持久化
 */

// ==================== 地图区域数据 ====================
let mockAreas = [
  {
    id: 1,
    name: '东海禁航区',
    type: '禁入区域',
    geoData: {
      type: 'Polygon',
      coordinates: [[[121.5, 29.5], [122.5, 29.5], [122.5, 30.5], [121.5, 30.5], [121.5, 29.5]]]
    },
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    managerId: 1,
    managerName: '管理员',
    remark: '东海演习期间禁航区域',
    status: 1,
    createTime: '2026-06-01 10:00:00',
    updateTime: '2026-07-15 14:30:00'
  },
  {
    id: 2,
    name: '舟山港重点监控区',
    type: '重点区域',
    geoData: {
      type: 'Polygon',
      coordinates: [[[122.1, 29.9], [122.3, 29.9], [122.3, 30.1], [122.1, 30.1], [122.1, 29.9]]]
    },
    startDate: '2026-03-01',
    endDate: '2026-09-30',
    managerId: 3,
    managerName: '李四',
    remark: '港口进出船只重点监控',
    status: 1,
    createTime: '2026-03-01 08:00:00',
    updateTime: '2026-07-01 09:00:00'
  },
  {
    id: 3,
    name: '南海巡检区域A',
    type: '巡检区域',
    geoData: {
      type: 'Polygon',
      coordinates: [[[116.5, 20.5], [117.5, 20.5], [117.5, 21.5], [116.5, 21.5], [116.5, 20.5]]]
    },
    startDate: '2026-05-01',
    endDate: '2026-08-31',
    managerId: 4,
    managerName: '王五',
    remark: '定期巡检区域',
    status: 1,
    createTime: '2026-05-01 10:00:00',
    updateTime: '2026-05-10 16:00:00'
  },
  {
    id: 4,
    name: '渤海石油平台警戒区',
    type: '重点区域',
    geoData: {
      type: 'Circle',
      center: [119.3, 38.7],
      radius: 5000
    },
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    managerId: 1,
    managerName: '管理员',
    remark: '石油平台周边5km警戒',
    status: 0,
    createTime: '2026-01-01 10:00:00',
    updateTime: '2026-07-28 09:00:00'
  }
]

let nextAreaId = 10

// 审批记录
let mockApprovals: Array<{
  id: number
  areaId: number
  areaName: string
  before: Record<string, any>
  after: Record<string, any>
  submitter: string
  submitTime: string
  reviewer: string | null
  reviewTime: string | null
  status: string
}> = [
  {
    id: 1,
    areaId: 4,
    areaName: '渤海石油平台警戒区',
    before: { name: '渤海石油平台警戒区', type: '重点区域', endDate: '2026-06-30' },
    after: { name: '渤海石油平台警戒区（扩建）', type: '重点区域', endDate: '2026-12-31' },
    submitter: '管理员',
    submitTime: '2026-07-28 09:00:00',
    reviewer: null,
    reviewTime: null,
    status: 'pending'
  }
]

let nextApprovalId = 10

// ==================== 围栏预警规则 ====================
let mockFenceRules = [
  {
    id: 1,
    name: '东海围栏规则',
    fenceType: 'polygon',
    geoData: { type: 'Polygon', coordinates: [[[121.5,29.5],[122.5,29.5],[122.5,30.5],[121.5,30.5],[121.5,29.5]]] },
    areaId: 1,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    timeSlots: [{ start: '06:00', end: '18:00' }],
    repeatDays: [1, 2, 3, 4, 5],
    shipTypes: ['渔船', '快艇', '三无船'],
    tonnageMin: 0,
    tonnageMax: 5000,
    sourceTypes: ['雷达', 'AIS'],
    priority: 1,
    alertLevel: 'urgent',
    status: 1,
    createTime: '2026-06-01 10:00:00',
    updateTime: '2026-07-15 14:30:00'
  },
]

let nextFenceRuleId = 10

// ==================== 黑名单 ====================
let mockBlacklist = [
  {
    id: 1,
    targetName: '可疑渔船A',
    mmsi: '412345678',
    callsign: 'ABCD',
    targetNo: 'TGT-001',
    level: 'highRisk',
    reason: '多次闯入禁入区域，涉嫌非法捕捞',
    hitCount: 12,
    lastHitTime: '2026-07-28 15:30:00',
    status: 1,
    createTime: '2026-04-01 10:00:00',
    updateTime: '2026-07-28 15:30:00'
  },
  {
    id: 2,
    targetName: '无证货船B',
    mmsi: '413987654',
    callsign: 'EFGH',
    targetNo: 'TGT-002',
    level: 'key',
    reason: '多次关闭AIS，疑从事走私活动',
    hitCount: 5,
    lastHitTime: '2026-07-20 09:15:00',
    status: 1,
    createTime: '2026-05-15 14:00:00',
    updateTime: '2026-07-20 09:15:00'
  },
  {
    id: 3,
    targetName: '普通违规船C',
    mmsi: '416123456',
    callsign: '',
    targetNo: '',
    level: 'normal',
    reason: '偶尔偏离航线',
    hitCount: 2,
    lastHitTime: '2026-07-10 11:00:00',
    status: 1,
    createTime: '2026-06-01 08:00:00',
    updateTime: '2026-07-10 11:00:00'
  }
]

let nextBlacklistId = 10

// ==================== 行为预警规则 ====================
let mockBehaviorRules = [
  {
    id: 1,
    name: '渔船航速异常',
    behaviorType: 'speed',
    shipTypes: ['渔船'],
    params: { speedMax: 25, speedMin: 1, duration: 30 },
    alertLevel: 'normal',
    status: 1,
    createTime: '2026-05-01 10:00:00',
    updateTime: '2026-05-01 10:00:00'
  },
  {
    id: 2,
    name: '货船航向异常',
    behaviorType: 'course',
    shipTypes: ['货船', '客船'],
    params: { courseAngle: 30, duration: 30 },
    alertLevel: 'important',
    status: 1,
    createTime: '2026-06-01 10:00:00',
    updateTime: '2026-06-01 10:00:00'
  },
  {
    id: 3,
    name: '全域异常停留',
    behaviorType: 'stay',
    shipTypes: ['渔船', '货船', '客船', '快艇', '橡皮艇', '三无船'],
    params: { stayDuration: 30 },
    alertLevel: 'tip',
    status: 1,
    createTime: '2026-04-01 10:00:00',
    updateTime: '2026-04-01 10:00:00'
  },
  {
    id: 4,
    name: '渔船轨迹断线',
    behaviorType: 'disconnect',
    shipTypes: ['渔船'],
    params: { disconnectDuration: 60, autoClassify: ['信号丢失', '设备故障', '目标消失', '未知'] },
    alertLevel: 'important',
    status: 1,
    createTime: '2026-07-01 10:00:00',
    updateTime: '2026-07-01 10:00:00'
  }
]

let nextBehaviorRuleId = 10

// ==================== 告警事件 ====================
let mockEvents = [
  {
    id: 1,
    ruleId: 1,
    ruleName: '东海围栏规则',
    ruleType: 'fence',
    targetId: 'TGT-A001',
    targetName: '闽渔12345',
    targetMmsi: '412345678',
    alertLevel: 'urgent',
    location: { lat: 29.85, lng: 121.95, address: '东海海域' },
    triggerTime: '2026-07-29 08:30:00',
    status: 'pending',
    assigneeId: null,
    assigneeName: null,
    timeline: [
      { operator: '系统', time: '2026-07-29 08:30:00', action: '生成告警', remark: '目标进入东海禁航区' }
    ],
    isFalseAlarm: false,
    falseAlarmReason: '',
    falseAlarmRemark: '',
    createTime: '2026-07-29 08:30:00',
    updateTime: '2026-07-29 08:30:00'
  },
  {
    id: 2,
    ruleId: 1,
    ruleName: '东海围栏规则',
    ruleType: 'fence',
    targetId: 'TGT-A002',
    targetName: '浙货67890',
    targetMmsi: '413987654',
    alertLevel: 'important',
    location: { lat: 29.92, lng: 122.12, address: '东海海域' },
    triggerTime: '2026-07-29 09:15:00',
    status: 'disposing',
    assigneeId: 3,
    assigneeName: '李四',
    timeline: [
      { operator: '系统', time: '2026-07-29 09:15:00', action: '生成告警', remark: '目标进入东海禁航区' },
      { operator: '李四', time: '2026-07-29 09:20:00', action: '确认有效', remark: '确认目标为货船，疑似偏航' }
    ],
    isFalseAlarm: false,
    falseAlarmReason: '',
    falseAlarmRemark: '',
    createTime: '2026-07-29 09:15:00',
    updateTime: '2026-07-29 09:20:00'
  },
  {
    id: 3,
    ruleId: 2,
    ruleName: '巡检围栏-低速',
    ruleType: 'fence',
    targetId: 'TGT-B001',
    targetName: '粤渔11111',
    targetMmsi: '416123456',
    alertLevel: 'normal',
    location: { lat: 20.95, lng: 117.12, address: '南海海域' },
    triggerTime: '2026-07-29 07:45:00',
    status: 'closed',
    assigneeId: 4,
    assigneeName: '王五',
    timeline: [
      { operator: '系统', time: '2026-07-29 07:45:00', action: '生成告警', remark: '目标在巡检区域内低速行驶' },
      { operator: '王五', time: '2026-07-29 07:50:00', action: '确认有效', remark: '确认渔船异常低速' },
      { operator: '王五', time: '2026-07-29 08:30:00', action: '闭环', remark: '经核实为正常捕捞作业，无需处置' }
    ],
    isFalseAlarm: true,
    falseAlarmReason: '算法误判',
    falseAlarmRemark: '渔船正常捕捞作业，不应触发告警',
    createTime: '2026-07-29 07:45:00',
    updateTime: '2026-07-29 08:30:00'
  },
  {
    id: 4,
    ruleId: 1,
    ruleName: '东海围栏规则',
    ruleType: 'fence',
    targetId: 'TGT-A003',
    targetName: '闽渔54321',
    targetMmsi: '417654321',
    alertLevel: 'urgent',
    location: { lat: 29.78, lng: 122.08, address: '东海海域' },
    triggerTime: '2026-07-29 10:15:00',
    status: 'pending',
    assigneeId: null,
    assigneeName: null,
    timeline: [{ operator: '系统', time: '2026-07-29 10:15:00', action: '生成告警', remark: '目标高速接近禁航区域' }],
    isFalseAlarm: false, falseAlarmReason: '', falseAlarmRemark: '',
    createTime: '2026-07-29 10:15:00', updateTime: '2026-07-29 10:15:00'
  },
  {
    id: 5,
    ruleId: 4,
    ruleName: '渔船轨迹断线',
    ruleType: 'behavior',
    targetId: 'TGT-C001',
    targetName: '琼渔22222',
    targetMmsi: '418111222',
    alertLevel: 'important',
    location: { lat: 18.5, lng: 110.3, address: '南海海域' },
    triggerTime: '2026-07-29 09:00:00',
    status: 'disposing',
    assigneeId: 4,
    assigneeName: '王五',
    timeline: [
      { operator: '系统', time: '2026-07-29 09:00:00', action: '生成告警', remark: '渔船信号中断超60分钟' },
      { operator: '王五', time: '2026-07-29 09:10:00', action: '派发给雷达站', remark: '通知相关雷达站核实目标状态' }
    ],
    isFalseAlarm: false, falseAlarmReason: '', falseAlarmRemark: '',
    createTime: '2026-07-29 09:00:00', updateTime: '2026-07-29 09:10:00'
  },
  {
    id: 6,
    ruleId: 3,
    ruleName: '全域异常停留',
    ruleType: 'behavior',
    targetId: 'TGT-D001',
    targetName: '沪货33333',
    targetMmsi: '419333444',
    alertLevel: 'normal',
    location: { lat: 31.2, lng: 122.5, address: '长江口海域' },
    triggerTime: '2026-07-28 22:30:00',
    status: 'pending',
    assigneeId: null,
    assigneeName: null,
    timeline: [{ operator: '系统', time: '2026-07-28 22:30:00', action: '生成告警', remark: '货船异常停留超30分钟' }],
    isFalseAlarm: false, falseAlarmReason: '', falseAlarmRemark: '',
    createTime: '2026-07-28 22:30:00', updateTime: '2026-07-28 22:30:00'
  },
  {
    id: 7,
    ruleId: 2,
    ruleName: '巡检围栏-低速',
    ruleType: 'fence',
    targetId: 'TGT-B002',
    targetName: '粤货55555',
    targetMmsi: '416555666',
    alertLevel: 'normal',
    location: { lat: 20.8, lng: 117.0, address: '南海海域' },
    triggerTime: '2026-07-27 16:00:00',
    status: 'closed',
    assigneeId: 3,
    assigneeName: '李四',
    timeline: [
      { operator: '系统', time: '2026-07-27 16:00:00', action: '生成告警', remark: '货船在巡检区域低速行驶' },
      { operator: '李四', time: '2026-07-27 16:15:00', action: '确认为等泊', remark: '核实目标在等待泊位' },
      { operator: '李四', time: '2026-07-27 17:00:00', action: '闭环', remark: '经核实为正常等泊，归档处理' }
    ],
    isFalseAlarm: false, falseAlarmReason: '', falseAlarmRemark: '',
    createTime: '2026-07-27 16:00:00', updateTime: '2026-07-27 17:00:00'
  }

]

let nextEventId = 10

// ==================== 规则版本 ====================
let mockRuleVersions = [
  {
    id: 1,
    ruleId: 1,
    ruleType: 'fence',
    version: 'v1',
    snapshot: { priority: 1, alertLevel: 'urgent', shipTypes: ['渔船', '快艇', '三无船'] },
    changeSummary: '初始版本',
    operatorId: 1,
    operatorName: '管理员',
    createTime: '2026-06-01 10:00:00'
  },
  {
    id: 2,
    ruleId: 1,
    ruleType: 'fence',
    version: 'v2',
    snapshot: { priority: 1, alertLevel: 'urgent', shipTypes: ['渔船', '快艇', '三无船', '橡皮艇'] },
    changeSummary: '新增橡皮艇船型过滤',
    operatorId: 1,
    operatorName: '管理员',
    createTime: '2026-07-15 14:30:00'
  }
]

let nextVersionId = 10

// ==================== 导出 Mock 函数 ====================

// 地图区域
export const getAreaListMock = (params: any) => {
  let list = [...mockAreas]
  if (params?.name) list = list.filter((a) => a.name.includes(params.name))
  if (params?.type) list = list.filter((a) => a.type === params.type)
  if (params?.status !== undefined && params?.status !== '') {
    list = list.filter((a) => a.status === Number(params.status))
  }
  const page = Number(params?.page) || 1
  const pageSize = Number(params?.pageSize) || 10
  const total = list.length
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), pagination: { page, pageSize, total } }
}

export const addAreaMock = (data: any) => {
  const area = { ...data, id: nextAreaId++, status: 1, createTime: new Date().toISOString(), updateTime: new Date().toISOString() }
  mockAreas.push(area)
  return area
}

export const updateAreaMock = (id: number, data: any) => {
  const idx = mockAreas.findIndex((a) => a.id === id)
  if (idx === -1) return null
  const old = { ...mockAreas[idx] }
  mockAreas[idx] = { ...mockAreas[idx], ...data, status: 0, updateTime: new Date().toISOString() }
  mockApprovals.push({
    id: nextApprovalId++,
    areaId: id,
    areaName: old.name,
    before: { name: old.name, type: old.type, endDate: old.endDate },
    after: { name: data.name || old.name, type: data.type || old.type, endDate: data.endDate || old.endDate },
    submitter: '管理员',
    submitTime: new Date().toISOString(),
    reviewer: null,
    reviewTime: null,
    status: 'pending'
  })
  return mockAreas[idx]
}

export const deleteAreaMock = (id: number) => {
  const idx = mockAreas.findIndex((a) => a.id === id)
  if (idx === -1) return false
  mockAreas.splice(idx, 1)
  return true
}

export const getApprovalListMock = (params: any) => {
  let list = [...mockApprovals]
  if (params?.status) list = list.filter((a) => a.status === params.status)
  const page = Number(params?.page) || 1
  const pageSize = Number(params?.pageSize) || 10
  const total = list.length
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), pagination: { page, pageSize, total } }
}

export const approveMock = (id: number, result: string) => {
  const item = mockApprovals.find((a) => a.id === id)
  if (!item) return null
  item.status = result
  item.reviewer = '管理员'
  item.reviewTime = new Date().toISOString()
  if (result === 'approved') {
    const area = mockAreas.find((a) => a.id === item.areaId)
    if (area) area.status = 1
  } else {
    const area = mockAreas.find((a) => a.id === item.areaId)
    if (area) {
      area.status = 1
      area.name = item.before.name
      area.type = item.before.type
      area.endDate = item.before.endDate
    }
  }
  return item
}

// 围栏规则
export const getFenceRuleListMock = (params: any) => {
  let list = [...mockFenceRules]
  if (params?.name) list = list.filter((r) => r.name.includes(params.name))
  if (params?.status !== undefined && params?.status !== '') {
    list = list.filter((r) => r.status === Number(params.status))
  }
  const page = Number(params?.page) || 1
  const pageSize = Number(params?.pageSize) || 10
  const total = list.length
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), pagination: { page, pageSize, total } }
}

export const addFenceRuleMock = (data: any) => {
  const rule = { ...data, id: nextFenceRuleId++, createTime: new Date().toISOString(), updateTime: new Date().toISOString() }
  mockFenceRules.push(rule)
  return rule
}

export const updateFenceRuleMock = (id: number, data: any) => {
  const idx = mockFenceRules.findIndex((r) => r.id === id)
  if (idx === -1) return null
  mockFenceRules[idx] = { ...mockFenceRules[idx], ...data, updateTime: new Date().toISOString() }
  return mockFenceRules[idx]
}

export const deleteFenceRuleMock = (id: number) => {
  const idx = mockFenceRules.findIndex((r) => r.id === id)
  if (idx === -1) return false
  mockFenceRules.splice(idx, 1)
  return true
}

export const updateFenceRuleStatusMock = (id: number, status: number) => {
  const idx = mockFenceRules.findIndex((r) => r.id === id)
  if (idx === -1) return null
  mockFenceRules[idx].status = status
  mockFenceRules[idx].updateTime = new Date().toISOString()
  return mockFenceRules[idx]
}

// 黑名单
export const getBlacklistMock = (params: any) => {
  let list = [...mockBlacklist]
  if (params?.keyword) {
    const kw = params.keyword.toLowerCase()
    list = list.filter((b) => b.targetName.toLowerCase().includes(kw) || b.mmsi.includes(kw))
  }
  if (params?.level) list = list.filter((b) => b.level === params.level)
  if (params?.status !== undefined && params?.status !== '') {
    list = list.filter((b) => b.status === Number(params.status))
  }
  const page = Number(params?.page) || 1
  const pageSize = Number(params?.pageSize) || 10
  const total = list.length
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), pagination: { page, pageSize, total } }
}

export const addBlacklistMock = (data: any) => {
  const item = { ...data, id: nextBlacklistId++, hitCount: 0, lastHitTime: '', createTime: new Date().toISOString(), updateTime: new Date().toISOString() }
  mockBlacklist.push(item)
  return item
}

export const updateBlacklistMock = (id: number, data: any) => {
  const idx = mockBlacklist.findIndex((b) => b.id === id)
  if (idx === -1) return null
  mockBlacklist[idx] = { ...mockBlacklist[idx], ...data, updateTime: new Date().toISOString() }
  return mockBlacklist[idx]
}

export const deleteBlacklistMock = (id: number) => {
  const idx = mockBlacklist.findIndex((b) => b.id === id)
  if (idx === -1) return false
  mockBlacklist.splice(idx, 1)
  return true
}

export const updateBlacklistStatusMock = (id: number, status: number) => {
  const idx = mockBlacklist.findIndex((b) => b.id === id)
  if (idx === -1) return null
  mockBlacklist[idx].status = status
  mockBlacklist[idx].updateTime = new Date().toISOString()
  return mockBlacklist[idx]
}

// 行为预警规则
export const getBehaviorRuleListMock = (params: any) => {
  let list = [...mockBehaviorRules]
  if (params?.shipType && params.shipType !== '全部') {
    list = list.filter((r) => r.shipTypes.includes(params.shipType))
  }
  return { list }
}

export const updateBehaviorRuleMock = (id: number, data: any) => {
  const idx = mockBehaviorRules.findIndex((r) => r.id === id)
  if (idx === -1) return null
  mockBehaviorRules[idx] = { ...mockBehaviorRules[idx], ...data, updateTime: new Date().toISOString() }
  return mockBehaviorRules[idx]
}

// 告警事件
export const getAlertEventListMock = (params: any) => {
  let list = [...mockEvents]
  if (params?.alertLevel) list = list.filter((e) => e.alertLevel === params.alertLevel)
  if (params?.ruleName) list = list.filter((e) => e.ruleName.includes(params.ruleName))
  if (params?.keyword) {
    const kw = params.keyword.toLowerCase()
    list = list.filter((e) => e.targetName.toLowerCase().includes(kw) || e.targetMmsi.includes(kw))
  }
  if (params?.status) list = list.filter((e) => e.status === params.status)
  const page = Number(params?.page) || 1
  const pageSize = Number(params?.pageSize) || 10
  const total = list.length
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), pagination: { page, pageSize, total } }
}

export const getAlertEventStatsMock = () => {
  return {
    pending: mockEvents.filter((e) => e.status === 'pending').length,
    disposing: mockEvents.filter((e) => e.status === 'disposing').length,
    closedToday: mockEvents.filter((e) => e.status === 'closed').length,
    overdue: 1
  }
}

export const updateAlertEventMock = (id: number, data: any) => {
  const idx = mockEvents.findIndex((e) => e.id === id)
  if (idx === -1) return null
  mockEvents[idx] = { ...mockEvents[idx], ...data, updateTime: new Date().toISOString() }
  return mockEvents[idx]
}

export const addEventTimelineMock = (id: number, entry: any) => {
  const idx = mockEvents.findIndex((e) => e.id === id)
  if (idx === -1) return null
  mockEvents[idx].timeline.push(entry)
  mockEvents[idx].updateTime = new Date().toISOString()
  return mockEvents[idx]
}

// 误报治理统计
export const getFalseAlarmStatsMock = () => {
  const fenceTotal = mockEvents.filter((e) => e.ruleType === 'fence').length
  const fenceFalseAlarm = mockEvents.filter((e) => e.ruleType === 'fence' && e.isFalseAlarm).length
  return {
    totalAlerts: mockEvents.length,
    totalFalseAlarms: mockEvents.filter((e) => e.isFalseAlarm).length,
    falseAlarmRate: mockEvents.length > 0 ? (mockEvents.filter((e) => e.isFalseAlarm).length / mockEvents.length * 100).toFixed(1) + '%' : '0%',
    rules: [
      { ruleId: 1, ruleName: '东海围栏规则', ruleType: 'fence', totalAlerts: 2, falseAlarms: 0, falseAlarmRate: '0%' },
      { ruleId: 2, ruleName: '巡检围栏-低速', ruleType: 'fence', totalAlerts: 1, falseAlarms: 1, falseAlarmRate: '100%' }
    ]
  }
}

// 规则版本
export const getRuleVersionsMock = (ruleId: number) => {
  return mockRuleVersions.filter((v) => v.ruleId === ruleId)
}

export const addRuleVersionMock = (data: any) => {
  const v = { ...data, id: nextVersionId++, createTime: new Date().toISOString() }
  mockRuleVersions.push(v)
  return v
}
