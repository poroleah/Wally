<template>
  <Teleport to="body">
    <Transition name="alarm-setting-slide">
      <div v-if="modelValue" :class="$style.page">
        <header :class="$style.head">
          <button :class="$style.backButton" type="button" aria-label="뒤로가기" @click="emit('update:modelValue', false)">
            <img :class="$style.iconArrowRight" src="/icons/Calender/chevron.svg" alt="" />
          </button>
          <b :class="$style.headTitle">알림 설정</b>
        </header>

        <section :class="$style.section">
          <b :class="$style.sectionLabel">캠 알림</b>
          <button
            v-for="item in camItems"
            :key="item.key"
            type="button"
            :class="$style.row"
            :aria-pressed="settings[item.key]"
            @click="toggleAlarmSetting(item.key)"
          >
            <span :class="$style.label">{{ item.label }}</span>
            <span :class="[$style.track, settings[item.key] ? $style.on : '']" aria-hidden="true">
              <span :class="$style.thumb" />
            </span>
          </button>
        </section>

        <section :class="$style.section">
          <button
            v-for="item in appItems"
            :key="item.key"
            type="button"
            :class="$style.row"
            :aria-pressed="settings[item.key]"
            @click="toggleAlarmSetting(item.key)"
          >
            <span :class="$style.label">{{ item.label }}</span>
            <span :class="[$style.track, settings[item.key] ? $style.on : '']" aria-hidden="true">
              <span :class="$style.thumb" />
            </span>
          </button>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useAlarmSettings } from '@/composables/useAlarmSettings'

defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const camItems = [
  { key: 'abnormal', label: '이상 행동' },
  { key: 'motion',   label: '움직임 감지' },
  { key: 'camError', label: '카메라 연결 오류' },
]
const appItems = [
  { key: 'schedule', label: '일정' },
  { key: 'chatbot',  label: '챗봇' },
  { key: 'appInfo',  label: '앱 정보 수신' },
]
const { settings, toggleAlarmSetting } = useAlarmSettings()
</script>

<style>
.alarm-setting-slide-enter-active,
.alarm-setting-slide-leave-active {
  transition: transform 0.25s ease;
}
.alarm-setting-slide-enter-from,
.alarm-setting-slide-leave-to {
  transform: translateX(100%);
}
</style>

<style module>
@font-face {
  font-family: 'Malang';
  src: url('@/assets/Fonts/Malang_Regular.ttf') format('truetype');
}
@font-face {
  font-family: 'MalangBold';
  src: url('@/assets/Fonts/Malang_Bold.ttf') format('truetype');
}
.page {
  position: fixed;
  inset: 0;
  background-color: var(--settings-page-bg);
  font-family: 'Malang', sans-serif;
  font-size: 1.5rem;
  color: var(--settings-text);
  z-index: 200;
  overflow-y: auto;
  padding-bottom: env(safe-area-inset-bottom);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.head {
  position: relative;
  width: 100%;
  height: calc(5.8rem + env(safe-area-inset-top));
  background-color: var(--settings-card-bg);
  flex-shrink: 0;
  text-align: center;
  color: var(--settings-text);
}
.backButton {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 1.7rem);
  left: 2rem;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.iconArrowRight {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: var(--settings-icon-filter);
}
.headTitle {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 1.7rem);
  left: 50%;
  transform: translateX(-50%);
  font-family: 'MalangBold', sans-serif;
  font-size: 1.6rem;
  white-space: nowrap;
}
.section {
  background-color: var(--settings-card-bg);
  margin: 0 0 0.6rem;
  overflow: hidden;
}
.section:last-of-type { margin-bottom: 0; }
.sectionLabel {
  display: flex;
  align-items: center;
  height: 5.6rem;
  padding: 0 2rem;
  font-family: 'MalangBold', sans-serif;
  font-size: 1.5rem;
  color: var(--settings-text);
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 4.8rem;
  padding: 0 2rem;
  border: 0;
  border-bottom: 0.05rem solid var(--settings-border);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.label {
  font-size: 1.5rem;
  color: var(--settings-text);
}
.track {
  width: 4.3rem;
  height: 2.3rem;
  position: relative;
  flex-shrink: 0;
  border-radius: 2rem;
  background-color: var(--settings-toggle-bg);
  transition: transform 0.18s ease;
}
.track.on {
  background-color: var(--settings-toggle-on);
}
.thumb {
  position: absolute;
  width: 44.19%;
  height: 1.9rem;
  top: calc(50% - 0.95rem);
  left: 4.65%;
  border-radius: 50%;
  background-color: var(--settings-toggle-thumb);

  transition: left 0.24s ease, transform 0.18s ease;
}
.on .thumb {
  left: 51.16%;
}
.track:hover .thumb {
  transform: scale(1.04);
}
.track:active {
  transform: scale(0.97);
}
.track:active .thumb {
  transform: scale(0.96);
}
</style>
