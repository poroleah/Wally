<template>
  <div :class="$style.header">
    <img :class="$style.iconClose" src="/icons/Common/Close.svg" alt="닫기" @click="router.back()" />
    <b :class="$style.title">타임 라인</b>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style module>
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
  filter: var(--log-close-icon-filter) var(--log-close-icon-shadow);
  width: var(--fluid-icon-md);
  height: var(--fluid-icon-md);
  cursor: pointer;
  justify-self: start;
  -webkit-tap-highlight-color: transparent;
  transition: filter 0.18s ease, transform 0.18s ease;
}
.iconClose:active {
  transform: scale(0.94);
}
.title {
  line-height: 1;
  font-size: var(--fluid-title-md);
  color: var(--log-text);
  text-align: center;
  justify-self: center;
  font-family: 'MalangBold', sans-serif;
}
</style>
