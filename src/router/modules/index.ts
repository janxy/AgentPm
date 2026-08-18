import { AppRouteRecord } from '@/types/router'
import { alertRoutes } from './alert'
import { deviceRoutes } from './device'
import { aiRoutes } from './ai'
import { targetRoutes } from './target'

export const routeModules: AppRouteRecord[] = [alertRoutes, deviceRoutes, aiRoutes, targetRoutes]
