<template>
  <div class="ai-assistant-page">
    <ElCard shadow="never" class="recommend-card annot-ai-assistant-recommend">
      <div class="card-title">推荐问题</div>
      <div class="recommend-list">
        <ElButton
          v-for="q in recommendQuestions"
          :key="q"
          text
          type="primary"
          class="recommend-item"
          @click="sendRecommend(q)"
        >
          {{ q }}
        </ElButton>
      </div>
    </ElCard>

    <div class="assistant-main">
      <ElCard shadow="never" class="chat-card">
        <div ref="chatBodyRef" v-loading="sending" class="chat-body annot-ai-assistant-chat">
          <div v-if="!messages.length" class="chat-message assistant">
            <div class="message-avatar"><el-icon :size="16"><MagicStick /></el-icon></div>
            <div class="message-content">{{ aiStore.assistant?.welcome || '您好，我是 AI 研判助手，可以查询目标、告警、区域与操作指引。' }}</div>
          </div>
          <div v-for="(msg, index) in messages" :key="index" class="chat-message" :class="msg.role">
            <div class="message-avatar" :class="msg.role">
              <el-icon :size="16"><component :is="msg.role === 'assistant' ? MagicStick : User" /></el-icon>
            </div>
            <div class="message-main">
              <div class="message-content">
                <div>{{ msg.content }}</div>
                <div v-if="msg.role === 'assistant' && msg.sections?.length" class="message-tags">
                  <ElTag v-for="s in msg.sections" :key="s.key" size="small" effect="plain" type="primary">{{ s.title }}</ElTag>
                </div>
              </div>
              <AssistantResult
                v-if="msg.role === 'assistant' && msg.sections?.length"
                :message="msg"
                class="message-result"
                @guide="goGuide"
                @feedback="openFeedback"
              />
            </div>
          </div>
        </div>
        <div class="chat-input annot-ai-assistant-input">
          <ElInput
            v-model="question"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit
            placeholder="请输入您的问题"
            resize="none"
            @keydown.enter.prevent="sendQuestion"
          />
          <ElButton type="primary" :icon="Promotion" :loading="sending" @click="sendQuestion">发送</ElButton>
        </div>
      </ElCard>

    </div>

    <FeedbackDialog
      v-model:visible="feedbackVisible"
      :target="feedbackTarget"
      :alarm-no="feedbackAlarmNo"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { MagicStick, Promotion, User } from '@element-plus/icons-vue'
import { useAiStore } from '@/store/modules/ai'
import AssistantResult from './components/AssistantResult.vue'
import FeedbackDialog from './components/FeedbackDialog.vue'

/**
 * AI智能研判-对话助手
 * 自然语言查询与辅助研判，结构化结果直接展示在对应回复下方
 */
defineOptions({ name: 'AiAssistant' })

const router = useRouter()
const aiStore = useAiStore()
const question = ref('')
const sending = ref(false)
const chatBodyRef = ref<HTMLElement>()
const messages = ref<any[]>([])
const feedbackVisible = ref(false)
const feedbackTarget = ref('')
const feedbackAlarmNo = ref('')

const recommendQuestions = computed(() => aiStore.assistant?.recommendQuestions || [])

function sendRecommend(q: string) {
  question.value = q
  sendQuestion()
}

async function sendQuestion() {
  const content = question.value.trim()
  if (!content) {
    ElMessage.warning('请输入问题')
    return
  }
  question.value = ''
  sending.value = true
  try {
    const result: any = await aiStore.sendAssistantMessageRecord(content)
    if (result?.error) {
      ElMessage.error(result.error)
      return
    }
    messages.value = result.messages || []
    nextTick(() => scrollToBottom())
  } finally {
    sending.value = false
  }
}

function scrollToBottom() {
  if (chatBodyRef.value) chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
}

function goGuide(path?: string) {
  if (path) router.push(path)
}

function openFeedback(payload: { target: string; alarmNo: string }) {
  feedbackTarget.value = payload.target || ''
  feedbackAlarmNo.value = payload.alarmNo || ''
  feedbackVisible.value = true
}

onMounted(async () => {
  await aiStore.loadAssistant()
  messages.value = aiStore.assistant?.messages || []
})
</script>

<style lang="scss" scoped>
.ai-assistant-page {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: 12px;
  height: 100%;
  min-height: 0;
}
.recommend-card,
.chat-card {
  :deep(.el-card__body) {
    padding: 16px;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
}
.recommend-card :deep(.el-card__body) {
  height: 100%;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
  flex: none;
}
.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: auto;
}
.recommend-item {
  justify-content: flex-start;
  padding: 0;
  height: auto;
  line-height: 1.5;
  white-space: normal;
  text-align: left;
}
.assistant-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-width: 0;
  min-height: 0;
}
.chat-card {
  flex: 1;
  min-height: 0;
  min-width: 0;
}
.chat-body {
  flex: 1;
  overflow: auto;
  min-height: 0;
}
.chat-message {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  min-width: 0;
}
.chat-message.user {
  flex-direction: row-reverse;
}
.message-avatar {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: var(--el-color-primary);
}
.message-avatar.user {
  background: var(--el-color-success);
}
.message-main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}
.chat-message.user .message-main {
  align-items: flex-end;
}
.message-content {
  max-width: 72%;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.6;
}
.chat-message.user .message-content {
  background: var(--el-color-primary-light-9);
}
.message-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.message-result {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
  background: var(--el-fill-color-blank);
  overflow: hidden;
}
.chat-input {
  flex: none;
  display: flex;
  gap: 10px;
  align-items: flex-end;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 12px;
  :deep(.el-textarea) {
    flex: 1;
  }
}
</style>
