<template>
  <div :class="$style.page">

    <div :class="$style.header">
      <div :class="$style.titleWrap">
        <img :class="$style.iconSettingOn" src="/icons/Nav/Setting_On.svg" alt="설정" />
        <b :class="$style.settingText">Settings</b>
      </div>
      <img :class="$style.iconAlarm" src="/icons/Nav/Bell_Off.svg" alt="알람" @click="showAlarm = true" />
    </div>

    <AlarmPage v-model="showAlarm" />
    <IpSetting v-model="showIp" />
    <ProfilePage v-model="showProfile" />
    <PasswordSetting v-model="showPasswordSetting" />
    <AlarmSetting v-model="showAlarmSetting" />
    <PromptSetting v-model="showPromptSetting" />

    <div :class="$style.card">
      <Profile @openProfile="showProfile = true" />
      <div :class="$style.profileLine" />
      <div :class="$style.menuBox">
        <AccountSection
          @openProfile="showProfile = true"
          @openPasswordSetting="showPasswordSetting = true"
          @openAlarmSetting="showAlarmSetting = true"
        />
        <div :class="$style.divider" />
        <MoreSection @openIp="showIp = true" @openPromptSetting="showPromptSetting = true" />
        <div :class="$style.divider" />
        <button type="button" :class="$style.logoutBtn" @click="handleLogout">로그아웃</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROUTES } from '@/constants'
import { useAuth } from '@/composables/useAuth'
import Profile from './Profile.vue'
import AccountSection from './Account/AccountSection.vue'
import MoreSection from './More/MoreSection.vue'
import AlarmPage from '@/views/AlarmPage/AlarmPage.vue'
import IpSetting from './IpSetting/IpSetting.vue'
import ProfilePage from './Profile/Profile.vue'
import PasswordSetting from './PasswordSetting/PasswordSetting.vue'
import AlarmSetting from './AlarmSetting/AlarmSetting.vue'
import PromptSetting from './PromptSetting/PromptSetting.vue'

const router = useRouter()
const route = useRoute()
const { logout, mustChangePassword } = useAuth()

const showAlarm = ref(false)
const showIp = ref(false)
const showProfile = ref(false)
const showPasswordSetting = ref(false)
const showAlarmSetting = ref(false)
const showPromptSetting = ref(false)

watch(
  () => route.query.panel,
  (panel) => {
    if (panel === 'camera') showIp.value = true
  },
  { immediate: true },
)

// FR-006: a pending initial-password change opens the password sheet on
// arrival. Enforcement UX beyond this is left to the app's own design.
watch(mustChangePassword, (pending) => {
  if (pending) showPasswordSetting.value = true
}, { immediate: true })

function closeOpenPanel() {
  if (showPromptSetting.value) {
    showPromptSetting.value = false
    return true
  }
  if (showAlarmSetting.value) {
    showAlarmSetting.value = false
    return true
  }
  if (showPasswordSetting.value) {
    showPasswordSetting.value = false
    return true
  }
  if (showProfile.value) {
    showProfile.value = false
    return true
  }
  if (showIp.value) {
    showIp.value = false
    return true
  }
  if (showAlarm.value) {
    showAlarm.value = false
    return true
  }
  return false
}

function handleAndroidBack(event) {
  if (!closeOpenPanel()) return
  event.preventDefault()
}

function handleLogout() {
  logout()
  router.replace(ROUTES.LOGIN_ADDRESS)
}

onMounted(() => {
  window.addEventListener('wally:android-back', handleAndroidBack)
})

onBeforeUnmount(() => {
  window.removeEventListener('wally:android-back', handleAndroidBack)
})
</script>

<style module>
@font-face {
  font-family: 'Malang';
  src: url('@/assets/Fonts/Malang_Regular.ttf') format('truetype');
}

.page {
  width: 100%;
  min-height: 100%;
  background-color: var(--settings-page-bg);
  padding-bottom: 2rem;
  font-family: 'Malang', sans-serif;
  font-size: 1.8rem;
  color: var(--settings-text);
}

.header {
  width: 100%;
  min-height: calc(clamp(22rem, 35vw, 32rem) + env(safe-area-inset-top));
  background-color: var(--settings-header-bg);
  border-radius: 0 0 1rem 1rem;
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: calc(env(safe-area-inset-top) + clamp(4rem, 8vw, 7rem)) 2rem 0;
  box-sizing: border-box;
  justify-content: space-between;
}

.titleWrap {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.iconSettingOn {
  width: clamp(2.4rem, 6vw, 3.6rem);
  height: clamp(2.4rem, 6vw, 3.6rem);
  filter: brightness(0) invert(1);
}

.iconAlarm {
  width: clamp(2.4rem, 6vw, 3.6rem);
  height: clamp(2.4rem, 6vw, 3.6rem);
  filter: brightness(0) invert(1);
  cursor: pointer;
}

.settingText {
  font-size: clamp(2rem, 5vw, 3rem);
  color: var(--settings-card-bg);
}

.card {
  background-color: var(--settings-card-bg);
  border-radius: 1rem;
  position: relative;
  z-index: 1;
  width: calc(100% - 4rem);
  margin-top: clamp(-17rem, -30vw, -12rem);
  margin-left: 2rem;
  padding: 2.4rem 1.6rem;
}

.section {
  margin-top: 1.6rem;
}

.sectionLabel {
  font-size: 1.4rem;
  color: var(--settings-muted);
  margin-bottom: 0.8rem;
}

.menuItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.6rem 0;
  border-bottom: 0.05rem solid var(--settings-border);
}

.icon {
  width: 2.4rem;
  height: 2.4rem;
}

.profileLine {
  height: 0.05rem;
  background-color: var(--settings-border);
  margin: 1.6rem 0 0.8rem;
}

.menuBox {
  background-color: var(--settings-card-bg);
  border-radius: 1rem;
  padding: 0 1.6rem;
  overflow: hidden;
}

.divider {
  height: 0.05rem;
  background-color: var(--settings-border);
}
.logoutBtn {
  width: 100%;
  margin-top: 1.6rem;
  min-height: clamp(4.4rem, 11vw, 5.6rem);
  padding: clamp(1.2rem, 3vw, 2rem) 0;
  border: 0;
  background-color: transparent;
  color: var(--settings-danger);
  font-family: 'Malang', sans-serif;
  font-size: var(--fluid-text-lg);
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

@media (orientation: landscape) {
  .page {
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    padding-bottom: max(2rem, env(safe-area-inset-bottom));
  }

  .header {
    min-height: clamp(14rem, 72vh, 22rem);
    padding-top: calc(env(safe-area-inset-top) + clamp(2rem, 10vh, 4rem));
  }

  .card {
    margin-top: clamp(-12rem, -38vh, -8rem);
    margin-bottom: 2rem;
  }
}
</style>
