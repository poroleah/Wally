<template>
  <section :class="$style.loginAddress" aria-label="서버 주소 인증">
    <img v-theme-src="{ light: '/icons/Logo.svg', dark: '/icons/Logo_Dark.svg' }" :class="$style.logo" src="/icons/Logo.svg" alt="ally" />

    <form :class="$style.form" @submit.prevent="authenticateServer">
      <label :class="$style.label" for="server-address">서버주소</label>
      <input
        id="server-address"
        :class="$style.input"
        type="text"
        v-model="serverAddress"
        name="serverAddress"
        placeholder="서버주소"
        autocomplete="url"
      />
      <button :class="$style.button" type="submit">인증하기</button>
    </form>
  </section>
</template>


<script setup>
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants'
import { useServerAuth } from '@/composables/useServerAuth'

const router = useRouter()
const { serverAddress, authenticateServer: saveServerAuthentication } = useServerAuth()

const authenticateServer = () => {
  if (!saveServerAuthentication()) return

  router.push(ROUTES.LOGIN)
}
</script>

<style module>
.loginAddress {
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
}


.logo {
  display: block;
  width: 134px;
  height: auto;
  margin: 189px auto 72.9px;
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

.button {
  border: 0;
  background-color: var(--primary);
  color: var(--button-text);
  font-weight: 700;
  cursor: pointer;
}

@media (min-width: 700px) {
  .loginAddress {
    font-size: clamp(16px, min(2.2dvw, 1.8dvh), 19px);
  }

  .logo {
    width: clamp(168px, min(24dvw, 18dvh), 285px);
    margin-top: clamp(178px, 19dvh, 260px);
    margin-bottom: clamp(64px, 7dvh, 88px);
  }

  .form {
    width: clamp(320px, min(74dvw, 58dvh), 760px);
    gap: clamp(20px, min(3dvw, 2.1dvh), 28px);
  }

  .input,
  .button {
    height: clamp(58px, min(8.5dvw, 6dvh), 78px);
    border-radius: clamp(12px, 1.4dvw, 16px);
    font-size: clamp(16px, min(2.2dvw, 1.8dvh), 19px);
    line-height: 1.55;
  }

  .input {
    padding: clamp(14px, 2dvw, 20px);
  }
}

@media (orientation: landscape) {
  .loginAddress {
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
