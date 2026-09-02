<template>
  <div :class="$style.overlay" role="dialog" aria-modal="true" aria-label="비밀번호 변경">
    <form :class="$style.pwResetParent" @submit.prevent="handleChange">
      <b :class="$style.title">비밀번호 변경</b>
      <div :class="$style.title2">최초의 로그인입니다. 계속 하시려면 비밀번호를 변경하세요.</div>

      <label v-for="field in fields" :key="field.key" :class="$style.pwReset">
        <input
          v-model="form[field.key]"
          :class="$style.content"
          :type="visible[field.key] ? 'text' : 'password'"
          :placeholder="field.placeholder"
          :autocomplete="field.autocomplete"
        />
        <button
          type="button"
          :class="$style.iconEye"
          :aria-label="visible[field.key] ? '비밀번호 숨기기' : '비밀번호 보기'"
          @click="visible[field.key] = !visible[field.key]"
        >
          <img
            :class="$style.vectorIcon"
            :src="visible[field.key] ? '/icons/Setting/Eye_On.svg' : '/icons/Setting/Eye_Off.svg'"
            alt=""
          />
        </button>
      </label>

      <button :class="$style.chatSending" type="submit" :disabled="loading">
        <div :class="$style.content4">{{ loading ? '변경 중' : '변경' }}</div>
      </button>
      <p :class="$style.error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { API_ENDPOINTS } from '@/endpoints'
import { authFetch, failureMessage } from '@/composables/useFetch'

// Forced first-login mode (FR-006): no cancel until the change succeeds.
const emit = defineEmits(['done'])

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
const loading = ref(false)
const error = ref('')

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

async function handleChange() {
  error.value = ''

  const validationMessage = validate()
  if (validationMessage) {
    error.value = validationMessage
    return
  }

  loading.value = true
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
      error.value = failureMessage(data, '비밀번호 변경에 실패했습니다.')
      return
    }

    emit('done')
  } catch {
    error.value = '서버에 연결할 수 없습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<style module>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 시안: 카드 좌우 여백 40px */
  padding: 40px;
  background: rgba(0, 0, 0, 0.45);
}

/* 시안 원본: 320x260 카드, 절대좌표(제목 16 / 안내 39 / 입력 68·116·164 / 버튼 212,
   좌우 20px 여백) — 에러 문구 한 줄만 하단에 추가되어 카드가 그만큼 늘어난다. */
.pwResetParent {
  width: min(320px, 100%);
  position: relative;
  border-radius: 10px;
  background-color: #fffbf5;
  overflow: hidden;
  text-align: left;
  font-size: 12px;
  color: #84776e;
  font-family: 'Hancom MalangMalang', 'Malang', sans-serif;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
}

.title {
  color: #000;
  line-height: 22px;
}

.title2 {
  margin-top: 1px;
  font-size: 10px;
  line-height: 15px;
  color: #000;
}

.pwReset {
  position: relative;
  margin-top: 14px;
  border-radius: 10px;
  background-color: #f5f0e9;
  border: 0.5px solid #eee8de;
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.pwReset + .pwReset {
  margin-top: 16px;
}

.content {
  width: 100%;
  height: 100%;
  border: 0;
  outline: none;
  background: transparent;
  padding: 0 32px 0 8px;
  color: #84776e;
  font-family: inherit;
  font-size: 12px;
  line-height: 22px;
}

.content::placeholder {
  color: #84776e;
}

.iconEye {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 16px;
  height: 16px;
  overflow: hidden;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.vectorIcon {
  width: 100%;
  height: 100%;
  display: block;
}

.chatSending {
  margin-top: 16px;
  border-radius: 10px;
  background-color: #ffb085;
  border: 0.5px solid #eee8de;
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  flex-shrink: 0;
  overflow: hidden;
  text-align: center;
  color: #fffbf5;
  font-family: inherit;
  font-size: 12px;
  padding: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.chatSending:disabled {
  opacity: 0.65;
  cursor: default;
}

.content4 {
  line-height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 32px;
}

.error {
  min-height: 15px;
  margin: 6px 0 0;
  font-size: 10px;
  line-height: 15px;
  text-align: center;
  color: var(--login-error, #d24f3f);
}
</style>
