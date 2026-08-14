import { watch } from 'vue'
import { useAlarmSettings } from '@/composables/useAlarmSettings'
import { usePlans } from '@/composables/usePlans'
import { cancelAllScheduleAlarms, schedulePlanAlarm } from '@/utils/alarm'

let initialized = false
let syncVersion = 0

function storedPlans() {
  const { plansByDate } = usePlans()
  return Object.values(plansByDate.value).flat()
}

async function syncScheduleAlarms(enabled, version) {
  const plans = storedPlans()
  const planIds = plans.map((plan) => plan.id).filter(Boolean)

  if (!enabled) {
    await cancelAllScheduleAlarms(planIds)
    return
  }

  for (const plan of plans) {
    if (version !== syncVersion) return
    await schedulePlanAlarm(plan)
  }
}

export function initScheduleAlarmSync() {
  if (initialized) return
  initialized = true

  const { settings } = useAlarmSettings()
  watch(
    () => settings.schedule,
    (enabled) => {
      const version = ++syncVersion
      void syncScheduleAlarms(enabled, version)
    },
    { immediate: true },
  )
}
