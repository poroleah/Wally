<template>
  <OptionSheet
    v-model="proxyValue"
    title="알림"
    :options="ALARM_OPTIONS"
    defaultValue="없음"
    @select="emit('select', $event)"
  />
</template>

<script setup>
import { computed } from 'vue'
import { ALARM_OPTIONS } from '@/constants'
import OptionSheet from '@/components/OptionSheet.vue'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'select'])

const proxyValue = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>
