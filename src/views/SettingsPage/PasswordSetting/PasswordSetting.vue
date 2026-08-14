<template>
  <Teleport to="body">
    <Transition name="password-slide">
      <div v-if="modelValue" :class="$style.page">
        <div :class="$style.head">
          <img :class="$style.iconBack" src="/icons/Calender/chevron.svg" alt="" @click="close" />
          <b :class="$style.title">비밀번호 변경</b>
        </div>

        <form :class="$style.frame" @submit.prevent="handleSave">
          <label v-for="field in fields" :key="field.key" :class="$style.inputRow">
            <input
              v-model="form[field.key]"
              :class="$style.input"
              :type="visible[field.key] ? 'text' : 'password'"
              :placeholder="field.placeholder"
              :autocomplete="field.autocomplete"
            />
            <button
              type="button"
              :class="$style.eyeButton"
              :aria-label="visible[field.key] ? '비밀번호 숨기기' : '비밀번호 보기'"
              @click="visible[field.key] = !visible[field.key]"
            >
              <img
                :class="$style.eyeIcon"
                :src="visible[field.key] ? '/icons/Setting/Eye_On.svg' : '/icons/Setting/Eye_Off.svg'"
                alt=""
              />
            </button>
          </label>

          <button type="submit" :class="$style.saveButton" :disabled="saving">
            {{ saving ? '변경 중' : '저장' }}
          </button>
          <div v-if="message" :class="[$style.statusText, success ? $style.success : '']">{{ message }}</div>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { API_ENDPOINTS } from '@/endpoints'
import { ROUTES } from '@/constants'
import { useAuth } from '@/composables/useAuth'
import { authFetch } from '@/composables/useFetch'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const router = useRouter()

const fields = [
  { key: 'currentPassword', placeholder: '현재 비밀번호', autocomplete: 'current-password' },
  { key: 'newPassword', placeholder: '새 비밀번호', autocomplete: 'new-password' },
  { key: 'confirmPassword', placeholder: '새 비밀번호 확인', autocomplete: 'new-password' },
]

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const visible = reactive({
  currentPassword: false,
  newPassword: false,
  confirmPassword: false,
})
const saving = ref(false)
const message = ref('')
const success = ref(false)

function resetForm() {
  form.currentPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
  visible.currentPassword = false
  visible.newPassword = false
  visible.confirmPassword = false
  message.value = ''
  success.value = false
}

function close() {
  emit('update:modelValue', false)
}

function validate() {
  if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
    return '비밀번호를 모두 입력해주세요.'
  }
  if (form.currentPassword === form.newPassword) {
    return '새 비밀번호가 현재 비밀번호와 같습니다.'
  }
  if (form.newPassword.length < 4) {
    return '새 비밀번호는 4자 이상이어야 합니다.'
  }
  if (form.newPassword !== form.confirmPassword) {
    return '새 비밀번호가 일치하지 않습니다.'
  }
  return ''
}

async function handleSave() {
  message.value = ''
  success.value = false

  const validationMessage = validate()
  if (validationMessage) {
    message.value = validationMessage
    return
  }

  saving.value = true
  try {
    const res = await authFetch(API_ENDPOINTS.changePassword, {
      method: 'POST',
      body: {
        current_password: form.currentPassword,
        new_password: form.newPassword,
      },
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      message.value = data?.detail || data?.error || '비밀번호 변경에 실패했습니다.'
      return
    }

    // FR-006: the change satisfies a pending initial-password requirement.
    const { clearMustChangePassword, logout } = useAuth()
    clearMustChangePassword()
    // FR-005: the backend revokes every token of the account on a password
    // change, this session included — move straight to re-login. The notice
    // rides the logout reason and is shown on the login page; the server
    // address is untouched, so the login page is reached directly.
    close()
    logout({ revoke: false, reason: '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.' })
    router.push(ROUTES.LOGIN)
  } catch {
    message.value = '서버에 연결할 수 없습니다.'
  } finally {
    saving.value = false
  }
}

watch(() => props.modelValue, (open) => {
  if (open) resetForm()
})
</script>

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
  background-color: var(--settings-card-bg);
  font-size: 1.6rem;
  color: var(--settings-text);
  font-family: 'Malang', sans-serif;
  display: flex;
  flex-direction: column;
  z-index: 200;
}

.head {
  position: relative;
  width: 100%;
  height: calc(5.8rem + env(safe-area-inset-top));
  flex-shrink: 0;
  text-align: center;
}

.iconBack {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 1.7rem);
  left: 2rem;
  width: 2.4rem;
  height: 2.4rem;
  object-fit: contain;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  filter: var(--settings-icon-filter);
}

.title {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 1.7rem);
  left: 50%;
  transform: translateX(-50%);
  font-family: 'MalangBold', sans-serif;
  font-size: 1.6rem;
}

.frame {
  flex: 1;
  background-color: var(--settings-card-bg);
  font-size: 1.2rem;
  color: var(--settings-muted);
  padding: 2.2rem 2rem calc(env(safe-area-inset-bottom) + 1.8rem);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 3.2rem;
}

.inputRow {
  width: 100%;
  border-bottom: 0.03rem solid var(--settings-muted);
  display: flex;
  align-items: center;
}

.input {
  width: 100%;
  height: 4.8rem;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1.2rem;
  font-family: 'Malang', sans-serif;
  color: var(--settings-text);
  line-height: 2.2rem;
}

.input::placeholder {
  color: var(--settings-muted);
}

.eyeButton {
  width: 3.2rem;
  height: 3.2rem;
  flex-shrink: 0;
  border: 0;
  padding: 0.6rem;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.eyeIcon {
  width: 2rem;
  height: 2rem;
  display: block;
  filter: var(--settings-icon-filter);
}

.saveButton {
  width: 100%;
  min-height: 4.8rem;
  margin-top: auto;
  border: 0;
  border-radius: 1rem;
  background-color: var(--settings-toggle-on);
  color: var(--settings-button-text);
  font-family: 'MalangBold', sans-serif;
  font-size: 1.2rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.saveButton:disabled {
  opacity: 0.55;
  cursor: default;
}

.statusText {
  min-height: 2.4rem;
  color: var(--settings-danger);
  font-size: 1rem;
  line-height: 1.4;
  text-align: center;
}

.success {
  color: var(--settings-muted);
}
</style>

<style>
.password-slide-enter-active,
.password-slide-leave-active {
  transition: transform 0.25s ease;
}
.password-slide-enter-from,
.password-slide-leave-to {
  transform: translateX(100%);
}
</style>
