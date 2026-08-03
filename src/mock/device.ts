// @ts-nocheck
/**
 * 设备联动 Mock 数据（设备台账 / 状态统计 / 取证与喊话记录）
 * 增删改查基于模块级变量持久化，resetDeviceMock 可恢复初始数据
 */

// ==================== 设备台账 ====================
const initialDevices = [
  {
    id: 101,
    name: '东海1号光电',
    code: 'OPT-ED-001',
    type: 'optic',
    regionId: 1,
    regionName: '东海区域',
    status: 1,
    lng: 122.06,
    lat: 29.88,
    model: '光电转台 X500',
    protocol: 'GB/T 28181',
    lastHeartbeat: '2026-08-03 10:05:00',
    signalStrength: 92,
    onlineSeconds: 12600
  },
  {
    id: 102,
    name: '舟山港光电',
    code: 'OPT-ZS-002',
    type: 'optic',
    regionId: 2,
    regionName: '舟山区域',
    status: 1,
    lng: 122.2,
    lat: 29.98,
    model: '光电转台 X300',
    protocol: 'GB/T 28181',
    lastHeartbeat: '2026-08-03 10:06:00',
    signalStrength: 86,
    onlineSeconds: 8640
  },
  {
    id: 103,
    name: '南海1号光电',
    code: 'OPT-NH-003',
    type: 'optic',
    regionId: 3,
    regionName: '南海区域',
    status: 0,
    lng: 117.12,
    lat: 20.95,
    model: '光电转台 X500',
    protocol: 'GB/T 28181',
    lastHeartbeat: '2026-08-02 18:30:00',
    signalStrength: 0,
    onlineSeconds: 0
  },
  {
    id: 201,
    name: '东海1号无人机',
    code: 'UAV-ED-001',
    type: 'uav',
    regionId: 1,
    regionName: '东海区域',
    status: 1,
    lng: 122.1,
    lat: 29.95,
    model: '四旋翼 U200',
    protocol: 'MAVLink',
    lastHeartbeat: '2026-08-03 10:07:00',
    signalStrength: 88,
    onlineSeconds: 5400
  },
  {
    id: 202,
    name: '舟山港无人机',
    code: 'UAV-ZS-002',
    type: 'uav',
    regionId: 2,
    regionName: '舟山区域',
    status: 2,
    lng: 122.18,
    lat: 30.02,
    model: '六旋翼 U600',
    protocol: 'MAVLink',
    lastHeartbeat: '2026-08-03 09:20:00',
    signalStrength: 41,
    onlineSeconds: 3600
  },
  {
    id: 301,
    name: '东海雷达站',
    code: 'RAD-ED-001',
    type: 'radar',
    regionId: 1,
    regionName: '东海区域',
    status: 1,
    lng: 122.02,
    lat: 29.82,
    model: '海防雷达 R100',
    protocol: 'SIPR-RADAR',
    lastHeartbeat: '2026-08-03 10:07:00',
    signalStrength: 96,
    onlineSeconds: 21600
  },
  {
    id: 302,
    name: '南海雷达站',
    code: 'RAD-NH-002',
    type: 'radar',
    regionId: 3,
    regionName: '南海区域',
    status: 0,
    lng: 116.9,
    lat: 20.85,
    model: '海防雷达 R80',
    protocol: 'SIPR-RADAR',
    lastHeartbeat: '2026-08-02 22:00:00',
    signalStrength: 0,
    onlineSeconds: 0
  },
  {
    id: 401,
    name: '东海气象站',
    code: 'WEA-ED-001',
    type: 'weather',
    regionId: 1,
    regionName: '东海区域',
    status: 1,
    lng: 122.05,
    lat: 29.86,
    model: '自动气象站 W10',
    protocol: 'MQTT',
    lastHeartbeat: '2026-08-03 10:08:00',
    signalStrength: 79,
    onlineSeconds: 28800
  }
]

let mockDevices = JSON.parse(JSON.stringify(initialDevices))

// ==================== 最近操作记录 ====================
const initialOps = [
  { id: 1, deviceId: 101, action: '云台控制', operator: '管理员', content: '方位角调整至 120°', createTime: '2026-08-03 09:58:00' },
  { id: 2, deviceId: 101, action: '截图取证', operator: '管理员', content: '目标闽渔12345 现场截图', createTime: '2026-08-03 09:59:00' },
  { id: 3, deviceId: 101, action: '预设喊话', operator: '管理员', content: '驱离警告：请立即驶离禁航区域', createTime: '2026-08-03 10:00:00' },
  { id: 4, deviceId: 201, action: '任务下发', operator: '管理员', content: '执行航线：东海巡检A线', createTime: '2026-08-03 09:30:00' },
  { id: 5, deviceId: 301, action: '雷达截图', operator: '管理员', content: '目标 T001 回波取证', createTime: '2026-08-03 09:40:00' },
  { id: 6, deviceId: 102, action: '云台控制', operator: '管理员', content: '调用预置位：泊位全景', createTime: '2026-08-03 08:20:00' }
]

let mockOps = JSON.parse(JSON.stringify(initialOps))
let nextOpId = 100

