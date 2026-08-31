import { computed, ref } from 'vue'
import { ROUTES } from '@/constants'
import { useProfile } from './useProfile'

const { name } = useProfile()
const petName = computed(() => name.value || '반려동물')

// 나중에 API로 교체: GET /conversations
const conversations = ref([
  {
    id: 1,
    summary: '오전 9시 15분 헐떡거림 감지 및 조치',
    messages: [
      { type: 'bot', text: '현재 펫하우스 내부 온도는 24°C 입니다.' },
      { type: 'user', text: '지금 콩돌이 상태는 어때?' },
      { type: 'bot', text: '오전 9시 3분경 콩돌이에게서 평소와 다른 헐떡거림이 포착되었습니다. 당시 펫하우스 주변 소음이 컸거나 실내 습도가 높았던 것이 원인으로 보입니다.' },
      { type: 'bot-link', text: '영상보러가기', path: `${ROUTES.FOOTPRINT}?date=2026-03-26` },
    ],
  },
  {
    id: 2,
    summary: '오늘 콩돌이의 하루 일과 요약 리포트 보기',
    messages: [
      { type: 'user', text: '오늘 콩돌이 하루 어땠어?' },
      { type: 'bot', text: '오늘 콩돌이는 오전에 활발하게 활동했고, 오후에는 평소보다 긴 낮잠을 잤습니다. 전반적으로 건강한 하루였습니다.' },
    ],
  },
  {
    id: 3,
    summary: '오후 2시: 평소보다 길었던 꿀잠 분석 결과',
    messages: [
      { type: 'user', text: '오후에 왜 이렇게 많이 자?' },
      { type: 'bot', text: '오후 2시부터 4시까지 약 2시간의 수면이 감지되었습니다. 오전 활동량이 많아 피로가 쌓인 것으로 보입니다. 정상 범위 내입니다.' },
    ],
  },
  {
    id: 4,
    summary: '지금 콩돌이는 뭐 하고 있을까요? (오후 일과)',
    messages: [
      { type: 'user', text: '지금 콩돌이 뭐 해?' },
      { type: 'bot', text: '현재 콩돌이는 펫하우스 안에서 휴식 중입니다. 호흡과 체온 모두 정상입니다.' },
    ],
  },
])

function replaceSamplePetName(text) {
  return String(text || '').replaceAll('콩돌이', petName.value)
}

function formatConversation(conversation) {
  return {
    ...conversation,
    summary: replaceSamplePetName(conversation.summary),
    messages: conversation.messages.map(message => ({
      ...message,
      text: replaceSamplePetName(message.text),
    })),
  }
}

const formattedConversations = computed(() => conversations.value.map(formatConversation))

const getById = (id) => formattedConversations.value.find(c => c.id === Number(id))

// 새 대화를 목록 맨 위에 추가
// 나중에 API로 교체: POST /conversations
const addConversation = (messages) => {
  const userMsg = messages.find(m => m.type === 'user')
  const summary = userMsg ? userMsg.text : '새 대화'
  const id = Date.now()
  conversations.value.unshift({ id, summary, messages: [...messages] })
  return id
}

export function useConversations() {
  return { conversations: formattedConversations, getById, addConversation }
}
