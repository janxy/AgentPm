import { AppRouteRecord } from '@/types/router'

/**
 * 权限管理模版路由
 * 包含：角色管理、菜单管理
 */
export const permissionTemplateRoutes: AppRouteRecord = {
  path: '/permission-template',
  name: 'PermissionTemplate',
  component: () => import('@/views/index/index.vue'),
  meta: {
    title: '权限管理',
    icon: 'Lock', // 权限管理
    isFirstLevel: true
  },
  children: [
    {
      path: '',
      name: 'PermissionTemplateIndex',
      component: () => import('@/views/permission/role/index.vue'),
      meta: {
        title: '权限管理',
        keepAlive: true,
        isHide: true
      }
    },
    {
      path: 'role',
      name: 'PermissionTemplateRole',
      component: () => import('@/views/permission/role/index.vue'),
      meta: {
        title: '角色管理',
        keepAlive: true
      }
    },
    {
      path: 'menu',
      name: 'PermissionTemplateMenu',
      component: () => import('@/views/permission/menu/index.vue'),
      meta: {
        title: '菜单管理',
        keepAlive: true
      }
    }
  ]
}
