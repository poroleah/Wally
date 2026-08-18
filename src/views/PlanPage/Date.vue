<template>
  <div :class="$style.calenderDate">
    <div :class="$style.date">{{ today }}</div>
    <img :class="$style.iconPaw" src="/icons/Calender/Plan/Bone.svg" alt="타임라인 보기" @click="router.push({ path: ROUTES.FOOTPRINT, query: { date: dateParam } })" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { DAY_NAMES, ROUTES } from '@/constants'

const props = defineProps({ selectedDate: Object })
const router = useRouter()
const days = DAY_NAMES

const today = computed(() => {
  const d = props.selectedDate
  if (!d) return ''
  const dow = new Date(d.year, d.month - 1, d.day).getDay()
  return `${d.year}년 ${d.month}월 ${d.day}일 (${days[dow]})`
})

const dateParam = computed(() => {
  const d = props.selectedDate
  if (!d) return ''
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
})
</script>

<style module>
@font-face {
  font-family: 'Malang';
  src: url('@/assets/Fonts/Malang_Regular.ttf') format('truetype');
}
.calenderDate {
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
.iconPaw {
  filter: var(--calendar-icon-filter);
  width: 24px;
  height: 24px;
  position: relative;
  max-width: 100%;
  overflow: hidden;
  cursor: pointer;
}
@media (min-width: 48rem) and (orientation: portrait) {
  .calenderDate {
    width: calc(100% - 4rem);
    margin: 0 2rem;
    height: 3.2rem;
    font-size: 1.48rem;
  }

  .date {
    line-height: 2.8rem;
  }

  .iconPaw {
    width: 24px;
    height: 24px;
  }
}

</style>
