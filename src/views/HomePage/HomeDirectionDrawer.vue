<template>
  <div :class="$style.homeDrawer" role="dialog" aria-label="카메라 조작">
    <template v-if="view === 'add'">
      <button type="button" :class="$style.closeButton" aria-label="뒤로" @click="cancelAdd">
        <span :class="$style.iconBack" aria-hidden="true"></span>
      </button>
      <b :class="$style.title">새 위치 추가</b>
    </template>
    <template v-else-if="view === 'manage'">
      <button type="button" :class="$style.closeButton" aria-label="뒤로" @click="closeManage">
        <span :class="$style.iconBack" aria-hidden="true"></span>
      </button>
      <b :class="$style.title">즐겨찾기 관리</b>
    </template>
    <template v-else>
      <button type="button" :class="$style.closeButton" aria-label="닫기" @click="close">
        <span :class="$style.iconClose" aria-hidden="true"></span>
      </button>
      <b :class="$style.title">카메라 조작</b>
    </template>

    <template v-if="view === 'add'">
      <button type="button" :class="$style.emojiCircle" aria-label="이모지 바꾸기" @click="startEmojiEdit">
        <input
          v-if="editingEmoji"
          ref="emojiInput"
          v-model="emojiDraft"
          :class="$style.emojiInput"
          type="text"
          aria-label="이모지 입력"
          @input="onEmojiInput"
          @keyup.enter="commitEmoji"
          @blur="commitEmoji"
        />
        <span v-else :class="$style.addEmoji" aria-hidden="true">{{ addEmoji }}</span>
      </button>
      <div :class="$style.addNameRow">
        <input
          v-if="editingAddName"
          ref="addNameInput"
          v-model="addName"
          :class="$style.addNameInput"
          type="text"
          maxlength="12"
          aria-label="새 위치 이름"
          @keyup.enter="commitAddRename"
          @blur="commitAddRename"
        />
        <span v-else :class="$style.addName" role="button" tabindex="0" @click="startAddRename" @keyup.enter="startAddRename">{{ addName }}</span>
        <button type="button" :class="$style.iconButton" aria-label="이름 수정" @click="startAddRename">
          <span :class="[$style.smallIcon, $style.camPencilIcon]" aria-hidden="true"></span>
        </button>
      </div>
      <div :class="$style.addPadFrame">
        <div :class="[$style.iconDpad, isDirectionPressed ? $style.iconDpadPressed : '']">
          <svg :class="$style.dpadArt" viewBox="0 0 150 150" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M66.875 1H83.125C93.6184 1 102.125 9.50659 102.125 20V41.875C102.125 45.1887 104.811 47.875 108.125 47.875H130C140.493 47.875 149 56.3816 149 66.875V83.125C149 93.6184 140.493 102.125 130 102.125H108.125C104.811 102.125 102.125 104.811 102.125 108.125V130C102.125 140.493 93.6184 149 83.125 149H66.875C56.3816 149 47.875 140.493 47.875 130V113.125C47.875 107.05 42.9501 102.125 36.875 102.125H20C9.50659 102.125 1 93.6184 1 83.125V66.875C1 56.3816 9.50659 47.875 20 47.875H41.875C45.1887 47.875 47.875 45.1887 47.875 41.875V20C47.875 9.50659 56.3816 1 66.875 1Z" fill="var(--home-panel-bg)" stroke="var(--home-panel-border)" stroke-width="2"/>
            <path d="M83.3346 27.334L75.0013 19.0007L66.668 27.334" stroke="var(--home-text)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M122.668 83.3327L131.001 74.9993L122.668 66.666" stroke="var(--home-text)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M66.6654 122.666L74.9987 130.999L83.332 122.666" stroke="var(--home-text)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M27.332 66.6673L18.9987 75.0007L27.332 83.334" stroke="var(--home-text)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <button type="button" :class="[$style.padHit, $style.padUp]" aria-label="위로 이동" @pointerdown.prevent="move(0, 1)" @pointerup.prevent="stop" @pointerleave.prevent="stop" @pointercancel.prevent="stop" />
          <button type="button" :class="[$style.padHit, $style.padLeft]" aria-label="왼쪽으로 이동" @pointerdown.prevent="move(-1, 0)" @pointerup.prevent="stop" @pointerleave.prevent="stop" @pointercancel.prevent="stop" />
          <button type="button" :class="[$style.padHit, $style.padRight]" aria-label="오른쪽으로 이동" @pointerdown.prevent="move(1, 0)" @pointerup.prevent="stop" @pointerleave.prevent="stop" @pointercancel.prevent="stop" />
          <button type="button" :class="[$style.padHit, $style.padDown]" aria-label="아래로 이동" @pointerdown.prevent="move(0, -1)" @pointerup.prevent="stop" @pointerleave.prevent="stop" @pointercancel.prevent="stop" />
        </div>
      </div>
      <button type="button" :class="$style.savePositionButton" @click="saveNewPreset">이 위치 저장하기</button>
    </template>

    <template v-else-if="view === 'manage'">
      <div :class="$style.manageFrame">
        <div v-for="slot in manageDraft" :key="slot" :class="$style.manageRow">
          <span :class="$style.manageEmoji" aria-hidden="true">{{ emojiOf(slot) }}</span>
          <span :class="$style.manageName">{{ nameOf(slot) }}</span>
          <button type="button" :class="$style.minusButton" :aria-label="`${nameOf(slot)} 삭제`" @click="removeDraft(slot)">
            <span :class="$style.minusIcon" aria-hidden="true"></span>
          </button>
        </div>
        <button v-if="manageDraft.length < 4" type="button" :class="$style.manageAddRow" @click="openAddFromManage">
          <span :class="$style.manageAddIcon" aria-hidden="true"></span>
          <span :class="$style.manageName">새 위치 추가하기</span>
        </button>
      </div>
      <div :class="$style.manageCaption">즐겨찾기는 최대 4개까지 저장할 수 있어요</div>
      <button type="button" :class="[$style.savePositionButton, $style.manageSave]" @click="commitManage">저장</button>
    </template>

    <div v-if="view === 'main'" :class="$style.cameraToggle" role="tablist" aria-label="카메라 조작 탭">
      <span :class="[$style.tabIndicator, tab === 'settings' ? $style.tabIndicatorRight : '']" aria-hidden="true"></span>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'control'"
        :class="[$style.tabButton, tab === 'control' ? $style.tabActive : '']"
        @click="switchTab('control')"
      >조작</button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'settings'"
        :class="[$style.tabButton, tab === 'settings' ? $style.tabActive : '']"
        @click="switchTab('settings')"
      >설정</button>
    </div>

    <template v-if="view === 'main' && tab === 'control'">
      <div :class="$style.padFrame">
        <span :class="$style.frameLabel">방향 제어</span>
        <button
          type="button"
          role="switch"
          :aria-checked="isFast"
          aria-label="고속 이동"
          :disabled="patrolEnabled"
          :class="[$style.speedToggle, isFast ? $style.speedToggleOn : '', patrolEnabled ? $style.locked : '']"
          @click="toggleFast"
        >
          <span :class="$style.speedKnob" aria-hidden="true"></span>
        </button>
        <div :class="[$style.iconDpad, isDirectionPressed ? $style.iconDpadPressed : '', patrolEnabled ? $style.locked : '']">
          <!-- Dpad.svg 원본 — 다크 대응을 위해 색만 팔레트 토큰으로 치환한 인라인 사본 -->
          <svg :class="$style.dpadArt" viewBox="0 0 150 150" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M66.875 1H83.125C93.6184 1 102.125 9.50659 102.125 20V41.875C102.125 45.1887 104.811 47.875 108.125 47.875H130C140.493 47.875 149 56.3816 149 66.875V83.125C149 93.6184 140.493 102.125 130 102.125H108.125C104.811 102.125 102.125 104.811 102.125 108.125V130C102.125 140.493 93.6184 149 83.125 149H66.875C56.3816 149 47.875 140.493 47.875 130V113.125C47.875 107.05 42.9501 102.125 36.875 102.125H20C9.50659 102.125 1 93.6184 1 83.125V66.875C1 56.3816 9.50659 47.875 20 47.875H41.875C45.1887 47.875 47.875 45.1887 47.875 41.875V20C47.875 9.50659 56.3816 1 66.875 1Z" fill="var(--home-panel-bg)" stroke="var(--home-panel-border)" stroke-width="2"/>
            <path d="M83.3346 27.334L75.0013 19.0007L66.668 27.334" stroke="var(--home-text)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M122.668 83.3327L131.001 74.9993L122.668 66.666" stroke="var(--home-text)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M66.6654 122.666L74.9987 130.999L83.332 122.666" stroke="var(--home-text)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M27.332 66.6673L18.9987 75.0007L27.332 83.334" stroke="var(--home-text)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <button type="button" :class="[$style.padHit, $style.padUp]" aria-label="위로 이동" @pointerdown.prevent="move(0, 1)" @pointerup.prevent="stop" @pointerleave.prevent="stop" @pointercancel.prevent="stop" />
          <button type="button" :class="[$style.padHit, $style.padLeft]" aria-label="왼쪽으로 이동" @pointerdown.prevent="move(-1, 0)" @pointerup.prevent="stop" @pointerleave.prevent="stop" @pointercancel.prevent="stop" />
          <button type="button" :class="[$style.padHit, $style.padRight]" aria-label="오른쪽으로 이동" @pointerdown.prevent="move(1, 0)" @pointerup.prevent="stop" @pointerleave.prevent="stop" @pointercancel.prevent="stop" />
          <button type="button" :class="[$style.padHit, $style.padDown]" aria-label="아래로 이동" @pointerdown.prevent="move(0, -1)" @pointerup.prevent="stop" @pointerleave.prevent="stop" @pointercancel.prevent="stop" />
        </div>
      </div>

      <div :class="$style.zoomFrame">
        <span :class="$style.frameLabel">화면 확대 · 축소</span>
        <div :class="$style.zoomBar">
          <span :class="[$style.zoomIcon, $style.zoomIconMinus]" aria-hidden="true"></span>
          <input
            v-model.number="zoom"
            :class="$style.zoomRange"
            :style="{ backgroundImage: zoomFill }"
            type="range"
            min="1"
            max="8"
            step="0.5"
            aria-label="화면 확대 축소"
          />
          <span :class="[$style.zoomIcon, $style.zoomIconPlus]" aria-hidden="true"></span>
        </div>
      </div>
    </template>

    <template v-else-if="view === 'main'">
      <div v-if="patrolArmed" :class="$style.autoInfo">
        <span :class="$style.autoDot" aria-hidden="true"></span>
        <div :class="$style.autoTexts">
          <div :class="$style.autoTitle">집 안을 자동으로 둘러보고 있어요</div>
          <div :class="$style.autoSub">즐겨보는 위치를 {{ patrolIntervalLabel }}마다 바꿔가며 보여줘요</div>
        </div>
        <button
          type="button"
          :class="$style.autoStop"
          :aria-label="patrolEnabled ? '자동 둘러보기 일시정지' : '자동 둘러보기 재개'"
          @click="togglePatrolPause"
        >
          <!-- Cam_stop.svg 원본 — 원 배경은 버튼이 그리고 막대만 토큰 색으로 치환한 인라인 사본 -->
          <svg v-if="patrolEnabled" :class="$style.autoStopIcon" viewBox="0 0 24 24" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 7.33337H8.66667C8.29848 7.33337 8 7.63185 8 8.00004V16C8 16.3682 8.29848 16.6667 8.66667 16.6667H10C10.3682 16.6667 10.6667 16.3682 10.6667 16V8.00004C10.6667 7.63185 10.3682 7.33337 10 7.33337Z" fill="currentColor"/>
            <path d="M15.3335 7.33337H14.0002C13.632 7.33337 13.3335 7.63185 13.3335 8.00004V16C13.3335 16.3682 13.632 16.6667 14.0002 16.6667H15.3335C15.7017 16.6667 16.0002 16.3682 16.0002 16V8.00004C16.0002 7.63185 15.7017 7.33337 15.3335 7.33337Z" fill="currentColor"/>
          </svg>
          <svg v-else :class="$style.autoStopIcon" viewBox="0 0 24 24" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 7L17.5 12L9 17V7Z" fill="currentColor"/>
          </svg>
        </button>
      </div>

      <div :class="$style.bookmarkFrame">
        <div :class="$style.bookmarkHead">
          <span :class="$style.bookmarkLabel">즐겨찾기</span>
          <button
            type="button"
            :class="$style.iconButton"
            aria-label="즐겨찾기 관리"
            @click="openManage"
          >
            <span :class="[$style.smallIcon, $style.pencilIcon]" aria-hidden="true"></span>
          </button>
        </div>

        <div :class="$style.presetGrid">
          <template v-for="slot in PRESET_SLOTS" :key="slot">
            <button
              v-if="isSaved(slot)"
              type="button"
              :class="[$style.presetCard, highlightedSlot === slot ? $style.presetCardOn : '']"
              :disabled="patrolEnabled"
              @click="onCardClick(slot)"
            >
              <span :class="$style.presetEmoji" aria-hidden="true">{{ emojiOf(slot) }}</span>
              <span :class="$style.presetName">{{ nameOf(slot) }}</span>
            </button>
            <button
              v-else-if="slot === firstEmptySlot"
              type="button"
              :class="[$style.presetCard, $style.presetCardAdd]"
              :disabled="patrolEnabled"
              @click="addPreset"
            >
              <span :class="$style.plusIcon" aria-hidden="true"></span>
              <span :class="$style.presetName">추가하기</span>
            </button>
            <span v-else :class="$style.presetPlaceholder" aria-hidden="true"></span>
          </template>
        </div>

        <div :class="$style.metaRow">
          <span>클릭시 바로 그 자리를 보여줘요</span>
          <span>{{ savedCount }}/4</span>
        </div>

        <div :class="$style.divider"></div>

        <div :class="$style.patrolRow">
          <span :class="$style.repeatIcon" aria-hidden="true"></span>
          <span :class="$style.patrolTitle">자동으로 둘러보기</span>
          <button
            type="button"
            role="switch"
            :aria-checked="patrolArmed"
            aria-label="자동으로 둘러보기"
            :class="[$style.patrolToggle, patrolArmed ? $style.patrolToggleOn : '']"
            @click="togglePatrol"
          >
            <span :class="$style.patrolKnob" aria-hidden="true"></span>
          </button>
        </div>

        <div :class="$style.metaRow">
          <span>즐겨찾기를 순서대로 보여줘요</span>
          <button type="button" :class="$style.intervalButton" aria-label="둘러보기 간격 바꾸기" @click="cycleInterval">
            <span>{{ patrolIntervalLabel }}</span>
            <svg :class="$style.arrowIcon" viewBox="0 0 10 10" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 1.5L6.5 5L3 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { usePtz } from '@/composables/usePtz'
