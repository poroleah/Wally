<template>
  <div :class="[$style.homeDrawer, isWarm ? '' : $style.modeCool]" role="dialog" aria-label="온도">
    <button type="button" :class="$style.closeButton" aria-label="닫기" @click="emit('close')">
      <span :class="$style.iconClose" aria-hidden="true"></span>
    </button>

    <b :class="$style.title">온도</b>

    <div :class="$style.content">
      <div :class="$style.segment" role="tablist" aria-label="온도 기능 선택">
        <span
          :class="[$style.segmentIndicator, activeTab === 'schedule' ? $style.segmentIndicatorRight : '']"
          aria-hidden="true"
        ></span>
        <button
          type="button"
          role="tab"
          :class="[$style.segmentButton, activeTab === 'temperature' ? $style.segmentButtonActive : '']"
          :aria-selected="activeTab === 'temperature'"
          @click="activeTab = 'temperature'"
        >
          <b :class="$style.segmentLabel">온도</b>
        </button>
        <button
          type="button"
          role="tab"
          :class="[$style.segmentButton, activeTab === 'schedule' ? $style.segmentButtonActive : '']"
          :aria-selected="activeTab === 'schedule'"
          @click="activeTab = 'schedule'"
        >
          <b :class="$style.segmentLabel">예약</b>
        </button>
      </div>

      <div v-if="activeTab === 'temperature'" :class="$style.statusRow">
        <button
          type="button"
          :class="[$style.powerButton, isPowerOn ? $style.powerButtonOn : '']"
          :aria-pressed="isPowerOn"
          :aria-label="isPowerOn ? '냉난방 끄기' : '냉난방 켜기'"
          @click="togglePower"
        >
          <svg :class="$style.powerIcon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M8 1.6v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            <path d="M11.6 3.6a5.4 5.4 0 1 1-7.2 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
          </svg>
        </button>
        <div :class="$style.statusText">
          <div :class="$style.statusTitle">{{ statusTitle }}</div>
          <div :class="$style.statusHint">{{ isPowerOn ? '탭 하여 끄기' : '탭 하여 켜기' }}</div>
        </div>
        <button
          type="button"
          :class="[$style.toggle, isWarm ? $style.toggleWarm : $style.toggleCool, !isPowerOn ? $style.toggleOff : '']"
          :aria-pressed="isWarm"
          :aria-label="isWarm ? '난방 모드' : '냉방 모드'"
          @click="toggleMode"
        >
          <span :class="$style.toggleChild"></span>
          <span :class="$style.toggleItem"></span>
          <img :class="[$style.modeIcon, isWarm ? $style.modeIconWarm : $style.modeIconCool]" :src="isWarm ? '/icons/Home/Bar/Tem/Tem_Fire.svg' : '/icons/Home/Bar/Tem/Tem_Cool_Toggle.svg'" alt="" />
        </button>
      </div>

      <div v-if="activeTab === 'temperature' && !isPowerOn" :class="$style.card">
        <div :class="[$style.currentRow, $style.currentRowOff]">
          <span :class="$style.currentLabel">현재 온도</span>
          <span :class="$style.currentValueSmall">{{ currentTemperature }}</span>
          <span :class="$style.iconCelsiusSmall" aria-hidden="true"></span>
        </div>
        <b :class="$style.offMessage">냉난방이 꺼져 있어요</b>
        <svg :class="$style.offArc" viewBox="0 0 320 170" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path :class="$style.heatTrack" d="M20 155A140 140 0 0 1 300 155" />
        </svg>
      </div>

      <div v-else-if="activeTab === 'temperature'" :class="$style.card">
        <div :class="$style.gaugeArea" aria-hidden="true">
          <svg :class="[$style.heatGauge, isWarm ? $style.heatGaugeWarm : $style.heatGaugeCool]" viewBox="0 0 320 170" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path :class="$style.heatTrack" d="M20 155A140 140 0 0 1 300 155" />
            <path :class="$style.heatValue" d="M20 155A140 140 0 0 1 300 155" pathLength="100" :style="{ strokeDashoffset: heatValueOffset }" />
          </svg>
          <div :class="$style.temperatureChild" :style="temperatureKnobStyle"></div>
        </div>

        <div :class="$style.currentRow">
          <span :class="$style.currentLabel">현재 온도</span>
          <span :class="$style.currentValueSmall">{{ currentTemperature }}</span>
          <span :class="$style.iconCelsiusSmall" aria-hidden="true"></span>
        </div>
        <b :class="$style.titleHope">희망 온도</b>
        <div :class="$style.temperatureTarget" aria-live="polite">
          <b :class="$style.targetValue">{{ targetTemperature }}</b>
          <span :class="$style.iconCelsius" aria-hidden="true"></span>
        </div>

        <button
          type="button"
          :class="[$style.adjustButton, $style.iconMinus]"
          aria-label="희망 온도 내리기"
          @click="lowerTemperature"
        >
          <img :class="$style.adjustIcon" src="/icons/Home/Bar/Tem/Tem_Minus.svg" alt="" />
        </button>
        <button
          type="button"
          :class="[$style.adjustButton, $style.iconPlus]"
          aria-label="희망 온도 올리기"
          @click="raiseTemperature"
        >
          <img :class="$style.adjustIcon" src="/icons/Home/Bar/Tem/Tem_Plus.svg" alt="" />
        </button>
      </div>

      <template v-else>
        <div :class="[$style.autoInfo, scheduleBanner.active ? '' : $style.autoInfoIdle]">
          <span :class="$style.autoDot" aria-hidden="true"></span>
          <div :class="$style.autoTexts">
            <div :class="$style.autoTitle">{{ scheduleBanner.title }}</div>
            <div v-if="scheduleBanner.subs.length" :class="$style.autoSub">{{ scheduleBanner.subs.join(' · ') }}</div>
          </div>
        </div>

        <div :class="$style.bookCard">
          <div :class="$style.bookLabel">예약</div>

          <div :class="$style.bookItem">
            <div :class="$style.bookItemTop">
              <span :class="$style.bookIcon" aria-hidden="true">
                <svg :class="$style.bookIconSvg" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 1.6v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                  <path d="M11.6 3.6a5.4 5.4 0 1 1-7.2 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                </svg>
              </span>
              <span :class="[$style.bookName, offScheduleOn ? '' : $style.bookNameOff]">꺼짐 예약</span>
              <button
                type="button"
                :class="[$style.miniToggle, offScheduleOn ? $style.miniToggleOn : '']"
                :aria-pressed="offScheduleOn"
                aria-label="꺼짐 예약"
                @click="toggleOffSchedule"
              >
                <span :class="$style.miniToggleTrack"></span>
                <span :class="$style.miniToggleThumb"></span>
              </button>
            </div>
            <button
              type="button"
              :class="[$style.bookTime, offScheduleOn ? $style.bookTimeOn : '']"
              aria-label="꺼짐 예약 시간 변경"
              @click="offScheduleHours = (offScheduleHours % 12) + 1"
            >
              <span>{{ offScheduleHours }}시간 후</span>
              <svg :class="$style.bookTimeArrow" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2 3.5 5 7 8 3.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <div :class="$style.bookDivider" aria-hidden="true"></div>

          <div :class="$style.bookItem">
            <div :class="$style.bookItemTop">
              <span :class="$style.bookIcon" aria-hidden="true">
                <svg :class="$style.bookIconSvg" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 1.6v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                  <path d="M11.6 3.6a5.4 5.4 0 1 1-7.2 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                </svg>
              </span>
              <span :class="[$style.bookName, onScheduleOn ? '' : $style.bookNameOff]">켜짐 예약</span>
              <button
                type="button"
                :class="[$style.miniToggle, onScheduleOn ? $style.miniToggleOn : '']"
                :aria-pressed="onScheduleOn"
                aria-label="켜짐 예약"
                @click="toggleOnSchedule"
              >
                <span :class="$style.miniToggleTrack"></span>
                <span :class="$style.miniToggleThumb"></span>
              </button>
            </div>
            <button
              type="button"
              :class="[$style.bookTime, onScheduleOn ? $style.bookTimeOn : '']"
              aria-label="켜짐 예약 시간 변경"
              @click="onScheduleHours = (onScheduleHours % 12) + 1"
            >
              <span>{{ onScheduleHours }}시간 후</span>
              <svg :class="$style.bookTimeArrow" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2 3.5 5 7 8 3.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const emit = defineEmits(['close'])

