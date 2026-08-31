<template>
  <RouterLink
    :to="path"
    class="nav-item"
    :class="{ active: isActive }"
  >
    <img class="nav-icon" :src="isActive ? iconOn : iconOff" alt="" aria-hidden="true" />
    <span>{{ label }}</span>
  </RouterLink>
</template>

<script setup>
defineProps({
  path: String,
  label: String,
  iconOn: String,
  iconOff: String,
  isActive: Boolean,
})
</script>

<style scoped>

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 5.6rem;
  height: 5.6rem;
  padding: 0;
  gap: 0.2rem;
  text-decoration: none;
  color: var(--nav-text);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  outline: none;
  min-width: 0;
  overflow: hidden;
}

.nav-item:focus,
.nav-item:focus-visible {
  outline: none;
}

.nav-item.active {
  color: var(--nav-active);
}

.nav-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: block;
  flex-shrink: 0;
  object-fit: contain;
  filter: var(--nav-icon-filter);
}

.nav-item > span:not(.nav-icon) {
  display: block;
  width: 100%;
  min-width: 0;
  height: 1.3rem;
  font-family: 'Bazzi', sans-serif;
  font-size: 1.3rem;
  font-weight: 500;
  line-height: 1.3rem;
  letter-spacing: 0;
  color: currentColor;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}
@media (min-width: 48rem) and (orientation: portrait) {
  .nav-item {
    width: 7.2rem;
    height: 7.2rem;
    gap: 0.35rem;
  }

  .nav-icon {
    width: 3.2rem;
    height: 3.2rem;
  }

  .nav-item > span:not(.nav-icon) {
    height: 1.65rem;
    font-size: 1.55rem;
    line-height: 1.65rem;
  }
}

</style>
