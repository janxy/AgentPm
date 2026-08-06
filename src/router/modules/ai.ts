import { AppRouteRecord } from '@/types/router'

/**
 * AI智能研判子系统路由
 *
 * 菜单结构 (SRS 3.1)：
 * AI智能研判 (一级菜单)
 * ├── 算法中台       /ai/algorithm
 * ├── AI助手         /ai/assistant
 * └── 多源融合智能体 /ai/mifa
 */
export const aiRoutes: AppRouteRecord = {
  path: '/ai',
  name: 'Ai',
  component: () => import('@/views/index/index.vue'),
  meta: {
    title: 'AI智能研判',
    icon: 'MagicStick',
    isFirstLevel: true
  },
  children: [
    {
      path: '',
      name: 'AiIndex',
      redirect: '/ai/algorithm',
      meta: { title: 'AI智能研判', isHide: true }
    },
    {
      path: 'algorithm',
      name: 'AiAlgorithm',
      component: () => import('@/views/ai/algorithm/index.vue'),
      meta: { title: '算法中台', keepAlive: true, roles: ['值班员', '指挥员', '运维管理员'] }
    },
    {
      path: 'assistant',
      name: 'AiAssistant',
      component: () => import('@/views/ai/assistant/index.vue'),
      meta: { title: 'AI助手', keepAlive: true, roles: ['值班员', '指挥员', '设备操作员'] }
    },
    {
      path: 'mifa',
      name: 'AiMifa',
      component: () => import('@/views/ai/mifa/index.vue'),
      meta: { title: '多源融合智能体', keepAlive: true, roles: ['值班员', '指挥员', '设备操作员', '运维管理员'] }
    }
  ]
}
