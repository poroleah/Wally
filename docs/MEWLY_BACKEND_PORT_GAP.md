# mewly → Wally 백엔드 이식 격차 조사

- 조사일: 2026-08-31 (브랜치: `feat/backend-port`)
- 대상: `d:\Projects\Wally` (이식 대상) ↔ `d:\Projects\mewly` (읽기 전용 참조)
- 판정 기준
  - **반영됨**: 실제 서버 통신 호출부(fetch/EventSource)가 코드로 확인되는 것만.
  - **부분**: 정의/import만 있고 호출부가 없거나, 호출부는 있으나 동작 불가한 것.
  - **없음**: 해당 연동·기능이 전혀 없는 것.
- 우선순위는 매기지 않음 (별도 판단).
- 이식 중 보류하기로 한 설정 작업은 [DEFERRED_SETUP.md](DEFERRED_SETUP.md)에 별도 관리.

---

## 1. Wally에 이미 있는 연동 현황

| 연동 | 판정 | 근거 |
|---|---|---|
| POST /api/login | 반영됨 | `src/composables/useAuth.js:244` `apiFetch(API_ENDPOINTS.login)` |
| POST /api/refresh | 반영됨 | `src/composables/useAuth.js:146` |
| POST /api/logout | 반영됨 | `src/composables/useAuth.js:116` |
| POST /api/change-password | 반영됨 | `src/views/SettingsPage/PasswordSetting/PasswordSetting.vue:119` |
| GET /camera | 반영됨 | `src/composables/useCamera.js:145` `authJson(API_ENDPOINTS.camera)` |
| POST /camera | 반영됨 | `src/composables/useCamera.js:201` |
| GET /clips (목록) | 반영됨 | `src/composables/useRealtimeEvents.js:314` |
| GET /clips/{name} (파일 URL) | 반영됨 | `src/composables/useRealtimeEvents.js:250`, `src/utils/abnormalNotifications.js:69` |
| SSE 실시간 상태 | 반영됨 (구방식) | `src/composables/useRealtimeEvents.js:446` — 단, 8080 `/events` 기준 (§4 참조) |
| POST /prompt | 반영됨 | `src/composables/usePromptSettings.js:70` |
| POST /ptz | 반영됨 | `src/composables/usePtz.js:15` |
| HLS 재생 | 반영됨 (무인증 직결) | `src/views/HomePage/CamView.vue:992`, URL 정의 `src/endpoints.js:142-147` (포트 8888 직결) |
| WHEP (WebRTC) | 반영됨 (무인증 직결) | `src/composables/useWebRtcStream.js:127-132` — Authorization 헤더 없음 |
| POST /streaming/start, /analysis/start | **부분 (동작 불가)** | 호출부 `src/composables/useAutoLifecycle.js:37,51`은 있으나 `src/endpoints.js:120-136`의 `APP_ENDPOINTS`에 정의가 없어 `undefined` URL로 요청됨 |
| POST /vlm/switch | 부분 (정의만) | `src/endpoints.js:133-135` 정의만, src 전체에 호출부 없음 |
| GET /stream (MJPEG) | 부분 (정의만) | `src/endpoints.js:130-132` 정의만, 호출부 없음 |
| petProfile·homeStatus·homeAlerts·anomalies | 부분 (placeholder) | `src/endpoints.js:105-117` — 호출부 없음. mewly 백엔드에는 이 경로 자체가 없고 `/client/storage`로 대체됨 |
| 홈 데이터 로드 | 없음 (빈 stub) | `src/composables/useHomeData.js:17-22` `loadHomeData`가 아무 요청도 안 함 |
| 반려견 프로필 | 없음 (localStorage만) | `src/composables/useProfile.js:28-37` — 서버 통신 없음 |

---

## 2. Wally에 없는 mewly 백엔드 기능

