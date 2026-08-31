<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="planAdd-backdrop" @click.self="$emit('update:modelValue', false)" />
    </Transition>
    <Transition name="slideup">
      <div v-if="modelValue" :class="$style.sheet">
          <SheetHeader :title="props.initialValue ? '일정 수정' : '일정 등록'" actionLabel="저장" @close="$emit('update:modelValue', false)" @action="save" />

          <div :class="$style.body">
            <div :class="$style.planOne" @click="isPlaceOpen = true">
              <div :class="$style.content5">{{ selectedCategory || '어떤 일정을 등록할까요?' }}</div>
            </div>

            <TimeSheet ref="timeSheetRef" :selectedDate="selectedDate" :initialValue="initialPlan" />

            <div :class="$style.planOneIcon" @click="isAlarmOpen = true">
              <img :class="$style.iconBellOff" src="/icons/Calendar/Plan/Bell.svg" alt="" />
              <div :class="$style.content">알림</div>
              <div :class="$style.content2">{{ selectedAlarm }}</div>
            </div>

            <div :class="$style.planOneIcon2" @click="isRepeatOpen = true">
              <img :class="$style.iconBellOff" src="/icons/Calendar/Plan/Repeat.svg" alt="" />
              <div :class="$style.content">반복</div>
              <div :class="$style.content4">{{ selectedRepeat }}</div>
            </div>

            <div v-if="props.initialValue" :class="$style.deleteBtn" @click="onDelete">
              <img :class="$style.iconTrash" src="/icons/Calendar/Plan/Trash.svg" alt="" />
              <div :class="$style.deleteText">삭제</div>
            </div>
          </div>
        </div>
    </Transition>
  </Teleport>

  <PlaceSheet v-model="isPlaceOpen" :selectedDate="selectedDate" @select="selectedCategory = $event" />
  <RepeatSheet v-model="isRepeatOpen" @select="selectedRepeat = $event" />
  <AlarmSheet v-model="isAlarmOpen" @select="selectedAlarm = $event" />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cancelAlarm, schedulePlanAlarm } from '@/utils/alarm.js'
import PlaceSheet from './Place.vue'
import RepeatSheet from './Repeat.vue'
import AlarmSheet from './Alarm.vue'
import TimeSheet from './Time.vue'
import SheetHeader from '@/components/Sheet/SheetHeader.vue'

const props = defineProps({ modelValue: Boolean, initialValue: [String, Object], selectedDate: Object })
const emit = defineEmits(['update:modelValue', 'add', 'delete'])


const timeSheetRef = ref(null)
const isPlaceOpen = ref(false)
const isRepeatOpen = ref(false)
const selectedRepeat = ref('안 함')
const isAlarmOpen = ref(false)
const selectedAlarm = ref('없음')

const selectedCategory = ref('')

function close() {
  emit('update:modelValue', false)
}

function handleAndroidBack(event) {
  if (!props.modelValue) return

  event.preventDefault()
  if (isPlaceOpen.value) {
    isPlaceOpen.value = false
    return
  }
  if (isRepeatOpen.value) {
    isRepeatOpen.value = false
    return
  }
  if (isAlarmOpen.value) {
    isAlarmOpen.value = false
    return
  }

  close()
}

function normalizeInitialPlan(value) {
  if (typeof value === 'string') {
    return value ? { title: value, category: value } : null
  }
  return value && typeof value === 'object' ? value : null
}

const initialPlan = ref(null)

watch(() => props.modelValue, (val) => {
  if (val) {
    initialPlan.value = normalizeInitialPlan(props.initialValue)
    selectedCategory.value = initialPlan.value?.title || initialPlan.value?.category || ''
    selectedAlarm.value = initialPlan.value?.alarm || '없음'
    selectedRepeat.value = initialPlan.value?.repeat || '안 함'
    isPlaceOpen.value = false
    isRepeatOpen.value = false
    isAlarmOpen.value = false
  }
})
const onDelete = () => {
  if (initialPlan.value?.id) cancelAlarm(initialPlan.value.id)
  emit('delete')
  close()
}
const save = async () => {
  const title = selectedCategory.value.trim()
  if (!title) {
    close()
    return
  }

  const timeValue = timeSheetRef.value?.getValue?.() || {}
  const plan = {
    id: initialPlan.value?.id || Date.now().toString(),
    title,
    category: title,
    allDay: Boolean(timeValue.allDay),
    startDate: timeValue.startDate || props.selectedDate,
    startTime: timeValue.startTime || '09:00',
    endDate: timeValue.endDate || timeValue.startDate || props.selectedDate,
    endTime: timeValue.endTime || '12:00',
    alarm: selectedAlarm.value,
    repeat: selectedRepeat.value,
  }

  emit('add', plan)

  if (initialPlan.value?.id) {
    await cancelAlarm(plan.id)
  }

  if (plan.alarm !== '없음' && plan.startDate) {
    await schedulePlanAlarm(plan)
  }

  close()
}

