/**
 * Mock 路由统一注册
 * VITE_USE_MOCK=true 时由 main.ts 动态导入
 */

import { mockRoute, extractId } from '@/utils/http/mockRegistry'

// ==================== 认证 ====================
import {
  mockLogin,
  mockGetUserMenuTree,
  mockLogout,
  mockGetPerms,
  mockRefreshToken,
  mockVerifyCaptcha,
  MOCK_USERS
} from './auth'

mockRoute('POST', '/admin/open/login', ({ data }) => mockLogin(data?.username, data?.password))
mockRoute('GET', '/admin/open/person', () => MOCK_USERS[0].userInfo)
mockRoute('GET', '/admin/open/permmenu', () => mockGetUserMenuTree())
mockRoute('POST', '/admin/open/logout', () => mockLogout())
mockRoute('GET', '/admin/open/perms', () => mockGetPerms())
mockRoute('POST', '/admin/open/refreshToken', ({ data }) => mockRefreshToken(data?.refreshToken))
// 注：图形验证码（/api/captcha/image）在 api/captcha.ts 内部直接走 mock，不经此注册表
mockRoute('GET', '/api/captcha/verify', () => mockVerifyCaptcha())

// ==================== 组织管理：部门 / 用户 ====================
import {
  getDepartmentTreeMock,
  getDepartmentListMock,
  addDepartmentMock,
  updateDepartmentMock,
  updateDepartmentStatusMock,
  deleteDepartmentMock,
  getUserListMock,
  getUserDetailMock,
  addUserMock,
  updateUserMock,
  deleteUserMock,
  batchDeleteUsersMock,
  updateUserStatusMock,
  moveUserMock
} from './organization'

// 部门
mockRoute('GET', '/admin/sys/department/tree', ({ params }) => getDepartmentTreeMock(params))
mockRoute('GET', '/admin/sys/department/list', ({ params }) => getDepartmentListMock(params))
mockRoute('POST', '/admin/sys/department/add', ({ data }) => addDepartmentMock(data))
mockRoute('PUT', '/admin/sys/department/update', ({ data }) => updateDepartmentMock(data.id, data))
mockRoute('PUT', '/admin/sys/department/update-status', ({ data }) =>
  updateDepartmentStatusMock(data.id, data.status)
)
mockRoute('DELETE', '/admin/sys/department/delete/:id', ({ url }) => {
  deleteDepartmentMock(extractId(url))
  return {}
})

// 用户
mockRoute('GET', '/admin/sys/user/list', ({ params }) => getUserListMock(params))
mockRoute('GET', '/admin/sys/user/detail/:id', ({ url }) => getUserDetailMock(extractId(url)))
mockRoute('POST', '/admin/sys/user/add', ({ data }) => addUserMock(data))
mockRoute('PUT', '/admin/sys/user/update', ({ data }) => updateUserMock(data.id, data))
mockRoute('PUT', '/admin/sys/user/update-status', ({ data }) =>
  updateUserStatusMock(data.id, data.status)
)
mockRoute('POST', '/admin/sys/user/batch-delete', ({ data }) => batchDeleteUsersMock(data?.ids))
mockRoute('POST', '/admin/sys/user/move', ({ data }) =>
  moveUserMock(data.userId, data.departmentId)
)
mockRoute('DELETE', '/admin/sys/user/delete/:id', ({ url }) => {
  deleteUserMock(extractId(url))
  return {}
})

// ==================== 权限管理：角色 / 菜单 ====================
import {
  getRoleListMock,
  getRoleDetailMock,
  addRoleMock,
  updateRoleMock,
  deleteRoleMock,
  batchDeleteRolesMock,
  updateRoleStatusMock,
  getRoleMenusMock,
  setRoleMenusMock,
  getMenuTreeMock,
  getMenuListMock,
  addMenuMock,
  updateMenuMock,
  deleteMenuMock,
  updateMenuStatusMock
} from './permission'

// 角色
mockRoute('GET', '/admin/sys/role/list', ({ params }) => getRoleListMock(params))
mockRoute('GET', '/admin/sys/role/detail/:id', ({ url }) => getRoleDetailMock(extractId(url)))
mockRoute('POST', '/admin/sys/role/add', ({ data }) => addRoleMock(data))
mockRoute('PUT', '/admin/sys/role/update', ({ data }) => updateRoleMock(data.id, data))
mockRoute('PUT', '/admin/sys/role/update-status', ({ data }) =>
  updateRoleStatusMock(data.id, data.status)
)
mockRoute('POST', '/admin/sys/role/batch-delete', ({ data }) => batchDeleteRolesMock(data?.ids))
mockRoute('GET', '/admin/sys/role/getMenus/:id', ({ url }) => getRoleMenusMock(extractId(url)))
mockRoute('POST', '/admin/sys/role/setMenus', ({ data }) =>
  setRoleMenusMock(data.roleId, data.menuIds)
)
mockRoute('DELETE', '/admin/sys/role/delete/:id', ({ url }) => {
  deleteRoleMock(extractId(url))
  return {}
})

