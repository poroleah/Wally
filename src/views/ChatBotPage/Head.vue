<template>
  <div :class="$style.headChatbot">
    <div :class="$style.logoWalltbot">
      <img v-theme-src="{ light: '/icons/ChatBot/Wallytbot.svg', dark: '/icons/ChatBot/Wallytbot_Dark.svg' }" :class="$style.wIcon" src="/icons/ChatBot/Wallytbot.svg" alt="" />
    </div>
    <img :class="$style.iconRecord" src="/icons/ChatBot/Record.svg" alt="" @click="emit('openRecord')" />
  </div>
</template>

<script setup>
const emit = defineEmits(['openRecord'])
</script>

<style module>
.headChatbot {
  width: 100%;
  height: calc(var(--fluid-logo-head-h) + env(safe-area-inset-top));
  padding-top: env(safe-area-inset-top);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: rgba(255, 255, 255, 0);
  font-size: 2.22rem;
  color: var(--chat-accent);
  font-family: 'Hakgyoansim Manito OTF R';
}

.logoWalltbot {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: calc(100% - 6.4rem);
  overflow: hidden;
}

.wIcon {
  width: clamp(10.2rem, 26.2vw, 18rem);
  height: var(--fluid-logo-h);
  max-width: 100%;
}

.iconRecord {
  filter: var(--chat-icon-filter);
  position: absolute;
  right: var(--fluid-logo-top);
  top: calc(env(safe-area-inset-top) + (var(--fluid-logo-head-h) / 2));
  transform: translateY(-50%);
  width: clamp(1.6rem, 6.2vw, 4.2rem);
  height: clamp(1.6rem, 6.2vw, 4.2rem);
}
</style>
