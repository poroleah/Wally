<template>
  <OptionSheet
    v-model="proxyValue"
    title="반복"
    :options="REPEAT_OPTIONS"
    defaultValue="안 함"
    @select="emit('select', $event)"
  />
</template>

<script setup>
import { computed } from 'vue'
import { REPEAT_OPTIONS } from '@/constants'
import OptionSheet from '@/components/OptionSheet.vue'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'select'])

const proxyValue = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>