import { usePresetMeta } from '@/composables/usePresetMeta'
import { useRealtimeEvents } from '@/composables/useRealtimeEvents'
import ptzCfg from '../../../config/ptz.json'

const emit = defineEmits(['close'])
const { speedLevel, setSpeedLevel, startMove, stopMove, savePreset, gotoPreset, setPatrol } = usePtz()
const { state } = useRealtimeEvents()
let moving = false
const isDirectionPressed = ref(false)
const tab = ref('control')

// 방향 제어의 2단 속도 토글 — usePtz 3단 중 보통(1)·고속(2)에 대응 (mewly 방침)
const isFast = computed(() => speedLevel.value >= 2)

// 줌 — 백엔드 미지원, 로컬 값 표시만 (mewly PtzSheet과 같은 방침, ×1.0–8.0 / 0.5 단위)
const zoom = ref(1)
const zoomFill = computed(() => {
  const pct = ((zoom.value - 1) / 7) * 100
  return `linear-gradient(to right, var(--home-accent) ${pct}%, var(--home-panel-border) ${pct}%)`
})

// ── 즐겨찾기 (PTZ 프리셋 slot 1–4) ──
// 좌표는 백엔드(SSE ptz_preset_positions)가 진실. 표시 메타(이름·이모지·
// 숨김)는 게이트웨이 클라이언트 저장소로 공유된다(usePresetMeta) —
// 웹·앱 어느 기기에서 바꿔도 같은 목록이 보인다. 백엔드에 프리셋 삭제
// API가 없어 관리 화면의 삭제는 숨김 목록으로 처리한다(다시 추가하면 해제).
const PRESET_SLOTS = [1, 2, 3, 4]
const { presetNames, presetEmojis, hiddenSlots } = usePresetMeta()

