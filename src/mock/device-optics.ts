// @ts-nocheck
/**
 * 设备联动 Mock：光电设备实时状态 / 云台控制 / 预置位 / 巡航
 * 增删改查基于模块级变量持久化，resetOpticMock 可恢复初始数据
 */

import { getDeviceListMock } from './device'

// ==================== 光电设备实时状态 ====================
const initialOpticStates = [
  { deviceId: 101, pan: 120, tilt: 5, zoom: 12, focus: 8, mode: 'visible', dualLight: true, maxZoom: 30, runningPlanId: null, runningPresetIndex: -1 },
  { deviceId: 102, pan: 160, tilt: 2, zoom: 14, focus: 10, mode: 'visible', dualLight: false, maxZoom: 20, runningPlanId: null, runningPresetIndex: -1 },
  { deviceId: 103, pan: 90, tilt: 10, zoom: 8, focus: 6, mode: 'visible', dualLight: true, maxZoom: 24, runningPlanId: null, runningPresetIndex: -1 }
]

let mockOpticStates = JSON.parse(JSON.stringify(initialOpticStates))

// ==================== 预置位 ====================
const initialPresets = [
  { id: 1, deviceId: 101, name: '泊位全景', pan: 120, tilt: 5, zoom: 12 },
  { id: 2, deviceId: 101, name: '航道出口', pan: 210, tilt: -8, zoom: 8 },
  { id: 3, deviceId: 101, name: '灯塔塔顶', pan: 285, tilt: 12, zoom: 6 },
  { id: 4, deviceId: 102, name: '码头东侧', pan: 45, tilt: 3, zoom: 10 },
  { id: 5, deviceId: 102, name: '泊位全景', pan: 160, tilt: 2, zoom: 14 },
  { id: 6, deviceId: 103, name: '南海瞭望点', pan: 90, tilt: 10, zoom: 8 }
]

let mockPresets = JSON.parse(JSON.stringify(initialPresets))
let nextPresetId = 100

// ==================== 巡航计划 ====================
const initialCruisePlans = [
  { id: 1, deviceId: 101, name: '泊位巡检', presetIds: [1, 2], dwellSeconds: 5 },
  { id: 2, deviceId: 101, name: '全境巡航', presetIds: [1, 2, 3], dwellSeconds: 4 },
  { id: 3, deviceId: 102, name: '码头巡检', presetIds: [4, 5], dwellSeconds: 6 }
]

let mockCruisePlans = JSON.parse(JSON.stringify(initialCruisePlans))
let nextCruiseId = 100

function findState(deviceId: number) {
  return mockOpticStates.find((s) => s.deviceId === Number(deviceId))
}

// ==================== 设备列表与状态 ====================
export const getOpticDeviceListMock = () => {
  const devices = getDeviceListMock({ type: 'optic' }).list
  return {
    list: devices.map((d) => ({ ...d, ...findState(d.id) }))
  }
}

export const getOpticStateMock = (deviceId: number) => {
  const state = findState(deviceId)
  if (!state) return null
  return { ...state }
}

export const updateOpticStateMock = (deviceId: number, patch: any = {}) => {
  const state = findState(deviceId)
  if (!state) return null
  Object.assign(state, patch)
  return { ...state }
}

// ==================== 云台控制 ====================
const directionMap: Record<string, [number, number]> = {
  up: [0, 1], down: [0, -1], left: [-1, 0], right: [1, 0],
  leftUp: [-1, 1], rightUp: [1, 1], leftDown: [-1, -1], rightDown: [1, -1]
}

export const controlOpticMock = (deviceId: number, action: string, step = 1) => {
  const state = findState(deviceId)
  if (!state) return null
  const delta = Number(step) || 1
  let warning = ''
  if (directionMap[action]) {
    const [dx, dy] = directionMap[action]
    const nextPan = state.pan + dx * delta
    const nextTilt = state.tilt + dy * delta
    if (nextPan < 0 || nextPan > 360) warning = 'panLimit'
    else state.pan = Math.round(nextPan * 10) / 10
    if (nextTilt < -45 || nextTilt > 45) warning = warning || 'tiltLimit'
    else state.tilt = Math.round(nextTilt * 10) / 10
  } else if (action === 'zoomIn') {
    state.zoom = Math.min(state.maxZoom, state.zoom + 1)
  } else if (action === 'zoomOut') {
    state.zoom = Math.max(1, state.zoom - 1)
  } else if (action === 'focusNear') {
    state.focus = Math.max(1, state.focus + 1)
  } else if (action === 'focusFar') {
    state.focus = Math.max(1, state.focus - 1)
  }
  return { state: { ...state }, warning }
}

