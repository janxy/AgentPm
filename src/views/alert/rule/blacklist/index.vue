<template>
  <div class="blacklist-page">
    <!-- 筛选区 -->
    <ElCard shadow="never" class="filter-card annot-alert-rule-blacklist-filter">
      <ElForm :inline="true" :model="filterForm">
        <ElFormItem label="目标名称/MMSI"><ElInput v-model="filterForm.keyword" placeholder="输入名称或MMSI" clearable /></ElFormItem>
        <ElFormItem label="等级">
          <ElSelect v-model="filterForm.level" placeholder="全部" clearable>
            <ElOption label="一般" value="normal" /><ElOption label="重点" value="key" /><ElOption label="高危" value="highRisk" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="filterForm.status" placeholder="全部" clearable>
            <ElOption label="启用" :value="1" /><ElOption label="禁用" :value="0" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" :icon="Search" @click="handleSearch">搜索</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <!-- 操作栏 + 表格 -->
    <ElCard shadow="never" class="table-card annot-alert-rule-blacklist-table">
      <div class="table-header annot-alert-rule-blacklist-toolbar">
        <ElButton type="primary" :icon="Plus" @click="openAddDialog">新增</ElButton>
        <ElButton :icon="Upload" @click="openImportDialog">批量导入</ElButton>
      </div>
      <ElTable v-loading="loading" :data="tableData">
        <ElTableColumn prop="targetName" label="目标名称" min-width="120" />
        <ElTableColumn prop="mmsi" label="MMSI" width="110" />
        <ElTableColumn prop="callsign" label="呼号" width="100"><template #default="{ row }">{{ row.callsign || '-' }}</template></ElTableColumn>
        <ElTableColumn prop="targetNo" label="目标编号" width="110"><template #default="{ row }">{{ row.targetNo || '-' }}</template></ElTableColumn>
        <ElTableColumn label="等级" width="90" align="center" class-name="annot-alert-rule-blacklist-level">
          <template #default="{ row }"><ElTag :type="(levelTagMap as any)[row.level]" size="small" disable-transitions>{{ levelLabel[row.level] }}</ElTag></template>
        </ElTableColumn>
        <ElTableColumn prop="reason" label="加入原因" min-width="150" show-overflow-tooltip />
        <ElTableColumn label="命中次数" width="90" align="center" class-name="annot-alert-rule-blacklist-hitcount">
          <template #default="{ row }"><ElButton link type="primary" @click="showHitHistory(row)">{{ row.hitCount }}</ElButton></template>
        </ElTableColumn>
        <ElTableColumn prop="createTime" label="加入时间" width="170" />
        <ElTableColumn label="状态" width="80" align="center" class-name="annot-alert-rule-blacklist-status">
          <template #default="{ row }">
            <ElSwitch v-model="row.status" :active-value="1" :inactive-value="0" size="small" @change="(val: any) => handleStatusChange(row, val)" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="200" align="center" fixed="right" class-name="annot-alert-rule-blacklist-actions">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openEditDialog(row)">编辑</ElButton>
            <ElButton link type="danger" @click="handleDelete(row)">删除</ElButton>
            <ElButton link type="primary" @click="showHitHistory(row)">命中历史</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
        :total="pagination.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next"
        @size-change="loadList" @current-change="loadList" class="list-pagination" />
    </ElCard>

    <!-- 新增/编辑弹窗 -->
    <ElDialog v-model="dialogVisible" :title="isEditing ? '编辑黑名单' : '新增黑名单'" width="560px" @closed="resetForm" class="annot-alert-rule-blacklist-dialog">
      <ElForm ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <ElFormItem label="目标名称" prop="targetName"><ElInput v-model="form.targetName" placeholder="2-50字" maxlength="50" /></ElFormItem>
        <ElFormItem label="MMSI" prop="mmsi"><ElInput v-model="form.mmsi" placeholder="9位数字" maxlength="9" :disabled="isEditing" /></ElFormItem>
        <ElFormItem label="呼号"><ElInput v-model="form.callsign" placeholder="选填，不超过20字" maxlength="20" /></ElFormItem>
        <ElFormItem label="目标编号"><ElInput v-model="form.targetNo" placeholder="选填，不超过30字" maxlength="30" /></ElFormItem>
        <ElFormItem label="等级" prop="level">
          <ElSelect v-model="form.level" placeholder="请选择等级">
            <ElOption label="一般" value="normal" /><ElOption label="重点" value="key" /><ElOption label="高危" value="highRisk" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="加入原因"><ElInput v-model="form.reason" type="textarea" placeholder="不超过200字" maxlength="200" :rows="3" /></ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">确定</ElButton>
      </template>
    </ElDialog>

    <!-- 批量导入弹窗 -->
    <ElDialog v-model="importDialogVisible" title="批量导入黑名单" width="700px" class="annot-alert-rule-blacklist-import">
      <ElSteps :active="importStep" align-center class="import-steps">
        <ElStep title="下载模板" /><ElStep title="上传文件" /><ElStep title="预览确认" />
      </ElSteps>
      <div v-if="importStep === 0" class="import-step-content">
        <ElButton type="primary" @click="downloadTemplate">下载导入模板</ElButton>
      </div>
      <div v-else-if="importStep === 1" class="import-step-content">
        <ElUpload drag :auto-upload="false" :on-change="handleFileUpload" accept=".xlsx" :limit="1">
          <ElIcon><Upload /></ElIcon>
          <div>点击或拖拽上传 XLSX 文件</div>
        </ElUpload>
      </div>
      <div v-else-if="importStep === 2" class="import-step-content">
        <ElTable :data="importPreviewData" size="small" max-height="300">
          <ElTableColumn prop="targetName" label="目标名称" width="120" />
          <ElTableColumn prop="mmsi" label="MMSI" width="110" />
          <ElTableColumn prop="level" label="等级" width="80" />
          <ElTableColumn prop="reason" label="原因" min-width="150" />
          <ElTableColumn label="状态" width="100"><template #default="{ row }"><ElTag :type="row.valid ? 'success' : 'danger'" size="small">{{ row.valid ? '正常' : '重复' }}</ElTag></template></ElTableColumn>
        </ElTable>
      </div>
      <template #footer>
        <ElButton @click="importDialogVisible = false">取消</ElButton>
        <ElButton v-if="importStep < 2" type="primary" @click="importStep++">下一步</ElButton>
        <ElButton v-if="importStep === 2" type="primary" :loading="importLoading" @click="confirmImport">确认导入</ElButton>
      </template>
    </ElDialog>

    <!-- 命中历史弹窗 -->
    <ElDialog v-model="hitDialogVisible" :title="`命中历史 - ${hitTargetName}`" width="700px" class="annot-alert-rule-blacklist-hit">
      <div class="hit-stats">
        <ElTag type="info">总命中 {{ hitHistoryData.length }} 次</ElTag>
        <ElTag v-if="hitHistoryData.length" type="warning">最近: {{ hitHistoryData[0]?.triggerTime }}</ElTag>
      </div>
      <ElTable :data="hitHistoryData" size="small" class="hit-table">
        <ElTableColumn prop="triggerTime" label="命中时间" width="170" />
        <ElTableColumn label="位置" min-width="180"><template #default="{ row }">{{ row.location?.lat }}, {{ row.location?.lng }}</template></ElTableColumn>
        <ElTableColumn label="告警级别" width="90"><template #default="{ row }"><ElTag :type="(alertLevelTagMap as any)[row.alertLevel]" size="small">{{ alertLevelLabel[row.alertLevel] }}</ElTag></template></ElTableColumn>
        <ElTableColumn prop="status" label="处理状态" width="100" />
      </ElTable>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus, Upload } from '@element-plus/icons-vue'
