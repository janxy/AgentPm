<template>
  <div class="tag-panel annot-target-marking-tag">
    <div class="tag-layout">
      <ElCard shadow="never" class="tag-list-card annot-target-marking-tag-list">
        <div class="panel-head">
          <span class="panel-title">标签列表</span>
          <ElButton v-roles="['值班员', '指挥员']" size="small" type="primary" :icon="Plus" @click="openCreate">新增标签</ElButton>
        </div>
        <div class="tag-list">
          <div
            v-for="tag in targetStore.tags"
            :key="tag.id"
            class="tag-item"
            :class="{ active: selectedTagId === tag.id }"
            @click="selectTag(tag)"
          >
            <span class="tag-color" :style="{ background: tag.color }"></span>
            <span class="tag-name">{{ tag.name }}</span>
            <span class="tag-count">{{ tag.targetCount }}</span>
            <ElButton v-roles="['值班员', '指挥员']" link :icon="Edit" class="tag-action" @click.stop="openEdit(tag)" />
            <ElButton v-roles="['值班员', '指挥员']" link type="danger" :icon="Delete" class="tag-action" @click.stop="removeTag(tag)" />
          </div>
          <div v-if="!targetStore.tags.length" class="tag-empty">暂无标签，点击右上角新增</div>
        </div>
      </ElCard>

      <ElCard shadow="never" class="tag-target-card annot-target-marking-tag-targets">
        <div v-if="selectedTag" class="tag-target-body">
          <div class="panel-head">
            <div class="panel-title tag-target-title">
              <span>标签目标</span>
              <span class="tag-title-badge" :style="{ background: selectedTag.color }">{{ selectedTag.name }}</span>
              <span class="tag-title-count">{{ selectedTag.targetCount }} 个目标</span>
            </div>
            <div class="tag-target-actions">
              <ElButton v-roles="['值班员', '指挥员']" size="small" type="primary" plain :icon="Connection" @click="openAssignDialog">
                添加目标
              </ElButton>
            </div>
          </div>
          <div class="tag-target-filter">
            <ElInput v-model="filterForm.keyword" placeholder="目标名称/MMSI/编号" clearable class="filter-keyword" @keyup.enter="loadTagTargets" @clear="loadTagTargets" />
            <ElSelect v-model="filterForm.riskLevel" placeholder="风险等级" clearable class="filter-select">
              <ElOption v-for="level in RISK_LEVEL_OPTIONS" :key="level.value" :label="level.label" :value="level.value" />
            </ElSelect>
            <ElButton type="primary" :icon="Search" @click="loadTagTargets">查询</ElButton>
            <ElButton :icon="Refresh" @click="resetFilter">重置</ElButton>
          </div>
          <ElTable
            v-loading="loading"
            :data="targetStore.targetList"
            row-key="fusionId"
            border
            stripe
            class="tag-target-table"
            empty-text="暂无标签目标"
          >
            <ElTableColumn label="目标名称" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="target-name-cell">
                  <span class="target-name">{{ row.name }}</span>
                  <span class="target-sub">{{ row.displayId || row.fusionId }}</span>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn label="目标类型" width="95" align="center">
              <template #default="{ row }">
                <ElTag :type="row.targetType === 'three_no' ? 'danger' : 'success'" size="small" disable-transitions>
                  {{ TARGET_TYPE_LABELS[row.targetType] || row.targetType }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="风险等级" width="95" align="center">
              <template #default="{ row }">
                <ElTag :color="RISK_LEVEL_COLORS[row.riskLevel]" size="small" effect="dark" disable-transitions>
                  {{ RISK_LEVEL_LABELS[row.riskLevel] || row.riskLevel }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="confidence" label="融合置信度" width="100" align="center">
              <template #default="{ row }">
                <span :class="['confidence', { 'confidence-low': row.confidence < 80 }]">{{ row.confidence }}%</span>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="updateTime" label="更新时间" width="165" />
            <ElTableColumn label="标签" min-width="140">
              <template #default="{ row }">
                <div class="target-tag-list">
                  <ElTag v-for="tag in row.tags || []" :key="tag" size="small" type="info" effect="plain" disable-transitions>{{ tag }}</ElTag>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="220" align="center" fixed="right" class-name="annot-target-marking-tag-actions">
              <template #default="{ row }">
                <ElButton link type="primary" @click="openDetail(row)">详情</ElButton>
                <ElButton v-roles="['值班员', '指挥员']" link :type="row.followed ? 'warning' : 'primary'" @click="toggleFollow(row)">
                  {{ row.followed ? '取消关注' : '关注' }}
                </ElButton>
                <ElButton v-roles="['值班员', '指挥员']" link type="warning" @click="removeTagFromTarget(row)">移除标签</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
          <ElPagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="targetStore.targetTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            class="list-pagination"
            @size-change="loadTagTargets"
            @current-change="loadTagTargets"
          />
        </div>
        <div v-else class="tag-target-empty">从左侧选择一个标签查看关联目标</div>
      </ElCard>
    </div>

    <ElDialog v-model="dialogVisible" :title="editingId ? '编辑标签' : '新增标签'" width="440px" class="annot-target-marking-tag-dialog">
      <ElForm label-width="80px" class="tag-form">
        <ElFormItem label="标签名称" required>
          <ElInput v-model="tagForm.name" maxlength="12" show-word-limit placeholder="请输入标签名称，全局唯一" />
        </ElFormItem>
        <ElFormItem label="标签颜色" required>
          <ElColorPicker v-model="tagForm.color" :predefine="TAG_COLORS" class="tag-color-picker" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="saveTag">保存</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="assignVisible" :title="`添加目标到【${selectedTag?.name || ''}】`" width="760px" class="annot-target-marking-assign-dialog">
      <div class="assign-filter">
        <ElInput v-model="assignForm.keyword" placeholder="目标名称/MMSI/编号" clearable class="assign-keyword" @keyup.enter="loadAssignTargets" @clear="loadAssignTargets" />
        <ElButton type="primary" :icon="Search" @click="loadAssignTargets">查询</ElButton>
        <ElButton :icon="Refresh" @click="resetAssign">重置</ElButton>
        <span class="assign-tip">已选 {{ assignSelectedRows.length }} 个目标</span>
      </div>
      <ElTable
        v-loading="assignLoading"
        :data="assignTargets"
        row-key="fusionId"
        border
        stripe
        height="380"
        class="assign-table"
        empty-text="暂无可选目标"
        @selection-change="handleAssignSelection"
      >
        <ElTableColumn type="selection" width="44" />
        <ElTableColumn label="目标名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="target-name-cell">
              <span class="target-name">{{ row.name }}</span>
              <span class="target-sub">{{ row.displayId || row.fusionId }}</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="MMSI/编号" width="170" show-overflow-tooltip>
          <template #default="{ row }">{{ row.mmsi || row.displayId }}</template>
        </ElTableColumn>
        <ElTableColumn label="目标类型" width="95" align="center">
          <template #default="{ row }">
            <ElTag :type="row.targetType === 'three_no' ? 'danger' : 'success'" size="small" disable-transitions>
              {{ TARGET_TYPE_LABELS[row.targetType] || row.targetType }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="风险等级" width="95" align="center">
          <template #default="{ row }">
            <ElTag :color="RISK_LEVEL_COLORS[row.riskLevel]" size="small" effect="dark" disable-transitions>
              {{ RISK_LEVEL_LABELS[row.riskLevel] || row.riskLevel }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="已有标签" min-width="140">
          <template #default="{ row }">
            <div class="target-tag-list">
              <ElTag v-for="tag in row.tags || []" :key="tag" size="small" type="info" effect="plain" disable-transitions>{{ tag }}</ElTag>
              <span v-if="!row.tags?.length" class="cell-empty">-</span>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>
      <template #footer>
        <ElButton @click="assignVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="assignSaving" @click="confirmAssign">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Connection, Delete, Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { getTargetList } from '@/api/target'
import { useTargetStore } from '@/store/modules/target'
import { RISK_LEVEL_COLORS, RISK_LEVEL_LABELS, RISK_LEVEL_OPTIONS, TARGET_TYPE_LABELS } from '@/utils/target'

/**
 * 目标标注-标签管理
 * 标签维护、目标关联、标签目标筛选与查看，支持关注/取消关注快捷操作。
 */
defineOptions({ name: 'TargetMarkingTagPanel' })

const router = useRouter()
const targetStore = useTargetStore()
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const selectedTagId = ref<number | null>(null)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const assignVisible = ref(false)
const assignLoading = ref(false)
const assignSaving = ref(false)
const assignTargets = ref<any[]>([])
const assignSelectedRows = ref<any[]>([])
const TAG_COLORS = ['#f56c6c', '#e6a23c', '#d46b08', '#c45656', '#409eff', '#67c23a', '#909399']

const tagForm = reactive({
  name: '',
  color: '#409eff'
})

const filterForm = reactive({
  keyword: '',
  riskLevel: ''
})

const assignForm = reactive({
  keyword: ''
})

const selectedTag = computed(() => targetStore.tags.find((tag) => tag.id === selectedTagId.value) || null)

async function loadTagTargets() {
  if (!selectedTag.value) return
  loading.value = true
  try {
    await targetStore.loadTargets({
      tag: selectedTag.value.name,
      keyword: filterForm.keyword,
      riskLevel: filterForm.riskLevel,
      page: page.value,
      pageSize: pageSize.value
    })
  } finally {
    loading.value = false
  }
}

function selectTag(tag: any) {
  selectedTagId.value = tag.id
  resetFilter()
}

function resetFilter() {
  filterForm.keyword = ''
  filterForm.riskLevel = ''
  page.value = 1
  loadTagTargets()
}

function openAssignDialog() {
  assignForm.keyword = ''
  assignTargets.value = []
  assignSelectedRows.value = []
  assignVisible.value = true
  loadAssignTargets()
}

async function loadAssignTargets() {
  const tag = selectedTag.value
  if (!tag) return
  assignLoading.value = true
  try {
    const { data } = await getTargetList({
      keyword: assignForm.keyword,
      page: 1,
      pageSize: 200
    })
    const list = (data as any)?.list || []
    assignTargets.value = list.filter((item: any) => !(item.tags || []).includes(tag.name))
  } finally {
    assignLoading.value = false
  }
}

function resetAssign() {
  assignForm.keyword = ''
  loadAssignTargets()
}

function handleAssignSelection(rows: any[]) {
  assignSelectedRows.value = rows || []
}

async function confirmAssign() {
  const tag = selectedTag.value
  if (!tag) return
  if (!assignSelectedRows.value.length) {
    ElMessage.warning('请先勾选需要添加标签的目标')
    return
  }
  assignSaving.value = true
  try {
    let count = 0
    for (const row of assignSelectedRows.value) {
      const current = Array.isArray(row.tags) ? row.tags : []
      if (!current.includes(tag.name)) {
        await targetStore.updateTagsRecord(row.fusionId, [...current, tag.name])
        count += 1
      }
    }
    ElMessage.success(`已为 ${count} 个目标添加标签【${tag.name}】`)
    assignVisible.value = false
    await loadTagTargets()
  } finally {
    assignSaving.value = false
  }
}

function openCreate() {
  editingId.value = null
  tagForm.name = ''
  tagForm.color = '#409eff'
  dialogVisible.value = true
}

function openEdit(tag: any) {
  editingId.value = tag.id
  tagForm.name = tag.name
  tagForm.color = tag.color
  dialogVisible.value = true
}

async function saveTag() {
  const name = tagForm.name.trim()
  if (!name) {
    ElMessage.warning('请输入标签名称')
    return
  }
  const duplicate = targetStore.tags.some((tag) => tag.id !== editingId.value && tag.name === name)
  if (duplicate) {
    ElMessage.warning(`标签名称【${name}】已存在`)
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await targetStore.updateTagRecord(editingId.value, { name, color: tagForm.color })
      ElMessage.success('标签已更新')
    } else {
      await targetStore.addTagRecord({ name, color: tagForm.color })
      ElMessage.success('标签已新增')
    }
    dialogVisible.value = false
    await loadTagTargets()
  } finally {
    saving.value = false
  }
}

async function removeTag(tag: any) {
  try {
    await ElMessageBox.confirm(`删除标签【${tag.name}】后，关联目标将自动移除该标签，是否继续？`, '删除标签', { type: 'warning' })
  } catch {
    return
  }
  await targetStore.deleteTagRecord(tag.id)
  if (selectedTagId.value === tag.id) {
    selectedTagId.value = null
  }
  ElMessage.success('标签已删除')
}

async function removeTagFromTarget(row: any) {
  const tag = selectedTag.value
  if (!tag) return
  try {
    await ElMessageBox.confirm(`从目标【${row.name}】中移除标签【${tag.name}】？`, '移除标签', { type: 'warning' })
  } catch {
    return
  }
  await targetStore.updateTagsRecord(row.fusionId, (row.tags || []).filter((item: string) => item !== tag.name))
  ElMessage.success(`已移除标签【${tag.name}】`)
  await loadTagTargets()
}

function openDetail(row: any) {
  router.push({ name: 'TargetDetail', params: { fusionId: row.fusionId } })
}

async function toggleFollow(row: any) {
  const next = !row.followed
  await targetStore.updateAttentionRecord([row.fusionId], next)
  ElMessage.success(next ? '已加入重点关注' : '已取消重点关注')
  await loadTagTargets()
}

onMounted(async () => {
  await targetStore.loadTags()
})
</script>

<style lang="scss" scoped>
.tag-layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}
.tag-list-card,
.tag-target-card {
  :deep(.el-card__body) { padding: 16px; }
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}
.tag-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 640px;
  overflow: auto;
}
.tag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: var(--el-fill-color-light);
  }
  &.active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}
.tag-color {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  border-radius: 50%;
}
.tag-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tag-count {
  flex-shrink: 0;
  padding: 1px 7px;
  background: var(--el-fill-color);
  border-radius: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.tag-action {
  flex-shrink: 0;
  padding: 0 2px;
}
.tag-empty,
.tag-target-empty {
  padding: 48px 0;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.tag-target-title {
  flex-wrap: wrap;
}
.tag-title-badge {
  padding: 2px 8px;
  border-radius: 3px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}
.tag-title-count {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.tag-target-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tag-target-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.filter-keyword { width: 220px; }
.filter-select { width: 130px; }
.target-name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.target-name { font-weight: 600; }
.target-sub { color: var(--el-text-color-secondary); font-size: 12px; }
.confidence { font-weight: 600; }
.confidence-low { color: var(--el-color-danger); }
.target-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.cell-empty {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.assign-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.assign-keyword {
  width: 240px;
}
.assign-tip {
  margin-left: auto;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.assign-table {
  width: 100%;
}
.list-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.tag-color-picker {
  width: 200px;
}

@media (max-width: 1100px) {
  .tag-layout {
    grid-template-columns: 1fr;
  }
  .tag-list {
    max-height: 260px;
  }
}
</style>
