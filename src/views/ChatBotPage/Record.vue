<template>
  <Teleport to="body">
    <Transition name="record-fade">
      <div v-if="modelValue" class="record-overlay" @click="emit('update:modelValue', false)" />
    </Transition>
    <Transition name="record-slide">
      <div v-if="modelValue" :class="$style.drawer">
        <div :class="$style.head">
          <b :class="$style.alarm">채팅</b>
          <img :class="$style.closeIcon" src="/icons/Setting/Arrow.svg" alt="" @click="emit('update:modelValue', false)" />
        </div>
        <div :class="$style.list">
          <div
            v-for="item in conversations"
            :key="item.id"
            :class="[$style.recordItem, activeId === item.id ? $style.recordItemHighlight : '']"
            @pointerdown="onPress(item.id)"
          >
            <div :class="$style.content">{{ item.summary }}</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConversations } from '@/composables/useConversations'
import { ROUTES } from '@/constants'

defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const { conversations } = useConversations()
const activeId = ref(null)

const onPress = (id) => {
  activeId.value = id
  setTimeout(() => {
    activeId.value = null
    emit('update:modelValue', false)
    router.push({ path: ROUTES.CHAT, query: { id } })
  }, 200)
}
</script>

<style module>

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 80%;
  height: 100%;
  background-color: var(--chat-surface);
  color: var(--chat-text);
  display: flex;
  flex-direction: column;
  font-family: 'Malang', sans-serif;
  z-index: 101;
}

.head {
  height: calc(5.8rem + env(safe-area-inset-top));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: env(safe-area-inset-top) 2rem 0;
  box-sizing: border-box;
  flex-shrink: 0;
}

.alarm {
  font-family: 'MalangBold', sans-serif;
  font-size: 1.6rem;
  color: var(--chat-text);
}

.closeIcon {
  position: absolute;
  left: 2rem;
  width: 2.4rem;
  height: 2.4rem;
  filter: var(--chat-icon-filter);
  cursor: pointer;
}

.list {
  flex: 1;
  background-color: var(--chat-bg);
  overflow-y: auto;
  padding: 1.6rem 1.6rem calc(env(safe-area-inset-bottom) + 1.6rem);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recordItem {
  border-radius: 2rem;
  background-color: var(--chat-surface);
  box-shadow: inset 0 0 0 0.06rem var(--chat-border), var(--chat-shadow);
  display: flex;
  align-items: center;
  padding: 1rem 1.6rem;
  cursor: pointer;
  transition: transform 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  min-width: 0;
}

.recordItemHighlight {
  background-color: var(--chat-accent-soft);
  border: 0.1rem solid var(--chat-accent);
  box-shadow: var(--chat-shadow);
}

.content {
  width: 100%;
  min-width: 0;
  font-size: 1.2rem;
  line-height: 2.2rem;
  font-family: 'Malang', sans-serif;
  color: var(--chat-text);
  overflow-wrap: anywhere;
  word-break: break-word;
}
</style>

<style>
.record-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.record-fade-enter-active,
.record-fade-leave-active {
  transition: opacity 0.25s ease;
}
.record-fade-enter-from,
.record-fade-leave-to {
  opacity: 0;
}

.record-slide-enter-active,
.record-slide-leave-active {
  transition: transform 0.25s ease;
}
.record-slide-enter-from,
.record-slide-leave-to {
  transform: translateX(100%);
}
</style>