const activeTab = ref('temperature')
const isPowerOn = ref(false)
const offScheduleOn = ref(true)
const onScheduleOn = ref(false)
const offScheduleHours = ref(3)
const onScheduleHours = ref(3)
// 예약 토글을 켠 순간을 기준으로 종료/시작 시각을 고정한다
const offScheduleBase = ref(Date.now())
const onScheduleBase = ref(Date.now())

/* 꺼짐/켜짐 예약은 동시에 켤 수 없다 — 하나를 켜면 다른 쪽은 꺼진다 */
function toggleOffSchedule() {
  offScheduleOn.value = !offScheduleOn.value
  if (offScheduleOn.value) {
    offScheduleBase.value = Date.now()
    onScheduleOn.value = false
  }
}

function toggleOnSchedule() {
  onScheduleOn.value = !onScheduleOn.value
  if (onScheduleOn.value) {
    onScheduleBase.value = Date.now()
    offScheduleOn.value = false
  }
}

function formatClock(baseTime, hoursLater) {
  const d = new Date(baseTime + hoursLater * 3600000)
  const hours = d.getHours()
  const period = hours < 12 ? '오전' : '오후'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return period + ' ' + hour12 + '시 ' + d.getMinutes() + '분'
}

const scheduleBanner = computed(() => {
  const offTime = formatClock(offScheduleBase.value, offScheduleHours.value)
  const onTime = formatClock(onScheduleBase.value, onScheduleHours.value)
  if (offScheduleOn.value) {
    return {
      active: true,
      title: offScheduleHours.value + '시간 후 자동으로 꺼져요',
      subs: ['시작 시간 : ' + formatClock(offScheduleBase.value, 0), '종료 시간 : ' + offTime],
    }
  }
  if (onScheduleOn.value) {
    return {
      active: true,
      title: onScheduleHours.value + '시간 후 자동으로 켜져요',
      subs: ['시작 시간 : ' + formatClock(onScheduleBase.value, 0), '켜짐 시간 : ' + onTime],
    }
  }
  return { active: false, title: '설정된 예약이 없어요', subs: [] }
})
const targetTemperature = ref(25)
const currentTemperature = ref(22)
const isWarm = ref(true)