function slotPosition(slot) {
  const positions = state.ptz_preset_positions
  return positions?.[slot] ?? positions?.[String(slot)] ?? null
}

function isSaved(slot) {
  if (hiddenSlots.value.includes(slot)) return false
  return !!(slotPosition(slot) || presetNames.value[slot])
}

function emojiOf(slot) {
  return presetEmojis.value[slot] || '🏠'
}

function nameOf(slot) {
  return presetNames.value[slot] || `위치 ${slot}`
}

const savedCount = computed(() => PRESET_SLOTS.filter(isSaved).length)
const firstEmptySlot = computed(() => PRESET_SLOTS.find((slot) => !isSaved(slot)) ?? null)

// 마지막으로 이동·저장한 슬롯을 강조. 순찰 중에는 순회 중인 슬롯(SSE)을 따른다 (mewly 방침).
const selectedPreset = ref(state.ptz_patrol?.slot ?? null)
const patrolSlot = computed(() => state.ptz_patrol?.slot ?? null)
const highlightedSlot = computed(() => (patrolEnabled.value ? patrolSlot.value : selectedPreset.value))

// ── 자동으로 둘러보기 (순찰, FR-052) — 상태는 SSE ptz_patrol이 진실 ──
// 적용 대기 중에는 누른 목표값을 낙관적으로 표시하고, SSE가 목표와 일치하면
// 대기를 푼다. 응답 유실 대비 5초 상한 타이머 (mewly patrolPending 패턴).
const PATROL_CHOICES = ptzCfg.patrolIntervalsSec.filter((sec) => sec > 0)
const patrolPending = ref(null) // null | { enabled, intervalSec }
let patrolPendingTimer = null

