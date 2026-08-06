// @ts-nocheck
/**
 * AI智能研判 Mock 数据（模拟AI引擎基座）
 * 算法服务、识别研判、对话助手、多源融合智能体数据均基于模块级变量持久化，
 * 数据在页面会话期间保持，页面刷新后重新初始化。
 */

function clone(source) {
  return JSON.parse(JSON.stringify(source))
}

function nowTime(offsetMinutes = 0) {
  const d = new Date('2026-08-06T10:30:00')
  d.setMinutes(d.getMinutes() + offsetMinutes)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ==================== 算法服务 ====================
const initialAlgorithmServices = [
  {
    id: 1,
    name: '船型识别-光电版',
    type: '船型识别',
    status: 'running',
    version: 'v2.1.0',
    versions: ['v1.9.0', 'v2.0.1', 'v2.1.0'],
    dataSources: ['光电'],
    authorizedDevices: ['东海1号光电', '舟山港光电', '南海1号光电'],
    metrics: { latency: 168, accuracy: 96.8, lastHeartbeat: nowTime(-2) },
    exception: null
  },
  {
    id: 2,
    name: '船型识别-雷达辅助版',
    type: '船型识别',
    status: 'abnormal',
    version: 'v1.8.2',
    versions: ['v1.8.0', 'v1.8.2'],
    dataSources: ['雷达', '光电'],
    authorizedDevices: ['东海雷达站', '东海1号光电'],
    metrics: { latency: 242, accuracy: 91.2, lastHeartbeat: nowTime(-18) },
    exception: {
      time: nowTime(-18),
      type: '心跳超时',
      description: '连续3个周期未收到服务心跳，识别请求超时',
      scope: '雷达辅助船型识别结果延迟',
      recovered: false
    }
  },
  {
    id: 3,
    name: '行为分析-作业模式',
    type: '行为分析',
    status: 'running',
    version: 'v3.0.0',
    versions: ['v2.6.0', 'v3.0.0'],
    dataSources: ['AIS', '雷达', '北斗'],
    authorizedDevices: ['东海雷达站', '舟山港光电'],
    metrics: { latency: 316, accuracy: 94.1, lastHeartbeat: nowTime(-1) },
    exception: null
  },
  {
    id: 4,
    name: '行为分析-异常绕行',
    type: '行为分析',
    status: 'running',
    version: 'v2.3.1',
    versions: ['v2.2.0', 'v2.3.1'],
    dataSources: ['AIS', '雷达'],
    authorizedDevices: ['东海雷达站'],
    metrics: { latency: 288, accuracy: 92.7, lastHeartbeat: nowTime(-1) },
    exception: null
  },
  {
    id: 5,
    name: '行为分析-频繁变向',
    type: '行为分析',
    status: 'running',
    version: 'v2.1.3',
    versions: ['v2.1.0', 'v2.1.3'],
    dataSources: ['AIS', '北斗'],
    authorizedDevices: ['东海雷达站', '舟山港光电'],
    metrics: { latency: 251, accuracy: 90.5, lastHeartbeat: nowTime(-3) },
    exception: null
  },
  {
    id: 6,
    name: '行为分析-接近重点目标',
    type: '行为分析',
    status: 'stopped',
    version: 'v1.7.4',
    versions: ['v1.7.0', 'v1.7.4'],
    dataSources: ['AIS', '雷达', '光电'],
    authorizedDevices: ['东海1号光电', '东海雷达站'],
    metrics: { latency: 0, accuracy: 0, lastHeartbeat: nowTime(-120) },
    exception: null
  },
  {
    id: 7,
    name: '多源融合推理',
    type: '融合推理',
    status: 'running',
    version: 'v1.2.0',
    versions: ['v1.1.0', 'v1.2.0'],
    dataSources: ['雷达', 'AIS', '北斗', '光电', '频谱', '气象'],
    authorizedDevices: ['东海雷达站', '东海1号光电', '舟山港光电', '东海1号无人机'],
    metrics: { latency: 425, accuracy: 95.3, lastHeartbeat: nowTime(-1) },
    exception: null
  },
  {
    id: 8,
    name: '风险评估-综合态势',
    type: '风险评估',
    status: 'running',
    version: 'v1.3.1',
    versions: ['v1.2.0', 'v1.3.0', 'v1.3.1'],
    dataSources: ['AIS', '雷达', '气象', '光电'],
    authorizedDevices: ['东海雷达站', '东海1号光电', '舟山港光电'],
    metrics: { latency: 358, accuracy: 93.6, lastHeartbeat: nowTime(-2) },
    exception: null
  },
  {
    id: 9,
    name: '事件推荐',
    type: '事件推荐',
    status: 'running',
    version: 'v1.1.2',
    versions: ['v1.0.3', 'v1.1.2'],
    dataSources: ['AIS', '雷达', '气象'],
    authorizedDevices: [],
    metrics: { latency: 196, accuracy: 89.6, lastHeartbeat: nowTime(-4) },
    exception: null
  }
]

let algorithmServices = clone(initialAlgorithmServices)

const availableDataSourceOptions = ['AIS', '雷达', '光电', '北斗', '频谱', '气象']
const availableDeviceOptions = ['东海雷达站', '东海1号光电', '舟山港光电', '南海1号光电', '东海1号无人机', '舟山港喊话器']
const serviceAvailabilityMap = { running: 99.8, abnormal: 86.4, stopped: 0, restarting: 0, switching: 99.2 }

// ==================== 船型识别 ====================
const initialShipDevices = [
  { id: 1, name: '东海1号光电', status: '在线', location: '东海作业区 01 号位' },
  { id: 2, name: '舟山港光电', status: '在线', location: '舟山港北航道' },
  { id: 3, name: '南海1号光电', status: '离线', location: '南海观测区 03 号位' }
]

const initialShipRecognition = [
  {
    id: 1,
    time: nowTime(-8),
    target: '浙普渔 12345',
    deviceId: 1,
    device: '东海1号光电',
    deviceOnline: true,
    shipType: '渔船',
    confidence: 96.2,
    reviewStatus: '已通过',
    reviewedBy: '系统',
    reviewTime: nowTime(-8),
    snapshot: {
      scene: '东海作业区 01 号位',
      cameraNo: '东海1号光电-02号机位',
      resolution: '1280x720',
      frameType: '船头侧视',
      brightness: '良好',
      zoom: '20 倍',
      box: { x: 48, y: 36, width: 22, height: 14 }
    }
  },
  {
    id: 2,
    time: nowTime(-23),
    target: '甬货 8806',
    deviceId: 2,
    device: '舟山港光电',
    deviceOnline: true,
    shipType: '货船',
    confidence: 88.7,
    reviewStatus: '已通过',
    reviewedBy: '系统',
    reviewTime: nowTime(-23),
    snapshot: {
      scene: '舟山港北航道',
      cameraNo: '舟山港光电-01号机位',
      resolution: '1920x1080',
      frameType: '舷侧视角',
      brightness: '良好',
      zoom: '15 倍',
      box: { x: 42, y: 42, width: 30, height: 13 }
    }
  },
  {
    id: 3,
    time: nowTime(-35),
    target: '快艇 B-108',
    deviceId: 1,
    device: '东海1号光电',
    deviceOnline: true,
    shipType: '快艇',
    confidence: 76.4,
    reviewStatus: '待复核',
    reviewedBy: null,
    reviewTime: null,
    snapshot: {
      scene: '东海作业区 04 号位',
      cameraNo: '东海1号光电-03号机位',
      resolution: '1280x720',
      frameType: '斜前方视角',
      brightness: '偏暗',
      zoom: '30 倍',
      box: { x: 52, y: 30, width: 18, height: 10 }
    }
  },
  {
    id: 4,
    time: nowTime(-52),
    target: '无标识橡皮艇 07',
    deviceId: 2,
    device: '舟山港光电',
    deviceOnline: true,
    shipType: '橡皮艇',
    confidence: 64.9,
    reviewStatus: '待复核',
    reviewedBy: null,
    reviewTime: null,
    snapshot: {
      scene: '舟山港内锚地',
      cameraNo: '舟山港光电-04号机位',
      resolution: '1280x720',
      frameType: '俯视视角',
      brightness: '一般',
      zoom: '25 倍',
      box: { x: 46, y: 52, width: 16, height: 9 }
    }
  },
  {
    id: 5,
    time: nowTime(-78),
    target: '东海观测船 201',
    deviceId: 3,
    device: '南海1号光电',
    deviceOnline: false,
    shipType: '客船',
    confidence: 91.3,
    reviewStatus: '已修改',
    reviewedBy: '张研',
    reviewTime: nowTime(-70),
    snapshot: {
      scene: '南海观测区 03 号位',
      cameraNo: '南海1号光电-01号机位',
      resolution: '1920x1080',
      frameType: '舷侧视角',
      brightness: '一般',
      zoom: '18 倍',
      box: { x: 38, y: 34, width: 32, height: 16 }
    }
  },
  {
    id: 6,
    time: nowTime(-96),
    target: '三无船 T-77',
    deviceId: 1,
    device: '东海1号光电',
    deviceOnline: true,
    shipType: '三无船',
    confidence: 82.5,
    reviewStatus: '已通过',
    reviewedBy: '系统',
    reviewTime: nowTime(-96),
    snapshot: {
      scene: '重点目标警戒区 2km',
      cameraNo: '东海1号光电-05号机位',
      resolution: '1280x720',
      frameType: '船头侧视',
      brightness: '良好',
      zoom: '22 倍',
      box: { x: 44, y: 38, width: 26, height: 12 }
    }
  }
]

let shipRecognition = clone(initialShipRecognition)
let shipDevices = clone(initialShipDevices)

// ==================== 行为分析 ====================
const initialBehaviorAnalysis = [
  {
    id: 1,
    time: nowTime(-12),
    target: '浙普渔 12345',
    workMode: '捕捞作业',
    abnormalType: '作业模式异常',
    severity: '高',
    evidence: [
      { source: 'AIS', time: nowTime(-14), value: '航速 2.3kn，航向 47°', step: 'AIS轨迹持续低速折返，符合捕捞作业特征' },
      { source: '雷达', time: nowTime(-13), value: '目标 RCS 波动 1.8dB', step: '雷达回波波动提示拖网设备展开' },
      { source: '光电', time: nowTime(-12), value: '识别船型：渔船', step: '光电识别结果与AIS轨迹一致' }
    ]
  },
  {
    id: 2,
    time: nowTime(-26),
    target: '快艇 B-108',
    workMode: '运输航行',
    abnormalType: '异常绕行',
    severity: '中',
    evidence: [
      { source: 'AIS', time: nowTime(-28), value: '绕行距离 4.2km', step: '目标偏离主航道绕行' },
      { source: '雷达', time: nowTime(-26), value: '连续 6 分钟位于绕行弧线', step: '轨迹形状与禁航区边界平行' }
    ]
  },
  {
    id: 3,
    time: nowTime(-41),
    target: '无标识橡皮艇 07',
    workMode: '游弋停泊',
    abnormalType: '频繁变向',
    severity: '中',
    evidence: [
      { source: '雷达', time: nowTime(-43), value: '10分钟内变向 7 次', step: '变向频率超过阈值' },
      { source: '北斗', time: nowTime(-41), value: '航向变化 128°', step: '航向跳变幅度异常' }
    ]
  },
  {
    id: 4,
    time: nowTime(-55),
    target: '三无船 T-77',
    workMode: '运输航行',
    abnormalType: '接近重点目标',
    severity: '高',
    evidence: [
      { source: 'AIS', time: nowTime(-58), value: '距离重点目标 1.6km', step: '进入重点目标警戒范围' },
      { source: '光电', time: nowTime(-55), value: '识别船型：三无船', step: '无有效身份标识' }
    ]
  },
  {
    id: 5,
    time: nowTime(-70),
    target: '甬货 8806',
    workMode: '运输航行',
    abnormalType: '作业模式异常',
    severity: '低',
    evidence: [
      { source: 'AIS', time: nowTime(-72), value: '货船航速 8.4kn', step: '常规航行，未发现明显异常' },
      { source: '气象', time: nowTime(-70), value: '阵风 9级', step: '恶劣天气下航向偏移概率上升' }
    ]
  }
]

let behaviorAnalysis = clone(initialBehaviorAnalysis)

// ==================== AI助手 ====================
const initialAssistant = {
  welcome: '您好，我是 AI 研判助手，可以查询目标、告警、区域与操作指引。',
  recommendQuestions: [
    '查询目标“浙普渔 12345”的位置',
    '今天有哪些紧急告警',
    '东海区域当前的管控范围',
    '如何派发告警事件',
    '对告警“A20260806001”辅助研判',
    '哪些目标接近重点区域'
  ],
  messages: []
}

let assistant = clone(initialAssistant)

const assistantTargets = [
  { name: '浙普渔 12345', position: [29.9312, 122.1041], status: '关注', sources: 'AIS+雷达+光电' },
  { name: '快艇 B-108', position: [29.8876, 122.0553], status: '异常', sources: '雷达+光电' },
  { name: '三无船 T-77', position: [29.9021, 121.9874], status: '异常', sources: 'AIS+雷达' },
  { name: '无标识橡皮艇 07', position: [30.0142, 122.1378], status: '关注', sources: '光电+雷达' },
  { name: '甬货 8806', position: [29.9541, 122.1583], status: '正常', sources: 'AIS' },
  { name: '东海观测船 201', position: [30.0821, 122.2374], status: '正常', sources: 'AIS+北斗' }
]

const initialAssistantAlarms = [
  { alarmNo: 'A20260806001', type: '异常绕行', target: '快艇 B-108', level: '紧急', time: nowTime(-55), status: '处置中' },
  { alarmNo: 'A20260806002', type: '接近重点目标', target: '三无船 T-77', level: '紧急', time: nowTime(-70), status: '待处置' },
  { alarmNo: 'A20260806003', type: '频繁变向', target: '无标识橡皮艇 07', level: '重要', time: nowTime(-23), status: '待处置' },
  { alarmNo: 'A20260806004', type: '作业模式异常', target: '浙普渔 12345', level: '重要', time: nowTime(-12), status: '待派发' },
  { alarmNo: 'A20260806005', type: '船型识别', target: '甬货 8806', level: '一般', time: nowTime(-8), status: '已归档' }
]
let assistantAlarms = clone(initialAssistantAlarms)

const assistantAreas = [
  { name: '东海作业区', code: 'AREA-DH01', center: [29.93, 122.12], status: '管控中' },
  { name: '舟山港北航道', code: 'AREA-ZS02', center: [29.96, 122.06], status: '管控中' },
  { name: '南海观测区', code: 'AREA-NH03', center: [30.08, 122.24], status: '常规' },
  { name: '重点目标警戒区', code: 'AREA-JD04', center: [29.9, 121.99], status: '重点管控' }
]

const assistantGuideMap = {
  告警: {
    title: '告警事件处置指引',
    steps: ['进入预警事件-事件闭环管理', '按级别与时间筛选目标告警', '查看研判材料并派发处置人员', '跟踪处置进度并归档'],
    path: '/alert/event'
  },
  派发: {
    title: '事件派发指引',
    steps: ['选择待派发事件', '指定处置人员与期限', '确认派发并通知', '跟踪处置结果'],
    path: '/alert/event'
  },
  光电: {
    title: '光电联动指引',
    steps: ['进入设备联动-光电联动', '选择在线光电设备', '云台锁定目标并核验', '截图或录像留痕'],
    path: '/device/optics'
  },
  无人机: {
    title: '无人机调度指引',
    steps: ['进入设备联动-无人机联动', '规划航线并校验续航', '下发任务执行', '查看任务记录'],
    path: '/device/uav'
  },
  雷达: {
    title: '雷达监测指引',
    steps: ['进入设备联动-雷达监测', '选择雷达站', '查看PPI回波与目标', '调节量程与增益'],
    path: '/device/radar'
  },
  默认: {
    title: 'AI智能研判操作指引',
    steps: ['进入AI智能研判-算法中台', '查看算法服务运行状态', '在AI助手提问或辅助研判', '在多源融合智能体查看四层流水线'],
    path: '/ai/algorithm'
  }
}

const initialAssistantAssist = {
  eventNo: 'A20260806001',
  target: '快艇 B-108',
  summary: 'A20260806001 快艇 B-108 异常绕行',
  conclusion: '目标偏离主航道并沿禁航区边界绕行，高度疑似异常行为，建议联动核验。',
  sources: ['AIS', '雷达'],
  suggestions: ['启动光电核验并抓拍', '通知值班艇附近巡航', '关联规则事件进入处置']
}
let assistantAssist = clone(initialAssistantAssist)

let assistantFeedbackList = []
let assistantFeedbackSeq = 0
let assistantIntent = ''

const assistantIntentHints = [
  { intent: 'target', keywords: ['目标', '位置', '在哪', '哪里', '接近重点区域', '浙普渔', '快艇', '三无船', '橡皮艇', '甬货', '观测船'], continuation: ['它', '这艘', '该目标', '还有'] },
  { intent: 'alarm', keywords: ['告警', '报警', '紧急事件', '紧急告警'], continuation: ['还有', '处置中', '待处置'] },
  { intent: 'area', keywords: ['区域', '管控范围', '范围', '警戒区', '作业区'], continuation: ['范围', '区域'] },
  { intent: 'guide', keywords: ['如何', '怎么', '操作', '指引', '步骤', '流程', '跳转'], continuation: ['继续', '下一步'] },
  { intent: 'assist', keywords: ['研判', '分析', '结论', '建议', '核实', '辅助'], continuation: ['为什么', '依据', '证据'] },
  { intent: 'feedback', keywords: ['反馈', '误报', '漏报'], continuation: [] }
]

function resolveAssistantIntent(question) {
  const normalized = question.toLowerCase()
  const isContinuation = /^(它|他|那|这|还有|继续|然后|详细|再|为什么|依据|证据)/.test(normalized)
  if (isContinuation && assistantIntent) return assistantIntent
  for (const hint of assistantIntentHints) {
    const hit = hint.keywords.some((k) => normalized.includes(k))
    if (hit) return hint.intent
  }
  return 'unknown'
}

function filterAssistantTargets(question, intent) {
  if (intent !== 'target') return []
  const normalized = question
  const keyword = assistantTargets.find((t) => normalized.includes(t.name))
  if (keyword) return [keyword]
  if (normalized.includes('重点区域') || normalized.includes('接近')) {
    return assistantTargets.filter((t) => t.status !== '正常')
  }
  return assistantTargets
}

function filterAssistantAlarms(question) {
  const normalized = question
  const levelMap = { 紧急: '紧急', 重要: '重要', 一般: '一般' }
  const matchedLevel = Object.keys(levelMap).find((level) => normalized.includes(level))
  let list = clone(assistantAlarms)
  if (matchedLevel) list = list.filter((a) => a.level === matchedLevel)
  if (normalized.includes('处置中')) list = list.filter((a) => a.status === '处置中')
  if (normalized.includes('待处置')) list = list.filter((a) => a.status === '待处置')
  list.sort((a, b) => (a.time < b.time ? 1 : -1))
  return list
}

function filterAssistantAreas(question) {
  const normalized = question
  const matched = assistantAreas.filter((a) => normalized.includes(a.name) || normalized.includes(a.code))
  return matched.length ? matched : assistantAreas
}

function matchAssistantGuide(question) {
  const normalized = question
  const key = Object.keys(assistantGuideMap).find((k) => k !== '默认' && normalized.includes(k))
  return assistantGuideMap[key || '默认']
}

function buildAssistantReply(question, intent) {
  const sections = []
  const data = {}
  if (intent === 'target') {
    const targets = filterAssistantTargets(question, intent)
    if (!targets.length) return { intent, sections: [], data: {}, content: '未找到相关结果，请尝试输入完整目标名称。' }
    sections.push({ key: 'targets', title: '目标查询' })
    data.targets = targets
    return { intent, sections, data, content: `已查询到 ${targets.length} 个目标，地图点位与列表已同步展示。` }
  }
  if (intent === 'alarm') {
    const alarms = filterAssistantAlarms(question)
    if (!alarms.length) return { intent, sections: [], data: {}, content: '未找到相关结果，请调整查询条件后重试。' }
    sections.push({ key: 'alarms', title: '告警查询' })
    data.alarms = alarms
    const distribution = ['紧急', '重要', '一般', '提示'].map((level) => ({
      level,
      count: assistantAlarms.filter((a) => a.level === level).length
    }))
    data.alarmDistribution = distribution
    return { intent, sections, data, content: `已查询到 ${alarms.length} 条告警，等级分布已同步展示。` }
  }
  if (intent === 'area') {
    const areas = filterAssistantAreas(question)
    if (!areas.length) return { intent, sections: [], data: {}, content: '未找到相关区域。' }
    sections.push({ key: 'areas', title: '区域查询' })
    data.areas = areas
    return { intent, sections, data, content: `已匹配 ${areas.length} 个区域，地图已高亮显示。` }
  }
  if (intent === 'guide') {
    sections.push({ key: 'guide', title: '操作指引' })
    data.guide = matchAssistantGuide(question)
    return { intent, sections, data, content: `已生成“${data.guide.title}”操作指引，可按步骤执行或快捷跳转。` }
  }
  if (intent === 'assist') {
    sections.push({ key: 'assist', title: '辅助研判' })
    data.assist = clone(assistantAssist)
    return { intent, sections, data, content: `已生成“${assistantAssist.target}”辅助研判结论，数据来源与处置建议已展示。` }
  }
  if (intent === 'feedback') {
    sections.push({ key: 'feedback', title: '误报/漏报反馈' })
    data.feedback = { target: assistantAssist.target, alarmNo: assistantAssist.eventNo }
    return { intent, sections, data, content: '您可以提交误报/漏报反馈，反馈记录将进入误报治理。' }
  }
  return { intent, sections: [], data: {}, content: '未理解您的问题，请换一种说法或使用推荐问题。' }
}

export const sendAssistantMessageMock = (content) => {
  if (!content || !content.trim()) return { error: '请输入问题' }
  const question = content.trim()
  const intent = resolveAssistantIntent(question)
  assistantIntent = intent
  const userMessage = { role: 'user', content: question, time: nowTime(0) }
  assistant.messages.push(userMessage)
  const reply = buildAssistantReply(question, intent)
  const answerMessage = {
    role: 'assistant',
    content: reply.content,
    intent,
    sections: reply.sections,
    data: reply.data,
    time: nowTime(0)
  }
  assistant.messages.push(answerMessage)
  return {
    messages: clone(assistant.messages),
    last: clone(answerMessage)
  }
}

export const submitAssistantFeedbackMock = (data = {}) => {
  if (!data.type) return { error: '请选择反馈类型' }
  if (!Array.isArray(data.reasons) || !data.reasons.length) return { error: '请选择反馈原因' }
  if (data.reasons.some((r) => !['天气干扰', '算法误判', '参数不当', '其他'].includes(r))) return { error: '反馈原因不合法' }
  if ((data.description || '').length > 200) return { error: '样本说明不能超过200字' }
  const duplicated = assistantFeedbackList.some(
    (f) => f.target === data.target && f.alarmNo === data.alarmNo && f.type === data.type
  )
  if (duplicated) return { error: '该样本已提交反馈' }
  assistantFeedbackSeq += 1
  const feedback = {
    id: assistantFeedbackSeq,
    target: data.target || assistantAssist.target,
    alarmNo: data.alarmNo || assistantAssist.eventNo,
    type: data.type,
    reasons: data.reasons,
    description: data.description || '',
    status: '待受理',
    time: nowTime(0)
  }
  assistantFeedbackList.unshift(feedback)
  return { success: true, feedback: clone(feedback) }
}

export const getAssistantFeedbackListMock = () => clone(assistantFeedbackList)

// ==================== 多源融合智能体 ====================
const initialMifa = {
  running: true,
  sources: [
    { name: '雷达', status: '在线', dataCount: 1286, alignRate: 98.6, stdRate: 99.2, updateTime: nowTime(-1) },
    { name: 'AIS', status: '在线', dataCount: 934, alignRate: 99.2, stdRate: 99.8, updateTime: nowTime(-1) },
    { name: '北斗', status: '在线', dataCount: 412, alignRate: 97.8, stdRate: 98.5, updateTime: nowTime(-2) },
    { name: '光电', status: '在线', dataCount: 168, alignRate: 96.4, stdRate: 97.1, updateTime: nowTime(-1) },
    { name: '频谱', status: '异常', dataCount: 57, alignRate: 88.1, stdRate: 92.6, updateTime: nowTime(-12) },
    { name: '气象', status: '在线', dataCount: 89, alignRate: 99.5, stdRate: 100, updateTime: nowTime(-3) }
  ],
  fusionTargets: [
    { id: 1, name: '浙普渔 12345', sources: 'AIS+雷达+光电', result: '已确认', position: '122.1041, 29.9312' },
    { id: 2, name: '快艇 B-108', sources: '雷达+光电', result: '待确认', position: '122.0553, 29.8876' },
    { id: 3, name: '三无船 T-77', sources: 'AIS+雷达', result: '已确认', position: '121.9874, 29.9021' },
    { id: 4, name: '无标识橡皮艇 07', sources: '光电+雷达', result: '待确认', position: '122.1378, 30.0142' }
  ],
  inferenceResults: [
    {
      id: 1,
      time: nowTime(-12),
      target: '浙普渔 12345',
      abnormalType: '作业模式异常',
      severity: '高',
      scope: '东海作业区 5km 范围',
      basis: 'AIS轨迹偏离正常作业区，叠加雷达作业回波交叉验证'
    },
    {
      id: 2,
      time: nowTime(-55),
      target: '三无船 T-77',
      abnormalType: '接近重点目标',
      severity: '高',
      scope: '重点目标警戒区 2km',
      basis: 'AIS位置与重点目标警戒区空间关系交叉识别'
    }
  ],
  linkActions: [
    { id: 1, action: '光电核验', device: '东海1号光电', trigger: '作业模式异常 · 浙普渔 12345', status: '成功', result: '作业模式复核通过', time: nowTime(-22) },
    { id: 2, action: '无人机调度', device: '东海1号无人机', trigger: '接近重点目标 · 三无船 T-77', status: '执行中', result: '正在前往目标区域巡查', time: nowTime(-1) },
    { id: 3, action: '喊话联动', device: '舟山港喊话器', trigger: '接近重点目标 · 三无船 T-77', status: '失败', result: '设备离线，喊话发送失败', time: nowTime(-18) },
    { id: 4, action: '光电核验', device: '舟山港光电', trigger: '接近重点目标 · 三无船 T-77', status: '待执行', result: '-', time: null }
  ]
}

let mifa = clone(initialMifa)

// ==================== 引擎心跳 ====================
let engineTicks = 0
let mifaTicks = 0

// ==================== Mock 处理函数 ====================
export const getAiEngineOverviewMock = () => {
  engineTicks += 1
  const runningCount = algorithmServices.filter((s) => s.status === 'running').length
  const abnormalCount = algorithmServices.filter((s) => s.status === 'abnormal').length
  return {
    serviceTotal: algorithmServices.length,
    running: runningCount,
    abnormal: abnormalCount,
    stopped: algorithmServices.length - runningCount - abnormalCount,
    todayCalls: 2864 + engineTicks,
    avgLatency: 273,
    avgAccuracy: 93.4,
    updatedAt: nowTime(0)
  }
}

export const getAlgorithmServiceListMock = (params = {}) => {
  let list = clone(algorithmServices)
  list = list.map((s) => ({
    ...s,
    metrics: { ...s.metrics, availability: serviceAvailabilityMap[s.status] ?? 99 }
  }))
  if (params.name) list = list.filter((s) => s.name.includes(params.name))
  if (params.type && params.type !== '全部') list = list.filter((s) => s.type === params.type)
  if (params.status && params.status !== '全部') list = list.filter((s) => s.status === params.status)
  const page = Number(params.page || 1)
  const pageSize = Number(params.pageSize || 10)
  return { list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length }
}

export const getAlgorithmServiceDetailMock = (id) => {
  const service = algorithmServices.find((s) => s.id === id)
  if (!service) return null
  const typeMap = {
    船型识别: '光电设备',
    行为分析: '轨迹数据',
    风险评估: '综合风险数据',
    融合推理: '多源数据',
    事件推荐: '事件数据'
  }
  const deviceTypeMap = { 光电: '光电设备', 雷达: '雷达设备', 无人机: '无人机' }
  const dataSourceConfig = service.dataSources.map((source, idx) => ({
    type: source,
    accessStatus: idx === 1 && service.status === 'abnormal' ? '异常' : '正常',
    updateFrequency: source === 'AIS' ? '1 秒' : source === '气象' ? '10 分钟' : '3 秒'
  }))
  const authorizedDeviceList = service.authorizedDevices.map((name) => ({
    name,
    type: deviceTypeMap[name.includes('光电') ? '光电' : name.includes('雷达') ? '雷达' : '无人机'] || '接入设备',
    accessStatus: service.status === 'abnormal' && name.includes('雷达') ? '异常' : '正常'
  }))
  const trend = Array.from({ length: 12 }, (_, i) => ({
    time: nowTime(-60 + i * 5),
    calls: 180 + Math.round(Math.sin(i / 2) * 60 + i * 7),
    successRate: Number((service.metrics.accuracy - Math.abs(Math.sin(i / 3)) * 4).toFixed(1)),
    latency: Math.max(80, Math.round(service.metrics.latency + Math.sin(i / 2.5) * 80))
  }))
  return clone({
    ...service,
    metrics: { ...service.metrics, availability: serviceAvailabilityMap[service.status] ?? 99 },
    dataSourceConfig,
    authorizedDeviceList,
    availableDataSources: availableDataSourceOptions,
    availableDevices: availableDeviceOptions,
    trend
  })
}

export const updateAlgorithmServiceConfigMock = (id, data = {}) => {
  const service = algorithmServices.find((s) => s.id === id)
  if (!service) return { error: '算法服务不存在' }
  if (!Array.isArray(data.dataSources) || !Array.isArray(data.authorizedDevices)) {
    return { error: '数据源与授权设备格式不正确' }
  }
  service.dataSources = [...data.dataSources]
  service.authorizedDevices = [...data.authorizedDevices]
  return { success: true, state: clone(service) }
}

export const restartAlgorithmServiceMock = (id) => {
  const service = algorithmServices.find((s) => s.id === id)
  if (!service) return { error: '算法服务不存在' }
  if (service.status === 'restarting' || service.status === 'switching') return { error: '服务正在处理中，请稍后再试' }
  service.status = 'restarting'
  service.metrics.lastHeartbeat = nowTime(0)
  setTimeout(() => {
    service.status = 'running'
    service.exception = null
  }, 1500)
  return { success: true, state: clone(service) }
}

export const switchAlgorithmVersionMock = (id, version, reason = '') => {
  const service = algorithmServices.find((s) => s.id === id)
  if (!service) return { error: '算法服务不存在' }
  if (!service.versions.includes(version)) return { error: '目标版本不可用' }
  if (service.status === 'restarting' || service.status === 'switching') return { error: '版本切换中，请稍后再试' }
  if (reason.trim().length < 2) return { error: '切换原因不能少于2个字' }
  service.prevStatus = service.status
  service.status = 'switching'
  service.switchReason = reason
  setTimeout(() => {
    service.status = service.prevStatus || 'running'
    service.version = version
    service.switchReason = undefined
    service.prevStatus = undefined
    service.metrics.lastHeartbeat = nowTime(0)
  }, 900)
  return { success: true, state: clone(service) }
}

export const getShipRecognitionListMock = (params = {}) => {
  let list = clone(shipRecognition)
  if (params.deviceId) list = list.filter((s) => s.deviceId === Number(params.deviceId))
  if (params.deviceStatus && params.deviceStatus !== '全部') {
    const online = params.deviceStatus === '在线'
    list = list.filter((s) => s.deviceOnline === online)
  }
  if (params.startTime && params.endTime) {
    list = list.filter((s) => s.time.slice(0, 10) >= params.startTime && s.time.slice(0, 10) <= params.endTime)
  }
  if (params.reviewStatus && params.reviewStatus !== '全部') list = list.filter((s) => s.reviewStatus === params.reviewStatus)
  list.sort((a, b) => (a.time < b.time ? 1 : -1))
  const page = Number(params.page || 1)
  const pageSize = Number(params.pageSize || 10)
  return { list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length }
}

export const getShipDevicesMock = () => clone(shipDevices)

export const getShipRecognitionDetailMock = (id) => {
  const record = shipRecognition.find((s) => s.id === id)
  return record ? clone(record) : null
}

export const reviewShipRecognitionMock = (id, data = {}) => {
  const record = shipRecognition.find((s) => s.id === id)
  if (!record) return { error: '识别结果不存在' }
  if (!data.shipType) return { error: '请选择识别船型' }
  if (!['确认无误', '修改船型'].includes(data.conclusion)) return { error: '请选择复核结论' }
  const modified = data.conclusion === '修改船型'
  record.shipType = data.shipType
  record.reviewStatus = modified ? '已修改' : '已通过'
  record.reviewedBy = data.operator || '值班员'
  record.reviewTime = nowTime(0)
  record.reviewNote = data.note || ''
  return { success: true, record: clone(record) }
}

export const getBehaviorAnalysisListMock = (params = {}) => {
  let list = clone(behaviorAnalysis)
  if (params.abnormalType && params.abnormalType !== '全部') list = list.filter((s) => s.abnormalType === params.abnormalType)
  if (params.severity && params.severity !== '全部') list = list.filter((s) => s.severity === params.severity)
  if (params.target) list = list.filter((s) => s.target.includes(params.target))
  list.sort((a, b) => (a.time < b.time ? 1 : -1))
  const page = Number(params.page || 1)
  const pageSize = Number(params.pageSize || 10)
  return { list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length }
}

export const getAssistantMock = () => clone(assistant)

export const getMifaPipelineMock = () => {
  if (mifa.running) mifaTicks += 1
  if (mifaTicks > 0 && mifaTicks % 3 === 0) {
    mifa.sources.forEach((s) => {
      if (s.status !== '异常') s.dataCount += Math.floor(Math.random() * 12)
    })
    const pending = mifa.linkActions.find((a) => a.status === '待执行')
    if (pending) {
      pending.status = '执行中'
      pending.result = '已下发联动指令'
      pending.time = nowTime(0)
    }
  }
  if (mifaTicks > 0 && mifaTicks % 6 === 0) {
    const executing = mifa.linkActions.find((a) => a.status === '执行中')
    if (executing) {
      executing.status = '成功'
      executing.result = '核验完成，结果已回填推理层'
      executing.time = nowTime(0)
    }
  }
  return clone(mifa)
}

export const setMifaRunningMock = (running) => {
  mifa.running = !!running
  if (running) mifaTicks = 0
  return { success: true, state: clone(mifa) }
}

const confirmMifaChainMap = {
  2: {
    inference: {
      target: '快艇 B-108',
      abnormalType: '异常绕行',
      severity: '中',
      scope: '舟山港航道附近',
      basis: '雷达回波绕行轨迹与AIS航向偏差交叉识别'
    },
    link: {
      action: '光电核验',
      device: '东海1号光电',
      trigger: '异常绕行 · 快艇 B-108',
      status: '执行中',
      result: '已自动下发光电核验指令'
    }
  },
  4: {
    inference: {
      target: '无标识橡皮艇 07',
      abnormalType: '频繁变向',
      severity: '中',
      scope: '重点目标警戒区附近',
      basis: 'AIS航向频繁变化与雷达回波轨迹交叉识别'
    },
    link: {
      action: '无人机调度',
      device: '东海1号无人机',
      trigger: '频繁变向 · 无标识橡皮艇 07',
      status: '执行中',
      result: '已自动下发无人机巡查指令'
    }
  }
}

export const confirmMifaTargetMock = (id) => {
  const target = mifa.fusionTargets.find((t) => t.id === id)
  if (!target) return { error: '融合目标不存在' }
  if (target.result === '已确认') return { error: '该目标已确认' }
  target.result = '已确认'
  const chain = confirmMifaChainMap[id]
  if (!chain) return { success: true, target: clone(target) }
  const inference = { ...chain.inference, time: nowTime(0) }
  const existingInference = mifa.inferenceResults.find(
    (r) => r.target === target.name && r.abnormalType === inference.abnormalType
  )
  const inferenceRecord = existingInference || { id: mifa.inferenceResults.reduce((max, item) => Math.max(max, item.id), 0) + 1, ...inference }
  if (!existingInference) mifa.inferenceResults.unshift(inferenceRecord)
  const link = { ...chain.link, time: nowTime(0) }
  const existingLink = mifa.linkActions.find(
    (a) => a.action === link.action && a.device === link.device && a.trigger === link.trigger
  )
  const linkRecord = existingLink || { id: mifa.linkActions.reduce((max, item) => Math.max(max, item.id), 0) + 1, ...link }
  if (!existingLink) mifa.linkActions.unshift(linkRecord)
  return {
    success: true,
    target: clone(target),
    chain: {
      inference: clone(inferenceRecord),
      link: clone(linkRecord)
    }
  }
}

export const retryMifaLinkMock = (id) => {
  const action = mifa.linkActions.find((a) => a.id === id)
  if (!action) return { error: '联动动作不存在' }
  if (action.status === '成功') return { error: '该联动已执行成功' }
  if (action.status === '执行中') return { error: '联动执行中，请稍后再试' }
  action.status = '执行中'
  action.result = '正在重新下发联动指令'
  action.time = nowTime(0)
  setTimeout(() => {
    action.status = '成功'
    action.result = '联动复核完成，结果已回填'
  }, 1200)
  return { success: true, action: clone(action) }
}
