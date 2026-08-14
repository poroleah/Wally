<template>
  <div :class="$style.section">
    <div :class="$style.sectionLabel">더보기</div>
    <MenuItem label="앱 정보" />
    <MenuItem label="버전" value="1.2.3" :show-arrow="false" />
    <MenuItem label="카메라 프로필" @click="emit('openIp')" />
    <MenuItem label="프롬프트 설정" @click="emit('openPromptSetting')" />
  </div>
</template>

<script setup>
import MenuItem from '../MenuItem.vue'
const emit = defineEmits(['openIp', 'openPromptSetting'])
</script>

<style module>
.section {
  margin-top: 1.6rem;
}
.sectionLabel {
  font-size: var(--fluid-text-lg);
  color: var(--settings-muted);
  margin-bottom: 0.8rem;
}
.box {
  background-color: var(--settings-card-bg);
  border-radius: 1rem;
  padding: 0 1.6rem;
  overflow: hidden;
}
</style>
