import request from '@/utils/http'

type ListResult = { list: any[]; total: number }

// ==================== 模拟AI引擎总览 ====================

/** 获取模拟AI引擎运行总览 */
export function getAiEngineOverview() {
  return request.get<any>({ url: '/admin/ai/engine/overview' })
}

// ==================== 算法服务管理 ====================

/** 获取算法服务列表 */
export function getAlgorithmServiceList(params?: any) {
  return request.get<ListResult>({ url: '/admin/ai/algorithm/list', params })
}

/** 获取算法服务详情 */
export function getAlgorithmServiceDetail(id: number) {
  return request.get<any>({ url: `/admin/ai/algorithm/detail/${id}` })
}

/** 重启算法服务 */
export function restartAlgorithmService(id: number) {
  return request.post<any>({ url: `/admin/ai/algorithm/restart/${id}` })
}

/** 切换算法服务版本 */
export function switchAlgorithmVersion(id: number, version: string, reason?: string) {
  return request.post<any>({ url: `/admin/ai/algorithm/version/${id}`, data: { version, reason } })
}

/** 更新算法服务关联数据源与授权设备 */
export function updateAlgorithmServiceConfig(id: number, data: { dataSources: string[]; authorizedDevices: string[] }) {
  return request.post<any>({ url: `/admin/ai/algorithm/config/${id}`, data })
}

// ==================== 船型识别 / 行为分析 ====================

/** 获取船型识别结果列表 */
export function getShipRecognitionList(params?: any) {
  return request.get<ListResult>({ url: '/admin/ai/ship/list', params })
}

/** 获取光电设备选项 */
export function getShipDevices() {
  return request.get<any[]>({ url: '/admin/ai/ship/devices' })
}

/** 获取船型识别详情（含识别快照） */
export function getShipRecognitionDetail(id: number) {
  return request.get<any>({ url: `/admin/ai/ship/detail/${id}` })
}

/** 提交船型识别人工复核 */
export function reviewShipRecognition(id: number, data: any) {
  return request.post<any>({ url: `/admin/ai/ship/review/${id}`, data })
}

/** 获取行为分析结果列表 */
export function getBehaviorAnalysisList(params?: any) {
  return request.get<ListResult>({ url: '/admin/ai/behavior/list', params })
}

// ==================== AI助手 ====================

/** 获取AI助手会话与推荐问题 */
export function getAssistantSession() {
  return request.get<any>({ url: '/admin/ai/assistant/session' })
}

/** 发送AI助手消息 */
export function sendAssistantMessage(content: string) {
  return request.post<any>({ url: '/admin/ai/assistant/send', data: { content } })
}

/** 提交误报/漏报反馈 */
export function submitAssistantFeedback(data: any) {
  return request.post<any>({ url: '/admin/ai/assistant/feedback', data })
}

/** 获取AI助手反馈受理记录 */
export function getAssistantFeedbackList() {
  return request.get<any[]>({ url: '/admin/ai/assistant/feedback-list' })
}

// ==================== 多源融合智能体 ====================

/** 获取MIFA流水线数据 */
export function getMifaPipeline() {
  return request.get<any>({ url: '/admin/ai/mifa/pipeline' })
}

/** 启动/暂停智能体 */
export function setMifaRunning(running: boolean) {
  return request.post<any>({ url: '/admin/ai/mifa/running', data: { running } })
}

/** 人工确认融合层待确认目标 */
export function confirmMifaTarget(id: number) {
  return request.post<any>({ url: `/admin/ai/mifa/target/confirm/${id}` })
}

/** 重新执行失败的联动动作 */
export function retryMifaLink(id: number) {
  return request.post<any>({ url: `/admin/ai/mifa/link/retry/${id}` })
}
