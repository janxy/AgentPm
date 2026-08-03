// @ts-nocheck
/**
 * 设备联动 Mock：无人机实时状态 / 航线 / 航线模板 / 任务与异常记录
 * 增删改查基于模块级变量持久化，resetUavMock 可恢复初始数据
 */

import { getDeviceListMock } from './device'

// ==================== 无人机实时状态 ====================
const initialUavStates = [
  {
    deviceId: 201, altitude: 120, speed: 18, heading: 210, roll: 2.5, pitch: 3.2,
    battery: 68, distanceFromOrigin: 3.2, enduranceMinutes: 46,
    flightStatus: 'flying', signalLost: false,
    origin: { lat: 29.95, lng: 122.1 }
  },
  {
    deviceId: 202, altitude: 0, speed: 0, heading: 0, roll: 0, pitch: 0,
    battery: 12, distanceFromOrigin: 5.8, enduranceMinutes: 8,
    flightStatus: 'offline', signalLost: true,
    origin: { lat: 30.02, lng: 122.18 }
  }
]

let mockUavStates = JSON.parse(JSON.stringify(initialUavStates))

const initialRoutes: Record<number, any> = {
  201: {
    takeoffPoint: { lat: 29.95, lng: 122.1 },
    landingPoint: { lat: 29.95, lng: 122.1 },
    waypoints: [
      { id: 1, lat: 29.92, lng: 122.08, altitude: 120, speed: 18 },
      { id: 2, lat: 29.88, lng: 122.12, altitude: 150, speed: 22 },
      { id: 3, lat: 29.9, lng: 122.18, altitude: 100, speed: 16 },
      { id: 4, lat: 29.95, lng: 122.15, altitude: 120, speed: 20 }
    ]
  },
  202: {
    takeoffPoint: { lat: 30.02, lng: 122.18 },
    landingPoint: { lat: 30.02, lng: 122.18 },
    waypoints: []
  }
}

let mockRoutes = JSON.parse(JSON.stringify(initialRoutes))
let nextWaypointId = 100

// ==================== 航线模板 ====================
const initialTemplates = [
  {
    id: 1, name: '东海巡检A线', uavId: 201,
    takeoffPoint: { lat: 29.95, lng: 122.1 }, landingPoint: { lat: 29.95, lng: 122.1 },
    waypoints: [
      { id: 1, lat: 29.92, lng: 122.08, altitude: 120, speed: 18 },
      { id: 2, lat: 29.88, lng: 122.12, altitude: 150, speed: 22 },
      { id: 3, lat: 29.9, lng: 122.18, altitude: 100, speed: 16 },
      { id: 4, lat: 29.95, lng: 122.15, altitude: 120, speed: 20 }
    ],
    totalDistance: 18.6
  },
  {
    id: 2, name: '舟山港区巡查线', uavId: 202,
    takeoffPoint: { lat: 30.02, lng: 122.18 }, landingPoint: { lat: 30.02, lng: 122.18 },
    waypoints: [
      { id: 1, lat: 30.0, lng: 122.2, altitude: 90, speed: 15 },
      { id: 2, lat: 30.04, lng: 122.22, altitude: 110, speed: 18 }
    ],
    totalDistance: 8.4
  }
]

let mockTemplates = JSON.parse(JSON.stringify(initialTemplates))
let nextTemplateId = 100

// ==================== 任务与异常记录 ====================
const initialTasks = [
  {
    id: 1, uavId: 201, templateId: 1, status: 'planned', currentWaypointIndex: 0, progress: 0,
    flownDistance: 0, startTime: '', endTime: '', events: [],
    waypoints: initialRoutes[201].waypoints.map((w) => ({ ...w }))
  },
  {
    id: 2, uavId: 202, templateId: 2, status: 'finished', currentWaypointIndex: 2, progress: 100,
    flownDistance: 8.4, startTime: '2026-08-03 08:00:00', endTime: '2026-08-03 08:42:00',
    events: [
      { time: '2026-08-03 08:20:00', type: '低电量', content: '电量低于20%，任务中断并自动返航' },
      { time: '2026-08-03 08:35:00', type: '信号丢失', content: '回传信号中断，进入自动返航' }
    ],
    waypoints: initialRoutes[202].waypoints.map((w) => ({ ...w }))
  }
]

let mockTasks = JSON.parse(JSON.stringify(initialTasks))
let nextTaskId = 100

function findState(deviceId: number) {
  return mockUavStates.find((s) => s.deviceId === Number(deviceId))
}