const statusTitle = computed(() => {
  const mode = isWarm.value ? '난방' : '냉방'
  return isPowerOn.value ? mode + ' 가동 중' : mode + ' 꺼짐'
})

const temperatureRange = computed(() => (isWarm.value ? { min: 20, max: 34 } : { min: 18, max: 24 }))
const currentTemperatureRatio = computed(() => Math.min(Math.max(currentTemperature.value / 50, 0), 1))
const heatValueOffset = computed(() => String(100 - currentTemperatureRatio.value * 100))
const temperatureKnobStyle = computed(() => {
  const angle = Math.PI * (1 - currentTemperatureRatio.value)
  const x = 160 + 140 * Math.cos(angle)
  const y = 155 - 140 * Math.sin(angle)
  return {
    left: (x / 320) * 100 + '%',
    top: (y / 170) * 100 + '%',
  }
})

function togglePower() {
  isPowerOn.value = !isPowerOn.value
}

function raiseTemperature() {
  targetTemperature.value = Math.min(targetTemperature.value + 1, temperatureRange.value.max)
  currentTemperature.value = targetTemperature.value
}

function lowerTemperature() {
  targetTemperature.value = Math.max(targetTemperature.value - 1, temperatureRange.value.min)
  currentTemperature.value = targetTemperature.value
}

function toggleMode() {
  isWarm.value = !isWarm.value
  targetTemperature.value = isWarm.value ? 25 : 22
  currentTemperature.value = isWarm.value ? 23 : 25
}
</script>

