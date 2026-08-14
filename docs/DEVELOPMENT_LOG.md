# wally

## 개발 일지

### 2026-07-28

**Calender — 날짜 선택 표시 및 로그 발바닥 확대 효과 개선**
- Calender.vue — 오늘 날짜 숫자가 기본 상태에서 다른 날짜보다 크게 보이지 않도록 일반 날짜와 동일한 크기와 굵기로 통일하고 기존 원형 배경은 유지
- Calender.vue — 일반 날짜를 직접 선택하면 얇은 원형 테두리가 표시되고, 원 안의 날짜 숫자만 부드럽게 확대·복귀하도록 `0.18s` 전환 효과 적용
- Calender.vue — 로그가 있는 날짜를 선택할 때 기존 `logprint` 발바닥과 내부 날짜 숫자가 함께 확대되고 선택 해제 시 함께 원래 크기로 돌아오도록 보완
- Calender.vue — 달력 내부의 로그 표시는 기존 `logprint.svg`, `logprint_mono.svg` 및 다크모드 전용 리소스를 계속 사용해 로그·일정 표시 방식 유지

**PlanPage·AlarmPage — 공통 발바닥 아이콘 교체**
- public/icons/Paw.svg — 일정 영역과 알림에서 사용할 새로운 24px 발바닥 아이콘 추가
- Date.vue — 달력 아래 일정 날짜 오른쪽의 발바닥 버튼을 `/icons/Paw.svg`로 교체하고 기존 발자국 화면 이동 및 다크모드 색상 처리 유지
- usePlans.js / AlarmItem.vue — 일정의 기본 아이콘과 일정 알림의 발바닥 마스크를 `/icons/Paw.svg`로 통일하고, 기존 저장 데이터의 `Footprint.svg` 경로도 계속 표시되도록 호환 처리
- Web 프로덕션 빌드를 실행해 변경된 날짜 선택 스타일과 발바닥 아이콘 참조가 정상적으로 컴파일되는지 확인

**Android — 최신 달력·일정 아이콘 변경사항 실기기 반영**
- Vite 프로덕션 빌드 결과를 Capacitor Android 프로젝트에 동기화하고 `assembleDebug`로 최신 debug APK 생성
- 연결된 SM-A826S 기기에 `adb install -r -t`로 기존 앱 데이터를 유지한 채 업데이트 설치하고 패키지 설치 경로 확인
- 설치 완료 후 `com.wally.app`을 강제 종료하고 런처 인텐트로 다시 실행해 최신 변경사항 반영

---

### 2026-07-27

**AbnormalNotification — 이상행동 알림과 실제 클립 연결 개선**
- useRealtimeEvents.js — `event_triggered=true`이고 유효한 `clip_count`가 포함된 이벤트만 이상행동 감지 대상으로 수락해 중복·불완전 이벤트 처리 방지
- useRealtimeEvents.js — 클립 목록 조회 결과에 전체 개수를 함께 반환하고 캐시 방지 쿼리와 `no-store` 옵션을 적용해 최신 클립 상태 확인
- abnormalNotifications.js — 감지 즉시 텍스트 알림을 먼저 게시한 뒤 `clip_count`에 대응하는 실제 클립이 생성될 때까지 조회하고, 확인된 영상·이미지 썸네일로 동일 알림 갱신
- abnormalNotifications.js — 동일 `clip_count`의 중복 처리 방지, 최대 120초 조회 제한, 알림 이동 쿼리에 `clip_count` 전달 및 클립 촬영 날짜 기준 이동 처리 추가
- MainActivity.java — 네이티브 알림 브리지에 `clipCount`를 전달하고 원격 이미지, 인라인 이미지 및 MP4 첫 프레임을 알림 썸네일로 변환하도록 확장
- MainActivity.java — 알림 클릭 시 날짜·클립·`clip_count`를 발자국 화면으로 전달하고 썸네일 조회·게시 과정을 확인할 수 있는 진단 로그 추가
- artifacts/wally_notification_collapsed.png / wally_notification_expanded.png / wally_notification_target.png — 접힌 알림, 펼친 알림 및 알림 이동 결과 실기기 확인 자료 추가

**HomePage — 카메라 가로화면 전환 및 복귀 동작 보완**
- CamView.vue — 기기가 이미 가로 방향일 때 확대 버튼을 누르면 별도 확대 레이어 대신 네이티브 몰입 모드로 전환하고 인라인 영상을 이어서 재생하도록 개선
- CamView.vue — 가로화면에서 Android 뒤로가기를 누르면 세로 화면으로 복귀하며, 가로·세로 방향 전환 시 확대 상태와 영상 재생 상태가 자연스럽게 이어지도록 정리
- HomePage.vue / CamView.vue — 강제 세로 레이아웃 상태에서 가로 방향이 감지돼도 홈 콘텐츠 스크롤, 카메라 오버레이 및 하단 아이콘 영역이 정상 노출되도록 반응형 스타일 보완

**App — Android 뒤로가기 종료 안내 토스트 추가**
- main.js / App.vue — 루트 화면에서 Android 뒤로가기를 처음 누르면 `한 번 더 누르면 앱이 종료됩니다.` 안내 토스트를 2초간 표시하고, 이어서 다시 누를 때 앱을 종료하도록 개선
- App.vue — 공통 이벤트 기반 토스트 UI와 표시 타이머, 접근성 상태 알림 및 등장·퇴장 애니메이션 추가

---

### 2026-07-24

**Calender — 로그·일정 발자국 표시 개선**
- Calender.vue / logprint_mono.svg / logprint_mono_Dark.svg — 로그와 일정이 모두 있는 날은 주황색 발가락이 포함된 발자국으로, 로그만 있는 날은 라이트·다크 모드에 맞는 단색 발자국으로 구분해 표시
- Calender.vue — 일정만 있는 날은 기존 주황색 점을 유지하고, 로그 발자국이 있는 날에는 일정 점을 별도로 겹치지 않도록 수정해 주황색 표시가 두 개 나타나던 문제 해결
- Calender.vue — 오늘 날짜의 로그 숫자가 선택 전부터 크게 보이지 않도록 기본 크기를 일반 날짜와 맞추고, 날짜를 직접 누른 뒤에만 숫자와 발자국이 함께 확대되도록 선택 상태 분리
- Web 빌드와 Android debug APK 빌드를 완료하고 연결된 SM-A826S 기기에 기존 데이터를 유지한 채 업데이트 설치 및 앱 재실행

**Android — 다크모드 스플래시 화면 적용**
- styles.xml / values-night/styles.xml — Android 12 이상의 시스템 스플래시가 라이트·다크모드에 맞는 배경색을 사용하도록 시작 테마를 분리
- splash_screen_dark.xml / splash_page_dark.png — 어두운 배경과 다크모드 전용 Wally 로고를 사용하는 네이티브 스플래시 레이아웃 및 이미지 추가
- MainActivity.java — 앱에서 선택한 테마를 Android SharedPreferences에 저장하고 다음 실행 시 해당 값에 맞는 네이티브 스플래시를 선택하도록 연동
- MainActivity.java — Android 12 이상에서 앱별 야간 모드를 시스템에 등록해 앱 코드 실행 전에 표시되는 Android 자체 스플래시에도 다크모드가 적용되도록 보완
- Android — 수정 내용을 debug APK로 빌드하고 연결된 휴대폰에 기존 데이터를 유지한 채 업데이트 설치 후 테마 등록 및 재실행 완료

---

### 2026-07-23

**App — 다크모드 상태바 가독성 개선**
- MainActivity.java / main.js — 웹의 라이트·다크 테마 상태를 Android 시스템 UI 브리지로 전달해 다크모드에서는 상태바 아이콘과 시간이 밝게, 라이트모드에서는 어둡게 표시되도록 연동
- MainActivity.java — 전체화면 스트리밍을 종료해 시스템 바가 다시 나타날 때도 현재 앱 테마에 맞는 상태바 아이콘 스타일이 유지되도록 보완

**PlanPage — 일정 기본 시간 및 시간 선택기 동기화**
- Time.vue / Plan_Add.vue / Plan.vue / usePlans.js — 새 일정의 기본 시작 시간을 날짜와 관계없이 `09:00`, 종료 시간을 `12:00`으로 통일하고 기존에 저장된 일정의 시간은 그대로 유지
- Time.vue — 시작·종료 시간 휠피커가 상단에 표시된 시간과 동일한 시·분 위치에서 열리도록 실제 항목 높이를 기준으로 스크롤 위치 계산
- Time.vue — 펼침 애니메이션으로 휠 중앙값이 4시간씩 밀리던 문제를 수정하고, 선택기가 열린 뒤 값이 이동하지 않도록 시간 휠 전환 구조 정리
- Time.vue — 시작·종료 날짜나 시간 선택기가 펼쳐진 상태에서 다른 영역을 누르면 선택값을 저장하고 닫히도록 처리하며, 날짜는 선택 즉시 반영 후 닫히도록 개선

**PlanPage — 일정 항목·알림·반복 빠른 선택**
- Place.vue — 일정 항목을 한 번 누르면 기존처럼 선택만 하고, 두 번 누르면 해당 항목을 즉시 저장한 뒤 선택창이 닫히도록 추가
- OptionSheet.vue — 알림 및 반복 옵션도 두 번 누르면 선택값을 즉시 저장하고 창을 닫도록 공통 동작 적용
- Place.vue — 기타 직접 입력란에서는 더블클릭이 문자 선택과 입력을 방해하지 않도록 빠른 저장 동작 제외