function formatTime(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

// ==================== 无人机列表与状态 ====================
export const getUavListMock = () => {
  const devices = getDeviceListMock({ type: 'uav' }).list
  return { list: devices.map((d) => ({ ...d, ...findState(d.id) })) }
}

export const getUavStateMock = (deviceId: number) => {
  const state = findState(deviceId)
  if (!state) return null
  return { ...state }
}

export const controlUavMock = (deviceId: number, action: string) => {
  const state = findState(deviceId)
  if (!state) return null
  if (action === 'takeoff') {
    state.flightStatus = 'flying'
    state.altitude = Math.max(state.altitude, 30)
  } else if (action === 'hover') {
    state.flightStatus = 'hover'
    state.speed = 0
  } else if (action === 'return') {
    state.flightStatus = 'returning'
    state.speed = 15
  }
  return { ...state }
}

// ==================== 航线 ====================
export const getUavRouteMock = (deviceId: number) => {
  const route = mockRoutes[Number(deviceId)]
  if (!route) return null
  return JSON.parse(JSON.stringify(route))
}

export const saveUavRouteMock = (deviceId: number, data: any = {}) => {
  const route = mockRoutes[Number(deviceId)]
  if (!route) return null
  route.takeoffPoint = data.takeoffPoint || route.takeoffPoint
  route.landingPoint = data.landingPoint || route.landingPoint
  route.waypoints = (data.waypoints || []).map((w: any) => ({
    id: w.id || nextWaypointId++,
    lat: w.lat, lng: w.lng, altitude: w.altitude, speed: w.speed
  }))
  return JSON.parse(JSON.stringify(route))
}

// ==================== 航线模板 ====================
export const getRouteTemplateListMock = () => {
  return { list: JSON.parse(JSON.stringify(mockTemplates)) }
}

export const saveRouteTemplateMock = (data: any = {}) => {
  const existing = mockTemplates.find((t) => t.id === Number(data.id))
  if (existing) {
    Object.assign(existing, {
      name: data.name || existing.name, uavId: data.uavId || existing.uavId,
      takeoffPoint: data.takeoffPoint || existing.takeoffPoint,
      landingPoint: data.landingPoint || existing.landingPoint,
      waypoints: data.waypoints || existing.waypoints,
      totalDistance: data.totalDistance || 0
    })
    return existing
  }
  const item = {
    id: nextTemplateId++,
    name: data.name || '航线模板',
    uavId: data.uavId,
    takeoffPoint: data.takeoffPoint,
    landingPoint: data.landingPoint,
    waypoints: data.waypoints || [],
    totalDistance: data.totalDistance || 0
  }
  mockTemplates.unshift(item)
  return item
}

// ==================== 任务 ====================
export const getUavTaskListMock = (uavId?: number) => {
  let list = [...mockTasks]
  if (uavId) list = list.filter((t) => t.uavId === Number(uavId))
  list.sort((a, b) => String(b.startTime).localeCompare(String(a.startTime)))
  return { list }
}

export const createUavTaskMock = (uavId: number, data: any = {}) => {
  const item = {
    id: nextTaskId++,
    uavId: Number(uavId),
    templateId: data.templateId ?? null,
    status: 'planned',
    currentWaypointIndex: 0,
    progress: 0,
    flownDistance: 0,
    startTime: '',
    endTime: '',
    events: [],
    waypoints: (data.waypoints || []).map((w: any) => ({ ...w }))
  }
  mockTasks.unshift(item)
  return item
}

export const updateUavTaskMock = (taskId: number, patch: any = {}) => {
  const task = mockTasks.find((t) => t.id === Number(taskId))
  if (!task) return null
  Object.assign(task, patch)
  return task
}

export const addUavEventMock = (uavId: number, event: any = {}) => {
  const task = mockTasks.find((t) => t.uavId === Number(uavId) && t.status !== 'finished')
  const item = {
    time: formatTime(new Date()),
    type: event.type || '异常',
    content: event.content || ''
  }
  if (task) task.events.push(item)
  return item
}

// ==================== 演示数据重置 ====================
export const resetUavMock = () => {
  mockUavStates = JSON.parse(JSON.stringify(initialUavStates))
  mockRoutes = JSON.parse(JSON.stringify(initialRoutes))
  mockTemplates = JSON.parse(JSON.stringify(initialTemplates))
  mockTasks = JSON.parse(JSON.stringify(initialTasks))
  nextWaypointId = 100
  nextTemplateId = 100
  nextTaskId = 100
  return { success: true }
}
