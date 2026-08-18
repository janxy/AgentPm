import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getTargetList,
  getTargetStats,
  getTargetDetail,
  getTrajectory,
  getAlertHistory,
  getFocusList,
  getFocusStats,
  updateAttention,
  updateNote,
  updateTags,
  updateRiskConfirm,
  getTags,
  addTag,
  updateTag,
  deleteTag,
  getChangeHistory,
  resetTargetData
} from '@/api/target'

/**
 * 目标管控共享状态
 * 目标总览、单目标研判与目标标注共用同一份目标列表、详情、关注、标签与变更历史。
 * 演示数据由 mock/target.ts 持久化到 localStorage，Store 负责跨页面状态同步。
 */
export const useTargetStore = defineStore('targetStore', () => {
  /** 目标列表 */
  const targetList = ref<any[]>([])
  const targetTotal = ref(0)
  /** 目标统计 */
  const targetStats = ref({ total: 0, followed: 0, pending: 0, highRisk: 0 })
  /** 单目标详情 */
  const targetDetail = ref<any>(null)
  /** 历史轨迹 */
  const trajectory = ref<{ points: any[]; stationary: boolean }>({ points: [], stationary: false })
  /** 报警历史 */
  const alertHistory = ref<any[]>([])
  const alertTotal = ref(0)
  /** 重点关注 */
  const focusList = ref<any[]>([])
  const focusTotal = ref(0)
  const focusStats = ref({ total: 0, highRisk: 0, todayNew: 0 })
  /** 标签与变更历史 */
  const tags = ref<any[]>([])
  const changeHistory = ref<any[]>([])
  const changeTotal = ref(0)

  async function loadTargets(params: any = {}) {
    const { data } = await getTargetList(params)
    targetList.value = (data as any)?.list || []
    targetTotal.value = (data as any)?.total || 0
  }

  async function loadTargetStats() {
    const { data } = await getTargetStats()
    targetStats.value = data || targetStats.value
  }

  async function loadTargetDetail(fusionId: string) {
    const { data } = await getTargetDetail(fusionId)
    targetDetail.value = data || null
    return targetDetail.value
  }

  async function loadTrajectory(fusionId: string, params: any = {}) {
    const { data } = await getTrajectory(fusionId, params)
    trajectory.value = data || { points: [], stationary: false }
    return trajectory.value
  }

  async function loadAlertHistory(fusionId: string, params: any = {}) {
    const { data } = await getAlertHistory(fusionId, params)
    alertHistory.value = (data as any)?.list || []
    alertTotal.value = (data as any)?.total || 0
    return data
  }

  async function loadFocusList(params: any = {}) {
    const { data } = await getFocusList(params)
    focusList.value = (data as any)?.list || []
    focusTotal.value = (data as any)?.total || 0
  }

  async function loadFocusStats() {
    const { data } = await getFocusStats()
    focusStats.value = data || focusStats.value
  }

  async function updateAttentionRecord(ids: string[], followed: boolean) {
    await updateAttention(ids, followed)
    await Promise.all([loadFocusStats(), loadTargetStats()])
  }

  async function updateNoteRecord(fusionId: string, content: string) {
    await updateNote(fusionId, content)
    if (targetDetail.value?.fusionId === fusionId) {
      await loadTargetDetail(fusionId)
    }
  }

  async function updateTagsRecord(fusionId: string, tagNames: string[]) {
    await updateTags(fusionId, tagNames)
    if (targetDetail.value?.fusionId === fusionId) {
      await loadTargetDetail(fusionId)
    }
    await loadTags()
  }

  async function updateRiskConfirmRecord(fusionId: string, data: any) {
    await updateRiskConfirm(fusionId, data)
    if (targetDetail.value?.fusionId === fusionId) {
      await loadTargetDetail(fusionId)
    }
    await Promise.all([loadTargetStats()])
  }

  async function loadTags() {
    const { data } = await getTags()
    tags.value = (data as any) || []
  }

  async function addTagRecord(data: any) {
    await addTag(data)
    await loadTags()
  }

  async function updateTagRecord(id: number, data: any) {
    await updateTag(id, data)
    await loadTags()
  }

  async function deleteTagRecord(id: number) {
    await deleteTag(id)
    await loadTags()
  }

  async function loadChangeHistory(params: any = {}) {
    const { data } = await getChangeHistory(params)
    changeHistory.value = (data as any)?.list || []
    changeTotal.value = (data as any)?.total || 0
  }

  /** 重置目标管控演示数据并刷新共享状态 */
  async function resetDemoData() {
    await resetTargetData()
    targetList.value = []
    targetTotal.value = 0
    targetDetail.value = null
    trajectory.value = { points: [], stationary: false }
    alertHistory.value = []
    alertTotal.value = 0
    focusList.value = []
    focusTotal.value = 0
    changeHistory.value = []
    changeTotal.value = 0
    await Promise.all([
      loadTargetStats(),
      loadFocusStats(),
      loadTags(),
      loadChangeHistory({ page: 1, pageSize: 10 })
    ])
  }

  return {
    targetList,
    targetTotal,
    targetStats,
    targetDetail,
    trajectory,
    alertHistory,
    alertTotal,
    focusList,
    focusTotal,
    focusStats,
    tags,
    changeHistory,
    changeTotal,
    loadTargets,
    loadTargetStats,
    loadTargetDetail,
    loadTrajectory,
    loadAlertHistory,
    loadFocusList,
    loadFocusStats,
    updateAttentionRecord,
    updateNoteRecord,
    updateTagsRecord,
    updateRiskConfirmRecord,
    loadTags,
    addTagRecord,
    updateTagRecord,
    deleteTagRecord,
    loadChangeHistory,
    resetDemoData
  }
})
