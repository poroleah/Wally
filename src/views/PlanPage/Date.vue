<template>
  <div :class="$style.calendarDate">
    <div :class="$style.date">{{ today }}</div>
    <img :class="$style.iconBone" src="/icons/Calendar/Bone.svg?v=7" alt="로그 보기" @click="router.push({ path: ROUTES.FOOTPRINT, query: { date: dateParam } })" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { DAY_NAMES, ROUTES } from '@/constants'
import { dateObjectToKey } from '@/utils/date'

const props = defineProps({ selectedDate: Object })
const router = useRouter()
const days = DAY_NAMES

const today = computed(() => {
  const d = props.selectedDate
  if (!d) return ''
  const dow = new Date(d.year, d.month - 1, d.day).getDay()
  return `${d.year}년 ${d.month}월 ${d.day}일 (${days[dow]})`
})

const dateParam = computed(() => dateObjectToKey(props.selectedDate))
</script>

<style module>
.calendarDate {
  width: calc(100% - 4rem);
  margin: 0 2rem;
  height: 2.4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 1rem;
  background-color: rgba(255, 251, 245, 0);
  font-size: 1.2rem;
  color: var(--calendar-text);
  font-family: 'Malang', sans-serif;
}
.date {
  line-height: 2.2rem;
}
.iconBone {
  filter: brightness(0) var(--calendar-icon-filter);
  width: 24px;
  height: 24px;
  position: relative;
  max-width: 100%;
  overflow: hidden;
  cursor: pointer;
}
@media (min-width: 48rem) and (orientation: portrait) {
  .calendarDate {
    width: calc(100% - 4rem);
    margin: 0 2rem;
    height: 3.2rem;
    font-size: 1.48rem;
  }

  .date {
    line-height: 2.8rem;
  }

  .iconBone {
    width: 24px;
    height: 24px;
  }
}

</style>