| # | 기능 | 상태 | mewly 근거 | Wally 현황 |
|---|---|---|---|---|
| 1 | HTTPS 단일 게이트웨이(8000) — 모든 REST·SSE·스트림이 한 포트 경유 | 없음 | `src/endpoints.js:1-12`, `config/network.json:2-3` | http + 8000/8080/8888/8889 분산 (`src/endpoints.js:53-63`) |
| 2 | SSE 라이브 상태 `/state` (신규 필드: `streaming_active`, `monitor_sources`, `label_groups`, `presets`, `active_preset`, `profile_pending`, `ptz_presets`, `ptz_preset_positions`, `ptz_patrol`) | 부분 | `src/composables/useSSE.js:8-70`, `src/endpoints.js:105-107` | 8080 `/events`로 구버전 필드만 수신 (`src/composables/useRealtimeEvents.js:40-82`) |
| 3 | 이벤트 이력 조회 `GET /events` (FR-031) | 없음 | `src/composables/useEventSummary.js:21` | 로그를 `/clips` 목록으로 대체 중 (`src/composables/useRealtimeEvents.js:314`) |
| 4 | 집계 조회 `GET /summary` (시간 버킷별 라벨 발생 수·분모) | 없음 | `src/composables/useInferenceSummary.js:26` | — |
| 5 | 클라이언트 저장소 `GET·PUT /client/storage/{key}` (반려견 프로필 서버 저장) | 없음 | `src/composables/useProfile.js:67,74` | 프로필이 localStorage 전용 (`src/composables/useProfile.js:28-37`) |
| 6 | 클립 삭제 `DELETE /clips` (`{names:[...]}` body) | 없음 | `src/composables/useClips.js:14-19` | — |
| 7 | 분석 수동 시작/정지 `POST /analysis/start·stop` (409/502 detail 분기) | 부분 | `src/composables/useAnalysis.js:27,41` | 엔드포인트 정의 완료(`src/endpoints.js` `analysisStart/Stop`), `useAutoLifecycle`이 자동 호출. 수동 UI·409/502 detail 분기는 없음 |
| 8 | 스트리밍 수동 시작/정지 `POST /streaming/start·stop` | 부분 | `src/components/CameraPanel.vue:126,142` | 엔드포인트 정의 완료(`src/endpoints.js` `streamingStart/Stop`), 자동 라이프사이클이 호출. 수동 토글 UI는 없음 |
| 9 | 라벨 어휘·프리셋 주입 `POST /presets` (SSE `label_groups` 비면 자동 주입) | 없음 | `src/composables/analysisConfig.js:118`, `src/components/AnalysisPanel.vue:46` | — |
| 10 | VLM 모델 전환 `POST /vlm/switch` 실제 호출 | 부분 | `src/components/HomeTab.vue:111` | 정의만 있고 호출부 없음 (`src/endpoints.js:133-135`) |
| 11 | 스트림 토큰 인증 — HLS 전 요청 Bearer(`xhrSetup`) + WHEP Authorization | 완료 | `src/components/HomeTab.vue:403-405, 493-500` | HLS `xhrSetup` Bearer + 네이티브 폴백 `?token=` (`src/views/HomePage/CamView.vue` `attachHls`), WHEP Authorization (`src/composables/useWebRtcStream.js`) |
| 12 | 세션 자동 갱신 타이머 + 만료 경고 카운트다운 + 연장(`extendSession`) | 완료 | `src/composables/useAuth.js:282-318, 396-399` | persistent 자동 갱신 + ephemeral 경고/만료 타이머·1초 시계·`extendSession` (`src/composables/useAuth.js` `scheduleSessionTimers`/`startSessionClock`) |
| 13 | 세션 교체 감지(FR-047) — 401 `token revoked` 분기 + SSE 끊김 시 401 프로브 + 로그아웃 사유 알림 | 완료 | `src/composables/useFetch.js:21-41`, `src/composables/useSSE.js:149-158`, `src/composables/useAuth.js:11-14, 204-209` | `token revoked` 분기 + `probeSession` + `SESSION_REPLACED_NOTICE` (`src/composables/useFetch.js`, `src/composables/useRealtimeEvents.js`) |
| 14 | 최초 로그인 비밀번호 강제 변경 `must_change_password` (FR-006) | 완료 | `src/composables/useAuth.js:15-18, 385` | 플래그 영속화(`src/composables/useAuth.js`) + `src/views/LoginPage/ForcePasswordChange.vue` |
| 15 | 로그인 응답 후에만 호스트 영속화 (`applyMewlyHost` → `persistMewlyHost`) | 없음 | `src/endpoints.js:130-145`, `src/composables/useAuth.js:374` | 로그인과 무관하게 즉시 저장 (`src/composables/useServerAuth.js:21-33`) |
| 16 | PTZ 확장 — 다중 프리셋 slot 저장/이동, 절대 이동(FR-016), 자동 순찰(FR-052), 3단 속도 | 없음 | `src/composables/usePtz.js:39-61` | move/stop/save/goto(홈 1개), 고정 속도 0.5 (`src/composables/usePtz.js:5, 36-65`) |
| 17 | logout 시 access token 동반 전송 — refresh token 없는 ephemeral 세션도 서버 측 epoch bump | 완료 | `src/composables/useAuth.js:211-228` | `revokeSessionTokens`가 Authorization + `refresh_token` body 동반 (`src/composables/useAuth.js`) |

