import request from '@/utils/http'

// ==================== 地图区域管理 ====================

/** 获取区域列表（分页+筛选） */
export function getAreaList(params?: { name?: string; type?: string; status?: number | string; page?: number; pageSize?: number }) {
  return request.get({ url: '/admin/alert/area/list', params })
}

/** 新增区域 */
export function addArea(data: any) { return request.post({ url: '/admin/alert/area/add', data }) }

/** 更新区域（提交审批） */
export function updateArea(id: number, data: any) { return request.put({ url: `/admin/alert/area/update/${id}`, data }) }

/** 删除区域 */
export function deleteArea(id: number) { return request.del({ url: `/admin/alert/area/delete/${id}` }) }

/** 获取审批列表 */
export function getApprovalList(params?: { status?: string; page?: number; pageSize?: number }) {
  return request.get({ url: '/admin/alert/area/approvals', params })
}

/** 审批通过/驳回 */
export function approveArea(id: number, result: string) { return request.put({ url: `/admin/alert/area/approve/${id}`, data: { result } }) }

// ==================== 围栏预警规则 ====================

/** 获取围栏规则列表 */
export function getFenceRuleList(params?: any) { return request.get({ url: '/admin/alert/rule/fence/list', params }) }

/** 新增围栏规则 */
export function addFenceRule(data: any) { return request.post({ url: '/admin/alert/rule/fence/add', data }) }

/** 更新围栏规则 */
export function updateFenceRule(id: number, data: any) { return request.put({ url: `/admin/alert/rule/fence/update/${id}`, data }) }

/** 删除围栏规则 */
export function deleteFenceRule(id: number) { return request.del({ url: `/admin/alert/rule/fence/delete/${id}` }) }

/** 切换规则状态 */
export function updateFenceRuleStatus(id: number, status: number) { return request.put({ url: `/admin/alert/rule/fence/status/${id}`, data: { status } }) }

// ==================== 身份识别预警（黑名单） ====================

/** 获取黑名单列表 */
export function getBlacklist(params?: any) { return request.get({ url: '/admin/alert/rule/blacklist/list', params }) }

/** 新增黑名单 */
export function addBlacklist(data: any) { return request.post({ url: '/admin/alert/rule/blacklist/add', data }) }

/** 更新黑名单 */
export function updateBlacklist(id: number, data: any) { return request.put({ url: `/admin/alert/rule/blacklist/update/${id}`, data }) }

/** 删除黑名单 */
export function deleteBlacklist(id: number) { return request.del({ url: `/admin/alert/rule/blacklist/delete/${id}` }) }

/** 切换黑名单状态 */
export function updateBlacklistStatus(id: number, status: number) { return request.put({ url: `/admin/alert/rule/blacklist/status/${id}`, data: { status } }) }

/** 批量导入黑名单 */
export function importBlacklist(data: any[]) { return request.post({ url: '/admin/alert/rule/blacklist/import', data }) }

// ==================== 行为预警 ====================

/** 获取行为规则列表 */
export function getBehaviorRuleList(params?: any) { return request.get({ url: '/admin/alert/rule/behavior/list', params }) }

/** 更新行为规则 */
export function updateBehaviorRule(id: number, data: any) { return request.put({ url: `/admin/alert/rule/behavior/update/${id}`, data }) }

// ==================== 告警事件 ====================

/** 获取告警事件列表 */
export function getAlertEventList(params?: any) { return request.get({ url: '/admin/alert/event/list', params }) }

/** 获取告警统计 */
export function getAlertEventStats() { return request.get({ url: '/admin/alert/event/stats' }) }

/** 更新告警事件 */
export function updateAlertEvent(id: number, data: any) { return request.put({ url: `/admin/alert/event/update/${id}`, data }) }

/** 添加事件时间线记录 */
export function addEventTimeline(id: number, entry: any) { return request.post({ url: `/admin/alert/event/timeline/${id}`, data: entry }) }

// ==================== 误报治理 ====================

/** 获取误报治理统计 */
export function getFalseAlarmStats() { return request.get({ url: '/admin/alert/false-alarm/stats' }) }

// ==================== 规则版本 ====================

/** 获取规则版本列表 */
export function getRuleVersions(ruleId: number) { return request.get({ url: `/admin/alert/version/list/${ruleId}` }) }

/** 回退到指定版本 */
export function rollbackVersion(ruleId: number, versionId: number) { return request.post({ url: `/admin/alert/version/rollback`, data: { ruleId, versionId } }) }
