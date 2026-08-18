import { AppRouteRecord } from '@/types/router'

/**
 * 目标管控子系统路由
 *
 * 菜单结构：
 * 目标管控 (一级菜单)
 * ├── 目标总览   /target/overview
 * └── 目标标注   /target/marking（重点关注 / 标签管理）
 *
 * 单目标研判详情 /target/detail/:fusionId 为隐藏路由，不进入菜单。
 */
export const targetRoutes: AppRouteRecord = {
  path: '/target',
  name: 'Target',
  component: () => import('@/views/index/index.vue'),
  meta: {
    title: '目标管控',
    icon: 'Aim',
    isFirstLevel: true,
    roles: ['值班员', '指挥员', '设备操作员', '运维管理员']
  },
  children: [
    {
      path: '',
      name: 'TargetIndex',
      redirect: '/target/overview',
      meta: { title: '目标管控', isHide: true }
    },
    {
      path: 'overview',
      name: 'TargetOverview',
      component: () => import('@/views/target/overview/index.vue'),
      meta: {
        title: '目标总览',
        keepAlive: true,
        roles: ['值班员', '指挥员', '设备操作员', '运维管理员']
      }
    },
    {
      path: 'marking',
      name: 'TargetMarking',
      component: () => import('@/views/target/marking/index.vue'),
      meta: {
        title: '目标标注',
        keepAlive: true,
        roles: ['值班员', '指挥员', '运维管理员']
      }
    },
    {
      path: 'detail/:fusionId',
      name: 'TargetDetail',
      component: () => import('@/views/target/detail/index.vue'),
      meta: {
        title: '单目标研判详情',
        isHide: true,
        isHideTab: true,
        activePath: '/target/overview',
        roles: ['值班员', '指挥员', '设备操作员', '运维管理员']
      }
    }
  ]
}
