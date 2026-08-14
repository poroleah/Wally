# Wally Android Notification Sequence UML

## 컨테이너 및 역할

| 컨테이너 | 역할 |
|---|---|
| User | 일정 알림 옵션을 설정하고, 휴대폰에 표시된 일정·이상 감지 알림을 탭해 해당 화면으로 이동합니다. |
| Wally Server | 카메라 스트림과 카메라/VLM 분석에서 발생한 이상 감지 이벤트를 SSE로 프론트엔드에 전달합니다. 일정 데이터는 관리하지 않습니다. |
| Wally Frontend | Vue 화면과 composable 계층입니다. 일정 데이터를 `localStorage`에서 관리하고 일정 알림을 계산·예약하며, SSE 이상 이벤트를 수신해 알림 설정을 확인하고, 알림 탭 후 Vue Router로 화면 전환을 처리합니다. |
| Notification Layer | `Capacitor LocalNotifications`와 `WallyNotification Native`로 구성됩니다. 일정 알림 예약, 이상 감지 알림 생성, Android 알림 채널·권한 처리, 알림 클릭 데이터 전달을 담당합니다. |
| Android Phone | Android OS의 `AlarmManager`/`NotificationManager`가 예약된 알림 또는 즉시 알림을 시스템 영역에 표시합니다. 앱이 백그라운드여도 예약된 일정 알림을 표시하며, 사용자의 탭을 앱에 전달합니다. |

### Wally Frontend 내부 컨테이너

| 컨테이너 | 역할 |
|---|---|
| UI & Routing | 일정 등록 화면에서 알림 옵션을 받고, 알림 탭으로 전달된 경로를 검증한 뒤 일정 또는 Footprint 화면으로 이동시킵니다. |
| Shared State Management | `usePlans`, `useRealtimeEvents`, `useAlarmSettings`를 통해 일정, 실시간 이상 이벤트, 사용자 알림 설정을 공유 상태로 관리합니다. |
| Schedule Alarm | `alarm.js`, `scheduleAlarmSync.js`가 반복 일정을 계산하고 미래 일정 알림을 예약·취소·동기화합니다. |
| Abnormal Notification | `abnormalNotifications.js`가 SSE 이상 감지 이벤트의 중복을 제거하고, 알림 설정에 따라 즉시 알림 생성을 요청합니다. |
| Notification Core | `notifications.js`가 알림 권한·채널을 준비하고, 로컬/네이티브 알림 클릭 데이터를 받아 안전한 화면 경로로 연결합니다. |

```mermaid
sequenceDiagram
    actor User as 사용자
    participant Plan as 일정 등록 화면
    participant Alarm as alarm.js
    participant RT as useRealtimeEvents
    participant AN as abnormalNotifications.js
    participant Settings as 알림 설정
    participant LN as Capacitor LocalNotifications
    participant Native as WallyNotification Native
    participant Android as Android 알림 시스템
    participant Core as notifications.js
    participant Router as Vue Router

    alt 일정 알람
        User->>Plan: 일정과 알림 옵션 설정
        Plan->>Alarm: schedulePlanAlarm(plan)
        Alarm->>Settings: schedule 알림 설정 확인
        alt 알림 꺼짐 또는 알림 없음
            Alarm-->>Plan: 예약하지 않음
        else 일정 알림 켜짐
            Alarm->>Alarm: 반복 일정의 미래 알림 시각 계산
            Alarm->>LN: 기존 동일 일정 알림 취소
            Alarm->>LN: 미래 발생분 예약
            LN->>Android: 정확한 시각으로 알림 등록
            Android-->>User: 일정 알림 표시
            User->>Android: 알림 탭
            Android->>LN: localNotificationActionPerformed
            LN->>Core: route=/schedule, date, plan 전달
            Core->>Router: 허용 경로 검증 후 push
            Router-->>User: 해당 날짜의 일정 화면 표시
        end

    else 이상 감지 알람
        Note over RT: 서버 SSE에서 VLM 감지 이벤트 수신
        RT->>RT: 키워드 매칭 및 중복 제거
        RT-->>AN: detectedKeywordEvent
        AN->>Settings: abnormal 알림 설정 확인
        alt 이상 감지 알림 꺼짐
            AN-->>RT: 알림 생성하지 않음
        else 이상 감지 알림 켜짐
            AN->>Native: 제목, 설명, 썸네일 URL, 날짜, clip 전달
            Native->>Native: 인증 토큰으로 썸네일 다운로드
            alt 썸네일 다운로드 성공
                Native->>Android: smallIcon + largeIcon + BigPictureStyle
            else URL 없음 또는 다운로드 실패
                Native->>Android: smallIcon + BigTextStyle
            end
            Android-->>User: 이상 감지 알림 표시
            User->>Android: 알림 탭
            Android->>Native: MainActivity intent
            Native-->>Core: route=/footprint, date, clip 전달
            Core->>Router: 허용 경로 검증 후 push
            Router-->>User: Footprint 상세 화면 표시
        end
    end
```
