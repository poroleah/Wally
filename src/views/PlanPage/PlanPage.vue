<template>
  <div :class="$style.rectangle">
    <CalendarDate :selectedDate="selectedDate" />
    <Plan :selectedDate="selectedDate" />
  </div>
</template>

<script setup>
import CalendarDate from './Date.vue'
import Plan from './Plan/Plan.vue'

defineProps({ selectedDate: Object })
</script>

<style module>
.rectangle {
  width: 100%;
  flex: 1;
  background-color: var(--calendar-bg);
  padding-top: 1rem;
  box-sizing: border-box;
}
</style>
