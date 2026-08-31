<template>
  <div :class="$style.head">
    <div :class="$style.topBar">
      <img :class="$style.backIcon" src="/icons/Setting/Arrow.svg" alt="뒤로가기" @click="emit('close')" />
      <b :class="$style.title">알림</b>
      <button :class="$style.trashButton" type="button" aria-label="알림 삭제" @click="!clearing && emit('clear')">
        <img :class="$style.trashIcon" src="/icons/Calendar/Plan/Trash.svg" alt="" />
      </button>
    </div>
    <div :class="$style.tabs">
      <div
        v-for="tab in tabs"
        :key="tab"
        :class="[$style.tab, activeTab === tab && $style.tabActive]"
        @click="selectTab(tab)"
      >{{ tab }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({ clearing: Boolean })
const emit = defineEmits(['close', 'update:tab', 'clear'])

const tabs = ['전체', '이상행동', '일정']

const activeTab = ref('전체')

const selectTab = (tab) => {
  activeTab.value = tab
  emit('update:tab', tab)
}
</script>

<style module>


.head {
  width: 100%;
  padding: calc(env(safe-area-inset-top) + 1rem) 2rem 0;
  box-sizing: border-box;
  background-color: var(--log-surface);
}

.topBar {
  display: flex;
  align-items: center;
  height: 4.4rem;
  position: relative;
}

.backIcon {
  width: 2.4rem;
  height: 2.4rem;
  cursor: pointer;
  filter: var(--log-icon-filter);
  transform: scaleX(-1);
}

.title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.6rem;
  line-height: 100%;
  color: var(--log-text);
  font-family: 'MalangBold', sans-serif;
  width: 6.2rem;
  height: 2.4rem;
  text-align: center;
}

.trashButton {
  position: absolute;
  right: 0;
  width: 2.4rem;
  height: 2.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  opacity: 1;
  transition: opacity 0.18s ease, transform 0.18s ease;
  -webkit-tap-highlight-color: transparent;
}

.trashIcon {
  width: 2.4rem;
  height: 2.4rem;
  object-fit: contain;
  filter: var(--log-icon-filter);
}

.tabs {
  display: flex;
  gap: 0.8rem;
  padding: 1rem 0;
}

.tab {
  height: 3.2rem;
  border-radius: 3.3rem;
  background-color: var(--log-surface-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1.2rem;
  font-family: 'Malang', sans-serif;
  font-weight: 400;
  font-size: 1.8rem;
  line-height: 2.2rem;
  color: var(--log-text);
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.tab:focus,
.tab:focus-visible {
  outline: none;
}

.tabActive {
  background-color: var(--log-text);
  color: var(--log-bg);
}
</style>