**Android — 홈 화면 두 번 뒤로가기로 앱 종료**
- main.js — 팝업과 하위 화면에서는 기존 닫기·이전 화면 이동을 우선하고, 앱 홈 또는 마지막 진입 화면에서는 2초 안에 Android 뒤로가기를 두 번 누르면 앱이 종료되도록 처리
- main.js / main.css — 첫 번째 뒤로가기 입력 시 별도 안내 문구를 표시하지 않고 종료 대기 상태만 내부적으로 유지하도록 정리

**Android — 최신 일정 및 시스템 UI 변경사항 실기기 반영**
- dist / android — Vite 빌드 결과를 Capacitor Android 프로젝트에 동기화하고 debug APK를 재생성
- app-debug.apk — 연결된 Android 기기에 기존 일정·로그인 데이터를 유지한 채 업데이트 설치하고 앱 재실행

**Web — 모바일 Chrome 하단 네비게이션 표시 개선**
- App.vue — 모바일 Chrome 주소창이 표시될 때 `100vh` 최소 높이 때문에 앱 영역이 실제 viewport보다 커지고 하단 네비게이션이 화면 밖으로 밀리던 문제를 수정
- Nav.vue / App.vue — 웹 브라우저에서는 공통 네비게이션을 화면 하단에 고정하고, 페이지 콘텐츠에 네비게이션 높이만큼 하단 여백을 확보해 화면 크기와 주소창 상태가 달라도 항상 접근할 수 있도록 보완
- Nav.vue — 플랫폼 클래스 초기화 여부와 관계없이 비네이티브 환경을 판별하도록 웹 전용 CSS 선택자를 정리하고, Vue scoped 스타일에서 전역 선택 대상이 잘못 변환되던 문제 수정
- Chrome DevTools / Android — 연결된 휴대폰 Chrome의 실제 DOM, viewport 높이, 네비게이션 위치와 적용 스타일을 원격으로 확인해 레이아웃 수정 결과 검증
- Vite — 휴대폰이 이전 개발 서버(`172.27.1.206:5176`)에 접속해 최신 변경사항이 보이지 않던 원인을 확인하고 현재 개발 PC 주소(`172.27.1.20:5176`)로 접속 경로 정리

**Calender — 로그 발바닥 다크모드 및 SVG 표시 개선**
- Calender.vue — 기록이 존재하는 날짜의 발바닥 이미지를 공통 테마 이미지 전환 디렉티브에 연결해 라이트·다크모드에 맞는 리소스가 자동 적용되도록 수정
- logprint_Dark.svg — 어두운 달력 배경에 맞는 갈색·주황색 조합의 다크모드 전용 발바닥 리소스 추가하고 내부 날짜 숫자를 밝은 테마 색상으로 표시
- Calender.vue — 발바닥 이미지 클래스를 `fluentanimalPawPrint48FilIcon` 구조로 정리하고 최대 높이 `42px`를 유지하면서 실제 날짜 셀 크기에 맞게 축소되도록 보정
- logprint.svg / logprint_Dark.svg — 주황색 발가락을 위·아래 두 경로 대신 단일 타원으로 변경해 중앙에 가로 경계선이 나타나던 렌더링 문제 수정
- Android — 수정된 달력 리소스를 Capacitor 프로젝트에 동기화하고 debug APK를 빌드해 연결된 휴대폰에 기존 데이터를 유지한 채 업데이트 설치 및 재실행

**AlarmPage — 일정 알림 아이콘 테마 색상 통일**
- AlarmItem.vue — 일정 알림 아이콘에 하드코딩되어 있던 색상 처리를 제거하고 공통 테마 색상 토큰을 사용하도록 변경해 라이트·다크모드에서 목록 아이콘 색상이 일관되게 표시되도록 수정
- AlarmItem.vue — 기본 일정인 두쫀쿠 알림의 발바닥 SVG를 CSS 마스크 방식으로 표시하고 `var(--log-text)` 색상을 적용해 라이트모드에서도 다른 일정 아이콘과 동일한 색상으로 노출되도록 보완
- Android — 최신 웹 빌드를 Capacitor Android 프로젝트에 동기화하고 debug APK를 생성해 연결된 휴대폰에 기존 데이터를 유지한 채 업데이트 설치 및 재실행

---

### 2026-07-22

**App — 전체 다크모드 테마 및 테마별 이미지 적용**
- base.css / main.js — 앱 전역 색상 토큰과 라이트·다크 테마 클래스를 정리하고 저장된 사용자 설정 또는 시스템 테마에 따라 초기 화면부터 올바른 색상이 적용되도록 구성
- themeSrc.js / AppLogo.vue / SplashScreen.vue / Chat.vue / ChatBotPage — 현재 테마에 맞는 로고·챗봇·채팅·발바닥·조명 아이콘 리소스를 자동으로 교체하는 공통 디렉티브 추가
- HomeDirectionDrawer.vue / HomeLightDrawer.vue / AlarmItem.vue — 드로어와 알림 카드의 배경·아이콘·텍스트가 다크모드에서도 선명하게 표시되도록 테마 스타일 보완

**HomePage — WebRTC 스트리밍 추가 및 HLS 전환 개선**
- useWebRtcStream.js — WebRTC 연결 생성, 원격 영상 스트림 수신, 연결 상태·오류·정리 흐름을 관리하는 composable 신규 추가
- CamView.vue — 홈 카메라에서 HLS와 WebRTC 스트리밍 방식을 선택·전환할 수 있도록 연결하고 프로토콜 상태 배지 및 재연결 처리 추가
- CamView.vue — HLS/WebRTC 전환 UI와 내부 상태를 정리해 스트림 방식을 바꿀 때 이전 연결이 남거나 영상 상태가 어긋나는 문제 수정

**Alarm — 일정·이상행동 네이티브 알림 기능 확장**
- notifications.js / alarm.js / scheduleAlarmSync.js — Android 알림 권한, 알림 채널, 일정 예약·취소·반복 및 저장된 일정의 재동기화 흐름 구성
- abnormalNotifications.js / MainActivity.java — 이상행동 감지 알림에 제목·내용·썸네일을 표시하고 알림 선택 시 해당 발자국 기록 화면으로 이동하는 네이티브 브리지 추가
- AndroidManifest.xml / ic_stat_wally.xml — 알림 표시 권한과 Wally 전용 상태바 알림 아이콘 리소스 추가
- Plan_Add.vue / Time.vue / CalenderPage — 일정 등록·수정·삭제 시 네이티브 알림을 함께 갱신하고, 알림을 통해 전달된 날짜와 기록을 달력 및 발자국 화면에 반영

**HomePage — 스트리밍 프로토콜 배지 및 가로 확대 UI 개선**
- CamView.vue — HLS/WebRTC 배지를 실제 스트리밍 영상 비율을 반영하는 relative wrapper 내부로 이동해 object-fit과 letterbox가 적용되어도 영상 우측 상단을 기준으로 표시되도록 수정
- CamView.vue — 새로고침·카메라·PTZ 버튼은 기존 컨트롤 영역에 유지하고, 가로 확대 화면의 새로고침·음소거·방향 아이콘 표시 크기를 닫기 아이콘 기준으로 통일
- CamView.vue — 확대 화면의 전역 버튼 초기화 스타일이 카메라 `다시 시도` 버튼 배경을 투명하게 덮던 충돌을 분리해 홈 화면과 동일한 버튼 UI가 표시되도록 수정

**HomePage — 가로 확대 종료 후 일반 홈 복귀 및 스크롤 보완**
- HomePage.vue / CamView.vue — 가로 확대 중에는 영상과 영상 컨트롤만 표시하고, 닫기 버튼을 누른 뒤에는 로고·상태 정보·영상·HomeBar·공통 하단 내비게이션이 포함된 일반 홈 레이아웃으로 복귀하도록 상태별 CSS 분리
- HomePage.vue — 물리 화면이 가로로 남아 있는 확대 종료 상태에서 콘텐츠 높이가 viewport를 넘으면 세로 스크롤이 생성되도록 pageContent의 고정 높이와 flex·overflow 구조 수정
- CamView.vue — 확대 종료 후 인라인 영상이 HomeBar 영역을 덮지 않도록 영상 컨테이너 높이와 실제 스트림 비율 계산을 조정

**SettingsPage — 가로 화면 콘텐츠 잘림 및 스크롤 개선**
- SettingsPage.vue — 짧은 가로 화면에서 설정 카드가 하단 내비게이션 경계에 잘리지 않도록 페이지 세로 스크롤과 Safe Area 하단 여백 적용
- SettingsPage.vue — 가로 viewport 높이에 맞춰 설정 헤더 높이와 카드 겹침 간격을 반응형으로 축소해 메뉴 접근성 개선

**LoginPage — 가로 화면 스크롤 및 세로 중앙 정렬 개선**
- LoginAddress.vue / LoginPage.vue — 고정 높이와 overflow hidden 조합을 제거하고 터치 기반 세로 스크롤과 Safe Area 하단 여백을 적용해 짧은 가로 화면에서도 입력창과 버튼에 접근할 수 있도록 수정
- LoginAddress.vue / LoginPage.vue — 가로 화면에서 로고와 폼을 하나의 묶음으로 세로 중앙 정렬하고 위·아래 잔여 공간을 auto margin으로 균등 배분하되, 콘텐츠가 화면보다 길면 정상적으로 스크롤되도록 보완

**Android — 최신 웹 변경사항 APK 반영 및 실기기 업데이트**
- dist / android — Vite 프로덕션 빌드 결과를 Capacitor Android 프로젝트에 동기화하고 debug APK 생성
- app-debug.apk — 연결된 Android 기기에 기존 앱 데이터를 유지하는 업데이트 설치를 수행하고 최신 버전으로 재실행

