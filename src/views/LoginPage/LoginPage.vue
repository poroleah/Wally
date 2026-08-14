<template>
  <section :class="$style.loginPage" aria-label="로그인">
    <img v-theme-src="{ light: '/icons/Logo.svg', dark: '/icons/Logo_Dark.svg' }" :class="$style.logo" src="/icons/Logo.svg" alt="ally" />

    <form :class="$style.form" @submit.prevent="handleLogin">
      <p v-if="notice" :class="$style.notice">{{ notice }}</p>
      <label :class="$style.label" for="login-id">아이디</label>
      <input
        id="login-id"
        v-model="username"
        :class="$style.input"
        type="text"
        name="loginId"
        placeholder="아이디"
        autocomplete="username"
      />

      <label :class="$style.label" for="login-password">비밀번호</label>
      <div :class="$style.passwordField">
        <input
          id="login-password"
          v-model="password"
          :class="$style.passwordInput"
          :type="showLoginPassword ? 'text' : 'password'"
          name="password"
          placeholder="비밀번호"
          autocomplete="current-password"
        />
        <img
          :class="$style.eyeIcon"
          :src="showLoginPassword ? '/icons/Setting/Eye_On.svg' : '/icons/Setting/Eye_Off.svg'"
          alt=""
          @click="showLoginPassword = !showLoginPassword"
        />
      </div>

      <div :class="$style.loginOptions">
        <button
          :class="$style.keepLogin"
          type="button"
          :aria-pressed="keepLogin"
          @click="toggleKeepLogin"
        >
          <img
            :class="$style.keepLoginIcon"
            :src="keepLogin ? '/icons/Login/LoginOn.svg' : '/icons/Login/LoginOff.svg'"
            alt=""
          />
          <span>로그인 유지</span>
        </button>
        <div :class="$style.findLinks" aria-label="계정 찾기">
          <button :class="$style.findButton" type="button" @click="showUnsupported">아이디</button>
          <img :class="$style.dotIcon" src="/icons/Login/LoginDot.svg" alt="" />
          <button :class="$style.findButton" type="button" @click="showUnsupported">비밀번호 찾기</button>
        </div>
      </div>
      <button :class="$style.button" type="submit" :disabled="loading">{{ loading ? '로그인 중' : '로그인' }}</button>
      <p v-if="error" :class="$style.error">{{ error }}</p>
    </form>
  </section>
</template>


<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login, mustChangePassword, consumeLoginNotice } = useAuth()

const username = ref('')
const password = ref('')
const keepLogin = ref(false)
const loading = ref(false)
const showLoginPassword = ref(false)
const error = ref('')
const notice = ref(consumeLoginNotice())

const toggleKeepLogin = () => {
  keepLogin.value = !keepLogin.value
}

const showUnsupported = () => {
  error.value = '아직 지원되지 않습니다.'
}

