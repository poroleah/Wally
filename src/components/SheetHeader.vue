<template>
  <div :class="$style.header">
    <img :class="$style.iconClose" src="/icons/Common/Close.svg" alt="" @click="emit('close')" />
    <b :class="$style.title">{{ title }}</b>
    <div :class="$style.action" @click="emit('action')">{{ actionLabel ?? '' }}</div>
  </div>
</template>

<script setup>
defineProps({ title: String, actionLabel: { type: String, default: null } })
const emit = defineEmits(['close', 'action'])
</script>

<style module>
@font-face {
  font-family: 'MalangBold';
  src: url('@/assets/Fonts/Malang_Bold.ttf') format('truetype');
}
.header {
  display: grid;
  grid-template-columns: minmax(var(--fluid-icon-md), 1fr) auto minmax(var(--fluid-icon-md), 1fr);
  align-items: center;
  padding: env(safe-area-inset-top) var(--fluid-pad-inline) 0;
  height: calc(var(--fluid-sheet-header-h) + env(safe-area-inset-top));
  box-sizing: border-box;
  flex-shrink: 0;
}
.iconClose {
  width: var(--fluid-icon-md);
  height: var(--fluid-icon-md);
  cursor: pointer;
  flex-shrink: 0;
  justify-self: start;
  -webkit-tap-highlight-color: transparent;
  filter: var(--settings-close-icon-filter, var(--settings-icon-filter)) var(--settings-close-icon-shadow, none);
  transition:
    filter 0.18s ease,
    transform 0.18s ease;
}
.iconClose:hover {
  filter: var(--settings-close-icon-filter, var(--settings-icon-filter)) var(--settings-close-icon-shadow, none);
  transform: scale(1.04);
}
.iconClose:active {
  transform: scale(0.94);
}
.title {
  font-size: var(--fluid-title-md);
  color: var(--settings-text);
  text-align: center;
  justify-self: center;
  line-height: 1;
  font-family: 'MalangBold', sans-serif;
}
.action {
  font-size: var(--fluid-title-md);
  color: var(--sheet-action-color, var(--settings-text));
  cursor: pointer;
  min-width: var(--fluid-icon-md);
  text-align: right;
  justify-self: end;
  line-height: 1;
  -webkit-tap-highlight-color: transparent;
}
</style>