// SSE가 ptz_patrol 필드를 실제로 실어 준 적이 있는가 — 없으면(구버전 백엔드)
// 로컬 상태를 진실로 삼는다. 필드가 오는 백엔드에서는 서버가 진실.
const hasServerPatrol = computed(() => state.ptz_patrol != null)
const serverPatrolEnabled = computed(() => !!state.ptz_patrol?.enabled)
// 순회 이동 중 스냅숏이 enabled=false로 잠깐 내려오는 순단을 걸러낸 "실제 진행" 값
const serverPatrolRunning = ref(serverPatrolEnabled.value)
const patrolEnabled = computed(() => {
  if (patrolPending.value) return patrolPending.value.enabled
  if (hasServerPatrol.value) return serverPatrolRunning.value
  return patrolArmed.value && !patrolPausedByUser.value
})
// 꺼짐 상태에서 미리 골라 둔 간격 — 다음 켜기에 사용 (서버에는 켤 때 전달)
const offIntervalChoice = ref(loadPatrolUi().intervalSec ?? null)
const patrolIntervalSec = computed(() =>
  patrolPending.value?.intervalSec
  ?? (serverPatrolEnabled.value ? state.ptz_patrol?.interval_s : offIntervalChoice.value ?? state.ptz_patrol?.interval_s)
  ?? PATROL_CHOICES[0],
)
const patrolIntervalLabel = computed(() =>
  patrolIntervalSec.value < 60 ? `${patrolIntervalSec.value}초` : `${patrolIntervalSec.value / 60}분`,
)

watch(() => state.ptz_patrol, (patrol) => {
  if (!patrolPending.value) return
  const applied = patrolPending.value.enabled
    ? patrol?.enabled && Number(patrol?.interval_s) === Number(patrolPending.value.intervalSec)
    : patrol != null && !patrol.enabled
  if (applied) {
    // 사용자가 끈(일시정지 포함) 것이 확인되면 순단 필터를 기다리지 않고 즉시 반영
    if (!patrolPending.value.enabled) {
      clearTimeout(patrolOffTimer)
      serverPatrolRunning.value = false
    }
    clearPatrolPending()
  }
}, { deep: true })

// 순찰을 끄면 서버가 복귀 슬롯을 내려준다 — 하이라이팅 승계 (mewly 방침)
watch(serverPatrolEnabled, (on, was) => {
  if (was && !on && patrolSlot.value != null) selectedPreset.value = patrolSlot.value
})

function clearPatrolPending() {
  clearTimeout(patrolPendingTimer)
  patrolPendingTimer = null
  patrolPending.value = null
}

async function requestPatrol(enabled, intervalSec) {
  patrolPending.value = { enabled, intervalSec }
  clearTimeout(patrolPendingTimer)
  // 응답 유실 대비: 5초가 지나면 표시를 거둔다(상태는 SSE가 진실).
  patrolPendingTimer = setTimeout(clearPatrolPending, 5000)
  const ok = enabled ? await setPatrol(true, intervalSec) : await setPatrol(false)
  if (!ok) clearPatrolPending()
}

// 토글은 "둘러보기 사용" 여부(armed), 배너의 ⏸/▶는 그 안에서의 일시정지.
// 일시정지는 서버 순찰만 멈추고 배너·토글은 켠 채 유지한다.
// 드로어를 닫았다 열어도 유지되도록 로컬에 저장한다(SSE ptz_patrol이 오면 서버가 우선).
const PATROL_UI_STORAGE_KEY = 'wally:ptzPatrolUi'

function loadPatrolUi() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PATROL_UI_STORAGE_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const patrolArmed = ref(hasServerPatrol.value ? serverPatrolEnabled.value : !!loadPatrolUi().armed)
const patrolPausedByUser = ref(hasServerPatrol.value ? false : !!loadPatrolUi().paused)

watch([patrolArmed, patrolPausedByUser, offIntervalChoice], () => {
  try {
    window.localStorage.setItem(PATROL_UI_STORAGE_KEY, JSON.stringify({
      armed: patrolArmed.value,
      paused: patrolPausedByUser.value,
      intervalSec: offIntervalChoice.value,
    }))
  } catch {
    // 저장 실패 시에도 세션 내 표시는 유지된다.
  }
})

// 서버 상태 동기화 — 켜짐은 즉시 반영·armed 승계, 꺼짐은 순회 이동 중의
// 순단(스냅숏이 잠깐 enabled=false)이 흔해서 4초 이상 유지될 때만 실제
// 꺼짐으로 본다. SSE에 ptz_patrol이 없는 백엔드에서는 armed를 건드리지 않는다.
let patrolOffTimer = null

watch(serverPatrolEnabled, (on) => {
  clearTimeout(patrolOffTimer)
  if (on) {
    serverPatrolRunning.value = true
    patrolArmed.value = true
    patrolPausedByUser.value = false
    return
  }
  patrolOffTimer = setTimeout(() => {
    serverPatrolRunning.value = false
    if (hasServerPatrol.value && !patrolPausedByUser.value && !patrolPending.value) {
      patrolArmed.value = false
    }
  }, 4000)
})

function togglePatrol() {
  if (patrolArmed.value) {
    patrolArmed.value = false
    patrolPausedByUser.value = false
    requestPatrol(false, patrolIntervalSec.value)
  } else {
    patrolArmed.value = true
    patrolPausedByUser.value = false
    requestPatrol(true, patrolIntervalSec.value)
  }
}

