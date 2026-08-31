<template>
  <Teleport to="body">
    <Transition name="prompt-setting-slide">
      <div v-if="modelValue" :class="$style.page">
        <div :class="$style.head">
          <img :class="$style.iconBack" src="/icons/Calendar/chevron.svg" alt="" @click="close" />
          <b :class="$style.title">프롬프트 설정</b>
        </div>

        <form :class="$style.frame" @submit.prevent="handleSave">
          <section :class="$style.section">
            <label :class="$style.label" for="ai-prompt">질의 프롬프트</label>
            <p :class="$style.hint">분석 지시문입니다. 영어만 지원합니다.</p>
            <div :class="$style.inputCard">
              <textarea
                id="ai-prompt"
                v-model="prompt"
                :class="$style.textarea"
                rows="7"
                placeholder="예: What is the dog doing? Answer in one sentence."
              />
            </div>
          </section>

          <section :class="$style.section">
            <label :class="$style.label" for="ai-triggers">주요 키워드</label>
            <p :class="$style.hint">분석 결과문에서 이벤트 발생 여부를 판단합니다. 영어만 지원합니다.</p>
            <div :class="$style.inputCard">
              <div :class="$style.keywordRow">
                <input
                  id="ai-triggers"
                  v-model="triggers"
                  :class="$style.input"
                  placeholder="예: barking, vomiting"
                />
                <button
                  type="button"
                  :class="$style.clearBtn"
                  :disabled="!triggers"
                  aria-label="키워드 지우기"
                  @click="triggers = ''"
                >
                  <img src="/icons/Setting/Trash.svg" alt="" />
                </button>
              </div>
            </div>
          </section>


          <button type="submit" :class="$style.saveBtn" :disabled="!canSave">
            {{ saving ? '저장 중' : '저장' }}
          </button>
          <div v-if="status" :class="[$style.statusText, success ? $style.success : '']">{{ status }}</div>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch } from 'vue'
import { usePromptSettings } from '@/composables/usePromptSettings'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const { prompt, triggers, saving, status, success, canSave, syncRealtimeValues, savePromptSettings, clearStatus } = usePromptSettings()

function close() {
  emit('update:modelValue', false)
}

async function handleSave() {
  try {
    await savePromptSettings({ prompt: prompt.value, triggers: triggers.value })
  } catch {
    // Status text is set in the composable.
  }
}

watch(() => props.modelValue, (open) => {
  if (!open) return
  clearStatus()
  syncRealtimeValues(false)
})
</script>

<style module>

.page {
  position: fixed;
  inset: 0;
  z-index: 200;
  background-color: var(--settings-card-bg);
  color: var(--settings-text);
  font-family: 'Malang', sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  position: relative;
  padding: 0 2rem 1.8rem;
  box-sizing: border-box;
  background-color: var(--settings-card-bg);
}

.section {
  position: absolute;
  left: 2rem;
  right: 2rem;
}

.section:first-of-type {
  top: 1.7rem;
}

.section:nth-of-type(2) {
  top: 26.2rem;
}

.label {
  display: flex;
  align-items: center;
  width: 9.1rem;
  height: 2.3rem;
  margin: 0;
  color: var(--settings-text);
  font-family: 'Malang', sans-serif;
  font-size: 1.5rem;
  line-height: 2.2rem;
}

.hint {
  display: flex;
  align-items: center;
  width: 100%;
  height: 1.9rem;
  margin: 0;
  color: var(--settings-muted);
  font-size: 1rem;
  line-height: 2.2rem;
}

.inputCard {
  margin-top: 0.3rem;
  background-color: var(--settings-page-bg);
  border: 0.05rem solid var(--settings-border);
  border-radius: 1rem;
  box-sizing: border-box;
  overflow: hidden;
}

.section:first-of-type .inputCard {
  width: 100%;
  height: 15.8rem;
  padding: 0 0.8rem;
}

.section:nth-of-type(2) .inputCard {
  width: calc(100% - 4.4rem);
  height: 3.2rem;
  padding: 0 0.8rem;
  overflow: visible;
}

.textarea,
.input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--settings-text);
  font-family: 'Malang', sans-serif;
  font-size: 1.2rem;
  line-height: 2.2rem;
  box-sizing: border-box;
}

.textarea {
  min-height: 15.6rem;
  padding: 0;
  resize: none;
}

.textarea::placeholder,
.input::placeholder {
  color: var(--settings-muted);
  opacity: 1;
}

.keywordRow {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
}

.input {
  height: 3.2rem;
  padding: 0;
}

.clearBtn {
  position: absolute;
  top: 50%;
  right: -5.2rem;
  width: 3.2rem;
  height: 3.2rem;
  padding: 0;
  border: 0;
  border-radius: 0.5rem;
  background-color: var(--settings-page-bg);
  border: 0.05rem solid var(--settings-border);
  box-sizing: border-box;
  display: grid;
  place-items: center;
  cursor: pointer;
  transform: translateY(-50%);
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}

.clearBtn:disabled {
  opacity: 1;
  cursor: default;
}

.clearBtn img {
  width: 2.4rem;
  height: 2.4rem;
  filter: var(--settings-icon-filter);
}

.saveBtn {
  position: absolute;
  left: 2rem;
  right: 2rem;
  bottom: calc(env(safe-area-inset-bottom) + 1.8rem);
  width: calc(100% - 4rem);
  min-height: 4.8rem;
  border: 0;
  border-radius: 1rem;
  background-color: var(--settings-toggle-on);
  color: var(--settings-button-text);
  font-family: 'MalangBold', sans-serif;
  font-size: 1.2rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.saveBtn:disabled {
  opacity: 0.55;
  cursor: default;
}

.statusText {
  position: absolute;
  left: 2rem;
  right: 2rem;
  bottom: calc(env(safe-area-inset-bottom) + 7.2rem);
  min-height: 2.4rem;
  color: var(--settings-danger);
  font-size: 1.1rem;
  line-height: 1.4;
  text-align: center;
}

.success {
  color: var(--settings-muted);
}
</style>

<style>
.prompt-setting-slide-enter-active,
.prompt-setting-slide-leave-active {
  transition: transform 0.25s ease;
}
.prompt-setting-slide-enter-from,
.prompt-setting-slide-leave-to {
  transform: translateX(100%);
}
</style>
