<template>
  <Transition name="session-modal">
    <div v-if="show" class="session-backdrop" role="presentation">
      <div
        class="session-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-expiry-title"
      >
        <b id="session-expiry-title" class="session-title">세션 만료 임박</b>
        <p class="session-copy">남은 시간 {{ timeLabel }}. 세션을 연장하시겠습니까?</p>
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
            {{ extending ? '연장 중' : '연장' }}
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
  return m > 0 ? `${m}분 ${s}초` : `${s}초`
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
  gap: 1.3rem;
  padding: 2rem;
  border-radius: 1.6rem;
  background: var(--app-surface);
  color: var(--app-text);
  font-family: 'Malang', sans-serif;
  box-shadow: 0 0.4rem 1.4rem var(--app-shadow);
}

.session-title {
  font-size: 1.6rem;
  line-height: 1.4;
}

.session-copy {
  font-size: 1.4rem;
  line-height: 1.6;
  color: var(--color-text-2);
}

.session-actions {
  display: flex;
  gap: 0.8rem;
}

.session-btn {
  flex: 1;
  height: 4.4rem;
  border: none;
  border-radius: 1rem;
  background: var(--app-surface-muted);
  color: var(--color-text-2);
  font-family: inherit;
  font-size: 1.4rem;
  cursor: pointer;
}

.session-btn.primary {
  background: var(--app-primary);
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