async function togglePatrolPause() {
  if (patrolEnabled.value) {
    patrolPausedByUser.value = true
    await requestPatrol(false, patrolIntervalSec.value)
    // 서버는 순찰 종료 시 시작 위치로 복귀 이동을 건다 — 일시정지는 "그 자리에
    // 멈춤"이므로 STOP으로 복귀 이동을 즉시 끊는다(지연 시작 대비 한 번 더).
    stopMove()
    setTimeout(stopMove, 500)
  } else {
    patrolPausedByUser.value = false
    requestPatrol(true, patrolIntervalSec.value)
  }
}

function cycleInterval() {
  const index = PATROL_CHOICES.indexOf(patrolIntervalSec.value)
  const next = PATROL_CHOICES[(index + 1) % PATROL_CHOICES.length]
  if (patrolEnabled.value) requestPatrol(true, next)
  else offIntervalChoice.value = next
}

function onCardClick(slot) {
  if (patrolEnabled.value) return
  selectedPreset.value = slot
  gotoPreset(slot)
}

// ── 화면 전환: main(탭) / add(새 위치 추가) / manage(즐겨찾기 관리) ──
const view = ref('main')
const addReturn = ref('main') // 새 위치 추가에서 돌아갈 화면
const editorSlot = ref(null)
const addName = ref('')
const editingAddName = ref(false)
const addNameInput = ref(null)

function openAdd(slot, returnTo) {
  editorSlot.value = slot
  addName.value = `위치 ${slot}`
  addEmoji.value = emojiOf(slot)
  editingAddName.value = false
  editingEmoji.value = false
  addReturn.value = returnTo
  view.value = 'add'
}

// ── 이모지 선택 — 기기 자판(휴대폰 이모지 키보드, Win+. 등)으로 입력받는다 ──
const addEmoji = ref('🏠')
const editingEmoji = ref(false)
const emojiDraft = ref('')
const emojiInput = ref(null)

// 입력값의 마지막 그래핌(눈에 보이는 글자 하나)만 취한다 — 조합 이모지 대응
function lastGrapheme(text) {
  const trimmed = String(text || '').trim()
  if (!trimmed) return ''
  try {
    const segments = [...new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(trimmed)]
    return segments[segments.length - 1]?.segment || ''
  } catch {
    return Array.from(trimmed).pop() || ''
  }
}

async function startEmojiEdit() {
  if (editingEmoji.value) return
  emojiDraft.value = ''
  editingEmoji.value = true
  await nextTick()
  emojiInput.value?.focus?.()
}

function onEmojiInput() {
  const picked = lastGrapheme(emojiDraft.value)
  if (!picked) return
  addEmoji.value = picked
  editingEmoji.value = false
}

function commitEmoji() {
  const picked = lastGrapheme(emojiDraft.value)
  if (picked) addEmoji.value = picked
  editingEmoji.value = false
}

// 설정 탭의 추가하기 카드
function addPreset() {
  const slot = firstEmptySlot.value
  if (!slot || patrolEnabled.value) return
  openAdd(slot, 'main')
}

async function startAddRename() {
  editingAddName.value = true
  await nextTick()
  addNameInput.value?.focus?.()
}

function commitAddRename() {
  const trimmed = addName.value.trim()
  if (!trimmed) addName.value = `위치 ${editorSlot.value ?? 1}`
  editingAddName.value = false
}

function cancelAdd() {
  stop()
  view.value = addReturn.value
}

function saveNewPreset() {
  const slot = editorSlot.value
  if (!slot) {
    view.value = addReturn.value
    return
  }
  stop()
  // 좌표 저장은 서버가 처리하고 결과는 SSE ptz_preset_positions로 내려온다.
  // 이름·이모지는 즉시 반영되고 usePresetMeta가 캐시·서버 저장을 처리한다.
  savePreset(slot)
  presetNames.value = { ...presetNames.value, [slot]: addName.value.trim() || `위치 ${slot}` }
  presetEmojis.value = { ...presetEmojis.value, [slot]: addEmoji.value }
  if (hiddenSlots.value.includes(slot)) {
    hiddenSlots.value = hiddenSlots.value.filter((item) => item !== slot)
  }
  selectedPreset.value = slot
  if (addReturn.value === 'manage' && !manageDraft.value.includes(slot)) {
    manageDraft.value = [...manageDraft.value, slot]
  }
  view.value = addReturn.value
}

// ── 즐겨찾기 관리 화면 (연필) ──
// 삭제는 저장을 누를 때 확정되는 초안 방식. 백엔드에 프리셋 삭제 API가
// 없어 이름(로컬)만 지운다 — 백엔드 연결 시 함께 확장할 것.
const manageDraft = ref([])

function openManage() {
  manageDraft.value = PRESET_SLOTS.filter(isSaved)
  view.value = 'manage'
}

function closeManage() {
  view.value = 'main'
}

function removeDraft(slot) {
  manageDraft.value = manageDraft.value.filter((item) => item !== slot)
}

function openAddFromManage() {
  const slot = PRESET_SLOTS.find((item) => !manageDraft.value.includes(item))
  if (!slot) return
  openAdd(slot, 'manage')
}

function commitManage() {
  const removed = PRESET_SLOTS.filter((slot) => isSaved(slot) && !manageDraft.value.includes(slot))
  if (removed.length) {
    const nextNames = { ...presetNames.value }
    const nextEmojis = { ...presetEmojis.value }
    for (const slot of removed) {
      delete nextNames[slot]
      delete nextEmojis[slot]
    }
    presetNames.value = nextNames
    presetEmojis.value = nextEmojis
    // 백엔드에 프리셋 삭제 API가 없다 — 서버 좌표는 남으므로 숨김 목록으로 가린다.
    hiddenSlots.value = [...new Set([...hiddenSlots.value, ...removed])]
    if (removed.includes(selectedPreset.value)) selectedPreset.value = null
  }
  view.value = 'main'
}

function switchTab(next) {
  if (tab.value === next) return
  stop()
  tab.value = next
}

function toggleFast() {
  setSpeedLevel(isFast.value ? 1 : 2)
}

function close() {
  stop()
  emit('close')
}

function move(pan, tilt) {
  if (patrolEnabled.value) return // 순찰 중에는 수동 팬·틸트 차단 (mewly 방침)
  moving = true
  isDirectionPressed.value = true
  startMove(pan, tilt)
}

