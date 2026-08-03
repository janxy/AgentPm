import { AppRouteRecord } from '@/types/router'
import { alertRoutes } from './alert'
import { deviceRoutes } from './device'

export const routeModules: AppRouteRecord[] = [alertRoutes, deviceRoutes]