> mewly 근거의 경로는 `d:\Projects\mewly\` 기준, Wally 현황의 경로는 이 저장소 기준.

---

## 3. Wally에 없는 mewly 일반(클라이언트) 기능

| # | 기능 | 상태 | mewly 근거 | Wally 현황 |
|---|---|---|---|---|
| 1 | 분석 화면 — 시간대별 자세 그래프, 주야간 점유율, 14일 베이스라인·액토그램, 리듬 판정 | 없음 | `src/components/AnalysisTab.vue`, `src/composables/useInferenceSummary.js:109-172` | LogPage는 클립 목록만 |
| 2 | 이벤트 키워드 24시간 히스토그램 집계 | 없음 | `src/composables/useEventSummary.js` | — |
| 3 | VLM 관찰 문장 로그 (`infer_raw` 누적 20건) | 없음 | `src/composables/useInferLog.js:25-37` | `infer_raw` 수신만 하고 미표시 |
| 4 | VLM 상태 표시(색 점·라벨) + 모델 전환 UI | 없음 | `src/composables/useVlmStatus.js:31-40`, `src/components/HomeTab.vue:111` | `vlm_state` 수신만 |
| 5 | 하드웨어 리소스 화면 (CPU·RAM·디스크·GPU·온도) | 없음 | `src/components/ResourcesSheet.vue` | 필드는 수신하나 표시 화면 없음 (`cpu_percent` 등 사용처가 `useRealtimeEvents.js`와 타입 정의뿐) |
| 6 | 스트림 통계 (WebRTC `getStats()`·HLS 대역폭) | 없음 | `src/composables/useStreamStats.js` | `getStats(` 호출 없음 |
| 7 | 세션 만료 모달 (카운트다운·연장 버튼) | 완료 | `src/components/SessionExpiryModal.vue` | `src/components/App/SessionExpiryModal.vue` + 상단 세션 칩 (`src/App.vue`) |
| 8 | ko/en 다국어 (i18n, `t()`/`hasMessage()`) | 없음 | `src/i18n/messages.js`, `src/composables/useLocale.js` | 한국어 하드코딩 |
| 9 | 전역 토스트 시스템 (자동 숨김, kind별) | 부분 | `src/composables/useToast.js`, `config/ui.json:4` | 커스텀 이벤트 1곳뿐 (`src/main.js:135` `wally:show-toast`) |
| 10 | 알림 인박스 (수신 목록 저장·읽음 처리) | 부분 | `src/composables/useNotifications.js`, `src/components/NotificationsOverlay.vue` | AlarmPage는 있으나 mewly식 인박스 저장 구조와 다름 (`src/utils/notifications.js`) |
| 11 | 프로필 사진 크롭·리사이즈 (512px JPEG, 크롭 뷰) | 없음 | `src/components/ProfileOverlay.vue`, `config/ui.json:5-9` | 프로필 이미지 경로만 저장 (`src/composables/useProfile.js:23`) |
| 12 | 프롬프트 보호 장치 — 검증 원형 이탈 경고 + 2단계 저장 확인 + 베이스라인 단절 기록 | 없음 | `src/components/PromptSheet.vue:42-77`, `src/composables/analysisConfig.js:49-87` | 단순 저장 (`src/composables/usePromptSettings.js:57-92`) |
| 13 | 설정 외부화 — `config/*.json` (network·analysis·ptz·ui) | 부분 | `config/` 4개 파일 | `config/network.json` 이식 완료 (게이트웨이 scheme/port·스트림 버퍼/재시도·SSE 재접속/프로브·세션 리드타임). analysis·ptz·ui는 미이식 |
| 14 | 공용 `persistentRef` localStorage 헬퍼 | 없음 | `src/composables/storage.js` | 컴포저블마다 수동 JSON 처리 |

**제외 항목**: 조명·온도·마이크 제어는 mewly에서도 mock(localStorage, `useDevices.js:2-5`)이라 백엔드 기능이 아니며 Wally에 동등 드로어가 이미 있음. 테마(다크 토글), HLS/WebRTC 전환 UI, 일정 관리, 알림 설정 토글, 서버 주소 입력, 비밀번호 변경 화면은 Wally에 동등 기능 존재.

---

## 4. 양쪽 다 있지만 방식이 다른 것

### 엔드포인트 정의·토폴로지
- mewly는 **HTTPS(사설 CA, 2026-08-24 전환) + 단일 게이트웨이 8000**으로 모든 트래픽(REST·SSE·HLS·WHEP 릴레이)을 통과. 평문 http는 더 이상 서빙되지 않음 (`mewly/src/endpoints.js:9-12, 151-159`). Wally는 http + 포트 분산: API 8000 / app 8080 / HLS 8888 / WHEP 8889 (`src/endpoints.js:53-63, 142-151`). → **mewly 백엔드에 그대로 붙으면 전 요청 실패.**
- **SSE 경로 의미 변경**: mewly 라이브 상태는 `/state`, `/events`는 저장 이력 (`mewly/src/endpoints.js:103-107`). Wally는 8080 `/events`를 SSE로 사용 (`src/endpoints.js:127-129`).
- SSE 스냅숏 필드 격차는 §2-2 참조. mewly에는 수신 스냅숏 카운터 `snapshotSeq`도 있음 (`mewly/src/composables/useSSE.js:70`).
- 네트워크 상수: mewly는 `config/network.json`으로 외부화(스트림 버퍼·재시도·세션 리드타임·SSE 프로브 간격). Wally도 동일 구조 이식 완료 — `config/network.json`이 원본이고 `src/constants/network.js`는 재수출만 한다.

### 인증
- **세션 만료**: mewly는 만료 전 자동 갱신 타이머(persistent) + 만료 경고 카운트다운(ephemeral) + 만료 시 강제 로그아웃·리다이렉트 스케줄링 (`mewly/src/composables/useAuth.js:282-318`). Wally도 동일 구조 이식 완료 — persistent 자동 갱신, ephemeral 경고 모달(60초 리드)·만료 로그아웃, 상단 잔여 시간 칩 (`src/composables/useAuth.js`, `src/App.vue`, `src/components/App/SessionExpiryModal.vue`).
- **세션 교체(FR-047)**: mewly authFetch는 401 body `detail === 'token revoked'`를 구분해 갱신 시도 없이 `sessionReplaced` 사유로 로그아웃+리다이렉트 (`mewly/src/composables/useFetch.js:21-41`). Wally도 동일 분기 이식 완료 (`src/composables/useFetch.js` authFetch).
- **logout 페이로드**: mewly는 access token을 Authorization으로 실어 ephemeral 세션도 서버 측 epoch bump 가능 (`mewly/src/composables/useAuth.js:211-228`). Wally도 동일하게 이식 완료 (`src/composables/useAuth.js` `revokeSessionTokens`).
- **Wally가 더 정교한 부분(이식 시 유지 가치)**:
  - 로그인 429에 `LoginRateLimitError` + Retry-After 헤더/바디 파싱 (`src/composables/useAuth.js:172-191, 257-263`) — mewly는 detail 메시지만 (`mewly/src/composables/useAuth.js:375-378`).
  - login/refresh AbortController 타임아웃 (`src/composables/useAuth.js:143`) — mewly 없음.
- **호스트 저장 시점**: Wally는 로그인 성공 여부와 무관하게 즉시 저장 (`src/composables/useServerAuth.js:21-33`). mewly는 백엔드가 응답한 뒤에만 persist.

### 스트림 인증
- mewly는 HLS 플레이리스트·세그먼트 전 요청 Bearer (`xhrSetup`, `mewly/src/components/HomeTab.vue:403-405`; 네이티브 HLS는 URL `?token=` 폴백 `:420`) + WHEP 시그널링 Authorization (`:493-500`). Wally는 둘 다 무토큰 → mewly 백엔드에서 401 거부됨.

### PTZ
- 페이로드 기본형(`{action, pan, tilt}`)은 동일. mewly는 `save/goto`에 `slot`, `absolute`, `patrol`, 3단 속도(config) 추가 (`mewly/src/composables/usePtz.js:39-61`). Wally는 홈 1개·고정 속도 0.5.

### prompt / camera
- 페이로드 양쪽 호환 (prompt: `{prompt, triggers}` POST — `src/composables/usePromptSettings.js:72-75` vs `mewly/src/components/PromptSheet.vue:69`; camera: 동일 필드 GET/POST).
- 에러 사유 추출: mewly는 `failureDetail` 헬퍼로 `detail` 우선 통일 (`mewly/src/composables/useFetch.js:49-56`). Wally는 각 호출부에서 `data?.detail || data?.error` 개별 처리.

### 이벤트 로그 데이터원
- Wally 로그/이벤트 목록은 `/clips` 목록 조회 (`src/composables/useRealtimeEvents.js:314`). mewly는 전용 `/events` 이력 자원 사용 — 같은 화면 목적에 다른 백엔드 자원을 쓰는 상태.
