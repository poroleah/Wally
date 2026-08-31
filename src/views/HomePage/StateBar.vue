<template>
  <div :class="$style.stateBar">
    <div :class="$style.left">
      <img :class="$style.iconCameraLine" src="/icons/Home/Camera.svg" alt="카메라" />
      <img :class="$style.dotGlyph" src="/icons/Home/DoubleDot.svg" alt="" aria-hidden="true" />
      <b>{{ cameraName }}</b>
    </div>
    <b :class="$style.time">{{ currentTime }}</b>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useCamera } from '@/composables/useCamera'

const currentTime = ref('')
const { selectedCamera, cameraViewState } = useCamera()
const cameraName = computed(() => {
  if (selectedCamera.value?.name) return selectedCamera.value.name
  if (cameraViewState.value === 'loading') return '연결 중'
  return '카메라'
})

const update = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = y + '.' + m + '.' + d + '. ' + hh + ':' + mm + ':' + ss
}

let timer
onMounted(() => { update(); timer = setInterval(update, 1000) })
onUnmounted(() => clearInterval(timer))
</script>

<style module>

.stateBar {
  width: 100%;
  padding: 0 clamp(1.9rem, 5vw, 2rem);
  box-sizing: border-box;
  height: 3rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: clamp(0.95rem, 2.8vw, 1.08rem);
  color: var(--home-muted);
  font-family: 'MalangBold', sans-serif;
}

.left {
  display: flex;
  align-items: center;
  gap: 0;
  min-width: 0;
}

.left b {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.iconCameraLine {
  width: 1.6rem;
  height: 1.6rem;
  filter: var(--home-icon-filter);
  flex-shrink: 0;
}

.dotGlyph {
  width: 0.6rem;
  height: 0.6rem;
  display: block;
  flex-shrink: 0;
}

.time {
  font-size: clamp(0.95rem, 2.8vw, 1.08rem);
  flex-shrink: 0;
  margin-left: 1rem;
}
@media (min-width: 48rem) and (orientation: portrait) {
  .stateBar {
    height: 3.8rem;
    padding-inline: 3.2rem;
    font-size: 1.22rem;
  }

  .time {
    font-size: 1.22rem;
    margin-left: 1.6rem;
  }

  .iconCameraLine {
    width: 1.9rem;
    height: 1.9rem;
  }

  .dotGlyph {
    width: 0.7rem;
    height: 0.7rem;
  }
}

</style>
