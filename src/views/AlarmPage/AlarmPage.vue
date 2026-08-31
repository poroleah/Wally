<template>
  <Teleport to="body">
    <Transition name="popup">
      <div v-if="modelValue" :class="$style.page">
        <Head
          :clearing="clearing"
          @clear="stackRef?.clearAlarms()"
          @close="emit('update:modelValue', false)"
          @update:tab="activeTab = $event"
        />
        <Stack
          ref="stackRef"
          :activeTab="activeTab"
          @clearing="clearing = $event"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import Head from './Head.vue'
import Stack from './Stack.vue'

defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])
const activeTab = ref('전체')
const clearing = ref(false)
const stackRef = ref(null)
</script>

<style module>

.page {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100%;
  background-color: var(--log-bg);
  color: var(--log-text);
  font-family: 'Malang', sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 202;
  --alarm-card-title-font: 1.2rem;
  --alarm-card-body-font: 1rem;
  --alarm-state-font: 1rem;
  --alarm-card-time-font: max(0.7rem, 7px);
}

@media (min-width: 700px) {
  .page {
    --alarm-card-title-font: clamp(15px, 4.4dvw, 30px);
    --alarm-card-body-font: clamp(14px, 3.8dvw, 25px);
    --alarm-state-font: clamp(15px, 4dvw, 28px);
    --alarm-card-time-font: clamp(9px, 1.85dvw, 14px);
  }
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
  transform: translateY(100%);
}
</style>
