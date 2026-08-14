<template>
  <div :class="$style.logDate">
    <img :class="$style.iconArrowRight2" src="/icons/Log/Arrow_Right.svg" alt="" />
    <div :class="$style.div">{{ displayDate }}</div>
    <img :class="$style.iconArrowRight" src="/icons/Log/Arrow_Right.svg" alt="" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const displayDate = computed(() => {
  if (!route.query.date) return ''
  return route.query.date.replaceAll('-', '.') + '.'
})
</script>

<style module>
@font-face {
  font-family: 'Malang';
  src: url('@/assets/Fonts/Malang_Regular.ttf') format('truetype');
}
.logDate {
  width: calc(100% - 4rem);
  margin: 0.8rem 2rem;
  height: 4.8rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 1rem;
  background-color: var(--log-surface);
  box-shadow: inset 0 0 0 0.06rem var(--log-border), var(--log-shadow);
  padding: 0 1.2rem;
  font-size: 1.2rem;
  color: var(--log-text);
  font-family: 'Malang', sans-serif;
}
.div {
  flex: 1;
  text-align: center;
  line-height: 2.2rem;
}
.iconArrowRight {
  filter: var(--log-icon-filter);
  width: 2.4rem;
  height: 2.4rem;
  flex-shrink: 0;
}
.iconArrowRight2 {
  filter: var(--log-icon-filter);
  width: 2.4rem;
  height: 2.4rem;
  flex-shrink: 0;
  transform: rotate(180deg);
}
</style>
