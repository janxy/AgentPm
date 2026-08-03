import { AppRouteRecord } from '@/types/router'

/**
 * 设备联动子系统路由
 *
 * 菜单结构 (SRS 3.1)：
 * 设备联动 (一级菜单)
 * ├── 设备总览       /device/overview
 * ├── 光电联动       /device/optics
 * ├── 无人机联动     /device/uav
 * └── 雷达监测       /device/radar
 */
export const deviceRoutes: AppRouteRecord = {
  path: '/device',
  name: 'Device',
  component: () => import('@/views/index/index.vue'),
  meta: {
    title: 'menus.device.title',
    icon: 'Monitor',
    isFirstLevel: true
  },
  children: [
    {
      path: '',
      name: 'DeviceIndex',
      redirect: '/device/overview',
      meta: { title: 'menus.device.title', isHide: true }
    },
    {
      path: 'overview',
      name: 'DeviceOverview',
      component: () => import('@/views/device/overview/index.vue'),
      meta: { title: 'menus.device.overview', keepAlive: true }
    },
    {
      path: 'optics',
      name: 'DeviceOptics',
      component: () => import('@/views/device/optics/index.vue'),
      meta: { title: 'menus.device.optics', keepAlive: true }
    },
    {
      path: 'uav',
      name: 'DeviceUav',
      component: () => import('@/views/device/uav/index.vue'),
      meta: { title: 'menus.device.uav', keepAlive: true }
    },
    {
      path: 'radar',
      name: 'DeviceRadar',
      component: () => import('@/views/device/radar/index.vue'),
      meta: { title: 'menus.device.radar', keepAlive: true }
    }
  ]
}
