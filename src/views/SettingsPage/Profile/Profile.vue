<template>
  <Teleport to="body">
    <Transition name="profile-slide">
      <div v-if="modelValue" :class="$style.frame">
        <Head @close="emit('update:modelValue', false)" />

        <div :class="$style.contentWrap" @click="showCalendar = false">
          <!-- 프로필 사진 -->
          <div :class="$style.imgChange">
            <div :class="$style.profileImg" @click="showPhotoOptions">
              <img :class="$style.iconUser" :src="previewUrl || '/icons/Setting/Profile_Img.svg'" alt="프로필 사진" />
            </div>
            <b :class="$style.content4" @click="showPhotoOptions">프로필 사진 변경</b>
            <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />
          </div>

          <!-- 이름 -->
          <div :class="$style.field">
            <span :class="$style.title">이름</span>
            <div :class="$style.profileContent">
              <input
                :class="$style.content2"
                :style="{ color: nameHasValue ? 'var(--settings-text)' : 'var(--settings-muted)' }"
                v-model="name"
                @compositionstart="nameHasValue = true"
                @compositionend="nameHasValue = $event.target.value.length > 0"
                @input="nameHasValue = $event.target.value.length > 0"
                placeholder="이름을 입력해주세요."
              />
            </div>
          </div>

          <!-- 견종 -->
          <div :class="$style.field">
            <span :class="$style.title">종</span>
            <div :class="$style.profileContent" @click="showSelect = true">
              <span :class="[$style.content2, selectedBreed ? $style.filled : '']">{{ selectedBreed || '견종을 선택해주세요.' }}</span>
              <img :class="$style.iconArrowRight" src="/icons/Setting/Arrow.svg" alt="" />
            </div>
          </div>

          <!-- 생일 -->
          <div :class="$style.field">
            <span :class="$style.title">생일</span>
            <div :class="$style.profileContent" @click.stop="showCalendar = !showCalendar">
              <span :class="[$style.content2, selectedDate ? $style.filled : '']">
                {{ selectedDateLabel || '생일을 입력해주세요.' }}
              </span>
              <img :class="$style.iconArrowRight" src="/icons/Setting/Icon_Calendar.svg" alt="" />
            </div>
            <Transition name="cal-drop">
              <div v-if="showCalendar" :class="$style.calendarInline" @click.stop>
                <Calender @selectDate="onSelectDate" />
              </div>
            </Transition>
          </div>
        </div>

        <!-- 저장 버튼 -->
        <div :class="$style.saveButton" @click="save">
          <b :class="$style.saveText">저장</b>
        </div>

        <Select v-model="showSelect" @select="selectedBreed = $event; breed = $event" />

        <!-- 웹용 액션시트 (브라우저 전용) -->
        <Transition name="cal-fade">
          <div v-if="showImgOptions" class="img-backdrop" @click="showImgOptions = false" />
        </Transition>
        <Transition name="cal-slideup">
          <div v-if="showImgOptions" class="img-sheet">
            <div class="img-option" @click="fileInput.click(); showImgOptions = false">사진 선택</div>
            <div class="img-divider" />
            <div class="img-option img-option-delete" @click="deletePhoto">삭제</div>
            <div class="img-divider" />
            <div class="img-option" @click="showImgOptions = false">취소</div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Head from './Head.vue'
import Calender from '@/components/Calender.vue'
import { useProfile } from '@/composables/useProfile'
import Select from './Select.vue'
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet'
import { Capacitor } from '@capacitor/core'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const { name: profileName, profileImg, breed, birthday } = useProfile()

const fileInput = ref(null)
const previewUrl = ref(null)
const showCalendar = ref(false)
const showSelect = ref(false)
const selectedBreed = ref('')
const showImgOptions = ref(false)
const selectedDate = ref(null)
const name = ref('')
const nameHasValue = ref(false)

watch(() => props.modelValue, (val) => {
  if (val) {
    name.value = profileName.value
    previewUrl.value = profileImg.value !== '/icons/Setting/Profile_Img.svg' ? profileImg.value : null
    selectedBreed.value = breed.value
    selectedDate.value = birthday.value
    showCalendar.value = false
  }
})

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return ''
  const { year, month, day } = selectedDate.value
  return `${year}년 ${month}월 ${day}일`
})

async function showPhotoOptions() {
  if (Capacitor.isNativePlatform()) {
    const result = await ActionSheet.showActions({
      title: '프로필 사진',
      options: [
        { title: '사진 선택' },
        { title: '삭제', style: ActionSheetButtonStyle.Destructive },
        { title: '취소', style: ActionSheetButtonStyle.Cancel },
      ],
    })
    if (result.index === 0) fileInput.value.click()
    else if (result.index === 1) deletePhoto()
  } else {
    showImgOptions.value = true
  }
}

