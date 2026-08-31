<template>
  <div :class="$style.head">
    <img :class="$style.iconArrowRight" src="/icons/Calendar/chevron.svg" alt="뒤로" @click="emit('close')" />
    <b :class="$style.content">프로필 변경</b>
  </div>
</template>

<script setup>
const emit = defineEmits(['close'])
</script>

<style module>
.head {
  width: 100%;
  height: calc(5.8rem + env(safe-area-inset-top));
  position: relative;
  text-align: center;
  font-size: 1.6rem;
  color: var(--settings-text);
  font-family: 'MalangBold';
  flex-shrink: 0;
}
.iconArrowRight {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 1.7rem);
  left: 2rem;
  width: 2.4rem;
  height: 2.4rem;
  object-fit: contain;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  filter: var(--settings-icon-filter);
}
.content {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 2.9rem);
  transform: translateY(-50%);
  left: 50%;
  transform: translate(-50%, -50%);
  white-space: nowrap;
}
</style>

<style>
</style>
