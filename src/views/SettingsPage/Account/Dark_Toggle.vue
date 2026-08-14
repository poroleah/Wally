<template>
  <div :class="$style.menuItem">
    <span>다크 모드</span>
    <div :class="[$style.track, isDark ? $style.on : '']" @click="toggleTheme">
      <div :class="$style.trackBg" />
      <div :class="$style.thumb" />
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const isDark = ref(false)
let unsubscribeTheme = null

function syncTheme(theme) {
  isDark.value = theme === 'dark'
}

function toggleTheme() {
  window.__wallyTheme?.setTheme?.(isDark.value ? 'light' : 'dark')
}

onMounted(() => {
  unsubscribeTheme = window.__wallyTheme?.subscribe?.(syncTheme)
})

onBeforeUnmount(() => {
  unsubscribeTheme?.()
})
</script>

<style module>
.menuItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(1.2rem, 3vw, 2rem) 0;
  font-size: clamp(1.6rem, 4vw, 2rem);
  color: var(--settings-text);
}
.track {
  width: 4.3rem;
  height: 2.3rem;
  position: relative;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  border-radius: 2rem;
  transition: transform 0.18s ease;
}
.trackBg {
  position: absolute;
  inset: 0;
  border: 0.1rem solid var(--settings-toggle-border);
  border-radius: 2rem;
  background-color: var(--settings-toggle-bg);
  box-shadow: var(--settings-toggle-shadow);
  transition: background-color 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
}
.on .trackBg {
  border-color: var(--settings-toggle-on);
  background-color: var(--settings-toggle-on);
  box-shadow: inset 0 0 0.2rem rgba(255, 255, 255, 0.18), 0 0.1rem 0.35rem rgba(255, 176, 133, 0.28);
}
.thumb {
  position: absolute;
  width: 44.19%;
  height: 1.9rem;
  top: calc(50% - 0.95rem);
  left: 4.65%;
  border-radius: 50%;
  background-color: var(--settings-toggle-thumb);
  box-shadow: var(--settings-toggle-thumb-shadow);
  transition: left 0.24s ease, transform 0.18s ease, box-shadow 0.24s ease;
}
.on .thumb {
  left: 51.16%;
}
.track:hover .trackBg {
  box-shadow: var(--settings-toggle-shadow), 0 0.1rem 0.35rem rgba(255, 176, 133, 0.16);
}
.track:hover .thumb {
  transform: scale(1.04);
}
.track:active {
  transform: scale(0.97);
}
.track:active .thumb {
  transform: scale(0.96);
}
</style>