<style module>
.homeDrawer {
  position: relative;
  z-index: 90;
  width: 100%;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  /* 다른 홈 드로어(조명·말하기 등)와 동일한 높이 — 탭 전환 시에도 고정.
     낮은 화면에서는 뷰포트에 맞춰 줄고 카드가 함께 줄어든다 */
  height: min(clamp(27.2rem, 62dvh, 34.8rem), calc(100dvh - 9rem));
  margin-top: 2.4rem;
  border-radius: 2rem 2rem 0 0;
  background-color: var(--home-panel-bg);
  overflow: hidden;
  text-align: center;
  font-size: 1.6rem;
  color: var(--home-text);
  font-family: 'Malang', 'Hancom MalangMalang', sans-serif;
  box-shadow: 0 -1.2rem 2.4rem rgba(45, 41, 38, 0.08);
  /* 냉난방 모드에 따라 강조색이 바뀌는 요소들(활성 탭, 전원 버튼, 예약 배너·토글)이 참조 */
  --tem-mode: var(--home-accent);
  --tem-mode-soft: rgba(255, 176, 133, 0.3);
}

.modeCool {
  --tem-mode: var(--home-cool);
  --tem-mode-soft: rgba(130, 162, 177, 0.3);
}

/* 다크 팔레트의 강조색(#ffb38a / #8fb8c8) 기준 배너 틴트 */
:global(:root.theme-dark) .homeDrawer,
:global(body.theme-dark) .homeDrawer,
:global(#app.theme-dark) .homeDrawer {
  --tem-mode-soft: rgba(255, 179, 138, 0.22);
}

:global(:root.theme-dark) .modeCool,
:global(body.theme-dark) .modeCool,
:global(#app.theme-dark) .modeCool {
  --tem-mode-soft: rgba(143, 184, 200, 0.22);
}

