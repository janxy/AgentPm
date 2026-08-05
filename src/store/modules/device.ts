import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getDeviceList, getDeviceStats, resetDeviceData, updateDeviceHeartbeat } from '@/api/device'

/**
 * 设备联动上下文
 * 由预警事件入口写入，光电联动页消费，离开联动页后清除
 */
export interface DeviceLinkContext {
  eventId?: number
  targetId?: string
  deviceId?: number
  sourceRoute?: string
  eventName?: string
  targetName?: string
  targetMmsi?: string
  ruleName?: string
  alertLevel?: string
  status?: string
  location?: { lat: number; lng: number; address?: string }
  triggerTime?: string
  fromOptics?: boolean
  opticDeviceId?: number
}

/**
 * 设备联动共享状态
 * 管理设备台账、状态统计、选中设备、联动上下文与心跳刷新
 */
export const useDeviceStore = defineStore('deviceStore', () => {
  /** 设备台账列表 */
  const deviceList = ref<any[]>([])
  /** 设备状态统计 */
  const stats = ref({ total: 0, online: 0, offline: 0, fault: 0 })
  /** 当前选中设备 */
  const selectedDeviceId = ref<number | null>(null)
  /** 预警事件联动上下文 */
  const linkContext = ref<DeviceLinkContext | null>(null)
  /** 心跳刷新定时器 */
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null

  /** 当前选中设备对象 */
  const selectedDevice = computed(() => deviceList.value.find((d) => d.id === selectedDeviceId.value) || null)

  /** 加载设备台账列表 */
  async function loadDevices(params: any = {}) {
    const { data } = await getDeviceList(params)
    deviceList.value = (data as any)?.list || []
  }

  /** 加载设备状态统计 */
  async function loadStats() {
    const { data } = await getDeviceStats()
    stats.value = (data as any) || stats.value
  }

  /** 刷新设备列表与统计 */
  async function refreshDevices() {
    await Promise.all([loadDevices(), loadStats()])
  }

  /** 模拟在线设备心跳并刷新统计 */
  async function tickHeartbeat() {
    const onlineIds = deviceList.value.filter((d) => d.status !== 0).map((d) => d.id)
    if (onlineIds.length === 0) return
    await Promise.all(onlineIds.map((id: number) => updateDeviceHeartbeat(id)))
    await refreshDevices()
  }

  /** 启动心跳定时刷新（默认 30 秒一次） */
  function startHeartbeat(interval = 30000) {
    stopHeartbeat()
    heartbeatTimer = setInterval(() => tickHeartbeat(), interval)
  }

  /** 停止心跳定时刷新 */
  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  /** 选中设备 */
  function selectDevice(id: number | null) {
    selectedDeviceId.value = id
  }

  /** 写入联动上下文（保留旧值，支持增量补充） */
  function setLinkContext(ctx: DeviceLinkContext) {
    linkContext.value = { ...(linkContext.value || {}), ...ctx }
  }

  /** 清除联动上下文 */
  function clearLinkContext() {
    linkContext.value = null
  }

  /** 重置设备联动演示数据 */
  async function resetDemoData() {
    await resetDeviceData()
    await refreshDevices()
  }

  return {
    deviceList,
    stats,
    selectedDeviceId,
    selectedDevice,
    linkContext,
    loadDevices,
    loadStats,
    refreshDevices,
    tickHeartbeat,
    startHeartbeat,
    stopHeartbeat,
    selectDevice,
    setLinkContext,
    clearLinkContext,
    resetDemoData
  }
})