const handleLogin = async () => {
  error.value = ''
  notice.value = ''
  loading.value = true

  try {
    await login(username.value, password.value, keepLogin.value)
    // FR-006: the initial password must be changed on the first login —
    // steer to the settings page, where the password sheet opens itself.
    router.push(mustChangePassword.value ? ROUTES.SETTINGS : ROUTES.HOME)
  } catch (e) {
    const message = e?.message || ''
    if (message.startsWith('network failed')) {
      error.value = '서버에 연결할 수 없습니다.'
    } else if (message.startsWith('server error')) {
      error.value = '서버 오류가 발생했습니다.'
    } else {
      error.value = '아이디 또는 비밀번호를 확인해주세요.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style module>
.loginPage {
  --page-bg: var(--login-bg);
  --field-bg: var(--login-surface);
  --primary: var(--login-primary);
  --secondary: var(--login-secondary);
  --border: var(--login-border);
  --text: var(--login-text);
  --text-muted: var(--login-muted);
  --button-text: var(--login-button-text);

  width: 100%;
  height: 100%;
  min-height: 100%;
  max-height: none;
  border-radius: 10px;
  background-color: var(--page-bg);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  color: var(--text-muted);
  font-family: 'Hancom MalangMalang', 'Malang', sans-serif;
  font-size: 12px;
}


.logo {
  display: block;
  width: 134px;
  height: auto;
  margin: 189px auto 39.9px;
}

.form {
  display: flex;
  width: 320px;
  margin: 0 auto;
  flex-direction: column;
  gap: 16px;
}

.label {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  border: 0;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.input,
.button {
  width: 100%;
  height: 48px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 12px;
  line-height: 22px;
}

.input {
  border: 1px solid var(--border);
  background-color: var(--field-bg);
  color: var(--text);
  padding: 9px;
  box-shadow: var(--login-shadow);
}

.input::placeholder {
  color: var(--text-muted);
}

.loginOptions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 24px;
  margin-top: -8px;
  line-height: 22px;
}

.keepLogin,
.findLinks {
  display: flex;
  align-items: center;
}

.keepLogin {
  gap: 3px;
  border: 0;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.keepLogin:focus,
.keepLogin:focus-visible,
.findButton:focus,
.findButton:focus-visible {
  outline: none;
}

.keepLoginIcon {
  filter: var(--login-icon-filter);
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
}

.findLinks {
  gap: 2px;
}

.dotIcon {
  filter: var(--login-icon-filter);
  display: block;
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
}

.findButton {
  color: inherit;
  text-decoration: none;
  border: 0;
  padding: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.passwordField {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.passwordInput {
  width: 100%;
  height: 48px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background-color: var(--field-bg);
  color: var(--text);
  padding: 9px 38px 9px 9px;
  font-family: inherit;
  font-size: 12px;
  line-height: 22px;
  outline: none;
  box-shadow: var(--login-shadow);
}

.passwordInput::placeholder {
  color: var(--text-muted);
}

.eyeIcon {
  filter: var(--login-icon-filter);
  position: absolute;
  right: 9px;
  width: 20px;
  height: 20px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.button {
  border: 0;
  background-color: var(--primary);
  color: var(--button-text);
  font-weight: 700;
  cursor: pointer;
}

.button:disabled {
  opacity: 0.65;
  cursor: default;
}

.error {
  min-height: 18px;
  margin-top: -8px;
  color: var(--login-error);
  text-align: center;
  font-size: 12px;
  line-height: 18px;
}

.notice {
  margin-bottom: 4px;
  color: var(--secondary);
  text-align: center;
  font-size: 12px;
  line-height: 18px;
}

@media (min-width: 700px) {
  .loginPage {
    font-size: clamp(16px, min(2.2dvw, 1.8dvh), 19px);
  }

  .logo {
    width: clamp(168px, min(24dvw, 18dvh), 285px);
    margin-top: clamp(178px, 19dvh, 260px);
    margin-bottom: clamp(46px, 5.2dvh, 68px);
  }

  .form {
    width: clamp(320px, min(74dvw, 58dvh), 760px);
    gap: clamp(20px, min(3dvw, 2.1dvh), 28px);
  }

  .input,
  .button,
  .passwordInput {
    height: clamp(58px, min(8.5dvw, 6dvh), 78px);
    border-radius: clamp(12px, 1.4dvw, 16px);
    font-size: clamp(16px, min(2.2dvw, 1.8dvh), 19px);
    line-height: 1.55;
  }

  .input {
    padding: clamp(14px, 2dvw, 20px);
  }

  .passwordInput {
    padding: clamp(14px, 2dvw, 20px) clamp(52px, 7dvw, 68px) clamp(14px, 2dvw, 20px) clamp(14px, 2dvw, 20px);
  }

  .loginOptions {
    min-height: clamp(30px, 4dvw, 36px);
    margin-top: clamp(-12px, -1.5dvw, -8px);
  }

  .keepLogin {
    gap: clamp(5px, 0.8dvw, 8px);
  }

  .keepLoginIcon,
  .eyeIcon {
    width: clamp(24px, 3.5dvw, 32px);
    height: clamp(24px, 3.5dvw, 32px);
  }

  .keepLoginIcon {
    flex-basis: clamp(24px, 3.5dvw, 32px);
  }

  .eyeIcon {
    right: clamp(14px, 2dvw, 20px);
  }

  .dotIcon {
    width: clamp(10px, 1.4dvw, 13px);
    height: clamp(10px, 1.4dvw, 13px);
    flex-basis: clamp(10px, 1.4dvw, 13px);
  }

  .error {
    font-size: clamp(14px, 1.8dvw, 16px);
    line-height: 1.5;
  }

  .notice {
    font-size: clamp(14px, 1.8dvw, 16px);
    line-height: 1.5;
  }
}

@media (orientation: landscape) {
  .loginPage {
    display: flex;
    flex-direction: column;
    padding-top: max(24px, env(safe-area-inset-top));
    padding-bottom: max(24px, env(safe-area-inset-bottom));
  }

  .logo {
    margin: auto auto clamp(20px, 6dvh, 32px);
  }

  .form {
    margin: 0 auto auto;
  }

}
</style>
