<template>
  <div :class="$style.page">
    <AppLogo />
    <Calender :selectedDate="selectedDate" @selectDate="onSelectDate" />
    <PlanSection :selectedDate="selectedDate" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppLogo from '@/components/AppLogo.vue'
import Calender from '@/components/Calender.vue'
import PlanSection from '@/views/PlanPage/PlanPage.vue'

const route = useRoute()
const now = new Date()

function parseDateQuery(value) {
  const [year, month, day] = String(value || '').split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (!year || !month || !day || Number.isNaN(date.getTime())) return null
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) return null
  return { year, month, day }
}

const selectedDate = ref(
  parseDateQuery(route.query.date)
  || { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() },
)
const onSelectDate = (date) => { selectedDate.value = date }

watch(() => route.query.date, (value) => {
  const date = parseDateQuery(value)
  if (date) selectedDate.value = date
})
</script>

<style module>
.page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--calendar-surface);
  color: var(--calendar-text);
}
</style>
