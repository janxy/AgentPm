import request from '@/utils/http'

type ListResult = { list: any[] }
type DeviceStatsResult = { total: number; online: number; offline: number; fault: number }
type OpticControlResult = {
  warning?: 'panLimit' | 'tiltLimit'
  error?: string
  state?: any
}
type OpticActionResult = {
  error?: string
  state?: any
}
type CruiseActionResult = OpticActionResult & { plan?: any; presetId?: number }

// ==================== 设备台账 / 状态 ====================

/** 获取设备列表（按关键字/类型/区域/状态筛选） */
export function getDeviceList(params?: { keyword?: string; type?: string; regionName?: string; status?: number | string }) {
  return request.get<ListResult>({ url: '/admin/device/list', params })
}

/** 获取设备状态统计 */
export function getDeviceStats() {
  return request.get<DeviceStatsResult>({ url: '/admin/device/stats' })
}

/** 获取设备详情（含最近操作记录） */
export function getDeviceDetail(id: number) {
  return request.get<any>({ url: `/admin/device/detail/${id}` })
}

/** 模拟设备心跳刷新 */
export function updateDeviceHeartbeat(id: number) {
  return request.put<any>({ url: `/admin/device/heartbeat/${id}` })
}

/** 重置设备联动演示数据 */
export function resetDeviceData() {
  return request.post<any>({ url: '/admin/device/reset' })
}

// ==================== 取证 / 喊话 ====================

/** 获取取证记录列表 */
export function getEvidenceList(params?: { deviceId?: number; type?: string; eventId?: number }) {
  return request.get<ListResult>({ url: '/admin/device/evidence/list', params })
}

/** 新增取证记录（截图/录像） */
export function addEvidence(data: any) {
  return request.post<any>({ url: '/admin/device/evidence/add', data })
}

/** 获取喊话记录列表 */
export function getHailerList(deviceId?: number) {
  return request.get<ListResult>({ url: '/admin/device/hailer/list', params: { deviceId } })
}

/** 新增喊话记录 */
export function addHailer(data: any) {
  return request.post<any>({ url: '/admin/device/hailer/add', data })
}

// ==================== 光电联动 ====================

/** 获取光电设备列表（含实时云台状态） */
export function getOpticDeviceList() {
  return request.get<ListResult>({ url: '/admin/device/optic/list' })
}

/** 获取光电设备实时状态 */
export function getOpticState(deviceId: number) {
  return request.get<any>({ url: `/admin/device/optic/state/${deviceId}` })
}

/** 更新光电设备状态（模式/倍率等） */
export function updateOpticState(deviceId: number, data: any) {
  return request.put<any>({ url: `/admin/device/optic/state/${deviceId}`, data })
}

/** 云台控制（八方向/变倍/聚焦） */
export function controlOptic(deviceId: number, action: string, step = 1) {
  return request.put<OpticControlResult>({ url: `/admin/device/optic/control/${deviceId}`, data: { action, step } })
}

/** 获取预置位列表 */
export function getPresetList(deviceId?: number) {
  return request.get<ListResult>({ url: '/admin/device/optic/preset/list', params: { deviceId } })
}

/** 新增预置位（记录当前云台状态） */
export function addPreset(deviceId: number, name: string) {
  return request.post<OpticActionResult>({ url: '/admin/device/optic/preset/add', data: { deviceId, name } })
}

/** 重命名预置位 */
export function updatePreset(id: number, data: any) {
  return request.put<OpticActionResult>({ url: `/admin/device/optic/preset/update/${id}`, data })
}

/** 删除预置位 */
export function deletePreset(id: number) {
  return request.del<any>({ url: `/admin/device/optic/preset/delete/${id}` })
}

/** 调用预置位 */
export function callPreset(deviceId: number, presetId: number) {
  return request.post<OpticActionResult>({ url: '/admin/device/optic/preset/call', data: { deviceId, presetId } })
}