function stop() {
  isDirectionPressed.value = false
  if (!moving) return
  moving = false
  stopMove()
}

onBeforeUnmount(() => {
  stop()
  clearTimeout(patrolPendingTimer)
  clearTimeout(patrolOffTimer)
})
</script>

<style module>
.homeDrawer {
  position: relative;
  z-index: 90;
  width: 100%;
  flex: 1 1 clamp(27.2rem, 62dvh, 34.8rem);
  min-height: clamp(27.2rem, 62dvh, 34.8rem);
  margin-top: 2.4rem;
  padding: 0 2rem;
  box-sizing: border-box;
  border-radius: 2rem 2rem 0 0;
  background-color: var(--home-panel-bg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -1.2rem 2.4rem rgba(45, 41, 38, 0.08);
  color: var(--home-text);
  font-family: 'Malang', 'Hancom MalangMalang', sans-serif;
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
.tabButton:focus,
.tabButton:focus-visible,
.speedToggle:focus,
.speedToggle:focus-visible,
.padHit:focus,
.padHit:focus-visible,
.autoStop:focus,
.autoStop:focus-visible,
.iconButton:focus,
.iconButton:focus-visible,
.presetCard:focus,
.presetCard:focus-visible,
.patrolToggle:focus,
.patrolToggle:focus-visible,
.intervalButton:focus,
.intervalButton:focus-visible {
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

.iconBack {
  width: 2.4rem;
  height: 2.4rem;
  display: block;
  background-color: var(--home-text);
  mask: url('/icons/Log/Arrow_Right.svg') center / contain no-repeat;
  -webkit-mask: url('/icons/Log/Arrow_Right.svg') center / contain no-repeat;
}

/* ── 새 위치 추가 화면 ── */
.emojiCircle {
  margin: 4.6rem auto 0;
  flex: 0 0 5.6rem;
  width: 5.6rem;
  height: 5.6rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background-color: var(--home-bg);
  display: grid;
  place-items: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.emojiCircle:focus,
.emojiCircle:focus-visible {
  outline: none;
}

.addEmoji {
  font-size: 3.6rem;
  line-height: 4.6rem;
}

.emojiInput {
  width: 7rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--home-text);
  font-family: inherit;
  font-size: 3.2rem;
  line-height: 4rem;
  text-align: center;
  outline: none;
  caret-color: var(--home-accent);
}

.addNameRow {
  margin-top: 0.4rem;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

/* 이름 바로 옆에 붙도록 — 아이콘 중앙 정렬 여백까지 상쇄 */
.addNameRow .iconButton {
  width: 2rem;
  margin-left: 0.2rem;
  color: var(--home-text);
}

.addName {
  font-size: 1.5rem;
  line-height: 2.2rem;
  color: var(--home-text);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.addName:focus,
.addName:focus-visible {
  outline: none;
}

.addNameInput {
  width: 12rem;
  padding: 0.1rem 0.2rem;
  border: 0;
  border-bottom: 1px solid var(--home-accent);
  border-radius: 0;
  background: transparent;
  color: var(--home-text);
  font-family: inherit;
  font-size: 1.5rem;
  line-height: 2.2rem;
  text-align: center;
  outline: none;
}

.addPadFrame {
  position: relative;
  margin-top: 1rem;
  flex: 1 1 16.6rem;
  min-height: 8rem;
  border-radius: 1rem;
  background-color: var(--home-bg);
  overflow: hidden;
}

.savePositionButton {
  margin: 1.2rem 0 1.6rem;
  flex: 0 0 4.8rem;
  height: 4.8rem;
  border: 0;
  border-radius: 1rem;
  background-color: var(--home-accent);
  color: var(--home-panel-bg);
  font-family: 'MalangBold', 'Hancom MalangMalang', sans-serif;
  font-size: 1.2rem;
  line-height: 2.2rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.savePositionButton:focus,
.savePositionButton:focus-visible {
  outline: none;
}

.savePositionButton:active {
  transform: scale(0.98);
}

/* ── 즐겨찾기 관리 화면 ── */
.manageFrame {
  margin-top: 5.2rem;
  flex: 1 1 22.5rem;
  min-height: 12rem;
  border-radius: 1rem;
  background-color: var(--home-bg);
  overflow: hidden auto;
  display: flex;
  flex-direction: column;
  padding: 0 2rem;
  box-sizing: border-box;
  text-align: left;
}

/* 행 하나가 항상 프레임 높이의 1/4 — 개수가 적어도 늘어나지 않는다 */
.manageRow {
  flex: 0 0 25%;
  min-height: 3.8rem;
  box-sizing: border-box;
  border-bottom: 1px solid var(--home-panel-border);
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.manageFrame > :last-child {
  border-bottom: 0;
}

.manageEmoji {
  flex: 0 0 2.4rem;
  font-size: 2rem;
  line-height: 2.4rem;
  text-align: center;
}

.manageName {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 1.2rem;
  line-height: 1.6rem;
  color: var(--home-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.minusButton {
  flex: 0 0 2.4rem;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: 0;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.minusButton:focus,
.minusButton:focus-visible,
.manageAddRow:focus,
.manageAddRow:focus-visible {
  outline: none;
}

.minusIcon {
  width: 1.6rem;
  height: 1.6rem;
  display: block;
  background-color: var(--home-muted);
  mask: url('/icons/Home/Cam/Cam_minus.svg') center / contain no-repeat;
  -webkit-mask: url('/icons/Home/Cam/Cam_minus.svg') center / contain no-repeat;
}

.manageAddRow {
  flex: 0 0 25%;
  min-height: 3.8rem;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0;
  border: 0;
  background: transparent;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  text-align: left;
}

.manageAddIcon {
  flex: 0 0 2.4rem;
  width: 2.4rem;
  height: 2.4rem;
  display: block;
  background-color: var(--home-muted);
  mask: url('/icons/Home/Cam/Cam_plus.svg') center / contain no-repeat;
  -webkit-mask: url('/icons/Home/Cam/Cam_plus.svg') center / contain no-repeat;
}

.manageCaption {
  margin-top: 1rem;
  font-size: 0.8rem;
  line-height: 1.1rem;
  color: var(--home-muted);
  text-align: center;
}

.manageSave {
  margin-top: 0.8rem;
}

.title {
  position: absolute;
  top: 1.4rem;
  left: 50%;
  height: 2.4rem;
  display: inline-block;
  transform: translateX(-50%);
  color: var(--home-text);
  font-family: 'MalangBold', 'Hancom MalangMalang', sans-serif;
  font-size: 1.6rem;
  line-height: 2.4rem;
  text-align: center;
  white-space: nowrap;
}

/* ── 조작/설정 세그먼트 토글 ── */
.cameraToggle {
  position: relative;
  margin-top: 5.2rem;
  height: 3.2rem;
  flex: 0 0 3.2rem;
  border-radius: 10.2rem;
  background-color: var(--home-bg);
  display: flex;
  align-items: center;
  padding: 0.2rem;
  box-sizing: border-box;
}

/* 활성 탭을 따라 미끄러지는 알약 */
.tabIndicator {
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  width: calc(50% - 0.2rem);
  height: calc(100% - 0.4rem);
  border-radius: 10.2rem;
  background-color: var(--home-accent);
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.tabIndicatorRight {
  transform: translateX(100%);
}

.tabButton {
  position: relative;
  z-index: 1;
  flex: 1 1 50%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: 10.2rem;
  background: transparent;
  color: var(--home-text);
  font-family: 'MalangBold', 'Hancom MalangMalang', sans-serif;
  font-size: 1.2rem;
  line-height: 2.2rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.2s ease;
}

.tabActive {
  color: var(--home-panel-bg);
}

/* ── 방향 제어 프레임 ── */
.padFrame {
  position: relative;
  margin-top: 1.2rem;
  flex: 1 1 20rem;
  min-height: 8.4rem;
  border-radius: 1rem;
  background-color: var(--home-bg);
  overflow: hidden;
}

/* 드로어가 낮으면 패드도 프레임 높이에 맞춰 줄어든다 */
.padFrame .iconDpad,
.addPadFrame .iconDpad {
  width: auto;
  height: min(15rem, calc(100% - 1.2rem));
}

/* 추가 화면 프레임에는 상단 라벨이 없으니 패드가 프레임을 더 꽉 채운다 */
.addPadFrame .iconDpad {
  height: min(15rem, calc(100% - 0.6rem));
}

.frameLabel {
  position: absolute;
  top: 0.8rem;
  left: 0.8rem;
  font-size: 1.2rem;
  line-height: 1.5rem;
  color: var(--home-text);
}

/* 고속 이동 스위치 — off: 보통(1단), on: 고속(2단) */
.speedToggle {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  width: 4.3rem;
  height: 2.3rem;
  padding: 0;
  border: 0;
  border-radius: 2rem;
  background-color: var(--home-panel-border);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 0.16s ease;
}

.speedToggleOn {
  background-color: var(--home-accent);
}

.speedKnob {
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 50%;
  background-color: var(--app-toggle-thumb);
  box-shadow: 0 0.1rem 0.2rem rgba(45, 41, 38, 0.16);
  transition: transform 0.16s ease;
}

.speedToggleOn .speedKnob {
  transform: translateX(2rem);
}

/* 순찰 중 수동 조작 잠금 표시 */
.locked {
  opacity: 0.45;
  pointer-events: none;
}

/* ── 방향 패드 ── */
.iconDpad {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(15rem, calc(100% - 8rem), calc(100% - 5rem));
  aspect-ratio: 1;
  height: auto;
  transform: translate(-50%, -50%);
  transition: transform 0.12s ease;
  transform-origin: center;
}

.iconDpadPressed {
  transform: translate(-50%, -50%) scale(0.96);
}

.dpadArt {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}

.padHit {
  position: absolute;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
}

/* 십자 팔 영역(세로 팔 32–68%, 팔 길이 0–32%)을 그대로 히트 영역으로 쓴다 */
.padUp {
  left: 32%;
  top: 0;
  width: 36%;
  height: 33%;
}

.padLeft {
  left: 0;
  top: 32%;
  width: 33%;
  height: 36%;
}

.padRight {
  left: 67%;
  top: 32%;
  width: 33%;
  height: 36%;
}

.padDown {
  left: 32%;
  top: 67%;
  width: 36%;
  height: 33%;
}

/* ── 화면 확대·축소 프레임 ── */
.zoomFrame {
  position: relative;
  margin-top: 1.4rem;
  margin-bottom: 2rem;
  flex: 0 0 7rem;
  height: 7rem;
  border-radius: 1rem;
  background-color: var(--home-bg);
  overflow: hidden;
}

.zoomBar {
  position: absolute;
  left: 0;
  right: 0;
  top: 2.7rem;
  height: 3.9rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0 0.8rem;
  box-sizing: border-box;
}

.zoomIcon {
  flex: 0 0 2.4rem;
  width: 2.4rem;
  height: 2.4rem;
  display: block;
  background-color: var(--home-text);
}

.zoomIconMinus {
  mask: url('/icons/Home/Cam/zoom_minus.svg') center / contain no-repeat;
  -webkit-mask: url('/icons/Home/Cam/zoom_minus.svg') center / contain no-repeat;
}

.zoomIconPlus {
  mask: url('/icons/Home/Cam/zoom_plus.svg') center / contain no-repeat;
  -webkit-mask: url('/icons/Home/Cam/zoom_plus.svg') center / contain no-repeat;
}

.zoomRange {
  flex: 1 1 auto;
  min-width: 0;
  height: 0.8rem;
  margin: 0;
  border-radius: 0.4rem;
  appearance: none;
  -webkit-appearance: none;
  background-color: var(--home-panel-border);
  background-repeat: no-repeat;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.zoomRange:focus,
.zoomRange:focus-visible {
  outline: none;
}

.zoomRange::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 1.6rem;
  height: 1.6rem;
  border: 0;
  border-radius: 50%;
  background-color: var(--app-toggle-thumb);
  box-shadow: 0.2rem 0.2rem 0.4rem rgba(0, 0, 0, 0.25);
}

.zoomRange::-moz-range-thumb {
  width: 1.6rem;
  height: 1.6rem;
  border: 0;
  border-radius: 50%;
  background-color: var(--app-toggle-thumb);
  box-shadow: 0.2rem 0.2rem 0.4rem rgba(0, 0, 0, 0.25);
}

/* ── 설정 탭: 자동 둘러보기 안내 배너 ── */
.autoInfo {
  margin-top: 1.2rem;
  flex: 0 0 4rem;
  height: 4rem;
  border-radius: 1rem;
  border: 1px solid var(--home-accent);
  background-color: color-mix(in srgb, var(--home-accent) 30%, var(--home-panel-bg));
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0 0.8rem;
  overflow: hidden;
}

.autoDot {
  flex: 0 0 0.6rem;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background-color: var(--home-accent);
}

.autoTexts {
  flex: 1 1 auto;
  min-width: 0;
  text-align: left;
}

.autoTitle {
  font-size: 1.1rem;
  line-height: 1.4rem;
  color: var(--home-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.autoSub {
  font-size: 1rem;
  line-height: 1.3rem;
  color: var(--home-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.autoStop {
  flex: 0 0 2.4rem;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background-color: var(--home-panel-bg);
  color: var(--home-text);
  display: grid;
  place-items: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.autoStopIcon {
  width: 100%;
  height: 100%;
  display: block;
}

/* ── 설정 탭: 즐겨찾기 프레임 ── */
.bookmarkFrame {
  margin-top: 1.2rem;
  margin-bottom: 1.6rem;
  flex: 1 1 24rem;
  min-height: 12rem;
  border-radius: 1rem;
  background-color: var(--home-bg);
  overflow: hidden auto;
  display: flex;
  flex-direction: column;
  padding: 1.2rem 2rem 1rem;
  box-sizing: border-box;
  text-align: left;
}

.bookmarkHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bookmarkLabel {
  font-size: 1.2rem;
  line-height: 1.6rem;
  color: var(--home-text);
}

.iconButton {
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: 0;
  border-radius: 0.6rem;
  background: transparent;
  color: var(--home-muted);
  display: grid;
  place-items: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.smallIcon {
  width: 1.6rem;
  height: 1.6rem;
  display: block;
}

.pencilIcon {
  background-color: currentColor;
  mask: url('/icons/Home/Cam/Cam_PencilLine.svg') center / contain no-repeat;
  -webkit-mask: url('/icons/Home/Cam/Cam_PencilLine.svg') center / contain no-repeat;
}

.camPencilIcon {
  background-color: currentColor;
  mask: url('/icons/Home/Cam/Cam_Pencil.svg') center / contain no-repeat;
  -webkit-mask: url('/icons/Home/Cam/Cam_Pencil.svg') center / contain no-repeat;
}

.presetGrid {
  margin-top: 0.6rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.8rem;
}

.presetCard {
  height: 6.8rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 1rem;
  background-color: var(--home-panel-bg);
  color: var(--home-text);
  font-family: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;
  box-sizing: border-box;
}

.presetCardOn {
  border-color: var(--home-accent);
  background-color: color-mix(in srgb, var(--home-accent) 30%, var(--home-panel-bg));
}

.presetCardAdd {
  color: var(--home-muted);
}

.presetCard:disabled {
  opacity: 0.45;
  cursor: default;
}

.presetPlaceholder {
  height: 6.8rem;
  border-radius: 1rem;
}

.presetEmoji {
  font-size: 2rem;
  line-height: 2.2rem;
}

.plusIcon {
  width: 2.4rem;
  height: 2.4rem;
  display: block;
  background-color: var(--home-muted);
  mask: url('/icons/Home/Cam/Cam_plus.svg') center / contain no-repeat;
  -webkit-mask: url('/icons/Home/Cam/Cam_plus.svg') center / contain no-repeat;
}

.presetName {
  font-size: 1rem;
  line-height: 1.3rem;
  max-width: 100%;
  padding: 0 0.4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metaRow {
  margin-top: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
  line-height: 1.2rem;
  color: var(--home-muted);
}

.divider {
  margin-top: 1.2rem;
  border-top: 1px solid var(--home-panel-border);
}

.patrolRow {
  margin-top: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.repeatIcon {
  flex: 0 0 2.4rem;
  width: 2.4rem;
  height: 2.4rem;
  display: block;
  background-color: var(--home-text);
  mask: url('/icons/Home/Cam/Cam_Repeat.svg') center / contain no-repeat;
  -webkit-mask: url('/icons/Home/Cam/Cam_Repeat.svg') center / contain no-repeat;
}

.patrolTitle {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 1.2rem;
  line-height: 1.6rem;
  color: var(--home-text);
}

.patrolToggle {
  flex: 0 0 3.3rem;
  position: relative;
  width: 3.3rem;
  height: 1.8rem;
  padding: 0;
  border: 0;
  border-radius: 1.6rem;
  background-color: var(--home-panel-border);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 0.16s ease;
}

.patrolToggleOn {
  background-color: var(--home-accent);
}

.patrolKnob {
  position: absolute;
  top: 0.16rem;
  left: 0.16rem;
  width: 1.48rem;
  height: 1.48rem;
  border-radius: 50%;
  background-color: var(--app-toggle-thumb);
  box-shadow: 0 0.1rem 0.2rem rgba(45, 41, 38, 0.16);
  transition: transform 0.16s ease;
}

.patrolToggleOn .patrolKnob {
  transform: translateX(1.5rem);
}

.intervalButton {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0;
  border: 0;
  background: transparent;
  color: var(--home-accent);
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.2rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.arrowIcon {
  width: 1rem;
  height: 1rem;
  display: block;
  color: var(--home-muted);
  transform: rotate(90deg);
}

@media (orientation: landscape) {
  .homeDrawer {
    display: none;
  }
}

:global(html.home-force-portrait) .homeDrawer {
  display: flex;
}
</style>
