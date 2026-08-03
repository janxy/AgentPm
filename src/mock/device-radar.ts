// @ts-nocheck
/**
 * 设备联动 Mock：雷达站运行参数 / PPI 回波目标
 * 增删改查基于模块级变量持久化，resetRadarMock 可恢复初始数据
 */

import { getDeviceListMock } from './device'

// ==================== 雷达站 ====================
const initialRadarStations = [
  { deviceId: 301, signalStrength: 96, antennaRpm: 12, temperature: 38.5, range: 24, gain: 60, colorScheme: 'cool', mode: 'R' },
  { deviceId: 302, signalStrength: 0, antennaRpm: 0, temperature: 42, range: 24, gain: 60, colorScheme: 'standard', mode: 'R' }
]

let mockRadarStations = JSON.parse(JSON.stringify(initialRadarStations))

// ==================== 雷达目标 ====================
const initialRadarTargets = [
  { id: 1, stationId: 301, targetNo: 'T001', distance: 3.2, bearing: 45, speed: 8, level: 'high', strength: 88 },
  { id: 2, stationId: 301, targetNo: 'T002', distance: 5.8, bearing: 120, speed: 12, level: 'high', strength: 82 },
  { id: 3, stationId: 301, targetNo: 'T003', distance: 8.4, bearing: 210, speed: 6, level: 'normal', strength: 64 },
  { id: 4, stationId: 301, targetNo: 'T004', distance: 11.6, bearing: 300, speed: 15, level: 'normal', strength: 55 },
  { id: 5, stationId: 301, targetNo: 'T005', distance: 15.2, bearing: 60, speed: 4, level: 'weak', strength: 38 },
  { id: 6, stationId: 301, targetNo: 'T006', distance: 19.8, bearing: 180, speed: 9, level: 'weak', strength: 30 },
  { id: 7, stationId: 302, targetNo: 'N001', distance: 6.5, bearing: 90, speed: 10, level: 'normal', strength: 58 }
]

let mockRadarTargets = JSON.parse(JSON.stringify(initialRadarTargets))

function findStation(deviceId: number) {
  return mockRadarStations.find((s) => s.deviceId === Number(deviceId))
}

// ==================== 雷达站列表与详情 ====================
export const getRadarStationListMock = () => {
  const devices = getDeviceListMock({ type: 'radar' }).list
  return { list: devices.map((d) => ({ ...d, ...findStation(d.id) })) }
}

export const getRadarStationDetailMock = (deviceId: number) => {
  const device = getDeviceListMock({ type: 'radar' }).list.find((d) => d.id === Number(deviceId))
  const station = findStation(deviceId)
  if (!device || !station) return null
  return { ...device, ...station }
}

export const updateRadarStationParamsMock = (deviceId: number, patch: any = {}) => {
  const station = findStation(deviceId)
  if (!station) return null
  Object.assign(station, patch)
  return { ...station }
}

// ==================== 雷达目标 ====================
export const getRadarTargetListMock = (stationId?: number) => {
  let list = [...mockRadarTargets]
  if (stationId) list = list.filter((t) => t.stationId === Number(stationId))
  return { list }
}

// ==================== 演示数据重置 ====================
export const resetRadarMock = () => {
  mockRadarStations = JSON.parse(JSON.stringify(initialRadarStations))
  mockRadarTargets = JSON.parse(JSON.stringify(initialRadarTargets))
  return { success: true }
}