// ==================== 预置位 ====================
export const getPresetListMock = (deviceId?: number) => {
  let list = [...mockPresets]
  if (deviceId) list = list.filter((p) => p.deviceId === Number(deviceId))
  return { list }
}

export const addPresetMock = (deviceId: number, name: string) => {
  const same = mockPresets.some((p) => p.deviceId === Number(deviceId) && p.name === name)
  if (same) return { error: 'duplicate' }
  const state = findState(deviceId)
  const item = { id: nextPresetId++, deviceId: Number(deviceId), name, pan: state.pan, tilt: state.tilt, zoom: state.zoom }
  mockPresets.push(item)
  return item
}

export const updatePresetMock = (id: number, data: any = {}) => {
  const item = mockPresets.find((p) => p.id === Number(id))
  if (!item) return null
  if (data.name) {
    const same = mockPresets.some((p) => p.id !== item.id && p.deviceId === item.deviceId && p.name === data.name)
    if (same) return { error: 'duplicate' }
    item.name = data.name
  }
  return item
}

export const deletePresetMock = (id: number) => {
  const idx = mockPresets.findIndex((p) => p.id === Number(id))
  if (idx === -1) return false
  mockPresets.splice(idx, 1)
  mockCruisePlans.forEach((plan) => {
    plan.presetIds = plan.presetIds.filter((pid: number) => pid !== Number(id))
  })
  return true
}

export const callPresetMock = (deviceId: number, presetId: number) => {
  const preset = mockPresets.find((p) => p.id === Number(presetId) && p.deviceId === Number(deviceId))
  if (!preset) return null
  const state = findState(deviceId)
  Object.assign(state, { pan: preset.pan, tilt: preset.tilt, zoom: preset.zoom })
  return { ...preset, state: { ...state } }
}

// ==================== 巡航 ====================
export const getCruisePlanListMock = (deviceId?: number) => {
  let list = [...mockCruisePlans]
  if (deviceId) list = list.filter((p) => p.deviceId === Number(deviceId))
  return { list }
}

export const saveCruisePlanMock = (data: any = {}) => {
  const existing = mockCruisePlans.find((p) => p.id === Number(data.id))
  if (existing) {
    Object.assign(existing, { name: data.name || existing.name, presetIds: data.presetIds || [], dwellSeconds: data.dwellSeconds || 5 })
    return existing
  }
  const item = { id: nextCruiseId++, deviceId: data.deviceId, name: data.name || '巡航计划', presetIds: data.presetIds || [], dwellSeconds: data.dwellSeconds || 5 }
  mockCruisePlans.push(item)
  return item
}

export const deleteCruisePlanMock = (id: number) => {
  const idx = mockCruisePlans.findIndex((p) => p.id === Number(id))
  if (idx === -1) return false
  mockCruisePlans.splice(idx, 1)
  return true
}

export const startCruiseMock = (deviceId: number, planId: number) => {
  const state = findState(deviceId)
  const plan = mockCruisePlans.find((p) => p.id === Number(planId) && p.deviceId === Number(deviceId))
  if (!state || !plan || plan.presetIds.length < 2) return null
  state.runningPlanId = plan.id
  state.runningPresetIndex = 0
  const first = mockPresets.find((p) => p.id === plan.presetIds[0])
  if (first) Object.assign(state, { pan: first.pan, tilt: first.tilt, zoom: first.zoom })
  return { state: { ...state }, plan: { ...plan } }
}

export const stopCruiseMock = (deviceId: number) => {
  const state = findState(deviceId)
  if (!state) return null
  state.runningPlanId = null
  state.runningPresetIndex = -1
  return { ...state }
}

export const tickCruiseMock = (deviceId: number) => {
  const state = findState(deviceId)
  if (!state || !state.runningPlanId) return { state: { ...state } }
  const plan = mockCruisePlans.find((p) => p.id === state.runningPlanId)
  if (!plan) return { state: { ...state } }
  const nextIndex = (state.runningPresetIndex + 1) % plan.presetIds.length
  state.runningPresetIndex = nextIndex
  const preset = mockPresets.find((p) => p.id === plan.presetIds[nextIndex])
  if (preset) Object.assign(state, { pan: preset.pan, tilt: preset.tilt, zoom: preset.zoom })
  return { state: { ...state }, presetId: plan.presetIds[nextIndex] }
}

// ==================== 演示数据重置 ====================
export const resetOpticMock = () => {
  mockOpticStates = JSON.parse(JSON.stringify(initialOpticStates))
  mockPresets = JSON.parse(JSON.stringify(initialPresets))
  mockCruisePlans = JSON.parse(JSON.stringify(initialCruisePlans))
  nextPresetId = 100
  nextCruiseId = 100
  return { success: true }
}