import { getBlacklist, addBlacklist, updateBlacklist, deleteBlacklist, updateBlacklistStatus, getAlertEventList } from '@/api/alert'

defineOptions({ name: 'AlertRuleBlacklist' })

const levelLabel: Record<string, string> = { normal: '一般', key: '重点', highRisk: '高危' }
const levelTagMap = { normal: 'warning' as const, key: '' as const, highRisk: 'danger' as const }
const alertLevelLabel: Record<string, string> = { tip: '提示', normal: '一般', important: '重要', urgent: '紧急' }
const alertLevelTagMap = { tip: 'info' as const, normal: 'warning' as const, important: '' as const, urgent: 'danger' as const }

const filterForm = reactive({ keyword: '', level: '', status: '' as number | string })
const loading = ref(false)
const tableData = ref<any[]>([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ targetName: '', mmsi: '', callsign: '', targetNo: '', level: 'normal', reason: '' })
const formRules: FormRules = {
  targetName: [{ required: true, message: '请输入目标名称', trigger: 'blur' }],
  mmsi: [{ required: true, message: '请输入MMSI', trigger: 'blur' }, { pattern: /^\d{9}$/, message: 'MMSI为9位数字', trigger: 'blur' }],
  level: [{ required: true, message: '请选择等级', trigger: 'change' }]
}

const importDialogVisible = ref(false)
const importStep = ref(0)
const importPreviewData = ref<any[]>([])
const importLoading = ref(false)

