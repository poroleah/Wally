<template>
  <div :class="$style.wrap">
    <div :class="$style.messageUserIcon">
      <span :class="$style.text">{{ message }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({ message: String })
</script>

<style module>

.wrap {
  display: flex;
  justify-content: flex-end;
  padding: 0.4rem 2rem;
}

.messageUserIcon {
  min-height: 4.6rem;
  position: relative;
  border-radius: 1.9rem 1.9rem 0 1.9rem;
  max-width: 32rem;
  min-width: 0;
  background-color: var(--chat-user-bg);
  display: flex;
  align-items: center;
  padding: 1.2rem 1.4rem;
  box-sizing: border-box;
}

.text {
  min-width: 0;
  font-size: 1.2rem;
  font-family: 'Malang', sans-serif;
  color: var(--chat-user-text);
  line-height: 2.2rem;
  overflow-wrap: anywhere;
  word-break: break-word;
}
</style>