function deletePhoto() {
  previewUrl.value = null
  profileImg.value = '/icons/Setting/Profile_Img.svg'
  showImgOptions.value = false
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    previewUrl.value = typeof reader.result === 'string' ? reader.result : null
  }
  reader.readAsDataURL(file)
}

function onSelectDate(date) {
  selectedDate.value = date
}

function save() {
  profileName.value = name.value
  profileImg.value = previewUrl.value || '/icons/Setting/Profile_Img.svg'
  breed.value = selectedBreed.value
  birthday.value = selectedDate.value
  emit('update:modelValue', false)
}
</script>

<style module>
.frame {
  position: fixed;
  inset: 0;
  background-color: var(--settings-card-bg);
  display: flex;
  flex-direction: column;
  font-size: clamp(0.875rem, 3.85vw, 1.25rem);
  color: var(--settings-muted);
  font-family: 'Malang';
  z-index: 200;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.frame * {
  -webkit-tap-highlight-color: transparent;
  outline: none;
}
.contentWrap {
  flex: 1;
  position: relative;
  overflow-y: auto;
  padding: 0 2rem;
  box-sizing: border-box;
}
.imgChange {
  position: absolute;
  top: 3.5rem;
  left: 50%;
  width: 8rem;
  height: 10.8rem;
  transform: translateX(-50%);
  cursor: pointer;
  text-align: center;
}
.profileImg {
  position: absolute;
  top: 0;
  left: 0;
  width: 8rem;
  height: 8rem;
}
.iconUser {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.content4 {
  position: absolute;
  top: 9.5rem;
  left: 0;
  width: 8rem;
  height: 1.3rem;
  font-size: 1rem;
  line-height: 1.3rem;
  color: var(--settings-muted);
  font-family: 'Malang';
}
.field {
  position: absolute;
  left: 2rem;
  right: 2rem;
  height: 6.9rem;
}
.field:nth-of-type(2) {
  top: 15rem;
}
.field:nth-of-type(3) {
  top: 24.6rem;
}
.field:nth-of-type(4) {
  top: 34.2rem;
}
.title {
  position: absolute;
  top: 0;
  left: 0.1rem;
  width: 8.9rem;
  height: 2.1rem;
  font-size: 1rem;
  line-height: 2.2rem;
  color: var(--settings-muted);
  display: flex;
  align-items: center;
}
.profileContent {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 4.8rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 0.03rem solid var(--settings-muted);
  overflow: hidden;
  cursor: pointer;
}
.content2 {
  flex: 1;
  height: 3rem;
  font-size: 1.5rem;
  line-height: 2.2rem;
  color: var(--settings-muted);
  font-family: 'Malang';
  background: none;
  border: none;
  padding: 0;
  width: 100%;
  display: flex;
  align-items: center;
}
.content2::placeholder {
  color: var(--settings-muted);
  opacity: 1;
}
.filled {
  color: var(--settings-text);
}
.iconArrowRight {
  width: 2.4rem;
  height: 2.4rem;
  flex-shrink: 0;
  filter: var(--settings-icon-filter);
}
.calendarInline {
  position: absolute;
  top: 6.9rem;
  left: 0;
  right: 0;
  z-index: 2;
}
.saveButton {
  height: 4.8rem;
  margin: 0 2rem calc(env(safe-area-inset-bottom) + 1.8rem);
  border-radius: 1rem;
  background-color: var(--settings-toggle-on);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.saveText {
  width: 12.7rem;
  height: 3rem;
  font-size: 1.2rem;
  line-height: 2.2rem;
  color: var(--settings-button-text);
  font-family: 'Malang';
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<style>
@font-face {
  font-family: 'Malang';
  src: url('@/assets/Fonts/Malang_Regular.ttf') format('truetype');
}
.profile-slide-enter-active,
.profile-slide-leave-active {
  transition: transform 0.25s ease;
}
.profile-slide-enter-from,
.profile-slide-leave-to {
  transform: translateX(100%);
}
.img-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  background-color: var(--settings-backdrop);
}
.img-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 301;
  background-color: var(--settings-card-bg);
  border-radius: 2rem 2rem 0 0;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
  font-family: 'Malang';
  font-size: clamp(0.875rem, 3.85vw, 1.25rem);
  color: var(--settings-text);
}
.img-option {
  display: flex;
  align-items: center;
  justify-content: center;
  height: clamp(3rem, 12.3vw, 4rem);
  cursor: pointer;
}
.img-option-delete {
  color: var(--settings-delete);
}
.img-divider {
  height: 0.03rem;
  background-color: var(--settings-border);
}
.cal-fade-enter-active,
.cal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.cal-fade-enter-from,
.cal-fade-leave-to {
  opacity: 0;
}
.cal-slideup-enter-active,
.cal-slideup-leave-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.cal-slideup-enter-from,
.cal-slideup-leave-to {
  transform: translateY(100%);
}
.cal-drop-enter-active,
.cal-drop-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.cal-drop-enter-from,
.cal-drop-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
