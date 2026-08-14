<template>
  <Teleport to="body">
    <Transition name="popup">
      <div v-if="modelValue" :class="$style.planPlace">
        <SheetHeader title="일정 등록" actionLabel="저장" @close="close" @action="saveAndClose" />

        <div :class="$style.date">{{ dateLabel }}</div>
        <b :class="$style.content7">어떤 일정을 등록할까요?</b>

        <div
          v-for="item in categories"
          :key="item"
          :class="[item === '기타(직접입력)' ? $style.planPlaceText : $style.planPlaceItem, selected === item ? $style.on : '']"
          @click="selected = item"
          @dblclick="selectAndClose(item)"
        >
          <template v-if="item === '기타(직접입력)'">
            <input
              :class="$style.customInput"
              placeholder="기타(직접입력)"
              v-model="customText"
              @click.stop="selected = item"
              @dblclick.stop
            />
          </template>
          <div v-else :class="$style.content">{{ item }}</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { DAY_NAMES } from '@/constants'
import SheetHeader from '@/components/SheetHeader.vue'

const props = defineProps({ modelValue: Boolean, selectedDate: Object })
const emit = defineEmits(['update:modelValue', 'select'])

watch(() => props.modelValue, (val) => {
  if (val) {
    selected.value = null
    customText.value = ''
  }
})

const days = DAY_NAMES
const dateLabel = computed(() => {
  const d = props.selectedDate
  if (!d) return ''
  const dow = new Date(d.year, d.month - 1, d.day).getDay()
  return `${d.month}월 ${d.day}일 (${days[dow]})`
})

const categories = ['목욕', '미용', '심장 사상충', '예방 접종', '병원', '기타(직접입력)']
const selected = ref(null)
const customText = ref('')

const close = () => emit('update:modelValue', false)
const selectAndClose = (item) => {
  if (item === categories.at(-1)) return
  selected.value = item
  emit('select', item)
  close()
}
const saveAndClose = () => {
  const value = selected.value === '기타(직접입력)' ? customText.value : selected.value
  if (value) emit('select', value)
  emit('update:modelValue', false)
}
</script>

<style module>
@font-face {
  font-family: 'Malang';
  src: url('@/assets/Fonts/Malang_Regular.ttf') format('truetype');
}
.planPlace {
  --sheet-action-color: var(--calendar-accent);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 202;
  width: 100%;
  height: 100%;
  border-radius: 2rem 2rem 0 0;
  background-color: var(--calendar-bg);
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  font-size: var(--fluid-text-sm);
  color: var(--calendar-text);
  font-family: 'Malang', sans-serif;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.date {
  width: 100%;
  padding: var(--fluid-pad-inline-lg) var(--fluid-pad-inline-lg) 0.4rem;
  text-align: left;
  font-size: var(--fluid-text-sm);
  line-height: 1.6;
  box-sizing: border-box;
}
.content7 {
  width: 100%;
  padding: 0 var(--fluid-pad-inline-lg) var(--fluid-pad-inline-lg);
  font-size: var(--fluid-title-lg);
  line-height: 1.3;
  text-align: left;
  box-sizing: border-box;
}
.planPlaceItem {
  position: relative;
  border-radius: 1rem;
  background-color: var(--calendar-surface);
  box-shadow: inset 0 0 0 0.06rem var(--calendar-border), var(--calendar-shadow);
  width: calc(100% - (var(--fluid-pad-inline-lg) * 2));
  height: var(--fluid-row-h);
  flex-shrink: 0;
  overflow: hidden;
  margin: 0 auto clamp(0.6rem, 1.5vw, 1.2rem);
  cursor: pointer;
}
.planPlaceItem.on {
  background-color: var(--calendar-accent-soft);
  border: 0.1rem solid var(--calendar-accent);
  box-sizing: border-box;
}
.planPlaceText {
  position: relative;
  border-radius: 1rem;
  background-color: var(--calendar-bg);
  box-shadow: inset 0 0 0 0.06rem var(--calendar-border), var(--calendar-shadow);
  border: 0.1rem solid var(--calendar-border);
  box-sizing: border-box;
  width: calc(100% - (var(--fluid-pad-inline-lg) * 2));
  height: var(--fluid-row-h);
  flex-shrink: 0;
  overflow: hidden;
  text-align: left;
  color: var(--calendar-muted);
  margin: 0 auto clamp(0.6rem, 1.5vw, 1.2rem);
  cursor: pointer;
}
.planPlaceText.on {
  background-color: var(--calendar-accent-soft);
  border-color: var(--calendar-accent);
}
.content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  line-height: 1.6;
}
.customInput {
  width: 100%;
  height: 100%;
  padding: 0 var(--fluid-pad-input);
  border: none;
  background: transparent;
  font-family: 'Malang', sans-serif;
  font-size: var(--fluid-text-sm);
  color: var(--calendar-muted);
  outline: none;
  box-sizing: border-box;
}
.customInput::placeholder {
  color: var(--calendar-muted);
}
</style>

<style>
.popup-enter-active,
.popup-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
