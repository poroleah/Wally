<template>
  <Teleport to="body">
    <Transition name="splash">
      <div v-if="show" class="splash">
        <img v-theme-src="{ light: '/icons/Brand/Logo.svg', dark: '/icons/Brand/Logo_Dark.svg' }" src="/icons/Brand/Logo.svg" class="splash-logo" alt="" />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const SPLASH_DURATION_MS = 2500
const hasInitialSplash = typeof document !== 'undefined' && Boolean(document.getElementById('splash-init'))
const show = ref(!hasInitialSplash)

onMounted(() => {
  const init = document.getElementById('splash-init')

  if (init) {
    setTimeout(() => {
      init.remove()
    }, SPLASH_DURATION_MS)
    return
  }

  setTimeout(() => {
    show.value = false
  }, SPLASH_DURATION_MS)
})
</script>

<style>
.splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  background-color: var(--splash-bg, #fffbf5);
}

.splash-logo {
  display: block;
  width: clamp(165px, 49vw, 205px);
  height: auto;
  transform: translateY(20px);
  filter: var(--splash-logo-shadow, none);
}

:root.theme-dark .splash,
body.theme-dark .splash {
  background-color: var(--splash-bg, #1c1918);
}

.splash-enter-active,
.splash-leave-active {
  transition: opacity 0.5s ease;
}
.splash-enter-from,
.splash-leave-to {
  opacity: 0;
}
</style>