// ==================== 取证记录 ====================
const initialEvidence = [
  {
    id: 1,
    deviceId: 101,
    deviceType: 'optic',
    type: 'screenshot',
    fileUrl: '/mock/evidence/ed-opt-001.png',
    size: '1.2MB',
    content: '东海1号光电 可见光截图',
    eventId: 1,
    targetId: 'TGT-A001',
    operatorName: '管理员',
    createTime: '2026-08-03 09:59:00'
  },
  {
    id: 2,
    deviceId: 301,
    deviceType: 'radar',
    type: 'screenshot',
    fileUrl: '/mock/evidence/ed-radar-001.png',
    size: '980KB',
    content: '东海雷达站 PPI 回波截图',
    eventId: null,
    targetId: null,
    operatorName: '管理员',
    createTime: '2026-08-03 09:40:00'
  }
]

let mockEvidence = JSON.parse(JSON.stringify(initialEvidence))
let nextEvidenceId = 100

// ==================== 喊话记录 ====================
const initialHailer = [
  { id: 1, deviceId: 101, content: '驱离警告：请立即驶离禁航区域', mode: 'tts', operatorName: '管理员', createTime: '2026-08-03 10:00:00' }
]

let mockHailer = JSON.parse(JSON.stringify(initialHailer))
let nextHailerId = 100

function formatTime(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

// ==================== 设备基础 ====================
export const getDeviceListMock = (params: any = {}) => {
  let list = [...mockDevices]
  if (params?.keyword) {
    const kw = String(params.keyword).toLowerCase()
    list = list.filter((d) => d.name.toLowerCase().includes(kw) || d.code.toLowerCase().includes(kw))
  }
  if (params?.type) list = list.filter((d) => d.type === params.type)
  if (params?.regionName) list = list.filter((d) => d.regionName === params.regionName)
  if (params?.status !== undefined && params?.status !== '' && params?.status !== null) {
    list = list.filter((d) => d.status === Number(params.status))
  }
  return { list }
}

export const getDeviceStatsMock = () => {
  return {
    total: mockDevices.length,
    online: mockDevices.filter((d) => d.status === 1).length,
    offline: mockDevices.filter((d) => d.status === 0).length,
    fault: mockDevices.filter((d) => d.status === 2).length
  }
}

export const getDeviceDetailMock = (id: number) => {
  const device = mockDevices.find((d) => d.id === Number(id))
  if (!device) return null
  return { ...device, ops: mockOps.filter((o) => o.deviceId === Number(id)).slice(-20) }
}

export const updateDeviceHeartbeatMock = (id: number) => {
  const device = mockDevices.find((d) => d.id === Number(id))
  if (!device) return null
  device.lastHeartbeat = formatTime(new Date())
  device.signalStrength = device.status === 1 ? 80 + (Number(id) % 18) : device.status === 2 ? 42 : 0
  if (device.status === 1) device.onlineSeconds = (device.onlineSeconds || 0) + 30
  return device
}

// ==================== 取证记录 ====================
export const getEvidenceListMock = (params: any = {}) => {
  let list = [...mockEvidence]
  if (params?.deviceId) list = list.filter((e) => e.deviceId === Number(params.deviceId))
  if (params?.type) list = list.filter((e) => e.type === params.type)
  if (params?.eventId) list = list.filter((e) => e.eventId === Number(params.eventId))
  list.sort((a, b) => String(b.createTime).localeCompare(String(a.createTime)))
  return { list }
}

export const addEvidenceMock = (data: any = {}) => {
  const item = {
    id: nextEvidenceId++,
    deviceId: data.deviceId || null,
    deviceType: data.deviceType || 'optic',
    type: data.type || 'screenshot',
    fileUrl: data.fileUrl || `/mock/evidence/evidence-${nextEvidenceId}.png`,
    size: data.size || '1MB',
    content: data.content || '',
    eventId: data.eventId ?? null,
    targetId: data.targetId ?? null,
    operatorName: data.operatorName || '管理员',
    createTime: formatTime(new Date())
  }
  mockEvidence.unshift(item)
  if (item.deviceId) {
    mockOps.push({ id: nextOpId++, deviceId: item.deviceId, action: item.type === 'screenshot' ? '截图取证' : '录像取证', operator: item.operatorName, content: item.content, createTime: item.createTime })
  }
  return item
}

// ==================== 喊话记录 ====================
export const getHailerListMock = (deviceId?: number) => {
  let list = [...mockHailer]
  if (deviceId) list = list.filter((h) => h.deviceId === Number(deviceId))
  list.sort((a, b) => String(b.createTime).localeCompare(String(a.createTime)))
  return { list }
}

export const addHailerMock = (data: any = {}) => {
  const item = {
    id: nextHailerId++,
    deviceId: data.deviceId,
    content: data.content || '',
    mode: data.mode || 'tts',
    operatorName: data.operatorName || '管理员',
    createTime: formatTime(new Date())
  }
  mockHailer.unshift(item)
  if (item.deviceId) {
    mockOps.push({ id: nextOpId++, deviceId: item.deviceId, action: '预设喊话', operator: item.operatorName, content: item.content, createTime: item.createTime })
  }
  return item
}

// ==================== 演示数据重置 ====================
export const resetDeviceMock = () => {
  mockDevices = JSON.parse(JSON.stringify(initialDevices))
  mockOps = JSON.parse(JSON.stringify(initialOps))
  mockEvidence = JSON.parse(JSON.stringify(initialEvidence))
  mockHailer = JSON.parse(JSON.stringify(initialHailer))
  nextOpId = 100
  nextEvidenceId = 100
  nextHailerId = 100
  return { success: true }
}