---

### 2026-07-20

**LogPage — 기록 날짜의 발바닥 아이콘 표시 개선**
- Log_Header.vue / logprint.svg — 기록이 존재하는 날짜의 기존 점 표시를 발바닥 아이콘으로 교체하고, SVG에 고정되어 있던 숫자를 제거해 실제 날짜가 아이콘 안에 표시되도록 수정
- Log_Header.vue — 발바닥 날짜 선택 시 일반 날짜와 동일한 회색 계열 테두리가 발바닥 윤곽을 따라 표시되도록 처리하고, 선택 전후 크기와 날짜 숫자의 정렬 위치를 조정

**HomePage — 카메라 새로고침·확대 종료·화면 회전 시 재생 복구**
- CamView.vue — 스트림 재연결 전에 기존 video 요소의 재생 상태와 소스를 정리하고 다시 초기화하도록 변경해 새로고침 후 이전 스트림 상태가 남는 문제 수정
- CamView.vue — 확대 카메라 화면을 닫을 때 확대용 HLS 인스턴스를 정리한 뒤 홈 화면의 인라인 영상을 다시 재생하도록 보완
- CamView.vue — 실제 화면 방향이 변경된 경우 viewport 상태를 갱신하고 인라인 영상을 재생하도록 회전 처리 순서를 정리해 가로·세로 전환 후 영상이 멈추는 문제 수정

**HomePage — 확대 및 가로 모드 카메라 UI 조정**
- CamView.vue — 세로 확대 모드의 영상 위치를 위쪽으로 조정하고, 가로 모드에서 닫기·새로고침·음소거·촬영·전체화면 등 조작 아이콘 크기를 축소
- HomePage.vue — 가로 모드에서 카메라 이동패드를 열 때 홈 드로어의 반투명 배경이 함께 표시되지 않도록 PTZ 상태 처리 분리

**App — 네이티브 스플래시 및 설정 화면 정렬 개선**
- main.js — 네이티브 앱에서는 Vue 마운트 직후 웹 스플래시를 제거하도록 변경해 큰 스플래시 다음 작은 스플래시가 연속 노출되던 현상 수정
- Account.vue / More.vue — 설정 페이지의 `계정`, `더보기` 제목 크기와 구분선 아래 여백을 메뉴 항목 기준에 맞게 통일

---

### 2026-07-14

**AlarmSetting — 알림 설정 화면 UI 및 접근성 개선**
- AlarmSetting.vue — 알림 종류별 영역과 토글의 배치, 간격, 색상 변수를 정리해 설정 화면의 시각적 일관성 개선
- AlarmSetting.vue — 알림 옵션을 의미에 맞는 버튼·섹션 구조로 정리하고 `aria-label`, `aria-pressed` 속성을 추가해 상태 전달과 접근성 보완
- AlarmSetting.vue — 헤더 뒤로가기 버튼과 선택 상태 스타일을 정리하고 모바일 화면에서 영역이 자연스럽게 이어지도록 레이아웃 수정

---

### 2026-07-13

**Android — Safe Area 및 대용량 영상 저장 브리지 개선**
- MainActivity.java — Android WebView의 시스템 바 inset 값을 CSS 변수로 전달해 화면 방향별 상·하·좌·우 Safe Area를 웹 UI에서 사용할 수 있도록 구성
- MainActivity.java / CamView.vue — 녹화 영상을 작은 청크 단위로 네이티브 MediaStore에 전달하고 저장을 완료·취소할 수 있는 브리지를 추가해 대용량 영상 저장 안정성 개선

**HomePage — 당겨서 새로고침 및 카메라 재연결 보완**
- HomePage.vue / CamView.vue — 홈 화면의 당겨서 새로고침 동작에서 카메라 스트림을 강제로 다시 불러오고 인라인 영상을 재생하도록 재시도 함수를 연결
- CamView.vue — 녹화 중 상태 표시와 애니메이션, 가로 모드 컨트롤 위치 및 Safe Area 반영을 보완

**LogPage·LoginPage — 화면 조작 및 네트워크 예외 처리 개선**
- Log_Header.vue — 달력에서 좌우 스와이프로 이전·다음 달을 이동할 수 있도록 터치 동작 추가
- useAuth.js — 로그인 요청에 제한 시간과 요청 취소 처리를 추가해 네트워크 응답이 없을 때 화면이 계속 대기하는 문제 방지
- SettingsPage.vue — 설정 카드 상단 여백 조정

---

### 2026-07-10

**App — Android 뒤로가기 및 네이티브 화면 전환 처리**
- main.js — `@capacitor/app` 기반 Android 뒤로가기 이벤트를 등록하고 현재 라우트와 오버레이 상태에 따라 닫기·이전 화면 이동·앱 종료가 순서대로 동작하도록 구성
- CamView.vue / HomePage.vue / Clip_Detail.vue / Record.vue / BotPage.vue — 확대 화면, 드로어, 상세 화면 등에서 Android 뒤로가기 이벤트를 우선 처리하도록 보완
- SettingsPage 하위 화면 — 프로필, 알림, 앱 정보, 문의, 오픈소스 라이선스 화면의 네이티브 뒤로가기 동작 통일

**HomePage — 카메라 촬영·녹화 및 전체화면 UI 개선**
- CamView.vue — 사진 촬영 플래시, 촬영 모드 안내, 녹화 파일 형식 처리와 저장 흐름을 보완하고 Android 전체화면에서 시스템 영역에 UI가 가려지지 않도록 레이아웃 수정
- HomePage.vue — 카메라 컨트롤 및 드로어가 열릴 때 배경과 터치 영역이 일관되게 동작하도록 정리

**LogPage·PlanPage — 일정 및 기록 날짜 표시 보완**
- Log_Header.vue / usePlans.js — 달력에서 일정 날짜와 로그 기록 날짜를 구분해 표시하고 실시간 기록 날짜를 달력에 반영
- usePlans.js / PlanPage — 일정 알림의 날짜·시간·오전/오후 표시 데이터를 정리해 등록된 일정이 일관된 형식으로 노출되도록 수정

---

### 2026-07-09

**Android — Capacitor APK 빌드 환경 구성**
- android/ — Gradle 프로젝트, 앱 모듈, AndroidManifest, MainActivity 및 Capacitor 설정 파일을 추가해 Android Studio와 Gradle에서 APK를 빌드할 수 있는 환경 구성
- package.json / capacitor.config.ts — Android 플랫폼과 스플래시 화면 플러그인 의존성 및 앱 설정 추가

**Android — 앱 아이콘·스플래시 및 갤러리 저장 연동**
- android/app/src/main/res — 화면 밀도, 세로·가로 방향, 다크 모드에 맞는 런처 아이콘과 스플래시 리소스 및 테마 추가
- MainActivity.java / CamView.vue — 촬영한 이미지와 영상을 Android MediaStore를 통해 기기 갤러리에 저장할 수 있도록 네이티브 브리지 연동
- SplashScreen.vue / main.js — 앱 시작 시 웹 화면과 네이티브 스플래시가 자연스럽게 전환되도록 초기 로딩 흐름 구성

---

### 2026-06-24

**LoginPage — 태블릿 반응형 화면 적용**
- LoginPage.vue / LoginAddress.vue — 태블릿 세로 화면에서 로고, 입력 폼, 옵션, 오류 메시지의 크기와 간격이 화면 비율에 맞게 표시되도록 반응형 스타일 추가

**AlarmPage — 알림 목록 및 시간 표시 개선**
- AlarmPage.vue / AlarmItem.vue / Stack.vue — 알림 제목, 상태, 본문, 시간의 반응형 글자 크기를 변수로 정리하고 태블릿 화면에서 항목 간 배치와 정렬 보완

---

### 2026-06-22

**App — 태블릿 세로 화면 반응형 UI 확대 적용**
- Calender.vue / Log_Page.vue — 태블릿 화면에서 달력 날짜, 이동 버튼, 기록 표시, 로그 타임라인과 상태 정보의 크기 및 간격 조정
- Nav.vue / NavItem.vue / HomeBar.vue — 하단 내비게이션과 홈 상단 바의 높이, 아이콘, 텍스트 크기를 태블릿 해상도에 맞게 확대하고 Safe Area 반영
- HomeLightDrawer.vue / StateBar.vue — 조명 드로어, 상태 카드, 제어 아이콘과 표시 점의 크기 및 배치를 태블릿 기준으로 보완
- Date.vue / Plan.vue / Time.vue — 일정 화면의 날짜·시간·내용 영역이 태블릿에서도 균형 있게 보이도록 글자 크기와 여백 조정

---

### 2026-06-19

**HomePage — 가로 모드 화면 잘림 및 회전 상태 오류 수정**
- App.vue / HomePage.vue — 홈 가로 모드에서 `100vh` 대신 `100dvh`·`100dvw`를 사용하고 전체화면 콘텐츠와 영상 영역 크기를 명시해 모바일 브라우저/WebView 회전 시 화면이 일부만 표시되던 현상 수정
- CamView.vue — 가로 모드 카메라 wrapper와 video를 화면 전체에 고정하고 최소 크기 제약을 정리해 카메라 화면과 컨트롤이 viewport를 안정적으로 채우도록 보정
- CamView.vue — 가로 모드에서 방향패드를 연 채 세로 모드로 전환하면 카메라 내부 패드와 세로 방향 드로어가 겹치던 문제를 수정하고, 회전 시 내부 PTZ 상태와 진행 중 이동을 정리

