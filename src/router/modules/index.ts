import { AppRouteRecord } from '@/types/router'
import { alertRoutes } from './alert'
import { deviceRoutes } from './device'
import { aiRoutes } from './ai'

export const routeModules: AppRouteRecord[] = [alertRoutes, deviceRoutes, aiRoutes]
