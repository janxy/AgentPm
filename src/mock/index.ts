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
  getFenceRuleListMock, getFenceRulesAllMock, addFenceRuleMock, updateFenceRuleMock, deleteFenceRuleMock, updateFenceRuleStatusMock,
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
mockRoute('GET', '/admin/alert/rule/fence/all', () => getFenceRulesAllMock())
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
