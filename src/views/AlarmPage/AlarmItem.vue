<template>
  <div :class="$style.alarm" role="button" tabindex="0">
    <span v-if="isBoneIcon" :class="[$style.icon, $style.boneIcon]" aria-hidden="true" />
    <img v-else v-theme-src="themeIconSources" :class="[$style.icon, isThemeIcon ? $style.themeIcon : null]" :src="alarm.icon" alt="" />
    <div :class="$style.body">
      <b :class="$style.title">{{ alarm.title }}</b>
      <div :class="$style.content">{{ alarm.content }}</div>
    </div>
    <div :class="$style.timeGroup">
      <div :class="$style.dayAmpm">{{ alarm.dayAmpm }}</div>
      <div :class="$style.time">{{ alarm.time }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ alarm: Object })
const isBoneIcon = computed(() => props.alarm?.icon === '/icons/Calendar/Bone.svg')
const isThemeIcon = computed(() => props.alarm?.icon?.startsWith('/icons/Alarm/') || isBoneIcon.value)
const themeIconSources = computed(() => ({
  light: props.alarm?.icon,
  dark: props.alarm?.icon,
}))
</script>

<style module>

.alarm {
  position: relative;
  width: 100%;
  height: 7.2rem;
  min-height: 7.2rem;
  box-shadow: 0 0.2rem 0.4rem rgba(0, 0, 0, 0.25);
  border-radius: 1rem;
  background-color: var(--log-surface);
  overflow: hidden;
  font-family: 'Malang', sans-serif;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.alarm:focus,
.alarm:focus-visible {
  outline: none;
}

.icon {
  position: absolute;
  top: 1.6rem;
  left: 2rem;
  width: 4rem;
  height: 4rem;
  object-fit: cover;
  border-radius: 50%;
}


.themeIcon {
  object-fit: contain;
  border-radius: 0;
  filter: var(--log-icon-filter);
}

.boneIcon {
  border-radius: 0;
  background-color: var(--log-text);
  -webkit-mask: url('/icons/Calendar/Bone.svg') center / contain no-repeat;
  mask: url('/icons/Calendar/Bone.svg') center / contain no-repeat;
}

.body {
  display: contents;
}

.title {
  position: absolute;
  top: 1.6rem;
  left: 7.2rem;
  width: 13.2rem;
  height: 1.6rem;
  display: flex;
  align-items: center;
  color: var(--log-accent);
  font-size: var(--alarm-card-title-font);
  line-height: 2.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content {
  position: absolute;
  top: 3.2rem;
  left: 7.2rem;
  right: 1.7rem;
  height: 1.6rem;
  display: flex;
  align-items: center;
  color: var(--log-text);
  font-size: var(--alarm-card-body-font);
  line-height: 2.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timeGroup {
  position: absolute;
  top: 1.6rem;
  right: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.2em;
  width: max-content;
  max-width: 9rem;
  height: 1.2em;
  color: var(--log-muted);
  font-size: var(--alarm-card-time-font);
  line-height: 1.2;
  text-align: right;
  white-space: nowrap;
}

.dayAmpm,
.time {
  position: static;
  width: auto;
  height: auto;
  display: block;
  line-height: inherit;
}

@media (min-width: 700px) {
  .title {
    top: clamp(1.25rem, 2.4dvw, 1.8rem);
    width: auto;
    right: 8.4rem;
    height: 1.3em;
    line-height: 1.15;
  }

  .content {
    top: clamp(3.45rem, 6.2dvw, 4.15rem);
    height: 1.4em;
    line-height: 1.35;
  }
}
</style>
