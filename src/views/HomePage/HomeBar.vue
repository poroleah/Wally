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
  height: clamp(5.6rem, 16vw, 6.4rem);
  flex: 0 0 clamp(5.6rem, 16vw, 6.4rem);
  padding: 0 clamp(2.4rem, 10vw, 4rem);
  box-sizing: border-box;
  background-color: var(--home-panel-bg);
  border-top: 0.08rem solid var(--home-panel-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.iconButton {
  width: clamp(3.8rem, 11vw, 4.4rem);
  height: clamp(3.8rem, 11vw, 4.4rem);
  padding: 0;
  border: 0;
  border-radius: 0.8rem;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.28s cubic-bezier(0.34, 1.86, 0.44, 1);
}

.iconButton:active {
  transform: scale(0.95);
  transition-duration: 0.08s;
}

.iconButton:focus,
.iconButton:focus-visible {
  outline: none;
}

.icon {
  width: clamp(2.2rem, 6.4vw, 2.5rem);
  height: clamp(2.2rem, 6.4vw, 2.5rem);
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
