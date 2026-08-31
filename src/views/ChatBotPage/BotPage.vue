<template>
  <div :class="$style.page">
    <ChatBotHead @openRecord="showRecord = true" />
    <div :class="$style.body" ref="bodyRef">
      <template v-for="(msg, i) in messages" :key="i">
        <ChattingBot v-if="msg.type === 'bot'" :message="msg.text" />
        <ChattingBotLink v-else-if="msg.type === 'bot-link'" :message="msg.text" :path="msg.path" @open="openClip(msg.clip)" />
        <ChattingPlus v-else-if="msg.type === 'user'" :message="msg.text" />
      </template>
    </div>
    <Chatting @send="onSend" />
  </div>
  <ClipDetail v-model="showClip" :clip="clipSrc" />
  <Record v-model="showRecord" />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChatBotHead from './Head.vue'
import Chatting from './Chatting.vue'
import ChattingPlus from './Plus.vue'
import ChattingBot from './Bot.vue'
import ChattingBotLink from './Link.vue'
import { useConversations } from '@/composables/useConversations'
import ClipDetail from '@/components/Media/ClipDetail.vue'
import Record from './Record.vue'
import { ROUTES } from '@/constants'

const route = useRoute()
const router = useRouter()
const { getById } = useConversations()

const loadMessages = () => {
  const id = route.query.id
  if (id) {
    const conv = getById(id)
    return conv ? [...conv.messages] : []
  }
  return []
}

const messages = ref(loadMessages())
const bodyRef = ref(null)

watch(() => route.query.id, () => {
  messages.value = loadMessages()
})
const showClip = ref(false)
const showRecord = ref(false)
const clipSrc = ref('')

const openClip = (clip) => {
  clipSrc.value = clip || ''
  showClip.value = true
}

function handleAndroidBack(event) {
  if (showClip.value) {
    event.preventDefault()
    showClip.value = false
    return
  }

  if (showRecord.value) {
    event.preventDefault()
    showRecord.value = false
    return
  }

  if (route.query.id) {
    event.preventDefault()
    router.replace(ROUTES.CHAT)
  }
}

const onSend = async (text) => {
  messages.value.push({ type: 'user', text })
  await nextTick()
  if (bodyRef.value) bodyRef.value.scrollTop = bodyRef.value.scrollHeight

  // API 연동 시 여기에 호출 추가
  // const res = await api.sendMessage(currentId, text)
  // messages.value.push({ type: 'bot', text: res.text })
  // if (res.path) messages.value.push({ type: 'bot-link', text: res.linkText, path: res.path })

}

onMounted(() => {
  window.addEventListener('wally:android-back', handleAndroidBack)
})

onBeforeUnmount(() => {
  window.removeEventListener('wally:android-back', handleAndroidBack)
})
</script>

<style module>
.page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--chat-page-bg);
  font-family: 'Malang', sans-serif;
  box-sizing: border-box;
}

.body {
  flex: 1;
  background-color: var(--chat-bg);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 1.6rem 0;
}
</style>
