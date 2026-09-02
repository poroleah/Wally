<template>
  <Transition name="session-modal">
    <div v-if="show" class="session-backdrop" role="presentation">
      <div
        class="session-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-expiry-title"
      >
        <b id="session-expiry-title" class="session-title">자동 로그아웃 안내</b>
        <b class="session-count">
          <span>로그아웃까지 남은 시간: </span>
          <span class="session-count-time">{{ timeLabel }}</span>
        </b>
        <p class="session-copy">
          잠시 후 자동으로 로그아웃될 예정입니다.<br>
          로그인 시간을 연장하시겠습니까?
        </p>
        <div class="session-actions">
          <button type="button" class="session-btn" @click="$emit('logout')">
            로그아웃
          </button>
          <button
            type="button"
            class="session-btn primary"
            :disabled="!canExtend || extending"
            @click="$emit('extend')"
          >
            {{ extending ? '연장 중' : '로그인 연장' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  remainingSeconds: { type: Number, default: 0 },
  canExtend: { type: Boolean, default: false },
  extending: { type: Boolean, default: false },
})

defineEmits(['extend', 'logout'])

const timeLabel = computed(() => {
  const m = Math.floor(props.remainingSeconds / 60)
  const s = props.remainingSeconds % 60
  return m > 0 ? `${m}분 ${String(s).padStart(2, '0')}초` : `${s}초`
})
</script>

<style scoped>
.session-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.2rem;
  background: rgba(0, 0, 0, 0.45);
}

.session-card {
  width: min(32rem, 100%);
  display: flex;
  flex-direction: column;
  padding: 2.4rem 2rem;
  border-radius: 1rem;
  background: var(--app-surface, #fffbf5);
  color: var(--app-text, #000);
  text-align: left;
  font-family: 'Malang', 'Hancom MalangMalang', sans-serif;
  box-shadow: 0 0.4rem 1.4rem var(--app-shadow);
}

.session-title {
  font-size: 1.4rem;
  line-height: 1.4;
  font-family: 'MalangBold', 'Malang', 'Hancom MalangMalang', sans-serif;
  font-weight: 700;
}

.session-count {
  margin-top: 1.4rem;
  font-size: 2rem;
  line-height: 1.4;
  font-family: 'MalangBold', 'Malang', 'Hancom MalangMalang', sans-serif;
  font-weight: 700;
}

.session-count-time {
  color: var(--app-primary, #ffb085);
  font-variant-numeric: tabular-nums;
}

.session-copy {
  margin: 1.4rem 0 0;
  font-size: 1.2rem;
  line-height: 1.5;
}

.session-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1.6rem;
  margin-top: 1.4rem;
}

.session-btn {
  width: 8.8rem;
  height: 3.2rem;
  border: 0.05rem solid #eee8de;
  border-radius: 1rem;
  background: #eee8de;
  color: #84776e;
  font-family: inherit;
  font-size: 1.2rem;
  cursor: pointer;
}

/* 다크: #eee8de의 팔레트 대응(#12100f)은 카드(#1c1918)에 묻혀 버려서,
   세션 칩과 같은 웜 뉴트럴 톤으로 분리한다. */
:global(:root.theme-dark) .session-btn,
:global(body.theme-dark) .session-btn,
:global(#app.theme-dark) .session-btn {
  border-color: #2c2723;
  background: #2c2723;
  color: #b0a59a;
}

.session-btn.primary {
  background: var(--app-primary, #ffb085);
  color: var(--login-button-text, #fffbf5);
  font-weight: 700;
}

.session-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.session-modal-enter-active,
.session-modal-leave-active {
  transition: opacity 0.2s ease;
}

.session-modal-enter-from,
.session-modal-leave-to {
  opacity: 0;
}
</style>