.closeButton {
  position: absolute;
  top: 1.4rem;
  left: 2rem;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.closeButton:focus,
.closeButton:focus-visible,
.segmentButton:focus,
.segmentButton:focus-visible,
.powerButton:focus,
.powerButton:focus-visible,
.adjustButton:focus,
.adjustButton:focus-visible,
.toggle:focus,
.toggle:focus-visible {
  outline: none;
}

.iconClose {
  width: 2.4rem;
  height: 2.4rem;
  display: block;
  background-color: var(--home-text);
  mask: url('/icons/Common/Close.svg') center / contain no-repeat;
  -webkit-mask: url('/icons/Common/Close.svg') center / contain no-repeat;
}

.title {
  position: absolute;
  width: 6.2rem;
  top: 1.4rem;
  left: 50%;
  height: 2.4rem;
  transform: translateX(-50%);
  display: inline-block;
  font-family: 'MalangBold', 'Malang', 'Hancom MalangMalang', sans-serif;
  color: var(--home-text);
}

.content {
  flex: 0 1 auto;
  min-height: 0;
  margin: 6.2rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}

.segment {
  position: relative;
  width: 100%;
  height: 3.2rem;
  flex: 0 0 auto;
  display: flex;
  padding: 0.2rem;
  border-radius: 102rem;
  background-color: var(--settings-toggle-bg);
  box-sizing: border-box;
}

/* 활성 탭 자리로 미끄러지는 필 — 카메라 속도 토글과 같은 트랜지션 패턴 */
.segmentIndicator {
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  width: calc(50% - 0.2rem);
  height: calc(100% - 0.4rem);
  border-radius: 102rem;
  background-color: var(--tem-mode);
  transition: transform 0.24s ease, background-color 0.24s ease;
}

.segmentIndicatorRight {
  transform: translateX(100%);
}

.segmentButton {
  position: relative;
  z-index: 1;
  flex: 1 1 0;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: 102rem;
  background: transparent;
  color: var(--home-text);
  font-size: 1.2rem;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.24s ease;
}

.segmentButtonActive {
  color: var(--settings-toggle-thumb);
}

.segmentLabel {
  line-height: 2.2rem;
  font-family: 'MalangBold', 'Malang', 'Hancom MalangMalang', sans-serif;
}

.statusRow {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-height: 2.4rem;
  text-align: left;
}

.powerButton {
  width: 2.4rem;
  height: 2.4rem;
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background-color: var(--settings-toggle-bg);
  color: var(--home-muted);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.24s ease, color 0.24s ease;
}

.powerButtonOn {
  background-color: var(--tem-mode);
  color: var(--settings-toggle-thumb);
}

.powerButton:active {
  transform: scale(0.94);
}

.powerIcon {
  width: 1.6rem;
  height: 1.6rem;
  display: block;
}

.statusText {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.statusTitle {
  font-size: 1rem;
  color: var(--home-text);
}

.statusHint {
  font-size: 0.8rem;
  color: var(--home-muted);
}

.card {
  position: relative;
  /* 시안의 168px 고정 카드 — 화면이 낮을 때만 10rem까지 줄어든다 */
  flex: 0 1 16.8rem;
  height: 16.8rem;
  min-height: 10rem;
  border-radius: 1rem;
  background-color: var(--home-control-hover);
  overflow: hidden;
  color: var(--home-muted);
}

/* 예약 탭: 자동 꺼짐 안내 배너 (시안 320x40) */
.autoInfo {
  flex: 0 0 auto;
  /* 두 줄(제목 + 시간 한 줄) 기준 고정 높이 — 상태 전환 시 카드가 움직이지 않는다 */
  height: 4.6rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.6rem 1rem 0.6rem 0.8rem;
  border: 0.1rem solid var(--tem-mode);
  border-radius: 1rem;
  background-color: var(--tem-mode-soft);
  text-align: left;
}

/* 예약이 모두 꺼져 있을 때의 중립 톤 배너 */
.autoInfoIdle {
  border-color: var(--home-panel-border);
  background-color: var(--home-control-hover);
}

.autoDot {
  flex: 0 0 auto;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background-color: var(--tem-mode);
  filter: blur(0.05rem);
}

.autoInfoIdle .autoDot {
  background-color: var(--home-muted);
}

.autoTexts {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 1rem;
}

.autoTitle {
  color: var(--home-text);
}

.autoSub {
  color: var(--home-muted);
  /* 시작·종료를 한 줄에 담기 위한 크기/줄바꿈 고정 */
  font-size: 0.9rem;
  white-space: nowrap;
}

/* 예약 카드 (시안 320x174) */
.bookCard {
  position: relative;
  flex: 0 1 17.4rem;
  height: 17.4rem;
  min-height: 12rem;
  padding: 1.6rem 2rem;
  border-radius: 1rem;
  background-color: var(--home-control-hover);
  display: flex;
  flex-direction: column;
  text-align: left;
  color: var(--home-text);
}

.bookLabel {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

.bookItem {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.bookItemTop {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.bookIcon {
  flex: 0 0 auto;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  background-color: var(--settings-toggle-bg);
  color: var(--home-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bookIconSvg {
  width: 1.6rem;
  height: 1.6rem;
  display: block;
}

.bookName {
  flex: 1 1 auto;
  font-size: 1rem;
  color: var(--home-text);
}

.bookNameOff {
  color: var(--home-muted);
}

.miniToggle {
  position: relative;
  flex: 0 0 auto;
  width: 3.3rem;
  height: 1.8rem;
  padding: 0;
  border: 0;
  border-radius: 1.5rem;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.miniToggle:focus,
.miniToggle:focus-visible {
  outline: none;
}

.miniToggleTrack {
  position: absolute;
  inset: 0;
  border-radius: 1.5rem;
  background-color: var(--settings-toggle-bg);
  transition: background-color 0.24s ease;
}

.miniToggleOn .miniToggleTrack {
  background-color: var(--tem-mode);
}

.miniToggleThumb {
  position: absolute;
  top: calc(50% - 0.73rem);
  left: 4.65%;
  width: 44.24%;
  height: 1.46rem;
  border-radius: 50%;
  background-color: var(--settings-toggle-thumb);
  box-shadow: var(--settings-toggle-thumb-shadow);
  transition: left 0.24s ease;
}

.miniToggleOn .miniToggleThumb {
  left: 51.16%;
}

.bookTime {
  align-self: flex-end;
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
  font-size: 0.8rem;
  color: var(--home-muted);
}

.bookTime:focus,
.bookTime:focus-visible {
  outline: none;
}

.bookTime:active {
  transform: scale(0.96);
}

.bookTimeOn {
  color: var(--tem-mode);
}

.bookTimeArrow {
  width: 1rem;
  height: 1rem;
  display: block;
}

.bookDivider {
  margin: 1.1rem 0;
  border-top: 0.1rem solid var(--home-panel-border);
}

/* 시안 카드(168px) 기준 좌표: 현재 온도 59px = 35% */
.currentRow {
  position: absolute;
  top: 35%;
  left: 0;
  right: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  font-size: 1rem;
  color: var(--home-muted);
}

/* 꺼짐 상태: 현재 온도를 돔 안 시안 위치(38%)에 */
.currentRowOff {
  top: 38%;
}

.currentValueSmall {
  font-family: 'MalangBold', 'Malang', 'Hancom MalangMalang', sans-serif;
}

.iconCelsiusSmall {
  width: 0.9rem;
  height: 0.9rem;
  display: block;
  background-color: var(--home-muted);
  mask: url(/icons/Home/Bar/Tem/Tem_Celsius.svg) center / contain no-repeat;
  -webkit-mask: url(/icons/Home/Bar/Tem/Tem_Celsius.svg) center / contain no-repeat;
}

.offMessage {
  position: absolute;
  top: 58%;
  left: 0;
  right: 0;
  z-index: 1;
  font-size: 1.6rem;
  color: var(--home-text);
  font-family: 'MalangBold', 'Malang', 'Hancom MalangMalang', sans-serif;
}

/* 켜짐 상태 게이지(gaugeArea)와 같은 자리의 돔형 아크 */
.offArc {
  position: absolute;
  left: 50%;
  top: 1.6rem;
  width: min(26rem, calc(100% - 5.6rem));
  aspect-ratio: 320 / 170;
  height: auto;
  transform: translateX(-50%);
  overflow: visible;
  pointer-events: none;
}

.gaugeArea {
  position: absolute;
  top: 1.6rem;
  left: 50%;
  width: min(26rem, calc(100% - 5.6rem));
  aspect-ratio: 320 / 170;
  height: auto;
  transform: translateX(-50%);
  overflow: visible;
}

.heatGauge {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.heatTrack,
.heatValue {
  stroke-width: 12;
  stroke-linecap: round;
}

.heatTrack {
  /* 말하기 드로어 음량 슬라이더 트랙과 동일한 색 */
  stroke: #eee8de;
}

:global(:root.theme-dark) .heatTrack,
:global(body.theme-dark) .heatTrack,
:global(#app.theme-dark) .heatTrack {
  stroke: #12100f;
}

.heatValue {
  stroke-dasharray: 100;
  transition: stroke-dashoffset 0.24s ease, stroke 0.24s ease;
}

.heatGaugeWarm .heatValue {
  stroke: #ffad83;
}

.heatGaugeCool .heatValue {
  stroke: var(--home-cool);
}

.temperatureChild {
  position: absolute;
  width: 2.3rem;
  height: 2.3rem;
  border-radius: 50%;
  border: 0;
  background-color: var(--home-panel-bg);
  box-shadow: 0 0.12rem 0.26rem rgba(45, 41, 38, 0.22);
  transform: translate(-50%, -50%);
  transition: left 0.24s ease, top 0.24s ease, background-color 0.24s ease, box-shadow 0.24s ease;
}

:global(:root.theme-dark) .temperatureChild,
:global(body.theme-dark) .temperatureChild,
:global(#app.theme-dark) .temperatureChild {
  /* 말하기 드로어 음량 토글과 동일한 룩 */
  background-color: #fffbf5;
  box-shadow: 0.2rem 0.2rem 0.4rem rgba(0, 0, 0, 0.25);
}

/* 시안: 희망 온도 라벨 90px = 53.5% */
.titleHope {
  position: absolute;
  top: 53.5%;
  left: 0;
  right: 0;
  z-index: 1;
  color: var(--home-text);
  font-family: 'MalangBold', 'Malang', 'Hancom MalangMalang', sans-serif;
  font-size: 1.6rem;
}

/* 시안: 희망 온도 숫자 118px = 70% */
.temperatureTarget {
  position: absolute;
  top: 70%;
  left: 0;
  right: 0;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  color: var(--home-text);
  font-family: 'MalangBold', 'Malang', 'Hancom MalangMalang', sans-serif;
}

.targetValue {
  min-width: 4.3rem;
  height: 3.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.6rem;
  line-height: 1;
}

.iconCelsius {
  width: 2.4rem;
  height: 2.4rem;
  display: block;
  background-color: var(--home-text);
  mask: url(/icons/Home/Bar/Tem/Tem_Celsius.svg) center / contain no-repeat;
  -webkit-mask: url(/icons/Home/Bar/Tem/Tem_Celsius.svg) center / contain no-repeat;
}

/* 시안: +/- 버튼 123px = 73%, 좌우 82px/218px */
.adjustButton {
  position: absolute;
  top: 73%;
  z-index: 1;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: 0;
  border-radius: 1rem;
  background: var(--home-panel-bg);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.adjustButton:active {
  transform: scale(0.94);
}

.adjustIcon {
  width: 2.4rem;
  height: 2.4rem;
  display: block;
  object-fit: contain;
}

.iconMinus {
  left: 25.6%;
}

.iconPlus {
  right: 24.4%;
}

.toggle {
  position: relative;
  flex: 0 0 auto;
  width: 4.4rem;
  height: 2.4rem;
  padding: 0;
  border: 0;
  border-radius: 2rem;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.18s ease;
}

.toggleChild {
  position: absolute;
  inset: 0;
  border: 0.1rem solid var(--settings-toggle-border);
  border-radius: 2rem;
  background-color: var(--settings-toggle-bg);
  box-shadow: var(--settings-toggle-shadow);
  transition: background-color 0.24s ease, border-color 0.24s ease;
}

.toggleWarm .toggleChild {
  border-color: var(--settings-toggle-on);
  background-color: var(--settings-toggle-on);
}

.toggleCool .toggleChild {
  border-color: var(--home-cool);
  background-color: var(--home-cool);
}

/* 전원이 꺼져 있으면 모드와 무관하게 토글 트랙도 꺼짐(회색) 모양 */
.toggleOff .toggleChild {
  border-color: var(--settings-toggle-border);
  background-color: var(--settings-toggle-bg);
  box-shadow: var(--settings-toggle-shadow);
}

.toggleItem {
  position: absolute;
  top: calc(50% - 1rem);
  left: 4.55%;
  width: 45.45%;
  height: 2rem;
  border-radius: 50%;
  background-color: var(--settings-toggle-thumb);
  box-shadow: var(--settings-toggle-thumb-shadow);
  transition: left 0.24s ease;
}

.toggleWarm .toggleItem {
  left: 50%;
}

.toggleCool .toggleItem {
  left: 4.55%;
}

.modeIcon {
  position: absolute;
  top: 0.5rem;
  width: 1.4rem;
  height: 1.4rem;
  display: block;
  object-fit: contain;
}

.modeIconWarm {
  left: 2.5rem;
}

.modeIconCool {
  left: 0.5rem;
}

.toggle:active {
  transform: scale(0.97);
}

@media (orientation: landscape) {
  .homeDrawer {
    display: none;
  }
}

:global(html.home-force-portrait) .homeDrawer {
  display: block;
}

@media (orientation: landscape) {
  /* 가로 화면 강제 세로 모드에서는 드로어 컨테이너가 top:0 스크롤 영역이 되므로
     드로어를 컨테이너 바닥(하단 바 위)에 붙이고 스크롤 없이 들어가는 높이로 제한 */
  :global(html.home-force-portrait) .homeDrawer {
    margin-top: auto;
  }
}

@media (min-width: 48rem) and (orientation: portrait) {
  .homeDrawer {
    margin-top: 1.4rem;
    border-radius: 1.8rem 1.8rem 0 0;
  }

  .content {
    top: 5.4rem;
    left: 3.2rem;
    right: 3.2rem;
    bottom: 1.6rem;
    gap: 1.2rem;
  }
}
</style>
