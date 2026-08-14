<template>
  <div :class="$style.wrap">
    <div :class="$style.messageBot">
      <div :class="$style.content">{{ message }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({ message: String })
</script>

<style module>
@font-face {
  font-family: 'Malang';
  src: url('@/assets/Fonts/Malang_Regular.ttf') format('truetype');
}

.wrap {
  display: flex;
  justify-content: flex-start;
  padding: 0.4rem 2rem;
}

.messageBot {
  width: 100%;
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
  text-align: left;
  font-size: 1.2rem;
  color: var(--chat-text);
  font-family: 'Malang', sans-serif;
}

.content {
  flex: 1;
  position: relative;
  line-height: 2.2rem;
}
</style>