// 菜单
mockRoute('GET', '/admin/sys/menu/tree', () => getMenuTreeMock())
mockRoute('GET', '/admin/sys/menu/list', () => getMenuListMock())
mockRoute('POST', '/admin/sys/menu/add', ({ data }) => addMenuMock(data))
mockRoute('PUT', '/admin/sys/menu/update', ({ data }) => updateMenuMock(data.id, data))
mockRoute('PUT', '/admin/sys/menu/update-status', ({ data }) =>
  updateMenuStatusMock(data.id, data.status)
)
mockRoute('DELETE', '/admin/sys/menu/delete/:id', ({ url }) => {
  deleteMenuMock(extractId(url))
  return {}
})

// ==================== 预警事件 ====================
import {
  getAreaListMock, addAreaMock, updateAreaMock, deleteAreaMock,
  getApprovalListMock, approveMock,
  getFenceRuleListMock, addFenceRuleMock, updateFenceRuleMock, deleteFenceRuleMock, updateFenceRuleStatusMock,
  getBlacklistMock, addBlacklistMock, updateBlacklistMock, deleteBlacklistMock, updateBlacklistStatusMock,
  getBehaviorRuleListMock, updateBehaviorRuleMock,
  getAlertEventListMock, getAlertEventStatsMock, updateAlertEventMock, addEventTimelineMock,
  getFalseAlarmStatsMock,
  getRuleVersionsMock, addRuleVersionMock
} from './alert'

// 地图区域
mockRoute('GET', '/admin/alert/area/list', ({ params }) => getAreaListMock(params))
mockRoute('POST', '/admin/alert/area/add', ({ data }) => addAreaMock(data))
mockRoute('PUT', '/admin/alert/area/update/:id', ({ url, data }) => updateAreaMock(extractId(url), data))
mockRoute('DELETE', '/admin/alert/area/delete/:id', ({ url }) => { deleteAreaMock(extractId(url)); return {} })
mockRoute('GET', '/admin/alert/area/approvals', ({ params }) => getApprovalListMock(params))
mockRoute('PUT', '/admin/alert/area/approve/:id', ({ url, data }) => approveMock(extractId(url), data.result))

// 围栏规则
mockRoute('GET', '/admin/alert/rule/fence/list', ({ params }) => getFenceRuleListMock(params))
mockRoute('POST', '/admin/alert/rule/fence/add', ({ data }) => addFenceRuleMock(data))
mockRoute('PUT', '/admin/alert/rule/fence/update/:id', ({ url, data }) => updateFenceRuleMock(extractId(url), data))
mockRoute('DELETE', '/admin/alert/rule/fence/delete/:id', ({ url }) => { deleteFenceRuleMock(extractId(url)); return {} })
mockRoute('PUT', '/admin/alert/rule/fence/status/:id', ({ url, data }) => updateFenceRuleStatusMock(extractId(url), data.status))

// 黑名单
mockRoute('GET', '/admin/alert/rule/blacklist/list', ({ params }) => getBlacklistMock(params))
mockRoute('POST', '/admin/alert/rule/blacklist/add', ({ data }) => addBlacklistMock(data))
mockRoute('PUT', '/admin/alert/rule/blacklist/update/:id', ({ url, data }) => updateBlacklistMock(extractId(url), data))
mockRoute('DELETE', '/admin/alert/rule/blacklist/delete/:id', ({ url }) => { deleteBlacklistMock(extractId(url)); return {} })
mockRoute('PUT', '/admin/alert/rule/blacklist/status/:id', ({ url, data }) => updateBlacklistStatusMock(extractId(url), data.status))
mockRoute('POST', '/admin/alert/rule/blacklist/import', ({ data }) => { data.forEach((item: any) => addBlacklistMock(item)); return { count: data.length } })

// 行为预警
mockRoute('GET', '/admin/alert/rule/behavior/list', ({ params }) => getBehaviorRuleListMock(params))
mockRoute('PUT', '/admin/alert/rule/behavior/update/:id', ({ url, data }) => updateBehaviorRuleMock(extractId(url), data))

// 告警事件
mockRoute('GET', '/admin/alert/event/list', ({ params }) => getAlertEventListMock(params))
mockRoute('GET', '/admin/alert/event/stats', () => getAlertEventStatsMock())
mockRoute('PUT', '/admin/alert/event/update/:id', ({ url, data }) => updateAlertEventMock(extractId(url), data))
mockRoute('POST', '/admin/alert/event/timeline/:id', ({ url, data }) => addEventTimelineMock(extractId(url), data))

