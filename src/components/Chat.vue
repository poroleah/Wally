<template>
  <img v-theme-src="{ light: '/icons/Chat_Fill.svg', dark: '/icons/Chat_Fill_Dark.svg' }" :class="$style.iconChatFill" src="/icons/Chat_Fill.svg" alt="채팅" />
</template>

<style module>
.iconChatFill {
  position: fixed;
  right: 2rem;
  bottom: 7.2rem;
  width: 1.8rem;
  height: 1.8rem;
}
</style>