**AlarmPage — 화면 밖 알림 삭제 처리 개선**
- Stack.vue — 알림 목록과 카드 DOM 위치를 추적해 휴지통 클릭 시 현재 viewport에 보이는 알림과 화면 밖 알림을 구분
- Stack.vue — 화면 밖 알림은 즉시 제거하고, 사용자가 보고 있는 알림만 아래쪽부터 기존 계단식 퇴장 애니메이션으로 삭제되도록 변경
- Stack.vue — 화면 표시 여부와 관계없이 삭제 대상 전체 ID를 localStorage에 기록해 삭제된 알림이 다시 노출되지 않도록 유지

**프로필 이름 — 홈 조명 및 챗봇 샘플 데이터 연동**
- HomeLightDrawer.vue — 하드코딩된 “몽실이 하우스” 대신 저장된 프로필 이름을 사용해 “반려동물 이름 + 하우스” 형식으로 표시
- useConversations.js — 챗봇 샘플 대화의 “콩돌이” 이름을 현재 프로필 이름으로 치환하고, 프로필 이름이 없으면 “반려동물”을 기본값으로 사용
- useConversations.js — 대화 목록과 상세 조회 모두 동일한 프로필 이름이 반영되도록 computed 기반 포맷팅 흐름 구성

---

### 2026-06-16

**HomePage — 하단 제어 드로어 반응형 보정**
- HomeDirectionDrawer.vue — 방향 드로어 높이를 `clamp`와 `dvh` 기준으로 조정하고 방향패드 너비와 저장 버튼 위치를 컨테이너 크기에 맞춰 제한
- HomeLightDrawer.vue — 조명 드로어 높이와 밝기 조절 영역을 반응형 크기로 변경하고, 좁은 화면에서도 양쪽 버튼과 슬라이더가 영역 안에 유지되도록 grid 구조 보정
- HomeTalkDrawer.vue — 말하기 드로어 최소 높이를 화면 높이에 맞게 조정하고 하단 파형 너비를 viewport가 아닌 드로어 컨테이너 기준으로 변경
- HomeTemperatureDrawer.vue — 온도 드로어와 아크 영역을 반응형 크기로 변경하고, 온도 노브 위치를 고정 rem 좌표 대신 아크 영역의 백분율 좌표로 계산
- HomeTemperatureDrawer.vue — 온도 노브에 중앙 기준 translate를 적용해 화면 크기가 달라져도 아크 경로 위에 정확히 배치되도록 보정

**Docs — 프로젝트 구조 설명 보강**
- README.md — 앱 공통 레이아웃, 라우터 인증 흐름, 하단 네비게이션 진입 구조에 대한 설명 추가
- README.md — endpoints, useFetch, 인증·카메라·PTZ·로그·프롬프트 composable 간 서버 통신 관계 설명 추가

---

### 2026-06-15

