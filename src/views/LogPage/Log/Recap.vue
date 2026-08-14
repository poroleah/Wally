<template>
  <div :class="$style.content">
    <img src="/icons/Log/Note.svg" alt="" :class="$style.iconNote" />
    <div :class="$style.recap">{{ recap }}</div>
  </div>
</template>

<script setup>
defineProps({ recap: String })
</script>

<style module>
@font-face {
  font-family: 'Malang';
  src: url('@/assets/Fonts/Malang_Regular.ttf') format('truetype');
}
.content {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 1rem 0 0.3rem;
}
.iconNote {
  filter: var(--log-icon-filter);
  width: 1.6rem;
  height: 1.6rem;
  flex-shrink: 0;
}
.recap {
  font-size: 1rem;
  color: var(--log-text);
  font-family: 'Malang', sans-serif;
}
</style>
