<template>
  <b :class="$style.logTime">{{ time }}</b>
</template>

<script setup>
defineProps({ time: String })
</script>

<style module>
.logTime {
  font-size: 1.4rem;
  color: var(--log-text);
  font-family: 'Malang', sans-serif;
}
</style>