**HomePage — 온도 조절 드로어 구현 및 Figma 보정**
- HomeTemperatureDrawer.vue — 홈바 온도 버튼 클릭 시 열리는 온도 조절 드로어를 새로 구성하고 HomePage의 activeHomeControl 흐름에 연결
- HomeTemperatureDrawer.vue — warm/cool 토글 상태에 따라 불꽃/눈송이 아이콘, 토글 색상, 희망 온도와 현재 온도 기본값이 바뀌도록 정리
- HomeTemperatureDrawer.vue — warm 모드는 20~34도, cool 모드는 18~24도로 희망 온도 범위를 제한
- HomeTemperatureDrawer.vue — API 연결 전 임시 동작으로 +/− 조작 시 현재 온도도 함께 변경되도록 처리
- HomeTemperatureDrawer.vue — 현재 온도를 0~50도 범위로 환산해 아크 진행률과 원형 노브 위치가 바뀌도록 계산 로직 구성
- HomeTemperatureDrawer.vue — 라이트/다크 모드에서 온도 숫자, °C 아이콘, 아크, 노브 색상이 자연스럽게 보이도록 CSS mask와 테마 색상 보정
- public/icons/Home/Bar/Tem/* — 온도 드로어에서 사용하는 +, −, fire, snow, celsius 계열 아이콘 리소스 연결

**HomePage — 방향 제어 드로어 Figma 보정**
- HomeDirectionDrawer.vue — 방향 제어 드로어 상단에 “카메라 이동” 제목을 추가하고 닫기 버튼, 제목, 오른쪽 액션 아이콘 위치를 Figma 기준으로 재배치
- HomeDirectionDrawer.vue — 방향패드와 되돌아가기/저장 아이콘이 드로어 안에서 너무 위로 붙어 보이지 않도록 전체 조작 영역을 아래로 이동
- HomeDirectionDrawer.vue — 되돌아가기 아이콘과 저장 아이콘 크기를 키워 Figma 시안과 더 비슷하게 보이도록 조정
- HomeDirectionDrawer.vue — 기존 PTZ pointer down/up 이동 기능과 저장/되돌아가기 동작은 유지하면서 시각 위치만 보정

**Docs — GitHub README 및 개발 일지 정리**
- README.md — GitHub 저장소 첫 화면에 페이지 구조도가 보이도록 기존 page-structure 내용을 README로 이동
- docs/DEVELOPMENT_LOG.md — 기존 README에 있던 개발 일지 내용을 docs 폴더로 분리
- docs/page-structure.md — README와 중복된 구조도 문서를 제거하고 문서 진입점을 README 기준으로 정리
- README.md — 개발 일지 위치를 바로 찾을 수 있도록 docs/DEVELOPMENT_LOG.md 링크 추가

---

### 2026-06-08

**HomePage — 말하기 드로어 파형 동작 개선**
- HomeTalkDrawer.vue — 마이크 버튼에 pending 상태를 추가해 권한 요청 중 중복 클릭을 막고 aria-busy/disabled 상태를 연결
- HomeTalkDrawer.vue — 마이크 입력 시작 실패 시 상태와 스트림을 정리하도록 startAudioInput 반환 흐름을 보강
- HomeTalkDrawer.vue — Flat.svg/Wave.svg 전환 방식 대신 SVG path를 직접 계산해 음성 크기에 따라 파형이 부드럽게 움직이도록 변경
- HomeTalkDrawer.vue — amplitude와 separation 값을 분리해 작은 입력에는 잔잔한 파형, 큰 입력에는 레이어 간격이 커지는 파형으로 보정
- HomeTalkDrawer.vue — 다크모드에서 마이크 중앙 레이어가 더 선명하게 보이도록 opacity/filter를 보정

**HomePage — 방향 제어 저장/되돌아가기 액션 추가**
- HomeDirectionDrawer.vue — 방향 제어 드로어에 저장된 위치로 되돌아가기 버튼과 현재 위치 저장 버튼을 추가
- HomeDirectionDrawer.vue — usePtz의 gotoHome, saveHome 동작을 드로어 오른쪽 액션 아이콘에 연결
- HomeDirectionDrawer.vue — 닫기 버튼 위치와 오른쪽 액션 아이콘 터치 영역, focus outline 처리를 함께 정리

**HomePage — 조명 드로어 표시 보정**
- HomeLightDrawer.vue — 밝기 퍼센트 텍스트의 고정 min-width를 제거해 숫자 자릿수에 따라 더 자연스럽게 정렬되도록 조정

---

### 2026-06-05

**HomePage — 말하기 파형 / 마이크 입력 반응 보정**
- HomeTalkDrawer.vue — 말하기 드로어에 마이크 버튼, 원형 마이크 레이어, 하단 파형 영역을 구성
- HomeTalkDrawer.vue — 마이크 입력의 시간영역 RMS 값을 읽어 실제 목소리 크기에 따라 wave 파형의 높낮이가 달라지도록 연결
- HomeTalkDrawer.vue — 아무 말도 하지 않거나 입력 레벨이 낮을 때는 `Flat.svg`를 표시하고, 음성 입력이 감지되면 `Wave.svg` 파형으로 전환되도록 처리
- HomeTalkDrawer.vue — 외장 마이크 입력이 낮게 들어오는 경우를 고려해 무음 임계값과 입력 감도를 낮추고, `autoGainControl` 활성화 및 echo/noise suppression 비활성화로 감지 반응을 보정
- public/icons/Home/Bar/Mic/* — 말하기 화면용 Flat/Wave 파형 아이콘과 마이크 레이어 리소스 정리

---

### 2026-06-04

**HomePage — 홈바 기능 드로어 추가**
- HomeBar.vue / HomePage.vue — 홈 하단 빠른 제어 바를 라이트, 온도조절, 대화하기, 방향 제어 4개 버튼 구조로 정리하고 active 상태에 따라 on/off 아이콘이 전환되도록 연결
- HomePage.vue — 홈바 버튼 클릭 시 하단 드로어가 슬라이드로 열리고, 같은 버튼 재클릭 시 닫히도록 `activeHomeControl` 흐름 구성
- HomePage.vue — 방향 제어 드로어를 닫을 때 CamView의 PTZ 패드 상태도 함께 닫히도록 동기화
- public/icons/Home/Bar/* — 홈바 전용 라이트/온도/마이크/방향 아이콘 세트를 `Bar` 폴더 기준으로 정리

**HomePage — 조명 드로어 구현**
- HomeLightDrawer.vue — 조명 드로어에 닫기 버튼, 하우스 이름, on/off 토글, 현재 밝기 퍼센트 표시, 램프 이미지를 배치
- HomeLightDrawer.vue — 0/20/40/60/80/100 단계 밝기 선택 컨트롤을 추가하고 선택값에 따라 램프 아이콘과 퍼센트가 변경되도록 연결
- public/icons/Home/Bar/Light/* — 밝기 단계별 램프 아이콘과 조명 설정 아이콘 리소스 추가

**HomePage — 방향 제어 드로어 구현**
- HomeDirectionDrawer.vue — 하단 드로어 안에 방향패드를 배치하고, 상/하/좌/우 pointer down/up 이벤트를 `usePtz`의 start/stop 이동 요청에 연결
- HomeDirectionDrawer.vue — 닫기 또는 컴포넌트 해제 시 진행 중인 PTZ 이동이 중지되도록 정리

**HomePage — 말하기 드로어 기반 구성**
- HomeTalkDrawer.vue — 말하기 드로어의 마이크 버튼, 활성 상태 glow 애니메이션, 하단 파형 표시 영역을 추가
- HomeTalkDrawer.vue — 마이크 on/off 상태에 따라 오디오 입력 루프를 시작/중지하고, 컴포넌트 해제 시 스트림과 AudioContext를 정리하도록 구성

---

### 2026-06-02

**HomePage — 홈바 UI 전환**
- HomeBar.vue — 기존 홈 아이콘 영역을 하단 빠른 제어 바 형태로 전환하고, 버튼별 active 아이콘 표시 구조를 추가
- HomePage.vue — 홈바에서 선택한 제어 항목을 페이지 상태로 관리해 이후 조명/말하기/방향 드로어가 연결될 수 있는 기반 구성
- CamView.vue — 홈바 방향 제어 상태와 카메라 PTZ 패드 표시 상태가 충돌하지 않도록 이벤트 연결 흐름 보정
- public/icons/Home/* — 홈바 on 상태 아이콘 리소스 추가 및 홈 카메라 컨트롤 아이콘 경로 정리

---

### 2026-05-29

**LogPage — 타임라인 높이 및 빈 상태 보정**
- Log_Page.vue — 로그가 없거나 로딩/오류 상태일 때 타임라인 세로 바가 상태 카드 높이에 맞춰 끝나도록 조정
- Log_Page.vue — 로그가 1개만 있을 때도 바가 화면 끝까지 뻗지 않고 실제 로그 콘텐츠 높이까지만 표시되도록 min-height 구조 보정

**CalenderPage — 로그 기록 날짜 표시**
- Calender.vue / useRealtimeEvents.js — 월별 클립 조회를 통해 로그가 있는 날짜를 계산하고, 해당 날짜 셀에 작은 주황색 점 표시 추가
- public/icons/Calender/Date/* — Figma 기준 날짜 아이콘 리소스 추가

**Clip Detail — 영상보기 컨트롤 보정**
- Clip_Detail.vue — 음소거 버튼 배경은 베이지 원으로 고정하고, 음소거/소리 켜짐 상태에 따라 내부 아이콘만 바뀌도록 정리
- public/icons/Log/Sound_Mute_Log.svg — 로그 영상보기 전용 배경 없는 음소거 아이콘 추가
- Clip_Detail.vue — 확대 버튼 클릭 시 눌림 모션이 보인 뒤 전체화면이 열리도록 pressed 상태와 짧은 지연 처리 추가

**AlarmPage — 알림 스택 동작 정리**
- Head.vue / AlarmItem.vue — 상단 탭과 알림 카드 클릭 시 브라우저 기본 파란 하이라이트가 보이지 않도록 tap highlight/focus outline 제거
- Stack.vue / useLogs.js / useRealtimeEvents.js — 과거 로그를 알림으로 다시 쌓을 수 있도록 날짜 범위 및 페이지 조회 흐름 추가
- Stack.vue — 알림 스택은 최대 20개까지만 표시하고, 사용자가 삭제한 알림 ID는 localStorage에 저장해 다시 노출되지 않도록 처리
- Stack.vue — 알림이 많이 쌓일수록 전체 삭제 애니메이션이 더 빠르게 진행되도록 삭제 간격을 개수 기반으로 조정

**HomePage — 상태바 DoubleDot 정렬**
- StateBar.vue — 카메라 이름 앞 주황 점을 /icons/Home/DoubleDot.svg로 교체하고 Figma 기준에 맞춰 카메라 아이콘, DoubleDot, 카메라 이름 간격 조정
- CamView.vue — 녹화 중 배지의 점 표시도 DoubleDot.svg로 통일

---

### 2026-05-28

**HomePage — 세로/전체화면 방향패드 및 카메라 컨트롤 보정**
- HomeBar.vue / HomePage.vue / CamView.vue — 홈 하단 방향 제어 버튼 클릭 이벤트를 CamView까지 전달해 세로모드에서도 PTZ 방향패드가 열리도록 연결
- CamView.vue — 일반 세로모드 방향패드는 홈 화면 위 Teleport 레이어로 표시하고, 전체화면 세로모드 방향패드는 전체화면 컨트롤 내부에 직접 렌더링해 닫기 버튼과 충돌하지 않도록 구조 분리
- CamView.vue — 전체화면 우하단 방향 버튼에 방향패드 토글 동작을 연결하고, X 버튼 클릭 시 방향패드와 전체화면이 함께 닫히도록 closeExpandedView 흐름 정리
- CamView.vue — 전체화면 세로모드 방향패드를 촬영 버튼 가까운 하단 중앙 위치로 이동해 방향 조절 중 바로 촬영할 수 있도록 배치
- CamView.vue — 방향패드 크기, 이미지 높이, border-radius, 태블릿 가로 미디어쿼리의 고정 px 값을 rem/clamp/aspect-ratio 기반 반응형 단위로 변경
- CamView.vue — 전체화면 세로모드 카메라/비디오 토글을 기존 Cam_Camera2.svg, Cam_Video2.svg 디자인 기준으로 유지하면서 thumb 이동 모션만 부드럽게 보정
- CamView.vue — 가로모드 토글과 전체화면 세로모드 토글 표시 방식을 분리해 가로모드 기존 세로형 토글 동작을 유지

---

### 2026-05-27

**HomePage — 카메라 확대 화면 UI 정리**
- CamView.vue — 세로 확대 화면에 닫기, 카메라 이름, 새로고침 헤더와 하단 소리/촬영/모드전환/방향 컨트롤을 Figma 구조에 맞춰 배치
- 확대 화면 바깥 검은 영역 클릭 시 자동으로 닫히던 동작 제거, 버튼 터치 시 파란 포커스 박스가 남지 않도록 tabindex, blur 처리, tap highlight 스타일 보정
- 카메라 이름은 선택된 카메라 이름을 표시하고, 글자 수가 길어질수록 font-size를 줄여 제목 영역 안에 보이도록 조정
- 카메라 연결 상태/다시 시도 오버레이가 제목과 겹치지 않도록 확대 영상 상단 기준 위치로 이동
- 세로 확대 화면의 촬영/비디오 토글은 Cam_Camera2.svg, Cam_Video2.svg 전용 아이콘을 사용하도록 변경하고, 가로 모드 토글은 기존 세로형 구조 유지
- 가로 모드 방향 제어 버튼과 확대 화면 방향 버튼을 Bar_Direction.svg로 통일

**SettingsPage — 카메라 프로필 보정**
- IpSetting.vue — 카메라 프로필 상단에 카메라 이름 입력 필드를 복구하고, 저장 시 name 값을 함께 전달하도록 연결

---

### 2026-05-26

**SettingsPage — 프롬프트 / 설정 화면 Figma 보정**
- PromptSetting.vue — 주요 키워드 입력칸과 삭제 버튼 사이 간격 및 삭제 아이콘 크기를 Figma 기준에 맞게 조정
- PromptSetting.vue — 삭제 아이콘 리소스를 Setting/Trash.svg 기준으로 정리
- SettingsPage.vue — 로그아웃 버튼 상단 간격 보정
- SettingsPage.vue — 설정 화면 스크롤/헤더/주황 배경 비율 조정 실험 후 최종 레이아웃은 원래 구조 기준으로 복구

**AlarmPage — 알림 목록 Figma 정렬 및 스크롤 구조 보정**
- AlarmPage.vue / Stack.vue — 알림 페이지에서 헤더와 탭은 고정하고, 알림 카드 목록 영역만 세로 스크롤되도록 레이아웃 조정
- AlarmItem.vue — 알림 카드 높이, 그림자, 아이콘, 제목, 내용, 시간 그룹 위치와 폰트 크기를 Figma 카드 기준으로 재정렬
- useLogs.js — 이상행동 이벤트 제목을 항상 “이상행동 감지”로 통일
- useLogs.js — 상세 설명 대신 “반려동물 이름”과 “프롬프트 키워드”를 조합한 문장 형식으로 알림 내용을 표시하도록 변경

**HomePage — 가로 모드 컨트롤 보정**
- CamView.vue — 홈 가로 모드 방향 제어 버튼을 세로 모드에서 쓰는 방향 버튼 스타일과 동일한 아이콘으로 교체
- CamView.vue — 가로/확대 화면 컨트롤 아이콘 크기와 배치가 화면 방향별로 유지되도록 분기 스타일 보정

---

### 2026-05-22

**AlarmPage — 알림 목업 하드코딩 제거**
- Stack.vue — 실제 알림이 없을 때 표시되던 mockAlarms fallback 제거
- 이상행동 알림은 useLogs에서 전달되는 프로필 이미지 기반 아이콘을 그대로 사용하고, 일정 알림은 실제 일정 데이터의 카테고리 아이콘만 표시하도록 정리
- 알림이 없을 때는 목업 카드 대신 "알림이 없습니다." 상태만 노출

**Nav — 하단 네비게이션 Figma 시각 보정**
- Nav.vue — 상단 border 제거, 하단 nav 높이 5.6rem 고정, 내부 padding 제거 후 item 기준 정렬로 전환
- NavItem.vue — CSS mask 방식에서 SVG 원본 img 렌더링으로 변경해 아이콘 원본 fill/stroke와 active filled 아이콘 전환 유지
- 아이콘 크기, 라벨 크기, gap, 세로 위치 조정: 2.5rem 아이콘, 1.3rem 라벨, 0.2rem gap, translateY(-0.55rem)
- 하단 nav 터치 시 파란 하이라이트 제거: -webkit-tap-highlight-color, outline, user-select

**개발 오버레이 정리**
- vite.config.js — vite-plugin-vue-devtools 제거로 화면 하단을 가리던 devtools overlay 비활성화

---

### 2026-05-21

**HomePage — 홈 / 가로 모드 개편**
- HomePage.vue / CamView.vue — 홈 화면 카메라 영역과 가로 모드 레이아웃을 재구성해 화면 방향에 따라 안정적으로 표시되도록 조정
- CamBar.vue / HomeIcons.vue / StateBar.vue — 가로 모드에서 컨트롤, 홈 아이콘, 상태바가 압축되거나 겹치지 않도록 크기와 배치 보정
- usePtz.js / endpoints.js — PTZ 이동, 홈 위치 저장/이동 기능을 위한 엔드포인트와 제어 흐름 정리
- public/icons/Home/* — 카메라, 방향, 재시작, 셔터, 사운드, 비디오 토글 등 홈 컨트롤 아이콘 세트 추가 및 교체
- App.vue / main.js / base.css — 홈 가로 모드 대응을 위한 전역 방향 상태와 테마/레이아웃 토큰 보정
- AlarmItem.vue — 홈/알림 화면에서 사용하는 아이콘 필터 및 다크모드 시각 차이를 보정

---

### 2026-05-20

**전역 테마 — 다크모드 적용 범위 확장**
- main.js / App.vue / base.css — light/dark 테마 토큰과 body, root 클래스 적용 흐름 정리
- Nav.vue / NavItem.vue / SplashScreen.vue — 하단 네비게이션과 스플래시 화면이 테마에 맞춰 색상을 변경하도록 보정
- AlarmPage, CalenderPage, ChatBotPage, HomePage, LogPage, LoginPage, PlanPage, SettingsPage 전반 — 화면별 배경, 텍스트, 아이콘 필터, 카드 색상 토큰 정리

**프로필 / 일정 / 알림 설정 — localStorage 유지**
- useProfile.js — 이름, 견종, 생일, 프로필 이미지, 검색 이력을 localStorage에 저장하도록 정리
- usePlans.js — 일정 데이터를 날짜별 localStorage 구조로 저장하고 legacy 문자열 일정도 정규화
- useAlarmSettings.js — 알림 설정 항목을 localStorage에 저장하고 설정 화면과 알림 목록에서 공유
- Plan_Add.vue / Plan.vue / Date.vue / Time.vue / Place.vue — 저장된 일정 데이터와 일정 등록/수정 흐름 연결
- alarm.js — 일정 알림 예약/취소 시 저장된 일정 정보와 알림 설정을 함께 사용하도록 정리

**공통 UI / 설정 화면 보정**
- SheetHeader.vue / OptionSheet.vue / Clip_Detail.vue / Calender.vue — 공통 컴포넌트가 테마와 저장 데이터 흐름에 맞게 동작하도록 보정
- SettingsPage 및 Profile, IpSetting, AlarmSetting, Dark_Toggle — 설정 화면의 다크모드 색상, 프로필 편집, 알림 설정 UI 정리
- public/icons/Setting/Trash.svg — 설정/프로필 편집에서 사용할 삭제 아이콘 추가

---

### 2026-05-19

**로그인 / 서버 연결 기반 구축**
- LoginAddress.vue / LoginPage.vue — 서버 주소 입력, 로그인 화면, 비밀번호 표시/숨김, 로그인 유지 흐름 구현
- useAuth.js / useServerAuth.js / useFetch.js — 인증 토큰, 서버 인증 여부, 공통 fetch 래퍼 구성
- endpoints.js / vite.config.js / .env.development — 서버 주소, API 프록시, 카메라/이벤트/클립 엔드포인트 정리
- router/index.js / constants/index.js — 로그인 전후 라우트 가드와 주요 경로 상수 연결
- public/icons/Login/* / Logo.svg / AppLogo.vue — 로그인 화면과 앱 로고 리소스 추가

**카메라 연결 / 홈 데이터 연동**
- useCamera.js — 카메라 설정, 선택 카메라, 스트림 URL, 연결 상태를 전역 composable로 관리
- useHomeData.js / HomePage.vue / StateBar.vue — 홈 화면에서 서버 상태와 카메라 정보를 표시하도록 연결
- SettingsPage / IpSetting.vue / MoreSection.vue — 카메라 접속 정보 입력 및 설정 화면 연결

**스트리밍 / 로그 / 알림 연동**
- CamView.vue / CamBar.vue — 홈 카메라 스트리밍 재생, 재연결, 음소거, PTZ 컨트롤 기반 구성
- useLogs.js / Log_Page.vue / Clip.vue / Log.vue / Recap.vue / Time.vue — 서버 이벤트 로그와 클립 목록을 불러와 로그 화면에 표시
- Clip_Detail.vue — 클립 상세 재생 화면이 서버 클립 URL을 사용할 수 있도록 정리
- AlarmPage/Stack.vue / AlarmItem.vue — 이상행동 이벤트를 알림 목록으로 표시하고 로그 상세로 이동할 수 있도록 연결
- usePtz.js — 카메라 PTZ 이동 요청 상태와 에러 처리 흐름 구성

---

### 2026-04-20

**HomePage — 가로 모드 레이아웃 재구성**
- `HomePage.vue` — `CamBar` 영역과 `HomeIcons` 영역을 분리하고, 가로 모드에서 전체 페이지를 좌우 배치의 고정 레이아웃으로 전환
- 세로 모드에서는 기존 흐름을 유지하고, 가로 모드에서는 `topArea`, `camBarArea`, `homeIconsArea` 표시를 재구성해 화면을 꽉 채우도록 조정

**CamView.vue — 가로 모드 카메라 화면 개선**
- 방향 감지 로직 추가: `resize`, `orientationchange`, `visualViewport` 기준으로 가로/세로 여부를 실시간 반영
- 비디오 재생 안정화: `loadeddata`, `canplay`, `pageshow`, `visibilitychange` 시점에 재생 재시도
- 음소거 상태를 인라인/확대 영상에 동기화하고, 기본값을 `muted`로 변경해 자동재생 실패 가능성 완화
- 세로 모드에서만 확대 버튼을 노출하고, 가로 모드에서는 확대 화면 대신 인라인 화면에 컨트롤이 자연스럽게 붙도록 구성
- 가로 모드에서 영상 `object-fit: contain` 적용, 오른쪽에 세로형 `CamBar`를 오버레이로 배치

**CamBar.vue — 가로 전용 세로형 컨트롤 지원**
- `vertical`, `bare` props 추가로 세로/가로 형태를 분기
- 세로 모드에서는 기존 하단 바 형태를 유지하고, 가로 모드에서는 배경 없는 세로형 아이콘 스택으로 동작하도록 확장
- 폰/태블릿 가로 모드를 나눠 아이콘 크기를 `clamp`/`vmin` 기반으로 조정

**HomeIcons.vue — 가로 화면 스케일 보정**
- 아이콘 크기, 라벨 크기, 패널 높이, 상단 여백을 CSS 변수로 정리해 화면 크기에 맞춰 유동적으로 조절
- 큰 화면(태블릿 이상)에서 아이콘과 텍스트 비율이 무너지지 않도록 별도 미디어쿼리 추가

**기타**
- `public/icons/Home/Direction_Fill.svg` — 가로 화면용 방향 아이콘 시각 보정
- `NavItem.vue` — 개행 정리

---

### 2026-04-10

**AlarmSetting.vue — 알림 설정 페이지 신규 구현**
- Figma 익스포트 정리: absolute 배치 제거, 안드로이드 상태바·하단바 제거, 상태 없는 토글 교체
- 6개 항목(이상 행동·움직임 감지·카메라 연결 오류·일정·챗봇·앱 정보 수신) v-for + reactive로 통합
- 토글 디자인: Figma 스펙 기준 `4.3rem × 2.3rem`, trackBg·thumb 분리 구조, `left` 트랜지션으로 이동
- IpSetting·Profile과 동일한 슬라이드 오버레이 방식으로 전환 (`Teleport + Transition + v-model`)
- `position: fixed; inset: 0; z-index: 200` 적용
- `AccountSection.vue` — `to="/settings/alarm"` 라우팅 → `emit('openAlarmSetting')` 방식으로 변경
- `SettingsPage.vue` — `showAlarmSetting` ref 추가, AlarmSetting 연결
- `router/index.js` — `/settings/alarm` 라우트 제거

**Dark_Toggle.vue — 토글 디자인 통일**
- AlarmSetting 토글과 동일한 구조로 변경 (trackBg + thumb 분리, `left` 트랜지션)
- 크기: `4.3rem × 2.3rem`, 색상: off `#eee8de` → on `#ffb085`

---

### 2026-04-09

**리팩토링 — 상수 중앙화 (`src/constants/index.js` 신규)**
- `DAY_NAMES`, `ALARM_OPTIONS`, `REPEAT_OPTIONS`, `ROUTES` 상수 추출
- 적용 대상: `Date.vue`, `Time.vue`, `Plan_Add.vue`, `Place.vue`, `alarm.js`, `router/index.js`, `Nav.vue`, `useConversations.js`, `Record.vue`
- 각 파일에서 하드코딩된 배열·경로 문자열 제거

**리팩토링 — 공통 컴포넌트 추출**
- `components/SheetHeader.vue` (신규) — 바텀시트 공통 헤더 (닫기 아이콘 + 제목 + 액션 버튼), `Plan_Add`, `Place`, `Clip_Detail` 적용
- `components/OptionSheet.vue` (신규) — 단일 선택 바텀시트, `Alarm.vue` / `Repeat.vue` 두 파일을 얇은 래퍼로 교체
- `Plan_Add.vue`, `Place.vue` — SheetHeader 교체 후 불필요해진 `.header`, `.iconClose`, `.register`, `.save` CSS 제거

**리팩토링 — 공용 컴포넌트 이동**
- `views/CalenderPage/Calender.vue` → `components/Calender.vue` (달력 재사용)
- `views/LogPage/Log/Clip_Detail.vue` → `components/Clip_Detail.vue` (영상 상세 재사용)
- 참조 파일 업데이트: `CalenderPage.vue`, `Profile.vue`, `Time.vue`, `BotPage.vue`, `Clip.vue`

**견종 선택 — `Select.vue` 검색 방식으로 전환**
- `src/data/dogBreeds.js` (신규) — 소형견·중형견·대형견·한국 토종견 분류, ㄱㄴㄷ 정렬, 믹스견 포함
- `Select.vue` — 직접 추가 방식 제거, 미리 정의된 목록에서 검색·선택 방식으로 전환 (`filteredBreeds` computed)

**알림 — Capacitor LocalNotifications 적용 (`src/utils/alarm.js`)**
- Web Notification API → `@capacitor/local-notifications` 교체 (백그라운드 알림 지원)
- `scheduleAlarm(planId, title, eventDate, alarmLabel, repeatLabel)` 시그니처
- `OFFSETS` / `REPEAT_MAP` 을 `ALARM_OPTIONS`, `REPEAT_OPTIONS` 상수에서 자동 도출

**UI 수정 — 탭 하이라이트 제거**
- `Clip.vue` — `.iconBtn`, `.clipImg` `-webkit-tap-highlight-color: transparent` 추가
- `IpSetting.vue` — `.iconArrowRight`, `.eyeIcon` 탭 하이라이트 제거
- `Log_Page.vue` — 날짜 바 탭 하이라이트·`user-select: none` 추가

**UI 수정 — 색상 및 레이아웃**
- `Log_Date.vue` — 날짜 박스 배경색 `#ffffff` → `#fffbf5`
- `Calender.vue` (WEN → WED 오타 수정)

**Profile.vue — 인터랙션 개선**
- 달력 외부 클릭 시 달력 닫힘 (`contentWrap @click="showCalendar = false"`, 달력 내부 `@click.stop`)
- 프로필 사진 변경: 이미지 아이콘 또는 "프로필 사진 변경" 텍스트 클릭 시에만 동작 (전체 div 클릭 제거)

**Clip_Detail.vue — 영상 확대 기능**
- 확대 버튼 클릭 시 풀스크린 오버레이 (`z-index: 400`, 클릭 시 닫힘)
- `.fullscreen`, `.fullImg` CSS 추가

---

### 2026-04-08

**SettingsPage — 프로필 변경 오버레이 전환**
- `AccountSection.vue` — "프로필 변경" 클릭 시 라우터 이동 제거, `emit('openProfile')`로 변경
- `SettingsPage.vue` — `showProfile` ref 추가, `ProfilePage` v-model 연결 (`Profile`, `AccountSection` 양쪽에서 오픈)
- `/settings/profile` 라우트 의존 제거

**SettingsPage/Profile — 프로필 변경 페이지 신규 구현**
- `Profile/Profile.vue` — Teleport + 오른쪽 슬라이드 오버레이 (`profile-slide` 트랜지션), 이름/견종/생일/프로필 사진 편집, 저장 시 `useProfile` 전역 반영
  - 프로필 사진 변경: 네이티브(`@capacitor/action-sheet`) / 웹(바텀시트 액션) 분기 처리, 파일 선택 및 삭제 기능
  - 견종: `Select.vue` 오버레이 연결 (검색어 입력 후 엔터로 추가, `searchHistory` 전역 공유)
  - 생일: 인라인 달력(`Calender.vue`) 드롭다운 토글, 선택 시 `yyyy년 mm월 dd일` 포맷 표시
  - 저장 버튼 클릭 시 이름·프로필 이미지 반영 후 오버레이 닫힘
- `Profile/Head.vue` — "프로필 변경" 헤더 (뒤로가기 chevron, MalangBold)
- `Profile/Select.vue` — 견종 선택 오버레이 (검색창 + 입력 이력 목록, `useProfile.searchHistory` 연동)

**Profile.vue (헤더 카드 영역) 개선**
- 이름·견종 미입력 시 "프로필" placeholder 표시 (`color: #84776e`)
- 견종 입력 시 이름 옆에 `(견종)` 소자 병렬 표시 (`nameWrap` flex 레이아웃)

**useProfile composable 확장**
- `breed`, `searchHistory` ref 추가 (견종 선택·검색 이력 전역 공유)
- `profileImg` 기본 경로 → `/icons/Setting/Profile_Img.svg`로 변경 (아이콘 폴더 정리 반영)
- `name` 초기값 빈 문자열로 변경 (미입력 상태 기본값)

**IpSetting 배경색 수정**
- `frame` 배경색 `#f5f0e9` → `#fffbf5` (전체 카드 배경색과 통일)

**아이콘 추가**
- `public/icons/Setting/Icon_Calendar.svg` — 생일 입력 필드 달력 아이콘
- `public/icons/Setting/Icon_Search.svg` — 견종 검색 아이콘
- `public/icons/Setting/Profile_Img.svg` — 프로필 기본 이미지

**패키지**
- `@capacitor/action-sheet` 추가 (네이티브 액션시트 지원)

---

### 2026-04-06

**HomePage 가로 모드 수정**
- `AppLogo`, `StateBar` — `flex-shrink: 0` 추가 (가로 모드 flex 압축으로 인한 겹침 방지)
- `CamView` — 가로 모드 검은 배경 처리, 16:9 비율 유지 (`height: 50vw` wrapper + `aspect-ratio`)
- `HomeIcons` — 가로 모드 축소 스타일 제거, 세로 모드와 동일하게 유지 후 스크롤 방식 전환
- `CamBar` — `flex-shrink: 0` 추가, `clamp` 반응형 스케일링 적용

**반응형 clamp/vw 스케일링 적용**
- `AppLogo` — head 높이, 로고 위치·크기 vw 기반 전환 (390px~에서 스케일 시작)
- `ChatBotPage/Head` — 헤더 높이, 로고, record 아이콘 clamp 스케일, `logoWalltbot` max-width로 겹침 방지
- `ChatBotPage/Head`, `Chatting` — `flex-shrink: 0` 추가 (화면 축소 시 상단 잘림 방지)
- `PlanPage/Plan` — 하단 navbar 여백 `clamp` 추가

**PlanPage 일정 등록 시트 반응형 적용**
- `Plan_Add` — 헤더·행 높이·아이콘·폰트·간격 전체 `clamp` 스케일, 내부 요소 `top: 50%` 세로 중앙 정렬
- `Place` — 헤더·제목·항목 높이·폰트 `clamp` 스케일, `overflow-y: auto` + 헤더 `sticky` 적용, 항목 `flex-shrink: 0`
- `Alarm`, `Repeat` — 폰트·행 높이·패딩 `clamp` 스케일, `flex-shrink: 0`으로 찌그러짐 방지, `overflow-y: auto` + 헤더 `sticky` 적용

**기타**
- `SettingsPage/MenuItem` — 터치 시 파란 하이라이트 제거 (`-webkit-tap-highlight-color: transparent`)

---

### 2026-04-03

**전체 앱 px → rem 단위 전환**
- `App.vue`, `Nav`, `NavItem` 포함 전 페이지 고정 px 값을 rem으로 전환
- 대상: `AlarmPage`, `CalenderPage`, `ChatBotPage`, `HomePage`, `LogPage`, `PlanPage`, `SettingsPage` 전 컴포넌트 (36개 파일)
- `CamView` — 가로 모드 초기 대응 (aspect-ratio, 검은 배경)
- `Clip_Detail` — flex 레이아웃 보완, 반응형 여백 조정

---

### 2026-04-02

**앱 전체 반응형 레이아웃 전환**

**공통 원칙**
- 고정 px 좌표(left/top) → flexbox / grid / 상대 단위(%, calc)로 전환
- 고정 height → min-height 또는 aspect-ratio로 전환
- `main.css` — 불필요한 padding, max-width, 2컬럼 그리드 제거
- `App.vue` — Nav에 가리지 않도록 page-content에 padding-bottom 추가

**페이지별 주요 변경**
- `HomePage` — CamBar·Chat·HomeIcons 고정 좌표 제거, flexbox 전환
- `AlarmPage` — AlarmItem absolute 전부 제거, flexbox 배치
- `ChatBotPage` — Chatting 입력창 flex: 1, Head 중앙정렬, Record max-width 제거
- `PlanPage` — Plan_Add·Date·Place 고정 너비/좌표 제거, Time.vue 휠피커 전면 개편
- `LogPage` — Clip aspect-ratio: 16/9, Clip_Detail·Log_Date flex 레이아웃 전환
- `CalenderPage` — 요일·날짜 grid 7열 통일 (정렬 불일치 수정), 선택 날짜 원형 32px 통일

**Time.vue 휠피커 개편**
- 날짜(달력) / 시간(휠피커) 분리 pill 방식으로 전환
- 달력 탭 → Calender.vue 인라인 표시, 시간 탭 → 24시간제 시·분 휠피커
- 바깥 클릭 / 행 클릭 / pill 재클릭 시 자동 저장, 선택 중 실시간 반영

---

### 2026-03-31

**ChatBotPage — Record 드로어 전환**
- `ChatBotPage/Record.vue` — 별도 라우트 → 오른쪽 슬라이드 드로어로 전환 (Teleport + Transition, 어두운 배경 페이드, 바깥 클릭 시 닫힘)
- `ChatBotPage/Head.vue` — Record 아이콘 클릭 시 emit('openRecord'), router 제거
- `ChatBotPage/BotPage.vue` — showRecord ref 추가, route.query.id watch로 대화 내용 동적 로드
- `/record` 라우트 제거

**SettingsPage — IpSetting 오버레이 전환**
- `IpSetting/IpSetting.vue` — 별도 라우트 → 오른쪽 풀스크린 슬라이드 오버레이 전환 (Teleport + Transition, v-model)
- `More/MoreSection.vue` — ip 설정 클릭 시 emit('openIp')으로 변경
- `SettingsPage.vue` — showIp ref 추가, IpSetting v-model 연결
- `MenuItem.vue` — to prop 없을 때 router.push 방지, 행 전체 클릭 가능
- `/settings/ip` 라우트 제거

**Composables**
- `composables/useCamera.js` — 카메라 접속 정보(id/password/ip/port) 전역 공유, cameraUrl computed 자동 계산
- `CamView.vue` — cameraUrl 있으면 홈캠 스트림, 없으면 로컬 테스트 영상 fallback

**IpSetting 기능**
- 비밀번호 Eye_On/Off 아이콘으로 표시/숨김 토글
- 입력 시 watch로 자동저장 (API 연동 포인트 주석 표시)

---

### 2026-03-27

**ChatBotPage 신규 구현**
- `ChatBotPage/BotPage.vue` — 챗봇 메인 페이지, 메시지 배열(type/text/path/clip) 구조로 관리, API 연동 준비 완료
- `ChatBotPage/Head.vue` — wallybot 로고(Wallytbot.svg 102×37), Record 아이콘 클릭 시 `/record` 이동
- `ChatBotPage/Chatting.vue` — 입력바 (placeholder "메세지를 입력하세요.", pointerdown 즉시 반응, 전송 시 오렌지 버튼 플래시)
- `ChatBotPage/Bot.vue` — 봇 말풍선 (좌측, border-radius 19px 19px 19px 0px, #fffbf5)
- `ChatBotPage/Plus.vue` — 사용자 말풍선 (우측, border-radius 19px 19px 0px 19px, #84776E)
- `ChatBotPage/Link.vue` — 봇 링크 말풍선 (오렌지 텍스트, 클릭 시 Clip_Detail 바텀시트 오픈)
- `ChatBotPage/Record.vue` — 대화 기록 목록 페이지 (헤더 58px, 항목 클릭 시 오렌지 애니메이션 후 해당 대화 로드)

**Composables 추가**
- `composables/useConversations.js` — 대화 기록 전역 공유, getById/addConversation 함수 (API 교체 포인트 주석 표시)

**라우터**
- `/chat` → `BotPage.vue`, `/record` → `Record.vue` 등록
- `ChatPage/` 폴더 삭제 (미사용 빈 파일)

**기타**
- Nav '알람' → '챗봇' 탭 (Chatting_On/Off.svg, 경로 /chat), HomePage Chat 컴포넌트 제거
- "영상보러가기" 클릭 시 `Clip_Detail.vue` 바텀시트 연결 (clip 필드로 썸네일 전달)

---

### 2026-03-26

**AlarmPage 신규 구현**
- `AlarmPage/AlarmPage.vue` — Teleport + popup 트랜지션 (아래에서 위로 슬라이드), 라우터 이동 없이 SettingsPage 위에 오버레이
- `AlarmPage/Head.vue` — 뒤로가기(<) 버튼, "알림" 제목(MalangBold 16px), 탭(전체/이상행동/일정) 필터
- `AlarmPage/Stack.vue` — 탭별 알람 필터링 (activeTab prop), usePlans + useLogs 연결
- `AlarmPage/AlarmItem.vue` — 알람 카드 컴포넌트 (아이콘, 제목, 내용, 시간 표시)
- SettingsPage 벨 아이콘 클릭 시 AlarmPage 오버레이 오픈

**Composables 추가**
- `composables/useProfile.js` — 펫 이름/프로필 이미지 전역 공유 (Profile.vue, useLogs.js 연결)
- `composables/usePlans.js` — 일정 데이터 전역 공유, 카테고리별 아이콘 매핑 (목욕/미용/심장사상충/예방접종/병원)
- `composables/useLogs.js` — 이상행동 로그 전역 공유, 알람 형식 변환 (프로필 이미지/이름 포함)
- Plan.vue 로컬 plansByDate → usePlans로 이전
- Log_Page.vue 로컬 logs → useLogs로 이전

**Nav 변경**
- '알람' 탭 → '챗봇' 탭으로 교체 (Chatting_On/Off.svg, 경로 /chat)
- `ChatPage/ChatPage.vue` 빈 페이지 생성 및 라우터 등록
- HomePage Chat 컴포넌트 제거

**기타**
- `index.html` favicon.ico 링크 제거 (404 오류 해결)

---

### 2026-03-25

**CalenderPage**
- `Calender.vue` — 날짜 폰트 Bazzi → Malang 변경, 고정 높이 제거 (4~6주 자동 대응)
- 선택된 날짜 스타일: `border: 1px solid #eee8de`, 오늘 스타일: `background-color: #f5f0e9`

**PlanPage — Plan_Add 리팩토링**
- `Plan_Add.vue` — absolute 레이아웃 → flex 레이아웃으로 전환 (Time 확장 시 아래 요소 자동 밀림)
- `Time.vue` — 하루종일/시작/종료 섹션 분리 컴포넌트로 추출
  - 시작/종료 클릭 시 휠피커 슬라이드 오픈 (시작은 시작↔종료 사이, 종료는 종료 아래)
  - 휠피커 디자인: Figma 드럼 롤 스타일 유지
- 공통 아이콘 `/icons/Common/` 정리 (Close.svg, Sound_Mute.svg)

**LogPage**
- `Clip.vue` — 클립 이미지 클릭 시 `Clip_Detail` 바텀시트 오픈
- `Clip_Detail.vue` — 바텀시트 형식으로 전환 (Teleport + slideup 트랜지션, 반투명  backdrop)
  - 클립 이미지 + 사운드/줌 아이콘 그대로 전달
  - Note.svg 아이콘 + AI 분석 텍스트 표시

---

### 2026-03-24

**CalenderPage 리팩토링**
- 폴더명 `CalenderPage.vue/` → `CalenderPage/` 로 수정 (.vue 확장자 제거)
- `PlanSection/Date/Date.vue` → `PlanSection/Date.vue` 로 불필요한 폴더 제거
- `Plan/Plan.vue` — 일정 동적 추가 기능 구현 (plans 배열 + v-for)
- `Plan/PlanAdd.vue` — 바텀시트 일정 추가 폼 구현 (제목 입력, 추가/닫기)

**LogPage 신규 구현**
- `Log_Page.vue` — 타임라인 구조 (수직선 + 원 + 로그 목록)
- `Log_Header.vue` — 닫기 버튼 + "타임 라인" 제목 (MalangBold 16px)
- `Log_DateNav` — 날짜 바 (이전/다음 날짜 이동, Malang 12px, 흰색 박스)
- `Log/Log.vue` — 로그 아이템 조합 (시간 → 클립 → 설명 → 구분선)
- `Log/Time.vue` — 시간 표시
- `Log/Clip.vue` — 클립 이미지 + Sound/Zoom 오버레이 버튼 (음소거 토글, 전체화면 확대)
- `Log/Recap.vue` — 행동 설명 텍스트 (Note 아이콘 + 텍스트)
- CalenderPage 발자국 아이콘 → `/footprint?date=yyyy-mm-dd` 쿼리 파라미터로 날짜 전달
- 타임라인 선 1px, 원 5px, 색상 #84776E
- 구분선(logline) 0.5px, 색상 #84776E

---

### 2026-03-23

**공통 컴포넌트**
- `AppLogo.vue` — 로고(Logo.svg) 컴포넌트 추가
- `Chat.vue` — 채팅 아이콘 컴포넌트 추가 (고정 위치 x:322 y:670)
- `Nav/NavItem.vue` — Bazzi 글씨체 적용, 클릭 시 색상 고정 (#2d2926 / 활성 #ffb085)

**HomePage**
- `AppLogo`, `StateBar`, `CamView`, `CamBar`, `HomeIcons`, `Chat` 구조로 구성
- `HomeIcons.vue` — 라이트/온도조절/대화하기 아이콘 + Malang_Regular 글씨체 적용
- `StateBar.vue` — 카메라 아이콘(16x16), 날짜/시간 표시

**SettingsPage**
- 주황 헤더(#FFB085) + 흰 카드(#FFFBF5) 겹침 구조 구현
- `MenuItem.vue` — 화살표 클릭 시 라우터 이동
- `Profile.vue` — 프로필 이미지 + 이름 표시
- `Account/AccountSection.vue` — 계정 섹션 (프로필 변경, 알림 설정, 다크모드)
- `Account/Dark_Toggle.vue` — 슬라이드 토글 애니메이션 구현
- `More/MoreSection.vue` — 더보기 섹션 (앱 정보, 버전, IP 설정)
- 글씨체 전체 Malang_Regular 적용
