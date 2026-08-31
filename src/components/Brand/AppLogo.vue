<template>
  <div :class="$style.head">
    <img v-theme-src="{ light: '/icons/Brand/Logo.svg', dark: '/icons/Brand/Logo_Dark.svg' }" :class="$style.logo" src="/icons/Brand/Logo.svg" alt="Wally" />
  </div>
</template>

<style module>
.head {
  width: 100%;
  height: calc(var(--fluid-logo-head-h) + env(safe-area-inset-top));
  position: relative;
  flex-shrink: 0;
}
.logo {
  position: absolute;
  top: calc(env(safe-area-inset-top) + var(--fluid-logo-top));
  left: var(--fluid-logo-left);
  width: var(--fluid-logo-w);
  height: var(--fluid-logo-h);
}
</style>
