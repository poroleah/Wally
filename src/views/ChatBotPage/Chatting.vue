<template>
  <div :class="$style.chatting">
    <div :class="$style.chatSending">
      <input :class="$style.content" v-model="inputText" @keyup.enter="onClick" placeholder="메세지를 입력하세요." />
    </div>
    <div :class="$style.chatbotSend" @pointerdown="onClick">
      <div :class="[isActive ? $style.chatbotSendActive : $style.chatbotSendChild]" />
      <span :class="[$style.iconSend, isActive ? $style.iconSendActive : '']" aria-hidden="true" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['send'])
const inputText = ref('')
const isActive = ref(false)

const onClick = () => {
  if (!inputText.value.trim()) return
  isActive.value = true
  emit('send', inputText.value)
  inputText.value = ''
  setTimeout(() => { isActive.value = false }, 300)
}
</script>

<style module>

.chatting {
  width: 100%;
  height: 8rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0 2rem;
  background-color: var(--chat-bg);
  font-size: 1.2rem;
  color: var(--chat-text);
  font-family: 'Malang', sans-serif;
}

.chatSending {
  flex: 1;
  height: 3.2rem;
  box-shadow: var(--chat-input-shadow);
  border-radius: 1rem;
  background-color: var(--chat-surface);
  display: flex;
  align-items: center;
  padding: 0 0.8rem;
  overflow: hidden;
}

.content {
  width: 100%;
  height: 3.2rem;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1.2rem;
  font-family: 'Malang', sans-serif;
  color: var(--chat-text);
}

.content::placeholder {
  color: var(--chat-muted);
}

.chatbotSend {
  flex-shrink: 0;
  position: relative;
  width: 3.2rem;
  height: 3.2rem;
}

.chatbotSendChild {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  background-color: var(--chat-surface);
  box-shadow: inset 0 0 0 0.06rem var(--chat-border), var(--chat-shadow);
  width: 3.2rem;
  height: 3.2rem;
}

.chatbotSendActive {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  background-color: var(--chat-accent);
  box-shadow: var(--chat-shadow);
  width: 3.2rem;
  height: 3.2rem;
}

.iconSend {
  position: absolute;
  top: 0.4rem;
  left: 0.5rem;
  width: 2.4rem;
  height: 2.4rem;
  background-color: var(--chat-accent);
  -webkit-mask: url('/icons/ChatBot/Send.svg') center / contain no-repeat;
  mask: url('/icons/ChatBot/Send.svg') center / contain no-repeat;
}

.iconSendActive {
  background-color: var(--chat-surface);
}
</style>
