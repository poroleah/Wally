<template>
  <nav class="nav">
    <NavItem
      v-for="tab in tabs"
      :key="tab.path"
      :path="tab.path"
      :label="tab.label"
      :iconOn="tab.iconOn"
      :iconOff="tab.iconOff"
      :isActive="route.path === tab.path"
    />
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
import NavItem from '@/components/Nav/NavItem.vue'
import { ROUTES } from '@/constants'

const route = useRoute()

const tabs = [
  { label: '홈',     path: ROUTES.HOME,     iconOn: '/icons/Nav/Home_On.svg',     iconOff: '/icons/Nav/Home_Off.svg' },
  { label: '캘린더', path: ROUTES.SCHEDULE, iconOn: '/icons/Nav/Calendar_On.svg', iconOff: '/icons/Nav/Calendar_Off.svg' },
  { label: '분석',   path: ROUTES.ANALYSIS, iconOn: '/icons/Nav/Analysis_On.svg', iconOff: '/icons/Nav/Analysis_Off.svg' },
  { label: '설정',   path: ROUTES.SETTINGS, iconOn: '/icons/Nav/Setting_On.svg',  iconOff: '/icons/Nav/Setting_Off.svg' },
]

</script>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  justify-content: space-around;
  position: relative;
  flex: 0 0 calc(5.6rem + env(safe-area-inset-bottom));
  width: 100%;
  height: calc(5.6rem + env(safe-area-inset-bottom));
  padding: 0 0 env(safe-area-inset-bottom);
  background-color: var(--nav-bg);
  overflow: visible;
  z-index: 100;
}

:global(html:not(.wally-native) .nav) {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
}
@media (min-width: 48rem) and (orientation: portrait) {
  .nav {
    flex-basis: calc(7.2rem + env(safe-area-inset-bottom));
    height: calc(7.2rem + env(safe-area-inset-bottom));
  }
}

</style>
