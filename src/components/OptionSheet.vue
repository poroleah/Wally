<template>
  <Teleport to="body">
    <Transition name="popup">
      <div v-if="modelValue" :class="$style.sheet">
        <div :class="$style.header">
          <img :class="$style.iconClose" src="/icons/Common/Close.svg" alt="" @click.stop="close" />
          <b :class="$style.title">{{ title }}</b>
          <div :class="$style.save" @click="saveAndClose">저장</div>
        </div>
        <div
          v-for="item in options"
          :key="item"
          :class="$style.row"
          @click="selected = item"
          @dblclick="selectAndClose(item)"
        >
          <div :class="$style.content">{{ item }}</div>
          <img v-if="selected === item" :class="$style.iconCheck" src="/icons/Calender/Plan/Check.svg" alt="" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  title: String,
  options: Array,
  defaultValue: String,
})
const emit = defineEmits(['update:modelValue', 'select'])

const selected = ref(props.defaultValue ?? props.options?.[0])

watch(() => props.modelValue, (val) => {
  if (val) selected.value = props.defaultValue ?? props.options?.[0]
})

const close = () => emit('update:modelValue', false)
const selectAndClose = (item) => {
  selected.value = item
  emit('select', item)
  close()
}
const saveAndClose = () => {
  emit('select', selected.value)
  emit('update:modelValue', false)
}
</script>

<style module>
.sheet {
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
  align-items: center;
  font-size: var(--fluid-text-sm);
  color: var(--calendar-text);
  font-family: 'Malang', sans-serif;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.header {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: var(--calendar-bg);
  width: 100%;
  height: calc(var(--fluid-sheet-header-h) + env(safe-area-inset-top));
  flex-shrink: 0;
  display: grid;
  grid-template-columns: minmax(var(--fluid-icon-md), 1fr) auto minmax(var(--fluid-icon-md), 1fr);
  align-items: center;
  padding: env(safe-area-inset-top) var(--fluid-pad-inline) 0;
  box-sizing: border-box;
}
.iconClose {
  width: var(--fluid-icon-md);
  height: var(--fluid-icon-md);
  cursor: pointer;
  flex-shrink: 0;
  justify-self: start;
  -webkit-tap-highlight-color: transparent;
  filter: var(--calendar-close-icon-filter, var(--calendar-icon-filter)) var(--calendar-close-icon-shadow, none);
  transition:
    filter 0.18s ease,
    transform 0.18s ease;
}
.iconClose:hover {
  filter: var(--calendar-close-icon-filter, var(--calendar-icon-filter)) var(--calendar-close-icon-shadow, none);
  transform: scale(1.04);
}
.iconClose:active {
  transform: scale(0.94);
}
.title {
  font-size: var(--fluid-title-md);
  color: var(--calendar-text);
  text-align: center;
  justify-self: center;
  line-height: 1;
}
.save {
  font-size: var(--fluid-title-md);
  color: var(--calendar-accent);
  cursor: pointer;
  min-width: var(--fluid-icon-md);
  text-align: right;
  justify-self: end;
  line-height: 1;
  -webkit-tap-highlight-color: transparent;
}
.row {
  width: 100%;
  height: var(--fluid-row-h);
  flex-shrink: 0;
  border-bottom: 0.05rem solid var(--calendar-border);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 var(--fluid-pad-inline-lg);
  cursor: pointer;
}
.content {
  flex: 1;
  line-height: 1.8;
}
.iconCheck {
  width: 2rem;
  height: 2rem;
  filter: var(--calendar-icon-filter);
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
