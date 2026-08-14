<template>
  <div :class="$style.homeBar" aria-label="홈 빠른 제어">
    <button
      v-for="item in controlItems"
      :key="item.label"
      type="button"
      :class="$style.iconButton"
      :aria-label="item.label"
      :aria-pressed="props.activeControl === item.action"
      @click="toggleControl(item.action)"
    >
      <img :class="$style.icon" :src="props.activeControl === item.action ? item.iconOn : item.iconOff" alt="" />
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  activeControl: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['control'])

const controlItems = [
  {
    label: '라이트',
    iconOff: '/icons/Home/Bar/Bar_Light.svg',
    iconOn: '/icons/Home/Bar/Bar_Light_On.svg',
    action: 'light',
  },
  {
    label: '온도조절',
    iconOff: '/icons/Home/Bar/Bar_Temperature.svg',
    iconOn: '/icons/Home/Bar/Bar_Temperature_On.svg?v=2',
    action: 'temperature',
  },
  {
    label: '대화하기',
    iconOff: '/icons/Home/Bar/Bar_Mic.svg',
    iconOn: '/icons/Home/Bar/Bar_Mic_On.svg',
    action: 'mic',
  },
  {
    label: '방향 제어',
    iconOff: '/icons/Home/Bar/Bar_Direction.svg',
    iconOn: '/icons/Home/Bar/Bar_Direction_On.svg',
    action: 'direction',
  },
]

function toggleControl(action) {
  const previousAction = props.activeControl
  const nextAction = previousAction === action ? null : action
  emit('control', action, nextAction === action, previousAction)
}
</script>

<style module>
.homeBar {
  width: 100%;
  height: 7.2rem;
  flex: 0 0 7.2rem;
  padding: 0 4rem;
  box-sizing: border-box;
  background-color: var(--home-panel-bg);
  border-top: 0.08rem solid var(--home-panel-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.iconButton {
  width: 4.4rem;
  height: 4.4rem;
  padding: 0;
  border: 0;
  border-radius: 0.8rem;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.iconButton:active {
  transform: scale(0.96);
}

.iconButton:focus,
.iconButton:focus-visible {
  outline: none;
}

.icon {
  width: 2.5rem;
  height: 2.5rem;
  display: block;
  filter: var(--home-icon-filter);
}
@media (min-width: 48rem) and (orientation: portrait) {
  .homeBar {
    height: 8.4rem;
    flex-basis: 8.4rem;
    padding: 0 5.6rem;
  }

  .iconButton {
    width: 5.4rem;
    height: 5.4rem;
  }

  .icon {
    width: 3.2rem;
    height: 3.2rem;
  }
}

</style>
