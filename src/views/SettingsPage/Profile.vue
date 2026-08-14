<template>
  <div :class="$style.profile">
    <img :class="$style.profileImgIcon" :src="profileImg" alt="프로필" />
    <div v-if="!name && !breed" :class="[$style.name, $style.placeholder]">프로필</div>
    <div v-else :class="$style.nameWrap">
      <div :class="$style.name">{{ name }}</div>
      <div v-if="breed" :class="$style.breedLabel">({{ breed }})</div>
    </div>
  </div>
</template>

<script setup>
import { useProfile } from '@/composables/useProfile'
const emit = defineEmits(['openProfile'])
const { name, profileImg, breed } = useProfile()
</script>

<style  module>@font-face {
  font-family: 'Malang';
  src: url('@/assets/Fonts/Malang_Regular.ttf') format('truetype');
}

.profile {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 1.2rem;
      background-color: rgba(255, 255, 255, 0);
      font-size: clamp(1.6rem, 4vw, 2rem);
      color: var(--settings-text);
      font-family: 'Malang', sans-serif;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
}
      .profileImgIcon {
            width: clamp(3.6rem, 10vw, 4.8rem);
            height: clamp(3.6rem, 10vw, 4.8rem);
            border-radius: 50%;
            object-fit: cover;
            flex-shrink: 0;
      }
      .nameWrap {
            display: flex;
            align-items: flex-end;
            gap: 0.2rem;
      }
      .name {
            display: flex;
            align-items: center;
      }
      .placeholder {
            color: var(--settings-text);
      }
      .breedLabel {
            font-size: 0.5em;
            font-family: 'Malang', sans-serif;
            color: var(--settings-muted);
            white-space: nowrap;
            padding-bottom: 0.15rem;
      }

</style>
