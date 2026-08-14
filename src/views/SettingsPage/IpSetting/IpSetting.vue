<template>
  <Teleport to="body">
    <Transition name="ip-slide">
      <div v-if="modelValue" :class="$style.settingIp">
        <div :class="$style.head">
          <img :class="$style.iconArrowRight" src="/icons/Calender/chevron.svg" alt="" @click="emit('update:modelValue', false)" />
          <b :class="$style.title">카메라 프로필</b>
        </div>
        <div :class="$style.frame">
          <div v-if="loading" :class="$style.statusText">카메라 설정을 불러오는 중</div>
          <div v-for="field in fields" :key="field.key" :class="$style.inputRow">
            <input
              :class="$style.input"
              v-model="form[field.key]"
              :placeholder="field.placeholder"
              :type="field.key === 'password' && !showPassword ? 'password' : 'text'"
            />
            <img
              v-if="field.key === 'password'"
              :class="$style.eyeIcon"
              :src="showPassword ? '/icons/Setting/Eye_On.svg' : '/icons/Setting/Eye_Off.svg'"
              alt=""
              @click="showPassword = !showPassword"
            />
          </div>
          <button type="button" :class="$style.saveBtn" :disabled="saving" @click="handleSave">{{ saving ? '저장 중' : '저장' }}</button>
          <div v-if="statusMessage" :class="$style.statusText">{{ statusMessage }}</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useCamera } from '@/composables/useCamera'

const props = defineProps({ modelValue: Boolean })
const modelValue = computed(() => props.modelValue)
const emit = defineEmits(['update:modelValue'])

const { settings, config, loading, saving, error, saveStatus, loadCameras, saveCameraSettings } = useCamera()

const fields = [
  { key: 'name', placeholder: '카메라 이름을 입력하세요' },
  { key: 'id', placeholder: 'ID를 입력하세요' },
  { key: 'password', placeholder: '패스워드를 입력하세요' },
  { key: 'ip', placeholder: '카메라 ip 주소를 입력하세요' },
  { key: 'port', placeholder: '포트번호를 입력하세요' },
  { key: 'onvifPort', placeholder: 'ONVIF 포트번호 (선택)' },
  { key: 'streamPath', placeholder: 'URL (경로)' },
]

const form = reactive({ ...settings.value })
const showPassword = ref(false)
const statusMessage = computed(() => saveStatus.value || error.value)

function syncFormFromCamera() {
  Object.assign(form, {
    name: config.name || settings.value.name || '',
    id: config.username || settings.value.id || '',
    password: '',
    ip: config.ip || settings.value.ip || '',
    port: String(config.rtsp_port || settings.value.port || ''),
    onvifPort: config.onvif_port == null ? '' : String(config.onvif_port),
    streamPath: config.stream_path || 'stream1',
  })
}

watch(modelValue, async (open) => {
  if (!open) return
  await loadCameras({ force: true })
  syncFormFromCamera()
}, { immediate: true })

watch(form, (val) => {
  Object.assign(settings.value, val)
})

async function handleSave() {
  const ok = await saveCameraSettings({
    name: form.name,
    id: form.id,
    password: form.password,
    ip: form.ip,
    port: form.port,
    onvif_port: form.onvifPort,
    stream_path: form.streamPath,
  })
  if (ok) {
    form.password = ''
    syncFormFromCamera()
    emit('update:modelValue', false)
  }
}

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

.settingIp {
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

.iconArrowRight {
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
  gap: 1.8rem;
}

.inputRow {
  width: 100%;
  border-bottom: 0.03rem solid #84776e;
  display: flex;
  align-items: center;
}

.eyeIcon {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  filter: var(--settings-icon-filter);
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
.saveBtn {
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
.saveBtn:disabled {
  opacity: 0.55;
  cursor: default;
}
.statusText {
  min-height: 2.4rem;
  color: var(--settings-muted);
  font-size: 1rem;
  line-height: 1.4;
  text-align: center;
}
</style>

<style>
.ip-slide-enter-active,
.ip-slide-leave-active {
  transition: transform 0.25s ease;
}
.ip-slide-enter-from,
.ip-slide-leave-to {
  transform: translateX(100%);
}
</style>