const hitDialogVisible = ref(false)
const hitTargetName = ref('')
const hitHistoryData = ref<any[]>([])

async function loadList() {
  loading.value = true
  try {
    const { data } = await getBlacklist({
      keyword: filterForm.keyword, level: filterForm.level,
      status: filterForm.status === '' ? undefined : filterForm.status,
      page: pagination.page, pageSize: pagination.pageSize
    })
    tableData.value = (data as any)?.list || []
    pagination.total = (data as any)?.pagination?.total || 0
  } finally { loading.value = false }
}

function handleSearch() { pagination.page = 1; loadList() }
function handleReset() { filterForm.keyword = ''; filterForm.level = ''; filterForm.status = ''; pagination.page = 1; loadList() }

function openAddDialog() {
  isEditing.value = false; editingId.value = null
  form.targetName = ''; form.mmsi = ''; form.callsign = ''; form.targetNo = ''; form.level = 'normal'; form.reason = ''
  dialogVisible.value = true
}

function openEditDialog(row: any) {
  isEditing.value = true; editingId.value = row.id
  form.targetName = row.targetName; form.mmsi = row.mmsi; form.callsign = row.callsign || ''
  form.targetNo = row.targetNo || ''; form.level = row.level; form.reason = row.reason || ''
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (isEditing.value && editingId.value) {
      await updateBlacklist(editingId.value, form)
      ElMessage.success('更新成功')
    } else {
      const exists = tableData.value.some((b) => b.mmsi === form.mmsi)
      if (exists) { ElMessage.warning(`MMSI【${form.mmsi}】已存在黑名单库中`); submitLoading.value = false; return }
      await addBlacklist({ ...form, status: 1 })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false; loadList()
  } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false }
}

async function handleStatusChange(row: any, val: any) {
  try { await updateBlacklistStatus(row.id, val); ElMessage.success(val === 1 ? '已启用' : '已禁用') } catch { row.status = val === 1 ? 0 : 1 }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确定从黑名单中移除该目标吗？', '确认删除', { type: 'warning' })
    await deleteBlacklist(row.id)
    ElMessage.success('删除成功'); loadList()
  } catch { /* cancel */ }
}

function openImportDialog() { importStep.value = 0; importPreviewData.value = []; importDialogVisible.value = true }

function downloadTemplate() {
  const csv = '\uFEFF目标名称,MMSI,等级,呼号,目标编号,备注\n示例船A,412000001,一般,ABCD,TGT-001,测试数据\n'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const el = document.createElement('a')
  el.href = URL.createObjectURL(blob); el.download = '黑名单导入模板.csv'; el.click()
}

function handleFileUpload(file: any) {
  importStep.value = 2
  const existingMmsis = new Set(tableData.value.map((b) => b.mmsi))
  importPreviewData.value = [
    { targetName: '示例船A', mmsi: '412000001', level: '一般', reason: '测试数据', valid: !existingMmsis.has('412000001') },
    { targetName: '示例船B', mmsi: '413999999', level: '重点', reason: '走私嫌疑', valid: !existingMmsis.has('413999999') }
  ]
}

async function confirmImport() {
  importLoading.value = true
  try {
    const items = importPreviewData.value.filter((i) => i.valid)
    await Promise.all(items.map((i) => addBlacklist({ targetName: i.targetName, mmsi: i.mmsi, level: i.level, reason: i.reason, callsign: '', targetNo: '', status: 1 })))
    ElMessage.success(`成功导入 ${items.length} 条数据`)
    importDialogVisible.value = false; loadList()
  } catch { ElMessage.error('导入失败') } finally { importLoading.value = false }
}

async function showHitHistory(row: any) {
  hitTargetName.value = row.targetName
  try {
    const { data } = await getAlertEventList({ keyword: row.mmsi, page: 1, pageSize: 50 })
    hitHistoryData.value = (data as any)?.list || []
    hitDialogVisible.value = true
  } catch { /* ignore */ }
}

function resetForm() { formRef.value?.resetFields() }

onMounted(() => { loadList() })
</script>

<style lang="scss" scoped>
.filter-card { margin-bottom: 12px; :deep(.el-card__body) { padding: 12px 16px 4px; } }
.table-card { :deep(.el-card__body) { padding: 16px; } }
.table-header { margin-bottom: 12px; display: flex; gap: 8px; }
.list-pagination { margin-top: 12px; display: flex; justify-content: center; }
.import-steps { margin-bottom: 24px; }
.import-step-content { padding: 24px 0; text-align: center; min-height: 120px; }
.hit-stats { display: flex; gap: 8px; margin-bottom: 16px; }
.hit-table { margin-top: 12px; }
</style>
