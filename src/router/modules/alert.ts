import { AppRouteRecord } from '@/types/router'

/**
 * 预警事件子系统路由
 *
 * 菜单结构 (SRS 3.1)：
 * 预警事件 (一级菜单)
 * ├── 地图区域管理       /alert/area
 * ├── 预警规则管理       /alert/rule  (内嵌 Tabs：fence / blacklist / behavior)
 * └── 事件闭环管理       /alert/event (三 Tab：告警接收 / 事件处置 / 误报治理)
 */
export const alertRoutes: AppRouteRecord = {
  path: '/alert',
  name: 'Alert',
  component: () => import('@/views/index/index.vue'),
  meta: {
    title: '预警事件',
    icon: 'WarningFilled',
    isFirstLevel: true
  },
  children: [
    {
      path: '',
      name: 'AlertIndex',
      redirect: '/alert/area',
      meta: { title: '预警事件', isHide: true }
    },
    {
      path: 'area',
      name: 'AlertArea',
      component: () => import('@/views/alert/area/index.vue'),
      meta: { title: '地图区域管理', keepAlive: true }
    },
    {
      path: 'rule',
      name: 'AlertRule',
      redirect: '/alert/rule/fence',
      meta: { title: '预警规则管理', keepAlive: true },
      children: [
        {
          path: 'fence',
          name: 'AlertRuleFence',
          component: () => import('@/views/alert/rule/fence/index.vue'),
          meta: { title: '电子围栏预警', keepAlive: true }
        },
        {
          path: 'blacklist',
          name: 'AlertRuleBlacklist',
          component: () => import('@/views/alert/rule/blacklist/index.vue'),
          meta: { title: '身份识别预警', keepAlive: true }
        },
        {
          path: 'behavior',
          name: 'AlertRuleBehavior',
          component: () => import('@/views/alert/rule/behavior/index.vue'),
          meta: { title: '行为预警', keepAlive: true }
        }
      ]
    },
    {
      path: 'event',
      name: 'AlertEvent',
      component: () => import('@/views/alert/event/index.vue'),
      meta: { title: '事件闭环管理', keepAlive: true }
    }
  ]
}
