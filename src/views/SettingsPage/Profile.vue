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
const { name, profileImg, breed } = useProfile()
</script>

<style module>
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
            min-width: 0;
            flex: 1;
      }
      .name {
            display: block;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
      }
      .placeholder {
            color: var(--settings-text);
      }
      .breedLabel {
            min-width: 0;
            max-width: 45%;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 0.5em;
            font-family: 'Malang', sans-serif;
            color: var(--settings-muted);
            white-space: nowrap;
            padding-bottom: 0.15rem;
      }

</style>