/** 获取巡航计划列表 */
export function getCruisePlanList(deviceId?: number) {
  return request.get<ListResult>({ url: '/admin/device/optic/cruise/list', params: { deviceId } })
}

/** 保存巡航计划 */
export function saveCruisePlan(data: any) {
  return request.post<any>({ url: '/admin/device/optic/cruise/save', data })
}

/** 删除巡航计划 */
export function deleteCruisePlan(id: number) {
  return request.del<any>({ url: `/admin/device/optic/cruise/delete/${id}` })
}

/** 启动巡航 */
export function startCruise(deviceId: number, planId: number) {
  return request.post<CruiseActionResult>({ url: '/admin/device/optic/cruise/start', data: { deviceId, planId } })
}

/** 停止巡航 */
export function stopCruise(deviceId: number) {
  return request.post<any>({ url: '/admin/device/optic/cruise/stop', data: { deviceId } })
}

/** 巡航步进（推进到下一个预置位） */
export function tickCruise(deviceId: number) {
  return request.post<CruiseActionResult>({ url: '/admin/device/optic/cruise/tick', data: { deviceId } })
}

// ==================== 无人机联动 ====================

/** 获取无人机列表（含实时飞行状态） */
export function getUavList() {
  return request.get<ListResult>({ url: '/admin/device/uav/list' })
}

/** 获取无人机实时状态 */
export function getUavState(deviceId: number) {
  return request.get<any>({ url: `/admin/device/uav/state/${deviceId}` })
}

/** 无人机基础控制（起飞/返航/悬停） */
export function controlUav(deviceId: number, action: string) {
  return request.post<any>({ url: `/admin/device/uav/control/${deviceId}`, data: { action } })
}

/** 获取无人机航线 */
export function getUavRoute(deviceId: number) {
  return request.get<any>({ url: `/admin/device/uav/route/${deviceId}` })
}

/** 保存无人机航线 */
export function saveUavRoute(deviceId: number, data: any) {
  return request.put<any>({ url: `/admin/device/uav/route/${deviceId}`, data })
}

/** 获取航线模板列表 */
export function getRouteTemplateList() {
  return request.get<ListResult>({ url: '/admin/device/uav/template/list' })
}

/** 保存航线模板 */
export function saveRouteTemplate(data: any) {
  return request.post<any>({ url: '/admin/device/uav/template/save', data })
}

/** 获取无人机任务列表 */
export function getUavTaskList(uavId?: number) {
  return request.get<ListResult>({ url: '/admin/device/uav/task/list', params: { uavId } })
}

/** 创建无人机航线任务 */
export function createUavTask(data: any) {
  return request.post<any>({ url: '/admin/device/uav/task/create', data })
}

/** 更新无人机任务（进度/状态/异常） */
export function updateUavTask(id: number, data: any) {
  return request.put<any>({ url: `/admin/device/uav/task/update/${id}`, data })
}

/** 记录无人机异常事件 */
export function addUavEvent(data: any) {
  return request.post<any>({ url: '/admin/device/uav/event', data })
}

// ==================== 雷达监测 ====================

/** 获取雷达站列表 */
export function getRadarStationList() {
  return request.get<ListResult>({ url: '/admin/device/radar/station/list' })
}

/** 获取雷达站详情（运行参数） */
export function getRadarStationDetail(deviceId: number) {
  return request.get<any>({ url: `/admin/device/radar/station/detail/${deviceId}` })
}

/** 获取雷达目标列表 */
export function getRadarTargetList(stationId?: number) {
  return request.get<ListResult>({ url: '/admin/device/radar/target/list', params: { stationId } })
}

/** 更新雷达站运行参数（量程/增益/色标/模式） */
export function updateRadarStationParams(deviceId: number, data: any) {
  return request.put<any>({ url: `/admin/device/radar/station/params/${deviceId}`, data })
}