// 误报治理
mockRoute('GET', '/admin/alert/false-alarm/stats', () => getFalseAlarmStatsMock())

// 规则版本
mockRoute('GET', '/admin/alert/version/list/:ruleId', ({ url }) => getRuleVersionsMock(extractId(url)))
mockRoute('POST', '/admin/alert/version/rollback', ({ data }) => { return { success: true } })

// ==================== 设备联动 ====================
import {
  getDeviceListMock, getDeviceStatsMock, getDeviceDetailMock, updateDeviceHeartbeatMock,
  getEvidenceListMock, addEvidenceMock, getHailerListMock, addHailerMock, resetDeviceMock
} from './device'
import {
  getOpticDeviceListMock, getOpticStateMock, updateOpticStateMock, controlOpticMock,
  getPresetListMock, addPresetMock, updatePresetMock, deletePresetMock, callPresetMock,
  getCruisePlanListMock, saveCruisePlanMock, deleteCruisePlanMock,
  startCruiseMock, stopCruiseMock, tickCruiseMock, resetOpticMock
} from './device-optics'
import {
  getUavListMock, getUavStateMock, controlUavMock,
  getUavRouteMock, saveUavRouteMock, getRouteTemplateListMock, saveRouteTemplateMock,
  getUavTaskListMock, createUavTaskMock, updateUavTaskMock, addUavEventMock, resetUavMock
} from './device-uav'
import {
  getRadarStationListMock, getRadarStationDetailMock, getRadarTargetListMock,
  updateRadarStationParamsMock, resetRadarMock
} from './device-radar'

// 设备台账 / 统计 / 取证 / 喊话
mockRoute('GET', '/admin/device/list', ({ params }) => getDeviceListMock(params))
mockRoute('GET', '/admin/device/stats', () => getDeviceStatsMock())
mockRoute('GET', '/admin/device/detail/:id', ({ url }) => getDeviceDetailMock(extractId(url)))
mockRoute('PUT', '/admin/device/heartbeat/:id', ({ url }) => updateDeviceHeartbeatMock(extractId(url)))
mockRoute('GET', '/admin/device/evidence/list', ({ params }) => getEvidenceListMock(params))
mockRoute('POST', '/admin/device/evidence/add', ({ data }) => addEvidenceMock(data))
mockRoute('GET', '/admin/device/hailer/list', ({ params }) => getHailerListMock(params?.deviceId))
mockRoute('POST', '/admin/device/hailer/add', ({ data }) => addHailerMock(data))
mockRoute('POST', '/admin/device/reset', () => {
  resetDeviceMock(); resetOpticMock(); resetUavMock(); resetRadarMock()
  return { success: true }
})

// 光电联动
mockRoute('GET', '/admin/device/optic/list', () => getOpticDeviceListMock())
mockRoute('GET', '/admin/device/optic/state/:id', ({ url }) => getOpticStateMock(extractId(url)))
mockRoute('PUT', '/admin/device/optic/state/:id', ({ url, data }) => updateOpticStateMock(extractId(url), data))
mockRoute('PUT', '/admin/device/optic/control/:id', ({ url, data }) => controlOpticMock(extractId(url), data?.action, data?.step))
mockRoute('GET', '/admin/device/optic/preset/list', ({ params }) => getPresetListMock(params?.deviceId))
mockRoute('POST', '/admin/device/optic/preset/add', ({ data }) => addPresetMock(data.deviceId, data.name))
mockRoute('PUT', '/admin/device/optic/preset/update/:id', ({ url, data }) => updatePresetMock(extractId(url), data))
mockRoute('DELETE', '/admin/device/optic/preset/delete/:id', ({ url }) => {
  deletePresetMock(extractId(url))
  return { success: true }
})
mockRoute('POST', '/admin/device/optic/preset/call', ({ data }) => callPresetMock(data.deviceId, data.presetId))
mockRoute('GET', '/admin/device/optic/cruise/list', ({ params }) => getCruisePlanListMock(params?.deviceId))
mockRoute('POST', '/admin/device/optic/cruise/save', ({ data }) => saveCruisePlanMock(data))
mockRoute('DELETE', '/admin/device/optic/cruise/delete/:id', ({ url }) => {
  deleteCruisePlanMock(extractId(url))
  return { success: true }
})
mockRoute('POST', '/admin/device/optic/cruise/start', ({ data }) => startCruiseMock(data.deviceId, data.planId))
mockRoute('POST', '/admin/device/optic/cruise/stop', ({ data }) => stopCruiseMock(data.deviceId))
mockRoute('POST', '/admin/device/optic/cruise/tick', ({ data }) => tickCruiseMock(data.deviceId))

