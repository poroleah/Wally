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
import HomeOn from '@/assets/icons/nav/Home_On.svg'
import HomeOff from '@/assets/icons/nav/Home_Off.svg'
import CalendarOn from '@/assets/icons/nav/Calendar_On.svg'
import CalendarOff from '@/assets/icons/nav/Calendar_Off.svg'
import AnalysisOn from '@/assets/icons/nav/Analysis_On.svg'
import AnalysisOff from '@/assets/icons/nav/Analysis_Off.svg'
import SettingOn from '@/assets/icons/nav/Setting_On.svg'
import SettingOff from '@/assets/icons/nav/Setting_Off.svg'

const route = useRoute()

const tabs = [
  { label: '홈',     path: ROUTES.HOME,     iconOn: HomeOn,     iconOff: HomeOff },
  { label: '캘린더', path: ROUTES.SCHEDULE, iconOn: CalendarOn, iconOff: CalendarOff },
  { label: '분석',   path: ROUTES.CHAT,     iconOn: AnalysisOn, iconOff: AnalysisOff },
  { label: '설정',   path: ROUTES.SETTINGS, iconOn: SettingOn,  iconOff: SettingOff },
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