onMounted(() => {
  window.addEventListener('wally:android-back', handleAndroidBack)
})

onBeforeUnmount(() => {
  window.removeEventListener('wally:android-back', handleAndroidBack)
})
</script>

<style module>
.sheet {
  --sheet-action-color: var(--calendar-accent);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 201;
  width: 100%;
  height: 100%;
  background-color: var(--calendar-bg);
  border-radius: 2rem 2rem 0 0;
  overflow: hidden;
  font-size: var(--fluid-text-sm);
  color: var(--calendar-text);
  font-family: 'Malang', sans-serif;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.body {
  position: absolute;
  top: calc(var(--fluid-sheet-header-h) + env(safe-area-inset-top));
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--fluid-gap-md);
  padding: 1.2rem 2rem 2rem;
}
.planOne {
  position: relative;
  border-radius: 1rem;
  cursor: pointer;
  background-color: var(--calendar-surface);
  box-shadow: inset 0 0 0 0.06rem var(--calendar-border), var(--calendar-shadow);
  width: 100%;
  height: var(--fluid-row-h);
  overflow: hidden;
  flex-shrink: 0;
}
.content5 {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: var(--fluid-offset-sm);
  line-height: 1.6;
  display: flex;
  align-items: center;
  right: var(--fluid-offset-sm);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.planOneIcon {
  position: relative;
  border-radius: 1rem;
  background-color: var(--calendar-surface);
  box-shadow: inset 0 0 0 0.06rem var(--calendar-border), var(--calendar-shadow);
  width: 100%;
  height: var(--fluid-row-h);
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
}
.planOneIcon2 {
  position: relative;
  border-radius: 1rem;
  background-color: var(--calendar-surface);
  box-shadow: inset 0 0 0 0.06rem var(--calendar-border), var(--calendar-shadow);
  width: 100%;
  height: var(--fluid-row-h);
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
}
.iconBellOff {
  filter: var(--calendar-icon-filter);
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: var(--fluid-offset-md);
  width: var(--fluid-icon-md);
  height: var(--fluid-icon-md);
}
.content {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: var(--fluid-label-offset);
  line-height: 1.6;
  display: flex;
  align-items: center;
}
.deleteBtn {
  position: relative;
  border-radius: 1rem;
  background-color: var(--calendar-surface);
  box-shadow: inset 0 0 0 0.06rem var(--calendar-border), var(--calendar-shadow);
  width: 100%;
  height: var(--fluid-row-h);
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}
.iconTrash {
  filter: var(--calendar-icon-filter);
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: var(--fluid-offset-md);
  width: var(--fluid-icon-md);
  height: var(--fluid-icon-md);
}
.deleteText {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: var(--fluid-label-offset);
  font-size: var(--fluid-text-sm);
  font-family: 'Malang', sans-serif;
  color: var(--calendar-text);
  line-height: 1.6;
  display: flex;
  align-items: center;
}
.content2 {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: var(--fluid-offset-md);
  line-height: 1.6;
  color: var(--calendar-muted);
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  white-space: nowrap;
  max-width: calc(100% - var(--fluid-label-offset) - var(--fluid-offset-md));
  overflow: hidden;
  text-overflow: ellipsis;
}
.content4 {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: var(--fluid-offset-md);
  line-height: 1.6;
  color: var(--calendar-muted);
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  white-space: nowrap;
  max-width: calc(100% - var(--fluid-label-offset) - var(--fluid-offset-md));
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<style>
.planAdd-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background-color: rgba(0, 0, 0, 0.4);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slideup-enter-active,
.slideup-leave-active {
  transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1);
}
.slideup-enter-from,
.slideup-leave-to {
  transform: translateY(100%);
}
.timeslide-enter-active,
.timeslide-leave-active {
  transition: opacity 0.25s ease, max-width 0.25s ease;
  max-width: 8rem;
  overflow: hidden;
}
.timeslide-enter-from,
.timeslide-leave-to {
  opacity: 0;
  max-width: 0;
}
</style>