// 无人机联动
mockRoute('GET', '/admin/device/uav/list', () => getUavListMock())
mockRoute('GET', '/admin/device/uav/state/:id', ({ url }) => getUavStateMock(extractId(url)))
mockRoute('POST', '/admin/device/uav/control/:id', ({ url, data }) => controlUavMock(extractId(url), data?.action))
mockRoute('GET', '/admin/device/uav/route/:id', ({ url }) => getUavRouteMock(extractId(url)))
mockRoute('PUT', '/admin/device/uav/route/:id', ({ url, data }) => saveUavRouteMock(extractId(url), data))
mockRoute('GET', '/admin/device/uav/template/list', () => getRouteTemplateListMock())
mockRoute('POST', '/admin/device/uav/template/save', ({ data }) => saveRouteTemplateMock(data))
mockRoute('GET', '/admin/device/uav/task/list', ({ params }) => getUavTaskListMock(params?.uavId))
mockRoute('POST', '/admin/device/uav/task/create', ({ data }) => createUavTaskMock(data.uavId, data))
mockRoute('PUT', '/admin/device/uav/task/update/:id', ({ url, data }) => updateUavTaskMock(extractId(url), data))
mockRoute('POST', '/admin/device/uav/event', ({ data }) => addUavEventMock(data.uavId, data))

// 雷达监测
mockRoute('GET', '/admin/device/radar/station/list', () => getRadarStationListMock())
mockRoute('GET', '/admin/device/radar/station/detail/:id', ({ url }) => getRadarStationDetailMock(extractId(url)))
mockRoute('GET', '/admin/device/radar/target/list', ({ params }) => getRadarTargetListMock(params?.stationId))
mockRoute('PUT', '/admin/device/radar/station/params/:id', ({ url, data }) => updateRadarStationParamsMock(extractId(url), data))

// ==================== AI智能研判（模拟AI引擎） ====================
import {
  getAiEngineOverviewMock,
  getAlgorithmServiceListMock,
  getAlgorithmServiceDetailMock,
  updateAlgorithmServiceConfigMock,
  restartAlgorithmServiceMock,
  switchAlgorithmVersionMock,
  getShipDevicesMock,
  getShipRecognitionListMock,
  getShipRecognitionDetailMock,
  reviewShipRecognitionMock,
  getBehaviorAnalysisListMock,
  getAssistantMock,
  sendAssistantMessageMock,
  submitAssistantFeedbackMock,
  getAssistantFeedbackListMock,
  getMifaPipelineMock,
  setMifaRunningMock,
  confirmMifaTargetMock,
  retryMifaLinkMock
} from './ai'

mockRoute('GET', '/admin/ai/engine/overview', () => getAiEngineOverviewMock())
mockRoute('GET', '/admin/ai/algorithm/list', ({ params }) => getAlgorithmServiceListMock(params))
mockRoute('GET', '/admin/ai/algorithm/detail/:id', ({ url }) => getAlgorithmServiceDetailMock(extractId(url)))
mockRoute('POST', '/admin/ai/algorithm/config/:id', ({ url, data }) =>
  updateAlgorithmServiceConfigMock(extractId(url), data)
)
mockRoute('POST', '/admin/ai/algorithm/restart/:id', ({ url }) => restartAlgorithmServiceMock(extractId(url)))
mockRoute('POST', '/admin/ai/algorithm/version/:id', ({ url, data }) =>
  switchAlgorithmVersionMock(extractId(url), data?.version)
)
mockRoute('GET', '/admin/ai/ship/list', ({ params }) => getShipRecognitionListMock(params))
mockRoute('GET', '/admin/ai/ship/devices', () => getShipDevicesMock())
mockRoute('GET', '/admin/ai/ship/detail/:id', ({ url }) => getShipRecognitionDetailMock(extractId(url)))
mockRoute('POST', '/admin/ai/ship/review/:id', ({ url, data }) => reviewShipRecognitionMock(extractId(url), data))
mockRoute('GET', '/admin/ai/behavior/list', ({ params }) => getBehaviorAnalysisListMock(params))
mockRoute('GET', '/admin/ai/assistant/session', () => getAssistantMock())
mockRoute('POST', '/admin/ai/assistant/send', ({ data }) => sendAssistantMessageMock(data?.content))
mockRoute('POST', '/admin/ai/assistant/feedback', ({ data }) => submitAssistantFeedbackMock(data))
mockRoute('GET', '/admin/ai/assistant/feedback-list', () => getAssistantFeedbackListMock())
mockRoute('GET', '/admin/ai/mifa/pipeline', () => getMifaPipelineMock())
mockRoute('POST', '/admin/ai/mifa/running', ({ data }) => setMifaRunningMock(data?.running))
mockRoute('POST', '/admin/ai/mifa/target/confirm/:id', ({ url }) => confirmMifaTargetMock(extractId(url)))
mockRoute('POST', '/admin/ai/mifa/link/retry/:id', ({ url }) => retryMifaLinkMock(extractId(url)))
