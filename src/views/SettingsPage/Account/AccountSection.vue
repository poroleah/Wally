<template>
  <div :class="$style.section">
    <div :class="$style.sectionLabel">계정</div>
    <MenuItem label="프로필 변경" @click="emit('openProfile')" />
    <MenuItem label="비밀번호 변경" @click="emit('openPasswordSetting')" />
    <MenuItem label="알림 설정" @click="emit('openAlarmSetting')" />
    <DarkToggle />
  </div>
</template>

<script setup>
import MenuItem from '../MenuItem.vue'
import DarkToggle from './DarkToggle.vue'
const emit = defineEmits(['openProfile', 'openPasswordSetting', 'openAlarmSetting'])
</script>

<style module>
.section {
  margin-top: 0.8rem;
}
.sectionLabel {
  font-size: var(--fluid-text-lg);
  color: var(--settings-muted);
  margin-bottom: 0.8rem;
}
</style>
