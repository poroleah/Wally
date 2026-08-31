<template>
  <div :class="$style.wrap">
    <div :class="$style.messageBot" @click="onClick">
      <div :class="$style.content">{{ message }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({ message: String, path: String })
const emit = defineEmits(['open'])

const onClick = () => {
  emit('open')
}
</script>

<style module>

.wrap {
  display: flex;
  justify-content: flex-start;
  padding: 0.4rem 2rem;
}

.messageBot {
  cursor: pointer;
  position: relative;
  border-radius: 1.9rem 1.9rem 1.9rem 0;
  background-color: var(--chat-surface);
  box-shadow: inset 0 0 0 0.06rem var(--chat-border), var(--chat-shadow);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.2rem;
  box-sizing: border-box;
  max-width: 32rem;
  min-width: 0;
}

.content {
  flex: 1;
  min-width: 0;
  width: 100%;
  position: relative;
  font-size: 1.2rem;
  line-height: 2.2rem;
  font-family: 'Malang', sans-serif;
  color: var(--chat-accent);
  text-align: left;
  display: inline-block;
  overflow-wrap: anywhere;
  word-break: break-word;
}
</style>
