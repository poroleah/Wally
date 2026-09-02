# 보류된 설정 작업 (나중에 할 것)

- 작성일: 2026-08-31 (브랜치: `feat/backend-port`)
- 배경: mewly 게이트웨이 구조 이식 중 "지금 안 해도 동작에 지장 없거나, 백엔드 환경 확인이 먼저 필요한" 설정 작업을 여기로 분리함.
- 격차 전체 목록은 [MEWLY_BACKEND_PORT_GAP.md](MEWLY_BACKEND_PORT_GAP.md) 참조.

---

## 1. 백엔드 스킴(http/https) 설정 외부화 — ✅ 완료 (2026-09-01)

`config/network.json`의 `backendScheme`·`backendPort`로 외부화, `src/endpoints.js`가 import. 값은 기존과 동일(https, 8000).

**여전히 유효한 운영 메모**:
- https는 **클라이언트 기기에 사설 CA 루트 인증서 설치가 전제**됨 (Android WebView 포함 — Capacitor 앱이면 네트워크 보안 설정에 CA 신뢰 추가 필요할 수 있음).
- 백엔드가 http만 받는 테스트 환경이면 이제 `config/network.json`의 `backendScheme`만 `"http"`로 바꾸면 됨.
- 스킴이 틀리면 로그인부터 전부 실패하므로, 재생 문제와 혼동하지 말 것.

## 2. 네트워크 상수 외부화 (config/network.json 전반) — ✅ 완료 (2026-09-01)

`config/network.json`으로 전부 이동: `stream.hlsBuffer`·`defaultProtocol`·`stallTimeoutMs`·`retryBackoffMs`·`connectTimeoutMs`·`maxAutoRetries`·`longRecoveryDelaysMs`, `stream.webrtc.iceServers`, `sseProbeMinIntervalMs`, `sse.*ReconnectDelayMs`, `session.warningLeadMs`/`autoRefreshLeadMs`, `serverRequestTimeoutMs`(구 `src/constants/network.js` — 이제 재수출만).

## 3. WebRTC iceServers 설정 — ✅ 자리 마련 완료 (2026-09-01)

`config/network.json` `stream.webrtc.iceServers`(기본 `[]` — LAN 직결 전제라 STUN 불필요)를 `useWebRtcStream.js`가 읽는다. **원격 접근을 도입하는 시점에** 여기에 STUN/TURN 서버만 추가하면 됨 (참조: `mewly/src/components/HomeTab.vue:463-465`).

## 4. vite dev 프록시 정리 — ✅ 완료 (2026-09-01)

(a)안 채택: 죽은 프록시 규칙 삭제, 절대 URL 유지 (mewly와 동일, 백엔드 CORS 허용 전제). `vite.config.js`는 이제 정적 설정만 남음.

## 5. 클립 삭제 이식 — 보류 (2026-09-02, 사용자 결정)

`DELETE /clips` (`{names:[...]}` body) + 선택 모드 UI(전체선택·삭제 바) 이식은 보류.
- mewly 참조: `mewly/src/composables/useClips.js:14-19`, `AnalysisTab.vue`의 선택 모드
- 재개 시 참고: LogPage 히스토그램 드릴다운(`EventSummary.vue`)과 결합해 "필터된 목록만 선택 대상"으로 붙이면 자연스러움. 격차 문서 §2-6 참조.

## 6. 네이티브 HLS 폴백 한계 (메모)

hls.js 미지원 브라우저의 네이티브 HLS 경로는 헤더를 못 실어 `?token=` 쿼리로 대체했는데(`CamView.vue`의 `attachHls()` 폴백), **세그먼트 요청에는 토큰이 상속되지 않아** 게이트웨이 릴레이 뒤에서는 제한적임. mewly도 동일한 한계를 안고 hls.js를 정식 경로로 둠 (`mewly/src/components/HomeTab.vue:416-420`). 문제가 되면 게이트웨이 측 쿼리 토큰 지원 범위를 백엔드와 확인할 것.
