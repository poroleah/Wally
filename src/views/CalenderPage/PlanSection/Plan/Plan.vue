<template>
  <div :class="$style.planList">
    <div
      v-if="plans.length === 0"
      :class="$style.calenderPlan"
      @click="isOpen = true"
    >
      <div :class="$style.div">일정없음. 일정을 추가하려면 클릭하세요.</div>
    </div>

    <div
      v-for="(plan, index) in plans"
      :key="index"
      :class="$style.calenderPlan"
    >
      <div :class="$style.div">{{ plan }}</div>
    </div>

    <div v-if="plans.length > 0" :class="$style.calenderPlan" @click="isOpen = true">
      <div :class="$style.div">일정없음. 일정을 추가하려면 클릭하세요.</div>
    </div>
  </div>

  <PlanAdd v-model="isOpen" @add="plans.push($event)" />
</template>

<script setup>
import { ref } from 'vue'
import PlanAdd from './Plan/Plan_Add.vue'

const isOpen = ref(false)
const plans = ref([])
</script>

<style module>
@font-face {
  font-family: 'Malang';
  src: url('@/assets/Fonts/Malang_Regular.ttf') format('truetype');
}
.planList {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.calenderPlan {
  width: calc(100% - 4rem);
  margin: 1rem 2rem 0;
  height: 4.8rem;
  position: relative;
  border-radius: 1rem;
  background-color: var(--calendar-surface);
  overflow: hidden;
  text-align: left;
  font-size: 1.2rem;
  color: var(--calendar-text);
  cursor: pointer;
}
.div {
  width: 19.4rem;
  height: 3rem;
  position: absolute;
  top: 0.9rem;
  left: 0.9rem;
  font-size: 1.2rem;
  line-height: 2.2rem;
  font-family: 'Malang', sans-serif;
  color: var(--calendar-text);
  text-align: left;
  display: flex;
  align-items: center;
}
.addBtn {
  width: calc(100% - 4rem);
  margin: 0.8rem 2rem 0;
  height: 3.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Malang', sans-serif;
  font-size: 1.2rem;
  color: var(--calendar-accent);
  cursor: pointer;
}
</style>
