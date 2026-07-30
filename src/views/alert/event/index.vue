<template>
  <div class="alert-event-page">
    <ElTabs v-model="activeTab" class="event-tabs">
      <!-- Tab 1: 报警接收展示 -->
      <ElTabPane label="报警接收展示" name="reception">
        <div class="stats-row annot-alert-event-reception-stats">
          <ElCard shadow="never" class="stat-card stat-pending">
            <div class="stat-value">{{ stats.pending }}</div>
            <div class="stat-label">待核验</div>
          </ElCard>
          <ElCard shadow="never" class="stat-card stat-disposing">
            <div class="stat-value">{{ stats.disposing }}</div>
            <div class="stat-label">处置中</div>
          </ElCard>
          <ElCard shadow="never" class="stat-card stat-closed">
            <div class="stat-value">{{ stats.closedToday }}</div>
            <div class="stat-label">今日闭环</div>
          </ElCard>
          <ElCard shadow="never" class="stat-card stat-overdue">
            <div class="stat-value">{{ stats.overdue }}</div>
            <div class="stat-label">超时未处理</div>
          </ElCard>
        </div>

        <ElCard shadow="never" class="filter-card annot-alert-event-reception-filter">
          <div class="filter-row">
            <ElInput v-model="filterR.keyword" placeholder="搜索目标名称/MMSI" clearable class="filter-input" @clear="loadEvents" @keyup.enter="loadEvents" />
            <ElSelect v-model="filterR.alertLevel" placeholder="告警级别" clearable class="filter-select">
              <ElOption label="紧急" value="urgent" /><ElOption label="重要" value="important" />
              <ElOption label="一般" value="normal" /><ElOption label="提示" value="tip" />
            </ElSelect>
            <ElSelect v-model="filterR.status" placeholder="事件状态" clearable class="filter-select">
              <ElOption label="待核验" value="pending" /><ElOption label="处置中" value="disposing" />
              <ElOption label="已闭环" value="closed" /><ElOption label="已归档" value="archived" />
            </ElSelect>
            <ElButton type="primary" :icon="Search" @click="loadEvents">查询</ElButton>
            <ElButton @click="resetReceptionFilter">重置</ElButton>
            <div class="filter-spacer" />
            <ElButton :icon="Setting" @click="pushDrawerVisible = true" class="annot-alert-event-push-btn">推送配置</ElButton>
          </div>
        </ElCard>

        <ElCard shadow="never" class="table-card annot-alert-event-reception-table">
          <ElTable v-loading="eventLoading" :data="eventList" row-key="id" class="event-table" @row-click="openDisposalDialog">
            <ElTableColumn label="告警级别" width="85" align="center">
              <template #default="{ row }"><ElTag :type="(alertTagMap as any)[row.alertLevel]" size="small" disable-transitions>{{ alertLabelMap[row.alertLevel] }}</ElTag></template>
            </ElTableColumn>
            <ElTableColumn prop="targetName" label="目标名称" width="130" />
            <ElTableColumn prop="targetMmsi" label="MMSI" width="110" />
            <ElTableColumn prop="ruleName" label="触发规则" min-width="150" show-overflow-tooltip />
            <ElTableColumn label="触发位置" min-width="160">
              <template #default="{ row }">{{ row.location?.lat?.toFixed(4) }}, {{ row.location?.lng?.toFixed(4) }} @ {{ row.location?.address }}</template>
            </ElTableColumn>
            <ElTableColumn prop="triggerTime" label="触发时间" width="170" />
            <ElTableColumn label="状态" width="85" align="center">
              <template #default="{ row }"><ElTag :type="(statusTagMap as any)[row.status]" size="small" disable-transitions>{{ statusLabelMap[row.status] }}</ElTag></template>
            </ElTableColumn>
            <ElTableColumn label="是否误报" width="85" align="center">
              <template #default="{ row }">{{ row.isFalseAlarm ? '是' : '否' }}</template>
            </ElTableColumn>
            <ElTableColumn label="快速操作" width="200" align="center" fixed="right" class-name="annot-alert-event-reception-actions">
              <template #default="{ row }">
                <template v-if="row.status === 'pending'">
                  <ElButton link type="primary" @click.stop="quickClaim(row)">签收</ElButton>
                  <ElButton link type="primary" @click.stop="quickAssign(row)">派发</ElButton>
                  <ElButton link type="warning" @click.stop="markFalseAlarm(row)">误报</ElButton>
                </template>
                <template v-else-if="row.status === 'disposing'">
                  <ElButton link type="success" @click.stop="quickClose(row)">闭环</ElButton>
                  <ElButton link type="warning" @click.stop="markFalseAlarm(row)">误报</ElButton>
                </template>
                <template v-else-if="row.status === 'closed'">
                  <ElButton link type="primary" @click.stop="quickArchive(row)">归档</ElButton>
                </template>
                <ElButton link type="primary" @click.stop="openDisposalDialog(row)">详情</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
          <ElPagination v-model:current-page="eventPage.page" v-model:page-size="eventPage.pageSize" :total="eventPage.total"
            :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @size-change="loadEvents" @current-change="loadEvents" class="event-pagination" />
        </ElCard>
      </ElTabPane>

      <!-- Tab 2: 报警处置流程 -->
      <ElTabPane label="报警处置流程" name="disposal">
        <ElCard shadow="never" class="filter-card annot-alert-event-disposal-filter">
          <div class="filter-row">
            <ElSelect v-model="filterD.status" placeholder="事件状态" clearable class="filter-select">
              <ElOption label="待核验" value="pending" /><ElOption label="处置中" value="disposing" />
              <ElOption label="已闭环" value="closed" /><ElOption label="已归档" value="archived" />
            </ElSelect>
            <ElInput v-model="filterD.keyword" placeholder="搜索目标名称/MMSI" clearable class="filter-input" @clear="loadDisposalList" @keyup.enter="loadDisposalList" />
            <ElButton type="primary" :icon="Search" @click="loadDisposalList">查询</ElButton>
            <ElButton @click="filterD.status=''; filterD.keyword=''; loadDisposalList()">重置</ElButton>
          </div>
        </ElCard>

        <ElCard shadow="never" class="table-card annot-alert-event-disposal-table">
          <ElTable v-loading="disposalLoading" :data="disposalList" row-key="id" class="disposal-table">
            <ElTableColumn type="expand">
              <template #default="{ row }">
                <div class="timeline-panel annot-alert-event-disposal-timeline">
                  <div class="timeline-title">操作时间线</div>
                  <ElTimeline>
                    <ElTimelineItem v-for="(t, tIdx) in row.timeline" :key="tIdx" :timestamp="t.time"
                      :type="t.action === '生成告警' ? 'primary' : t.action.includes('闭环') ? 'success' : t.action.includes('误报') ? 'danger' : 'warning'"
                      :hollow="t.operator === '系统'">
                      <p><strong>{{ t.operator }}</strong> - {{ t.action }}</p>
                      <p v-if="t.remark" class="timeline-remark">{{ t.remark }}</p>
                    </ElTimelineItem>
                  </ElTimeline>
                  <div class="timeline-add">
                    <ElInput v-model="timelineRemarks[row.id]" placeholder="补充处置备注..." size="small" class="timeline-input" />
                    <ElButton size="small" type="primary" :disabled="!timelineRemarks[row.id]" @click="addTimelineEntry(row)">添加记录</ElButton>
                  </div>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn label="告警级别" width="85" align="center">
              <template #default="{ row }"><ElTag :type="(alertTagMap as any)[row.alertLevel]" size="small" disable-transitions>{{ alertLabelMap[row.alertLevel] }}</ElTag></template>
            </ElTableColumn>
            <ElTableColumn prop="targetName" label="目标名称" width="130" />
            <ElTableColumn prop="targetMmsi" label="MMSI" width="110" />
            <ElTableColumn prop="ruleName" label="触发规则" min-width="150" show-overflow-tooltip />
            <ElTableColumn label="状态流转" width="200" align="center" class-name="annot-alert-event-disposal-statusflow">
              <template #default="{ row }">
                <div class="status-flow">
                  <span :class="['flow-step', row.status === 'pending' ? 'active' : 'done']">待核验</span>
                  <span class="flow-arrow">&rarr;</span>
                  <span :class="['flow-step', row.status === 'disposing' ? 'active' : (['closed','archived'].includes(row.status) ? 'done' : '')]">处置中</span>
                  <span class="flow-arrow">&rarr;</span>
                  <span :class="['flow-step', row.status === 'closed' ? 'active' : (row.status === 'archived' ? 'done' : '')]">已闭环</span>
                  <span class="flow-arrow">&rarr;</span>
                  <span :class="['flow-step', row.status === 'archived' ? 'active' : '']">已归档</span>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn label="经办人" width="100" align="center">
              <template #default="{ row }">{{ row.assigneeName || '-' }}</template>
            </ElTableColumn>
            <ElTableColumn prop="triggerTime" label="触发时间" width="170" />
            <ElTableColumn label="操作" width="280" align="center" fixed="right" class-name="annot-alert-event-disposal-actions">
              <template #default="{ row }">
                <template v-if="row.status === 'pending'">
                  <ElButton link type="primary" @click.stop="disposalClaim(row)">签收</ElButton>
                  <ElButton link type="primary" @click.stop="disposalAssign(row)">派发</ElButton>
                  <ElButton link type="warning" @click.stop="markFalseAlarm(row)">标记误报</ElButton>
                </template>
                <template v-else-if="row.status === 'disposing'">
                  <ElButton link type="primary" @click.stop="disposalAssign(row)">转派</ElButton>
                  <ElButton link type="success" @click.stop="disposalClose(row)">闭环</ElButton>
                  <ElButton link type="warning" @click.stop="markFalseAlarm(row)">标记误报</ElButton>
                </template>
                <template v-else-if="row.status === 'closed'">
                  <ElButton link type="primary" @click.stop="disposalArchive(row)">归档</ElButton>
                </template>
                <template v-else>
                  <ElTag type="info" size="small">已完成</ElTag>
                </template>
              </template>
            </ElTableColumn>
          </ElTable>
          <ElPagination v-model:current-page="disposalPage.page" v-model:page-size="disposalPage.pageSize" :total="disposalPage.total"
            :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @size-change="loadDisposalList" @current-change="loadDisposalList" class="event-pagination" />
        </ElCard>
      </ElTabPane>

      <!-- Tab 3: 误报治理 -->
      <ElTabPane label="误报治理" name="falseAlarm">
        <div class="stats-row annot-alert-event-fa-stats">
          <ElCard shadow="never" class="stat-card stat-neutral">
            <div class="stat-value">{{ faStats.totalAlerts }}</div>
            <div class="stat-label">告警总数</div>
          </ElCard>
          <ElCard shadow="never" class="stat-card stat-warning">
            <div class="stat-value">{{ faStats.totalFalseAlarms }}</div>
            <div class="stat-label">误报数量</div>
          </ElCard>
          <ElCard shadow="never" class="stat-card stat-danger">
            <div class="stat-value">{{ faStats.falseAlarmRate }}</div>
            <div class="stat-label">误报率</div>
          </ElCard>
        </div>

        <ElCard shadow="never" class="table-card annot-alert-event-fa-table">
          <div class="table-header"><span class="table-title">规则维度误报统计</span></div>
          <ElTable :data="faStats.rules" row-key="ruleId" size="small" class="fa-table">
            <ElTableColumn prop="ruleName" label="规则名称" min-width="180" />
            <ElTableColumn label="规则类型" width="120" align="center">
              <template #default="{ row }">
                <ElTag :type="row.ruleType === 'fence' ? 'primary' : 'warning'" size="small" disable-transitions>
                  {{ row.ruleType === 'fence' ? '围栏预警' : '行为预警' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="totalAlerts" label="告警数" width="90" align="center" />
            <ElTableColumn prop="falseAlarms" label="误报数" width="90" align="center" />
            <ElTableColumn label="误报率" width="100" align="center">
              <template #default="{ row }">
                <span :style="{ color: parseFloat(row.falseAlarmRate) > 50 ? 'var(--el-color-danger)' : parseFloat(row.falseAlarmRate) > 20 ? 'var(--el-color-warning)' : '' }">{{ row.falseAlarmRate }}</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="220" align="center">
              <template #default="{ row }">
                <ElButton link type="primary" size="small" @click="openVersionDialog(row)">版本管理</ElButton>
                <ElButton link type="warning" size="small" @click="openMarkFalseAlarmDialog(row)">标记误报</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </ElTabPane>
    </ElTabs>

    <!-- 推送配置抽屉 -->
    <ElDrawer v-model="pushDrawerVisible" title="推送配置" direction="rtl" size="460px" class="annot-alert-event-push-drawer">
      <ElForm label-width="100px">
        <ElFormItem label="推送方式">
          <ElCheckboxGroup v-model="pushConfig.channels">
            <ElCheckbox value="popup" label="弹窗" /><ElCheckbox value="sms" label="短信" />
            <ElCheckbox value="email" label="邮件" /><ElCheckbox value="dingtalk" label="钉钉" />
            <ElCheckbox value="wechat" label="微信" />
          </ElCheckboxGroup>
        </ElFormItem>
        <ElFormItem label="告警级别过滤">
          <ElCheckboxGroup v-model="pushConfig.levels">
            <ElCheckbox value="urgent" label="紧急" /><ElCheckbox value="important" label="重要" />
            <ElCheckbox value="normal" label="一般" /><ElCheckbox value="tip" label="提示" />
          </ElCheckboxGroup>
        </ElFormItem>
        <ElFormItem label="推送频率">
          <ElRadioGroup v-model="pushConfig.frequency">
            <ElRadio value="realtime">实时</ElRadio><ElRadio value="5min">每5分钟</ElRadio>
            <ElRadio value="15min">每15分钟</ElRadio><ElRadio value="1hour">每小时</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="接收人">
          <ElSelect v-model="pushConfig.receivers" multiple placeholder="选择接收人">
            <ElOption label="管理员" value="1" /><ElOption label="李四" value="3" /><ElOption label="王五" value="4" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="静默时段">
          <ElTimePicker v-model="pushConfig.silenceTime" is-range range-separator="-" start-placeholder="开始" end-placeholder="结束" format="HH:mm" value-format="HH:mm" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="pushDrawerVisible = false">取消</ElButton>
        <ElButton type="primary" @click="savePushConfig">保存配置</ElButton>
      </template>
    </ElDrawer>

    <!-- 派发弹窗 -->
    <ElDialog v-model="assignDialogVisible" title="派发/转派" width="480px" class="annot-alert-event-assign-dialog">
      <ElForm label-width="80px">
        <ElFormItem label="事件编号">{{ assignTarget?.id }}</ElFormItem>
        <ElFormItem label="目标名称">{{ assignTarget?.targetName }}</ElFormItem>
        <ElFormItem label="触发规则">{{ assignTarget?.ruleName }}</ElFormItem>
        <ElFormItem label="指派给">
          <ElSelect v-model="assignForm.assigneeName" placeholder="选择处置人员" filterable>
            <ElOption label="管理员" value="管理员" /><ElOption label="李四" value="李四" />
            <ElOption label="王五" value="王五" /><ElOption label="张三" value="张三" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="处置建议">
          <ElInput v-model="assignForm.remark" type="textarea" placeholder="输入处置建议（选填）" :rows="3" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="assignDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="confirmAssign">确定派发</ElButton>
      </template>
    </ElDialog>

    <!-- 闭环确认弹窗 -->
    <ElDialog v-model="closeDialogVisible" title="闭环确认" width="480px" class="annot-alert-event-close-dialog">
      <ElForm label-width="80px">
        <ElFormItem label="处置结论">
          <ElSelect v-model="closeForm.conclusion" placeholder="选择处置结论">
            <ElOption label="已确认并驱离" value="已确认并驱离" />
            <ElOption label="核实为正常作业" value="核实为正常作业" />
            <ElOption label="已移交海警处理" value="已移交海警处理" />
            <ElOption label="设备误报" value="设备误报" />
            <ElOption label="其他" value="其他" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="补充说明">
          <ElInput v-model="closeForm.remark" type="textarea" placeholder="补充处置说明..." :rows="3" maxlength="200" show-word-limit />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="closeDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="confirmClose">确认闭环</ElButton>
      </template>
    </ElDialog>

    <!-- 标记误报弹窗 -->
    <ElDialog v-model="falseAlarmDialogVisible" title="标记误报" width="560px" class="annot-alert-event-falsealarm-dialog">
      <ElForm label-width="90px">
        <ElFormItem label="告警事件">{{ falseAlarmTarget?.targetName }} - {{ falseAlarmTarget?.ruleName }}</ElFormItem>
        <ElFormItem label="误报原因">
          <ElSelect v-model="falseAlarmForm.reason" placeholder="选择误报原因">
            <ElOption label="算法误判" value="算法误判" /><ElOption label="传感器异常" value="传感器异常" />
            <ElOption label="数据延迟" value="数据延迟" /><ElOption label="人为操作失误" value="人为操作失误" />
            <ElOption label="环境干扰" value="环境干扰" /><ElOption label="其他" value="其他" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="详细说明">
          <ElInput v-model="falseAlarmForm.remark" type="textarea" placeholder="描述误报的具体情况..." :rows="3" maxlength="300" show-word-limit />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="falseAlarmDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="confirmFalseAlarm">确定标记</ElButton>
      </template>
    </ElDialog>

    <!-- 事件详情弹窗 -->
    <ElDialog v-model="detailDialogVisible" :title="'事件详情 - ' + (detailTarget?.targetName || '')" width="640px" class="annot-alert-event-detail-dialog">
      <template v-if="detailTarget">
        <ElDescriptions :column="2" border size="small">
          <ElDescriptionsItem label="事件编号">{{ detailTarget.id }}</ElDescriptionsItem>
          <ElDescriptionsItem label="目标MMSI">{{ detailTarget.targetMmsi }}</ElDescriptionsItem>
          <ElDescriptionsItem label="目标名称">{{ detailTarget.targetName }}</ElDescriptionsItem>
          <ElDescriptionsItem label="触发规则">{{ detailTarget.ruleName }}</ElDescriptionsItem>
          <ElDescriptionsItem label="告警级别"><ElTag :type="(alertTagMap as any)[detailTarget.alertLevel]" size="small" disable-transitions>{{ alertLabelMap[detailTarget.alertLevel] }}</ElTag></ElDescriptionsItem>
          <ElDescriptionsItem label="事件状态"><ElTag :type="(statusTagMap as any)[detailTarget.status]" size="small" disable-transitions>{{ statusLabelMap[detailTarget.status] }}</ElTag></ElDescriptionsItem>
          <ElDescriptionsItem label="触发时间">{{ detailTarget.triggerTime }}</ElDescriptionsItem>
          <ElDescriptionsItem label="触发位置">{{ detailTarget.location?.lat?.toFixed(4) }}, {{ detailTarget.location?.lng?.toFixed(4) }}</ElDescriptionsItem>
          <ElDescriptionsItem label="位置描述" :span="2">{{ detailTarget.location?.address }}</ElDescriptionsItem>
          <ElDescriptionsItem label="经办人">{{ detailTarget.assigneeName || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="是否误报">{{ detailTarget.isFalseAlarm ? '是' : '否' }}</ElDescriptionsItem>
          <ElDescriptionsItem v-if="detailTarget.isFalseAlarm" label="误报原因" :span="2">{{ detailTarget.falseAlarmReason }}</ElDescriptionsItem>
          <ElDescriptionsItem v-if="detailTarget.isFalseAlarm" label="误报说明" :span="2">{{ detailTarget.falseAlarmRemark }}</ElDescriptionsItem>
        </ElDescriptions>
        <div class="detail-timeline-title">操作时间线</div>
        <ElTimeline>
          <ElTimelineItem v-for="(t, tIdx) in detailTarget.timeline" :key="tIdx" :timestamp="t.time"
            :type="t.action === '生成告警' ? 'primary' : t.action.includes('闭环') ? 'success' : t.action.includes('误报') ? 'danger' : 'warning'"
            :hollow="t.operator === '系统'">
            <p><strong>{{ t.operator }}</strong> - {{ t.action }}</p>
            <p v-if="t.remark">{{ t.remark }}</p>
          </ElTimelineItem>
        </ElTimeline>
      </template>
    </ElDialog>

    <!-- 版本管理弹窗 -->
    <ElDialog v-model="versionDialogVisible" title="版本管理" width="600px" class="annot-alert-event-version-dialog">
      <ElTable :data="versionList" size="small" v-loading="versionLoading">
        <ElTableColumn prop="version" label="版本号" width="80" align="center" />
        <ElTableColumn prop="changeSummary" label="变更说明" min-width="200" />
        <ElTableColumn prop="operatorName" label="操作人" width="100" align="center" />
        <ElTableColumn prop="createTime" label="变更时间" width="170" />
        <ElTableColumn label="操作" width="100" align="center">
          <template #default="{ row }"><ElButton link type="warning" size="small" @click="confirmRollback(row)">回退</ElButton></template>
        </ElTableColumn>
      </ElTable>
    </ElDialog>

    <!-- 快速签收确认 -->
    <ElDialog v-model="claimDialogVisible" title="确认签收" width="420px">
      <p>确定签收告警 <strong>{{ claimTarget?.targetName }}</strong>（{{ claimTarget?.ruleName }}）吗？签收后将进入处置流程。</p>
      <template #footer>
        <ElButton @click="claimDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="confirmClaim">确认签收</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Setting } from '@element-plus/icons-vue'
import {
  getAlertEventList, getAlertEventStats, updateAlertEvent, addEventTimeline,
  getFalseAlarmStats, getRuleVersions, rollbackVersion
} from '@/api/alert'

defineOptions({ name: 'AlertEvent' })

const activeTab = ref('reception')

const alertLabelMap: Record<string, string> = { urgent: '紧急', important: '重要', normal: '一般', tip: '提示' }
const alertTagMap = { urgent: 'danger' as const, important: 'warning' as const, normal: 'primary' as const, tip: 'info' as const }
const statusLabelMap: Record<string, string> = { pending: '待核验', disposing: '处置中', closed: '已闭环', archived: '已归档' }
const statusTagMap = { pending: 'danger' as const, disposing: 'warning' as const, closed: 'success' as const, archived: 'info' as const }

// Tab1: 报警接收展示
const stats = reactive({ pending: 0, disposing: 0, closedToday: 0, overdue: 0 })
const filterR = reactive({ keyword: '', alertLevel: '', status: '' })
const eventLoading = ref(false)
const eventList = ref<any[]>([])
const eventPage = reactive({ page: 1, pageSize: 10, total: 0 })

async function loadStats() { try { const { data } = await getAlertEventStats(); Object.assign(stats, data) } catch { /* */ } }

async function loadEvents() {
  eventLoading.value = true
  try {
    const { data } = await getAlertEventList({ keyword: filterR.keyword, alertLevel: filterR.alertLevel, status: filterR.status, page: eventPage.page, pageSize: eventPage.pageSize })
    eventList.value = (data as any)?.list || []; eventPage.total = (data as any)?.pagination?.total || 0
  } finally { eventLoading.value = false }
}

function resetReceptionFilter() { filterR.keyword = ''; filterR.alertLevel = ''; filterR.status = ''; eventPage.page = 1; loadEvents() }

// Tab2: 报警处置流程
const filterD = reactive({ keyword: '', status: '' })
const disposalLoading = ref(false)
const disposalList = ref<any[]>([])
const disposalPage = reactive({ page: 1, pageSize: 10, total: 0 })
const timelineRemarks = reactive<Record<number, string>>({})

async function loadDisposalList() {
  disposalLoading.value = true
  try {
    const { data } = await getAlertEventList({ keyword: filterD.keyword, status: filterD.status, page: disposalPage.page, pageSize: disposalPage.pageSize })
    disposalList.value = (data as any)?.list || []; disposalPage.total = (data as any)?.pagination?.total || 0
  } finally { disposalLoading.value = false }
}

// Tab3: 误报治理
const faStats = reactive<{ totalAlerts: number; totalFalseAlarms: number; falseAlarmRate: string; rules: any[] }>({ totalAlerts: 0, totalFalseAlarms: 0, falseAlarmRate: '0%', rules: [] })
async function loadFalseAlarmStats() { try { const { data } = await getFalseAlarmStats(); Object.assign(faStats, data) } catch { /* */ } }

// 推送配置
const pushDrawerVisible = ref(false)
const pushConfig = reactive({ channels: ['popup', 'sms'], levels: ['urgent', 'important'], frequency: 'realtime', receivers: ['1'], silenceTime: [] as string[] })
function savePushConfig() { ElMessage.success('推送配置已保存'); pushDrawerVisible.value = false }

// 派发
const assignDialogVisible = ref(false)
const assignTarget = ref<any>(null)
const assignForm = reactive({ assigneeName: '', remark: '' })
function quickAssign(row: any) { assignTarget.value = row; assignForm.assigneeName = ''; assignForm.remark = ''; assignDialogVisible.value = true }
function disposalAssign(row: any) { quickAssign(row) }
async function confirmAssign() {
  if (!assignForm.assigneeName) { ElMessage.warning('请选择处置人员'); return }
  const row = assignTarget.value!
  const idMap: Record<string, number> = { '管理员': 1, '李四': 3, '王五': 4, '张三': 5 }
  try {
    await addEventTimeline(row.id, { operator: '系统', time: new Date().toLocaleString('zh-CN'), action: '派发', remark: `派发给${assignForm.assigneeName}` + (assignForm.remark ? `：${assignForm.remark}` : '') })
    await updateAlertEvent(row.id, { assigneeName: assignForm.assigneeName, assigneeId: idMap[assignForm.assigneeName] || 0, status: 'disposing' })
    ElMessage.success('派发成功'); assignDialogVisible.value = false; refreshAll()
  } catch { ElMessage.error('操作失败') }
}

// 闭环
const closeDialogVisible = ref(false)
const closeTarget = ref<any>(null)
const closeForm = reactive({ conclusion: '', remark: '' })
function quickClose(row: any) { closeTarget.value = row; closeForm.conclusion = ''; closeForm.remark = ''; closeDialogVisible.value = true }
function disposalClose(row: any) { quickClose(row) }
async function confirmClose() {
  if (!closeForm.conclusion) { ElMessage.warning('请选择处置结论'); return }
  const row = closeTarget.value!
  try {
    await addEventTimeline(row.id, { operator: row.assigneeName || '管理员', time: new Date().toLocaleString('zh-CN'), action: '闭环', remark: `结论：${closeForm.conclusion}` + (closeForm.remark ? `。${closeForm.remark}` : '') })
    await updateAlertEvent(row.id, { status: 'closed' })
    ElMessage.success('已闭环'); closeDialogVisible.value = false; refreshAll()
  } catch { ElMessage.error('操作失败') }
}

// 归档
async function quickArchive(row: any) {
  try { await ElMessageBox.confirm('确定归档该事件吗？归档后可查看但不可修改。', '确认归档', { type: 'info' }) } catch { return }
  await addEventTimeline(row.id, { operator: row.assigneeName || '管理员', time: new Date().toLocaleString('zh-CN'), action: '归档', remark: '事件归档处理' })
  await updateAlertEvent(row.id, { status: 'archived' })
  ElMessage.success('已归档'); refreshAll()
}
function disposalArchive(row: any) { quickArchive(row) }

// 签收
const claimDialogVisible = ref(false)
const claimTarget = ref<any>(null)
function quickClaim(row: any) { claimTarget.value = row; claimDialogVisible.value = true }
function disposalClaim(row: any) { quickClaim(row) }
async function confirmClaim() {
  const row = claimTarget.value!
  try {
    await addEventTimeline(row.id, { operator: '管理员', time: new Date().toLocaleString('zh-CN'), action: '签收', remark: '签收并确认有效' })
    await updateAlertEvent(row.id, { status: 'disposing', assigneeName: '管理员', assigneeId: 1 })
    ElMessage.success('签收成功，已进入处置流程'); claimDialogVisible.value = false; refreshAll()
  } catch { ElMessage.error('操作失败') }
}

// 误报标记
const falseAlarmDialogVisible = ref(false)
const falseAlarmTarget = ref<any>(null)
const falseAlarmForm = reactive({ reason: '', remark: '' })
function markFalseAlarm(row: any) { falseAlarmTarget.value = row; falseAlarmForm.reason = ''; falseAlarmForm.remark = ''; falseAlarmDialogVisible.value = true }
function openMarkFalseAlarmDialog(_row: any) { falseAlarmTarget.value = null; falseAlarmForm.reason = ''; falseAlarmForm.remark = ''; falseAlarmDialogVisible.value = true }
async function confirmFalseAlarm() {
  if (!falseAlarmForm.reason) { ElMessage.warning('请选择误报原因'); return }
  if (falseAlarmTarget.value) {
    const row = falseAlarmTarget.value
    await addEventTimeline(row.id, { operator: row.assigneeName || '管理员', time: new Date().toLocaleString('zh-CN'), action: '标记误报', remark: `${falseAlarmForm.reason}` + (falseAlarmForm.remark ? `：${falseAlarmForm.remark}` : '') })
    await updateAlertEvent(row.id, { isFalseAlarm: true, falseAlarmReason: falseAlarmForm.reason, falseAlarmRemark: falseAlarmForm.remark, status: 'closed' })
    ElMessage.success('已标记为误报')
  }
  falseAlarmDialogVisible.value = false; refreshAll()
}

// 事件详情
const detailDialogVisible = ref(false)
const detailTarget = ref<any>(null)
function openDisposalDialog(row: any) { detailTarget.value = row; detailDialogVisible.value = true }

// 版本管理
const versionDialogVisible = ref(false)
const versionList = ref<any[]>([])
const versionLoading = ref(false)
const versionRuleId = ref<number | null>(null)
async function openVersionDialog(row: any) {
  versionRuleId.value = row.ruleId; versionLoading.value = true; versionDialogVisible.value = true
  try { const { data } = await getRuleVersions(row.ruleId); versionList.value = (data as any) || [] } catch { versionList.value = [] } finally { versionLoading.value = false }
}
async function confirmRollback(row: any) {
  try { await ElMessageBox.confirm(`确定回退到版本 ${row.version} 吗？此操作将恢复该版本的规则参数。`, '确认回退', { type: 'warning' }) } catch { return }
  try { await rollbackVersion(versionRuleId.value!, row.id); ElMessage.success('回退成功'); versionDialogVisible.value = false } catch { ElMessage.error('回退失败') }
}

// 时间线
async function addTimelineEntry(row: any) {
  const remark = timelineRemarks[row.id]
  if (!remark?.trim()) return
  try {
    await addEventTimeline(row.id, { operator: row.assigneeName || '管理员', time: new Date().toLocaleString('zh-CN'), action: '补充备注', remark: remark.trim() })
    ElMessage.success('记录已添加'); timelineRemarks[row.id] = ''; await refreshAll()
  } catch { ElMessage.error('添加失败') }
}

async function refreshAll() { await Promise.all([loadStats(), loadEvents(), loadDisposalList(), loadFalseAlarmStats()]) }

onMounted(() => { refreshAll() })
</script>

<style lang="scss" scoped>
.alert-event-page { height: 100%; }
.event-tabs {
  height: 100%;
  :deep(.el-tabs__header) { margin-bottom: 12px; background: var(--el-bg-color); padding: 0 16px; }
  :deep(.el-tabs__content) { padding: 0 16px; }
}
.stats-row { display: flex; gap: 16px; margin-bottom: 12px; }
.stat-card { flex: 1; text-align: center; padding: 4px 0; }
.stat-value { font-size: 28px; font-weight: 700; line-height: 1.3; }
.stat-label { font-size: 13px; color: var(--el-text-color-secondary); margin-top: 2px; }
.stat-pending .stat-value { color: var(--el-color-danger); }
.stat-disposing .stat-value { color: var(--el-color-warning); }
.stat-closed .stat-value { color: var(--el-color-success); }
.stat-overdue .stat-value { color: #e6a23c; }
.stat-neutral .stat-value { color: var(--el-color-primary); }
.stat-warning .stat-value { color: var(--el-color-warning); }
.stat-danger .stat-value { color: var(--el-color-danger); }
.filter-card { margin-bottom: 12px; :deep(.el-card__body) { padding: 12px 16px; } }
.filter-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.filter-input { width: 200px; }
.filter-select { width: 140px; }
.filter-spacer { flex: 1; }
.table-card { :deep(.el-card__body) { padding: 16px; } }
.table-header { display: flex; align-items: center; margin-bottom: 12px; }
.table-title { font-weight: 600; font-size: 14px; }
.event-pagination { margin-top: 12px; display: flex; justify-content: center; }
.event-table, .disposal-table { :deep(.el-table__body tr) { cursor: pointer; } }
.status-flow { display: flex; align-items: center; gap: 4px; font-size: 12px; }
.flow-step { padding: 2px 6px; border-radius: 4px; background: var(--el-fill-color-light); color: var(--el-text-color-secondary); }
.flow-step.active { background: var(--el-color-primary-light-3); color: var(--el-color-primary); font-weight: 600; }
.flow-step.done { background: var(--el-color-success-light-3); color: var(--el-color-success); }
.flow-arrow { color: var(--el-text-color-placeholder); }
.timeline-panel { padding: 12px 16px; background: var(--el-fill-color-lighter); border-radius: 6px; }
.timeline-title { font-weight: 600; margin-bottom: 8px; font-size: 13px; }
.timeline-remark { color: var(--el-text-color-secondary); font-size: 12px; }
.timeline-add { display: flex; gap: 8px; margin-top: 8px; }
.timeline-input { flex: 1; }
.detail-timeline-title { font-weight: 600; margin: 16px 0 8px; font-size: 13px; }
.fa-table { :deep(.el-table__body tr) { cursor: default; } }
</style>
