import { AppRouteRecord } from '@/types/router'

export const exceptionRoutes: AppRouteRecord = {
  path: '/exception',
  name: 'Exception',
  component: () => import('@/views/index/index.vue'),
  meta: {
    title: '异常页',
    icon: 'Warning'
  },
  children: [
    {
      path: '403',
      name: 'Exception403',
      component: () => import('@/views/exception/403/index.vue'),
      meta: {
        title: '禁止访问',
        keepAlive: true,
        isHideTab: true,
        isFullPage: true
      }
    },
    {
      path: '404',
      name: 'Exception404',
      component: () => import('@/views/exception/404/index.vue'),
      meta: {
        title: '页面不存在',
        keepAlive: true,
        isHideTab: true,
        isFullPage: true
      }
    },
    {
      path: '500',
      name: 'Exception500',
      component: () => import('@/views/exception/500/index.vue'),
      meta: {
        title: '服务器错误',
        keepAlive: true,
        isHideTab: true,
        isFullPage: true
      }
    }
  ]
}
