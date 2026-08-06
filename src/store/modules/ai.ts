import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getAiEngineOverview,
  getAlgorithmServiceList,
  getAlgorithmServiceDetail,
  restartAlgorithmService,
  switchAlgorithmVersion,
  updateAlgorithmServiceConfig,
  getAssistantSession,
  sendAssistantMessage,
  getBehaviorAnalysisList,
  getMifaPipeline,
  getShipDevices,
  getShipRecognitionDetail,
  getShipRecognitionList,
  reviewShipRecognition,
  setMifaRunning,
  submitAssistantFeedback,
  getAssistantFeedbackList,
  confirmMifaTarget,
  retryMifaLink
} from '@/api/ai'

/**
 * AI智能研判共享状态
 * 统一管理模拟AI引擎总览、算法服务、识别研判结果与多源融合智能体状态
 */
export const useAiStore = defineStore('aiStore', () => {
  /** 模拟AI引擎运行总览 */
  const engineOverview = ref<any>(null)
  /** 算法服务列表与总数 */
  const algorithmServices = ref<any[]>([])
  const algorithmTotal = ref(0)
  /** 算法服务详情 */
  const serviceDetail = ref<any>(null)
  /** 船型识别结果 */
  const shipRecognition = ref<any[]>([])
  const shipTotal = ref(0)
  const shipDeviceOptions = ref<any[]>([])
  const shipDetail = ref<any>(null)
  /** 行为分析结果 */
  const behaviorAnalysis = ref<any[]>([])
  const behaviorAnalysisTotal = ref(0)
  /** AI助手会话 */
  const assistant = ref<any>(null)
  /** AI助手反馈受理记录 */
  const assistantFeedbackList = ref<any[]>([])
  /** 多源融合智能体流水线 */
  const mifa = ref<any>(null)
  /** 引擎心跳定时器 */
  let engineTimer: ReturnType<typeof setInterval> | null = null

  async function loadEngineOverview() {
    const { data } = await getAiEngineOverview()
    engineOverview.value = data || engineOverview.value
  }

  async function loadAlgorithmServices(params: any = {}) {
    const { data } = await getAlgorithmServiceList(params)
    algorithmServices.value = (data as any)?.list || []
    algorithmTotal.value = (data as any)?.total || 0
  }

  async function loadServiceDetail(id: number) {
    const { data } = await getAlgorithmServiceDetail(id)
    serviceDetail.value = data || null
    return serviceDetail.value
  }

  /** 重启算法服务并刷新列表与总览 */
  async function restartService(id: number) {
    await restartAlgorithmService(id)
    await Promise.all([loadEngineOverview(), loadAlgorithmServices()])
  }

  /** 切换算法服务版本并刷新列表 */
  async function switchServiceVersion(id: number, version: string, reason: string) {
    await switchAlgorithmVersion(id, version, reason)
    await Promise.all([loadEngineOverview(), loadAlgorithmServices()])
  }

  /** 更新算法服务数据源与授权设备并刷新详情 */
  async function updateServiceConfig(id: number, dataSources: string[], authorizedDevices: string[]) {
    const { data } = await updateAlgorithmServiceConfig(id, { dataSources, authorizedDevices })
    await Promise.all([loadServiceDetail(id), loadAlgorithmServices()])
    return data
  }

  async function loadShipRecognition(params: any = {}) {
    const { data } = await getShipRecognitionList(params)
    shipRecognition.value = (data as any)?.list || []
    shipTotal.value = (data as any)?.total || 0
  }

  async function loadShipDevices() {
    const { data } = await getShipDevices()
    shipDeviceOptions.value = (data as any) || []
  }

  async function loadShipDetail(id: number) {
    const { data } = await getShipRecognitionDetail(id)
    shipDetail.value = data || null
    return shipDetail.value
  }

  async function reviewShipRecord(id: number, form: any) {
    const { data } = await reviewShipRecognition(id, form)
    return data
  }

  async function loadBehaviorAnalysis(params: any = {}) {
    const { data } = await getBehaviorAnalysisList(params)
    behaviorAnalysis.value = (data as any)?.list || []
    behaviorAnalysisTotal.value = (data as any)?.total || 0
  }

  async function loadAssistant() {
    const { data } = await getAssistantSession()
    assistant.value = data
  }

  async function sendAssistantMessageRecord(content: string) {
    const { data } = await sendAssistantMessage(content)
    return data
  }

  async function loadAssistantFeedback() {
    const { data } = await getAssistantFeedbackList()
    assistantFeedbackList.value = (data as any) || []
  }

  async function submitAssistantFeedbackRecord(form: any) {
    const { data } = await submitAssistantFeedback(form)
    await loadAssistantFeedback()
    return data
  }

  async function loadMifa() {
    const { data } = await getMifaPipeline()
    mifa.value = data
  }

  async function toggleMifaRunning(running: boolean) {
    await setMifaRunning(running)
    await loadMifa()
  }

  async function confirmMifaTargetRecord(id: number) {
    const { data } = await confirmMifaTarget(id)
    await loadMifa()
    return data
  }

  async function retryMifaLinkRecord(id: number) {
    const { data } = await retryMifaLink(id)
    await loadMifa()
    return data
  }

  /** 启动模拟引擎心跳刷新 */
  function startEngineHeartbeat(interval = 10000) {
    stopEngineHeartbeat()
    engineTimer = setInterval(() => {
      loadEngineOverview()
      loadMifa()
    }, interval)
  }

  /** 停止模拟引擎心跳刷新 */
  function stopEngineHeartbeat() {
    if (engineTimer) {
      clearInterval(engineTimer)
      engineTimer = null
    }
  }

  return {
    engineOverview,
    algorithmServices,
    algorithmTotal,
    serviceDetail,
    shipRecognition,
    shipTotal,
    shipDeviceOptions,
    shipDetail,
    behaviorAnalysis,
    behaviorAnalysisTotal,
    assistant,
    assistantFeedbackList,
    mifa,
    loadEngineOverview,
    loadAlgorithmServices,
    loadServiceDetail,
    restartService,
    switchServiceVersion,
    updateServiceConfig,
    loadShipRecognition,
    loadShipDevices,
    loadShipDetail,
    reviewShipRecord,
    loadBehaviorAnalysis,
    loadAssistant,
    sendAssistantMessageRecord,
    loadAssistantFeedback,
    submitAssistantFeedbackRecord,
    loadMifa,
    toggleMifaRunning,
    confirmMifaTargetRecord,
    retryMifaLinkRecord,
    startEngineHeartbeat,
    stopEngineHeartbeat
  }
})
