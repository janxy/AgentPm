import request from '@/utils/http'

type ListResult = { list: any[]; total: number }

// ==================== 目标查询 ====================

/** 获取目标列表（筛选 + 排序 + 分页） */
export function getTargetList(params?: any) {
  return request.get<ListResult>({ url: '/admin/target/list', params })
}

/** 获取目标统计 */
export function getTargetStats() {
  return request.get<any>({ url: '/admin/target/stats' })
}

/** 获取单目标详情 */
export function getTargetDetail(fusionId: string) {
  return request.get<any>({ url: `/admin/target/detail/${encodeURIComponent(fusionId)}` })
}

/** 获取目标历史轨迹 */
export function getTrajectory(fusionId: string, params?: any) {
  return request.get<any>({ url: `/admin/target/trajectory/${encodeURIComponent(fusionId)}`, params })
}

/** 获取目标报警历史 */
export function getAlertHistory(fusionId: string, params?: any) {
  return request.get<ListResult>({ url: `/admin/target/alert-history/${encodeURIComponent(fusionId)}`, params })
}

// ==================== 目标标注 ====================

/** 获取重点关注列表 */
export function getFocusList(params?: any) {
  return request.get<ListResult>({ url: '/admin/target/focus/list', params })
}

/** 获取重点关注统计 */
export function getFocusStats() {
  return request.get<any>({ url: '/admin/target/focus/stats' })
}

/** 批量更新关注状态 */
export function updateAttention(ids: string[], followed: boolean) {
  return request.put<any>({ url: '/admin/target/attention', data: { ids, followed } })
}

/** 更新目标备注 */
export function updateNote(fusionId: string, content: string) {
  return request.put<any>({ url: `/admin/target/note/${encodeURIComponent(fusionId)}`, data: { content } })
}

/** 更新目标标签 */
export function updateTags(fusionId: string, tags: string[]) {
  return request.put<any>({ url: `/admin/target/tags/${encodeURIComponent(fusionId)}`, data: { tags } })
}

/** 人工确认风险等级 */
export function updateRiskConfirm(fusionId: string, data: any) {
  return request.put<any>({ url: `/admin/target/risk-confirm/${encodeURIComponent(fusionId)}`, data })
}

// ==================== 标签与变更历史 ====================

/** 获取标签列表（含目标统计） */
export function getTags() {
  return request.get<any[]>({ url: '/admin/target/tags' })
}

/** 新增标签 */
export function addTag(data: any) {
  return request.post<any>({ url: '/admin/target/tag/add', data })
}

/** 更新标签 */
export function updateTag(id: number, data: any) {
  return request.put<any>({ url: `/admin/target/tag/update/${id}`, data })
}

/** 删除标签 */
export function deleteTag(id: number) {
  return request.del<any>({ url: `/admin/target/tag/delete/${id}` })
}

/** 获取目标标注变更历史 */
export function getChangeHistory(params?: any) {
  return request.get<ListResult>({ url: '/admin/target/change-history', params })
}

/** 重置目标管控演示数据 */
export function resetTargetData() {
  return request.post<any>({ url: '/admin/target/reset' })
}
