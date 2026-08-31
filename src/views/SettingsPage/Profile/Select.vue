<template>
  <Teleport to="body">
    <Transition name="select-fade">
      <div v-if="modelValue" class="select-backdrop" @click="emit('update:modelValue', false)" />
    </Transition>
    <Transition name="select-slide">
      <div v-if="modelValue" :class="$style.frame">

        <!-- 헤더 -->
        <div :class="$style.head">
          <img :class="$style.iconBack" src="/icons/Calendar/chevron.svg" alt="뒤로" @click="emit('update:modelValue', false)" />
          <b :class="$style.headTitle">반려동물 종류</b>
        </div>

        <!-- 검색창 -->
        <div :class="$style.breedSearch">
          <input
            :class="$style.searchInput"
            v-model="searchQuery"
            placeholder="반려동물의 종류를 입력하세요."
          />
          <img
            :class="$style.iconSearch"
            src="/icons/Setting/Icon_Search.svg"
            alt=""
          />
        </div>

        <!-- 입력한 견종 목록 -->
        <div :class="$style.list">
          <div
            v-for="(breed, i) in filteredBreeds"
            :key="i"
            :class="$style.breedItem"
            @click="select(breed)"
          >
            <div :class="$style.ipContent">
              <span :class="$style.content2">{{ breed }}</span>
            </div>
          </div>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { dogBreeds } from '@/data/dogBreeds'

defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'select'])

const searchQuery = ref('')

const filteredBreeds = computed(() => {
  const q = searchQuery.value.trim()
  if (!q) return dogBreeds
  return dogBreeds.filter(b => b.includes(q))
})

function select(breed) {
  emit('select', breed)
  emit('update:modelValue', false)
}
</script>

<style module>
.frame {
  position: fixed;
  inset: 0;
  background-color: var(--settings-card-bg);
  border-radius: 2rem 2rem 0 0;
  display: flex;
  flex-direction: column;
  font-size: 1.5rem;
  color: var(--settings-text);
  font-family: 'Malang';
  z-index: 201;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  overflow: hidden;
}
.frame * {
  -webkit-tap-highlight-color: transparent;
  outline: none;
}
.head {
  width: 100%;
  height: calc(5.8rem + env(safe-area-inset-top));
  position: relative;
  text-align: center;
  font-size: 1.6rem;
  color: var(--settings-text);
  font-family: 'MalangBold';
  flex-shrink: 0;
}
.iconBack {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 2.9rem);
  transform: translateY(-50%);
  left: clamp(1rem, 5.1vw, 1.625rem);
  width: clamp(1.25rem, 6.15vw, 2rem);
  height: clamp(1.25rem, 6.15vw, 2rem);
  object-fit: contain;
  cursor: pointer;
  filter: var(--settings-icon-filter);
}
.headTitle {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 2.9rem);
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.6rem;
  font-family: 'MalangBold';
  color: var(--settings-text);
  white-space: nowrap;
}
.breedSearch {
  margin: 1.4rem 2rem 2.4rem;
  border-radius: 0.5rem;
  border: 0.05rem solid var(--settings-border);
  height: 3.2rem;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  gap: 0.8rem;
  flex-shrink: 0;
}
.searchInput {
  flex: 1;
  background: none;
  border: none;
  font-family: 'Malang';
  font-size: 1.2rem;
  color: var(--settings-text);
  padding: 0;
}
.searchInput::placeholder {
  color: var(--settings-muted);
  opacity: 1;
}
.iconSearch {
  width: 1.6rem;
  height: 1.6rem;
  flex-shrink: 0;
  filter: var(--settings-icon-filter);
}
.list {
  flex: 1;
  overflow-y: auto;
  padding: 0 2rem env(safe-area-inset-bottom);
}
.breedItem {
  position: relative;
  height: 3.2rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ipContent {
  position: absolute;
  inset: 0;
  border-bottom: 0.05rem solid var(--settings-border);
  display: flex;
  align-items: center;
  overflow: hidden;
}
.content2 {
  font-size: 1.5rem;
  color: var(--settings-text);
  font-family: 'Malang';
  line-height: 1.4;
}
</style>

<style>
.select-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background-color: var(--settings-backdrop);
}
.select-fade-enter-active,
.select-fade-leave-active {
  transition: opacity 0.3s ease;
}
.select-fade-enter-from,
.select-fade-leave-to {
  opacity: 0;
}
.select-slide-enter-active,
.select-slide-leave-active {
  transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1);
}
.select-slide-enter-from,
.select-slide-leave-to {
  transform: translateY(100%);
}
</style>
