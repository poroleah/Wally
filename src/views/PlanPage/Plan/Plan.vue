<template>
  <div :class="$style.planList">
    <div
      v-if="plans.length === 0"
      :class="[$style.calendarPlan, $style.clickable]"
      @click="isOpen = true"
    >
      <div :class="$style.div">일정없음. 일정을 추가하려면 클릭하세요.</div>
    </div>

    <div
      v-for="(plan, index) in plans"
      :key="index"
      :class="$style.calendarPlan"
    >
      <div :class="[$style.div, $style.editText]" @click="openEdit(index)">
        <span :class="$style.title">{{ plan.title }}</span>
        <span :class="$style.meta">{{ planMeta(plan) }}</span>
      </div>
    </div>

    <div v-if="plans.length > 0" :class="[$style.calendarPlan, $style.clickable]" @click="openNew">
      <div :class="$style.div">일정없음. 일정을 추가하려면 클릭하세요.</div>
    </div>
  </div>

  <PlanAdd v-model="isOpen" :initialValue="editValue" :selectedDate="selectedDate" @add="onAdd" @delete="onDelete" />
</template>

<script setup>
import { ref, computed } from 'vue'
import PlanAdd from './PlanAdd.vue'
import { usePlans } from '@/composables/usePlans'
import { dateObjectToKey } from '@/utils/date'

const props = defineProps({ selectedDate: Object })

const { addPlan, deletePlan, getPlans } = usePlans()
const isOpen = ref(false)
const editIndex = ref(null)
const editValue = ref(null)

const dateKey = computed(() => dateObjectToKey(props.selectedDate))

const plans = computed(() => getPlans(dateKey.value))

function planMeta(plan) {
  const pieces = []
  pieces.push(plan.allDay ? '하루 종일' : `${plan.startTime || '09:00'} - ${plan.endTime || '12:00'}`)
  if (plan.alarm && plan.alarm !== '없음') pieces.push(`알림 ${plan.alarm}`)
  if (plan.repeat && plan.repeat !== '안 함') pieces.push(plan.repeat)
  return pieces.join(' · ')
}

const openNew = () => {
  editIndex.value = null
  editValue.value = null
  isOpen.value = true
}
const openEdit = (index) => {
  editIndex.value = index
  editValue.value = plans.value[index]
  isOpen.value = true
}
const onAdd = (value) => {
  const targetDateKey = dateObjectToKey(value.startDate) || dateKey.value
  if (editIndex.value !== null && targetDateKey !== dateKey.value) {
    deletePlan(dateKey.value, editIndex.value)
    addPlan(targetDateKey, value)
  } else {
    addPlan(targetDateKey, value, editIndex.value)
  }
  editIndex.value = null
  editValue.value = null
}
const onDelete = () => {
  if (editIndex.value !== null) {
    deletePlan(dateKey.value, editIndex.value)
    editIndex.value = null
    editValue.value = null
  }
}
</script>

<style module>
.planList {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-bottom: clamp(1.2rem, 3vw, 2.4rem);
}
.calendarPlan {
  width: calc(100% - 4rem);
  margin: 1rem 2rem 0;
  height: 4.8rem;
  position: relative;
  border-radius: 1rem;
  background-color: var(--calendar-surface);
  box-shadow: inset 0 0 0 0.06rem var(--calendar-border), var(--calendar-shadow);
  overflow: hidden;
  text-align: left;
  font-size: 1.2rem;
  color: var(--calendar-text);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.clickable {
  cursor: pointer;
}
.div {
  width: calc(100% - 1.8rem);
  min-height: 3rem;
  position: absolute;
  top: 50%;
  left: 0.9rem;
  transform: translateY(-50%);
  font-size: 1.2rem;
  line-height: 1.4;
  font-family: 'Malang', sans-serif;
  color: var(--calendar-muted);
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.2rem;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.title {
  color: var(--calendar-text);
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta {
  font-size: 0.95rem;
  color: var(--calendar-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.editText {
  cursor: pointer;
  color: var(--calendar-text);
}
@media (min-width: 48rem) and (orientation: portrait) {
  .div {
    font-size: 1.42rem;
    line-height: 1.45;
  }

  .meta {
    font-size: 1.12rem;
  }
}

</style>
