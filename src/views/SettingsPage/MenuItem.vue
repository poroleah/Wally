<template>
  <div :class="$style.menuItem" @click="to ? router.push(to) : null">
    <span>{{ label }}</span>
    <span v-if="value" :class="$style.value">{{ value }}</span>
    <img v-else-if="showArrow" src="/icons/Setting/Arrow.svg" alt="" :class="$style.icon" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

defineProps({
  label: String,
  to: String,
  value: String,
  showArrow: {
    type: Boolean,
    default: true,
  },
})

const router = useRouter()
</script>

<style module>
.menuItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(1.2rem, 3vw, 2rem) 0;
  font-size: var(--fluid-text-lg);
  color: var(--settings-text);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  gap: 1rem;
  min-width: 0;
}
.menuItem > span:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.value {
  min-width: 0;
  max-width: 50%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--settings-muted);
  font-size: var(--fluid-text-lg);
  line-height: 1;
  text-align: right;
  font-family: 'Malang', sans-serif;
}
.icon {
  width: var(--fluid-icon-lg);
  height: var(--fluid-icon-lg);
  cursor: pointer;
  filter: var(--settings-icon-filter);
  flex-shrink: 0;
}
</style>
