<template>
  <div :class="$style.wrapper">
    <div :class="$style.video">
      <div :class="$style.streamFrame" :style="streamFrameStyle">
      <div :class="[$style.protocolSwitch, $style.inlineProtocolSwitch, protocol === 'webrtc' ? $style.protocolSwitchWebRtc : $style.protocolSwitchHls]" aria-label="스트리밍 프로토콜">
        <button type="button" :class="[$style.protocolOption, protocol === 'hls' ? $style.protocolOptionActive : '']" @click.stop="selectProtocol('hls')">HLS</button>
        <button type="button" :class="[$style.protocolOption, protocol === 'webrtc' ? $style.protocolOptionActive : '']" @click.stop="selectProtocol('webrtc')">WebRTC</button>
      </div>
      <video
        ref="inlineVideo"
        :src="nativeVideoSrc"
        :class="$style.videoImg"
        autoplay
        muted
        preload="auto"
        loop
        :muted="isMuted"
        playsinline
        webkit-playsinline
        crossorigin="anonymous"
        @loadeddata="playVideo(inlineVideo)"
        @canplay="playVideo(inlineVideo)"
        @loadedmetadata="updateVideoAspectRatio"
        @error="handleVideoError"
      />
      </div>
      <div v-if="statusText" :class="$style.statusOverlay">
        <span>{{ statusText }}</span>
        <button v-if="canRetry" type="button" :class="[$style.retryBtn, 'streamRetryButton']" @click.stop="retryStream">다시 시도</button>
      </div>
      <div v-if="captureFeedbackKey" :key="`inline-${captureFeedbackKey}`" :class="$style.captureFeedback" aria-hidden="true">
        <span :class="$style.captureFlash"></span>
        <span :class="$style.captureRing"></span>
      </div>
      <div v-if="captureModeFeedback" :class="$style.captureModeFeedback" aria-live="polite">
        <span v-if="captureModeFeedback === '동영상 녹화 중'" :class="$style.recordingPulseDot" aria-hidden="true"></span>
        <span>{{ captureModeFeedback }}</span>
      </div>
      <div v-if="isRecording && !isExpanded" :class="$style.recordingBadge" aria-live="polite">
        <span :class="$style.recordingPulseDot" aria-hidden="true"></span>
        <span :class="$style.recordingText">녹화 중</span>
      </div>
      <div :class="$style.overlay">
        <div :class="[$style.iconBtn, $style.soundToggleButton]" @click="isMuted = !isMuted">
          <img v-if="!isMuted" src="/icons/Home/Sound.svg" :class="$style.soundIcon" />
          <img v-else src="/icons/Common/Sound_Mute.svg" :class="$style.soundIcon" />
        </div>
        <div v-if="!isLandscape" :class="$style.iconBtn" @click="openExpandedView">
          <img src="/icons/Home/Zoom.svg" :class="$style.soundIcon" />
        </div>
      </div>
      <div v-if="isLandscape" :class="$style.landscapeLeftControls" @click.stop>
        <button type="button" :class="$style.landscapeLeftButton" aria-label="가로 화면 닫기" @click="exitLandscapeView">
          <img src="/icons/Common/Close.svg" alt="" />
        </button>
        <button type="button" :class="[$style.landscapeLeftButton, $style.soundToggleButton]" aria-label="소리 켜기/끄기" @click="isMuted = !isMuted">
          <img v-if="!isMuted" src="/icons/Home/Cam/Cam_Sound.svg" alt="" />
          <img v-else src="/icons/Home/Cam/Cam_SoundMute_Line.svg" alt="" />
        </button>
      </div>
      <div v-if="isLandscape" :class="$style.landscapeControls" @click.stop>
        <button type="button" :class="$style.landscapeCapture" aria-label="촬영" @click="handleCaptureButton">
          <img :src="captureIconSrc" alt="" />
        </button>
        <button type="button" :class="[$style.landscapeCameraToggle, isVideoMode ? $style.toggleOn : '']" aria-label="카메라 전환" @click="toggleCaptureMode">
          <span :class="$style.cameraToggleTrack" aria-hidden="true">
            <span :class="$style.cameraToggleThumb"></span>
            <svg :class="[$style.cameraToggleIcon, isVideoMode ? $style.iconHidden : '']" viewBox="0 0 30 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M11.6985 35.3652C11.8987 34.3828 12.7733 33.6875 13.7745 33.6875H16.2255C17.2267 33.6875 18.1005 34.3828 18.3015 35.3652C18.3237 35.4734 18.3816 35.571 18.4659 35.6423C18.5503 35.7136 18.6561 35.7544 18.7665 35.7583H18.7913C19.8435 35.8048 20.652 35.9337 21.327 36.377C21.7523 36.656 22.1182 37.0145 22.4032 37.4337C22.758 37.9542 22.914 38.5528 22.989 39.2758C23.0625 39.983 23.0625 40.8688 23.0625 41.9908V42.0545C23.0625 43.1765 23.0625 44.063 22.989 44.7695C22.914 45.4925 22.758 46.091 22.4032 46.6122C22.1167 47.0312 21.7511 47.3901 21.327 47.669C20.7998 48.0148 20.1945 48.1677 19.461 48.2405C18.7425 48.3125 17.8417 48.3125 16.6972 48.3125H13.3028C12.1583 48.3125 11.2575 48.3125 10.539 48.2405C9.8055 48.1677 9.20025 48.0155 8.673 47.669C8.24883 47.3899 7.88324 47.0307 7.59675 46.6115C7.242 46.091 7.086 45.4925 7.011 44.7695C6.9375 44.063 6.9375 43.1765 6.9375 42.0545V41.9908C6.9375 40.8688 6.9375 39.983 7.011 39.2758C7.086 38.5528 7.242 37.9542 7.59675 37.4337C7.88324 37.0146 8.24883 36.6553 8.673 36.3763C9.348 35.9338 10.1565 35.8047 11.2088 35.759L11.2215 35.7583H11.2335C11.3439 35.7544 11.4497 35.7136 11.5341 35.6423C11.6184 35.571 11.6763 35.4734 11.6985 35.3652ZM13.7745 34.8125C13.2945 34.8125 12.8917 35.1447 12.801 35.5895C12.6547 36.3095 12.0157 36.8765 11.247 36.8833C10.236 36.9283 9.6945 37.052 9.2895 37.3175C8.98909 37.5154 8.73003 37.7699 8.52675 38.0667C8.31975 38.3705 8.19525 38.7597 8.12925 39.392C8.06325 40.034 8.0625 40.862 8.0625 42.023C8.0625 43.184 8.0625 44.0113 8.13 44.6532C8.19525 45.2855 8.31975 45.6748 8.5275 45.9792C8.7285 46.2747 8.98725 46.5298 9.29025 46.7285C9.603 46.9333 10.0035 47.057 10.6508 47.1215C11.3063 47.1868 12.1507 47.1875 13.3335 47.1875H16.6665C17.8485 47.1875 18.693 47.1875 19.3492 47.1215C19.9965 47.057 20.397 46.934 20.7098 46.7285C21.0128 46.5298 21.2723 46.2748 21.4733 45.9785C21.6803 45.6748 21.8047 45.2855 21.8707 44.6532C21.9367 44.0113 21.9375 43.1833 21.9375 42.023C21.9375 40.8628 21.9375 40.034 21.87 39.392C21.8047 38.7597 21.6802 38.3705 21.4725 38.0667C21.2693 37.7696 21.0102 37.5149 20.7098 37.3168C20.3063 37.052 19.7648 36.9283 18.7523 36.8833C17.9843 36.8758 17.3453 36.3102 17.199 35.5895C17.151 35.3677 17.0279 35.1693 16.8506 35.0277C16.6732 34.8861 16.4524 34.8101 16.2255 34.8125H13.7745ZM15 40.0625C14.5524 40.0625 14.1232 40.2403 13.8068 40.5568C13.4903 40.8732 13.3125 41.3024 13.3125 41.75C13.3125 42.1976 13.4903 42.6268 13.8068 42.9432C14.1232 43.2597 14.5524 43.4375 15 43.4375C15.4476 43.4375 15.8768 43.2597 16.1932 42.9432C16.5097 42.6268 16.6875 42.1976 16.6875 41.75C16.6875 41.3024 16.5097 40.8732 16.1932 40.5568C15.8768 40.2403 15.4476 40.0625 15 40.0625ZM12.1875 41.75C12.1875 41.0041 12.4838 40.2887 13.0113 39.7613C13.5387 39.2338 14.2541 38.9375 15 38.9375C15.7459 38.9375 16.4613 39.2338 16.9887 39.7613C17.5162 40.2887 17.8125 41.0041 17.8125 41.75C17.8125 42.4959 17.5162 43.2113 16.9887 43.7387C16.4613 44.2662 15.7459 44.5625 15 44.5625C14.2541 44.5625 13.5387 44.2662 13.0113 43.7387C12.4838 43.2113 12.1875 42.4959 12.1875 41.75ZM18.9375 39.5C18.9375 39.3508 18.9968 39.2077 19.1023 39.1023C19.2077 38.9968 19.3508 38.9375 19.5 38.9375H20.25C20.3992 38.9375 20.5423 38.9968 20.6477 39.1023C20.7532 39.2077 20.8125 39.3508 20.8125 39.5C20.8125 39.6492 20.7532 39.7923 20.6477 39.8977C20.5423 40.0032 20.3992 40.0625 20.25 40.0625H19.5C19.3508 40.0625 19.2077 40.0032 19.1023 39.8977C18.9968 39.7923 18.9375 39.6492 18.9375 39.5Z" fill="#84776E"/>
              </svg>
            <svg :class="[$style.cameraToggleIcon, isVideoMode ? '' : $style.iconHidden]" viewBox="0 0 30 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M8.69238 20.6243C8.29456 20.6243 7.91303 20.4662 7.63172 20.1849C7.35042 19.9036 7.19238 19.5221 7.19238 19.1243V10.8765C7.19238 10.4787 7.35042 10.0971 7.63172 9.81584C7.91303 9.53454 8.29456 9.3765 8.69238 9.3765H17.1006C17.2976 9.3765 17.4927 9.4153 17.6747 9.49068C17.8566 9.56607 18.022 9.67656 18.1613 9.81584C18.3006 9.95513 18.4111 10.1205 18.4865 10.3025C18.5618 10.4845 18.6006 10.6795 18.6006 10.8765V19.1243C18.6006 19.5221 18.4426 19.9036 18.1613 20.1849C17.88 20.4662 17.4985 20.6243 17.1006 20.6243H8.69238ZM18.9906 16.8758C18.8726 16.8112 18.7741 16.716 18.7055 16.6003C18.6369 16.4846 18.6007 16.3525 18.6006 16.218V13.7828C18.6007 13.6482 18.6369 13.5162 18.7055 13.4004C18.7741 13.2847 18.8726 13.1896 18.9906 13.125L21.6966 11.643C21.8108 11.5805 21.9393 11.5488 22.0695 11.5511C22.1996 11.5533 22.327 11.5894 22.439 11.6557C22.551 11.7221 22.6438 11.8165 22.7082 11.9296C22.7727 12.0427 22.8066 12.1706 22.8066 12.3008V17.7008C22.8065 17.8309 22.7725 17.9587 22.7079 18.0717C22.6434 18.1847 22.5506 18.2789 22.4386 18.3452C22.3267 18.4115 22.1994 18.4475 22.0693 18.4497C21.9392 18.4519 21.8108 18.4202 21.6966 18.3578L18.9906 16.8758Z" stroke="#84776E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15.3721 15.7432C15.1638 16.2269 14.8184 16.6389 14.3785 16.9284C13.9387 17.2179 13.4237 17.3721 12.8971 17.3721C12.3705 17.3721 11.8555 17.2179 11.4156 16.9284C10.9758 16.6389 10.6304 16.2269 10.4221 15.7432M10.5683 12.8415C10.5038 12.8464 10.4431 12.8743 10.3974 12.9201C10.3517 12.9659 10.324 13.0267 10.3193 13.0912C10.3193 13.2157 10.4438 13.3402 10.5683 13.3402C10.6329 13.3356 10.6936 13.3079 10.7395 13.2622C10.7853 13.2165 10.8132 13.1558 10.8181 13.0912C10.8181 12.966 10.6936 12.8415 10.5683 12.8415ZM15.2266 12.8415C15.162 12.8464 15.1014 12.8743 15.0557 12.9201C15.01 12.9659 14.9823 13.0267 14.9776 13.0912C14.9776 13.2157 15.1021 13.3402 15.2266 13.3402C15.2912 13.3356 15.3519 13.3079 15.3977 13.2622C15.4436 13.2165 15.4715 13.1558 15.4763 13.0912C15.4763 12.966 15.3518 12.8415 15.2266 12.8415Z" stroke="#84776E" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
          </span>
        </button>
        <button type="button" :class="$style.landscapeRefresh" aria-label="스트리밍 새로고침" @click="retryStream">
          <img src="/icons/Home/Cam/Cam_Restart.svg" alt="" />
        </button>
        <div :class="$style.landscapePtzWrap">
          <button type="button" :class="$style.landscapePtzButton" aria-label="카메라 방향 제어" @click="togglePtzPad">
            <img src="/icons/Home/Bar/Bar_Direction.svg" alt="" />
          </button>
          <div v-if="ptzOpen" :class="[$style.landscapePtzPad, isDirectionPressed ? $style.directionPadPressed : '']" @click.stop>
            <img :class="$style.directionPadImage" src="/icons/Home/Cam/Cam_DirectionPad.svg" alt="" />
            <button type="button" :class="[$style.padHit, $style.padClose]" aria-label="방향 패드 닫기" @click="closePtzPad" />
            <button type="button" :class="[$style.padHit, $style.padGoto]" aria-label="저장된 위치로 이동" @click="gotoHome" />
            <button type="button" :class="[$style.padHit, $style.padSave]" aria-label="현재 위치 저장" @click="saveHome" />
            <button type="button" :class="[$style.padHit, $style.padUp]" aria-label="위로 이동" @pointerdown.prevent="move(0, 1)" @pointerup.prevent="stopPtz" @pointerleave.prevent="stopPtz" @pointercancel.prevent="stopPtz" />
            <button type="button" :class="[$style.padHit, $style.padLeft]" aria-label="왼쪽으로 이동" @pointerdown.prevent="move(-1, 0)" @pointerup.prevent="stopPtz" @pointerleave.prevent="stopPtz" @pointercancel.prevent="stopPtz" />
            <button type="button" :class="[$style.padHit, $style.padRight]" aria-label="오른쪽으로 이동" @pointerdown.prevent="move(1, 0)" @pointerup.prevent="stopPtz" @pointerleave.prevent="stopPtz" @pointercancel.prevent="stopPtz" />
            <button type="button" :class="[$style.padHit, $style.padDown]" aria-label="아래로 이동" @pointerdown.prevent="move(0, -1)" @pointerup.prevent="stopPtz" @pointerleave.prevent="stopPtz" @pointercancel.prevent="stopPtz" />
          </div>
        </div>
      </div>
    </div>
  </div>
  <Teleport to="body">
    <div v-if="ptzOpen && !isLandscape && !isExpanded" :class="$style.portraitPtzLayer" @click="closePtzPad">
      <div :class="[$style.portraitPtzPad, isDirectionPressed ? $style.directionPadPressed : '']" @click.stop>
        <img :class="$style.directionPadImage" src="/icons/Home/Cam/Cam_DirectionPad.svg" alt="" />
        <button type="button" :class="[$style.padHit, $style.padClose]" aria-label="방향 패드 닫기" @click="closePtzPad" />
        <button type="button" :class="[$style.padHit, $style.padGoto]" aria-label="저장된 위치로 이동" @click="gotoHome" />
        <button type="button" :class="[$style.padHit, $style.padSave]" aria-label="현재 위치 저장" @click="saveHome" />
        <button type="button" :class="[$style.padHit, $style.padUp]" aria-label="위로 이동" @pointerdown.prevent="move(0, 1)" @pointerup.prevent="stopPtz" @pointerleave.prevent="stopPtz" @pointercancel.prevent="stopPtz" />
        <button type="button" :class="[$style.padHit, $style.padLeft]" aria-label="왼쪽으로 이동" @pointerdown.prevent="move(-1, 0)" @pointerup.prevent="stopPtz" @pointerleave.prevent="stopPtz" @pointercancel.prevent="stopPtz" />
        <button type="button" :class="[$style.padHit, $style.padRight]" aria-label="오른쪽으로 이동" @pointerdown.prevent="move(1, 0)" @pointerup.prevent="stopPtz" @pointerleave.prevent="stopPtz" @pointercancel.prevent="stopPtz" />
        <button type="button" :class="[$style.padHit, $style.padDown]" aria-label="아래로 이동" @pointerdown.prevent="move(0, -1)" @pointerup.prevent="stopPtz" @pointerleave.prevent="stopPtz" @pointercancel.prevent="stopPtz" />
      </div>
    </div>
  </Teleport>
  <Teleport to="body">
    <div v-if="isExpanded && !isLandscape" :class="[$style.fullscreen, 'fullscreenNoHighlight']">
      <div :class="$style.fullscreenStage">
        <div :class="$style.fullscreenContent" @click.stop>
          <div :class="$style.fullVideoArea">
            <div :class="$style.fullStreamFrame" :style="streamFrameStyle">
            <div data-debug-id="full-protocol-switch" :data-protocol="protocol" :class="[$style.protocolSwitch, $style.fullProtocolSwitch, protocol === 'webrtc' ? $style.protocolSwitchWebRtc : $style.protocolSwitchHls]" aria-label="스트리밍 프로토콜">
              <button type="button" :class="[$style.protocolOption, protocol === 'hls' ? $style.protocolOptionActive : '']" @click.stop="selectProtocol('hls')">HLS</button>
              <button type="button" :class="[$style.protocolOption, protocol === 'webrtc' ? $style.protocolOptionActive : '']" @click.stop="selectProtocol('webrtc')">WebRTC</button>
            </div>
            <video
              ref="expandedVideo"
              :src="nativeVideoSrc"
              :class="$style.fullImg"
              autoplay
              muted
              preload="auto"
              loop
              :muted="isMuted"
              playsinline
              webkit-playsinline
              @loadeddata="playVideo(expandedVideo)"
              @canplay="playVideo(expandedVideo)"
              @loadedmetadata="updateVideoAspectRatio"
              @error="handleVideoError"
            />
            </div>
            <div v-if="statusText" :class="[$style.statusOverlay, $style.fullStatusOverlay]">
              <span>{{ statusText }}</span>
              <button v-if="canRetry" type="button" :class="[$style.retryBtn, 'streamRetryButton']" @click.stop="retryStream">다시 시도</button>
            </div>
            <div v-if="captureFeedbackKey" :key="`full-${captureFeedbackKey}`" :class="$style.captureFeedback" aria-hidden="true">
              <span :class="$style.captureFlash"></span>
              <span :class="$style.captureRing"></span>
            </div>
            <div v-if="captureModeFeedback" :class="[$style.captureModeFeedback, $style.fullCaptureModeFeedback]" aria-live="polite">
              <span v-if="captureModeFeedback === '동영상 녹화 중'" :class="$style.recordingPulseDot" aria-hidden="true"></span>
              <span>{{ captureModeFeedback }}</span>
            </div>
            <div v-if="isRecording" :class="[$style.recordingBadge, $style.fullRecordingBadge]" aria-live="polite">
              <span :class="$style.recordingPulseDot" aria-hidden="true"></span>
              <span :class="$style.recordingText">녹화 중</span>
            </div>
            <div :class="$style.fullLandscapeControls" @pointerdown.capture="blurFullscreenControl" @click.capture="blurFullscreenControl" @click.stop>
              <button type="button" tabindex="-1" :class="[$style.fullControlBtn, $style.fullCloseBtn]" aria-label="확대 화면 닫기" @click="closeExpandedView">
                <img src="/icons/Common/Close.svg" :class="$style.fullControlIcon" alt="" />
              </button>
              <button type="button" tabindex="-1" :class="[$style.fullControlBtn, $style.fullRefreshBtn]" aria-label="스트리밍 새로고침" @click="retryStream">
                <img src="/icons/Home/Cam/Cam_Restart.svg" :class="$style.fullControlIcon" alt="" />
              </button>
              <button type="button" tabindex="-1" :class="[$style.fullControlBtn, $style.fullSoundBtn, $style.soundToggleButton]" aria-label="소리 켜기/끄기" @click="isMuted = !isMuted">
                <img v-if="!isMuted" src="/icons/Home/Cam/Cam_Sound.svg" :class="$style.fullControlIcon" alt="" />
                <img v-else src="/icons/Home/Cam/Cam_SoundMute_Line.svg" :class="$style.fullControlIcon" alt="" />
              </button>
              <button type="button" tabindex="-1" :class="$style.fullCaptureBtn" aria-label="촬영" @click="handleCaptureButton">
                <img :src="captureIconSrc" alt="" />
              </button>
              <button type="button" tabindex="-1" :class="[$style.fullCameraToggle, isVideoMode ? $style.toggleOn : '']" aria-label="카메라 전환" @click="toggleCaptureMode">
                <span :class="$style.cameraToggleTrack" aria-hidden="true">
            <span :class="$style.cameraToggleThumb"></span>
            <svg :class="[$style.cameraToggleIcon, isVideoMode ? $style.iconHidden : '']" viewBox="0 0 30 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M11.6985 35.3652C11.8987 34.3828 12.7733 33.6875 13.7745 33.6875H16.2255C17.2267 33.6875 18.1005 34.3828 18.3015 35.3652C18.3237 35.4734 18.3816 35.571 18.4659 35.6423C18.5503 35.7136 18.6561 35.7544 18.7665 35.7583H18.7913C19.8435 35.8048 20.652 35.9337 21.327 36.377C21.7523 36.656 22.1182 37.0145 22.4032 37.4337C22.758 37.9542 22.914 38.5528 22.989 39.2758C23.0625 39.983 23.0625 40.8688 23.0625 41.9908V42.0545C23.0625 43.1765 23.0625 44.063 22.989 44.7695C22.914 45.4925 22.758 46.091 22.4032 46.6122C22.1167 47.0312 21.7511 47.3901 21.327 47.669C20.7998 48.0148 20.1945 48.1677 19.461 48.2405C18.7425 48.3125 17.8417 48.3125 16.6972 48.3125H13.3028C12.1583 48.3125 11.2575 48.3125 10.539 48.2405C9.8055 48.1677 9.20025 48.0155 8.673 47.669C8.24883 47.3899 7.88324 47.0307 7.59675 46.6115C7.242 46.091 7.086 45.4925 7.011 44.7695C6.9375 44.063 6.9375 43.1765 6.9375 42.0545V41.9908C6.9375 40.8688 6.9375 39.983 7.011 39.2758C7.086 38.5528 7.242 37.9542 7.59675 37.4337C7.88324 37.0146 8.24883 36.6553 8.673 36.3763C9.348 35.9338 10.1565 35.8047 11.2088 35.759L11.2215 35.7583H11.2335C11.3439 35.7544 11.4497 35.7136 11.5341 35.6423C11.6184 35.571 11.6763 35.4734 11.6985 35.3652ZM13.7745 34.8125C13.2945 34.8125 12.8917 35.1447 12.801 35.5895C12.6547 36.3095 12.0157 36.8765 11.247 36.8833C10.236 36.9283 9.6945 37.052 9.2895 37.3175C8.98909 37.5154 8.73003 37.7699 8.52675 38.0667C8.31975 38.3705 8.19525 38.7597 8.12925 39.392C8.06325 40.034 8.0625 40.862 8.0625 42.023C8.0625 43.184 8.0625 44.0113 8.13 44.6532C8.19525 45.2855 8.31975 45.6748 8.5275 45.9792C8.7285 46.2747 8.98725 46.5298 9.29025 46.7285C9.603 46.9333 10.0035 47.057 10.6508 47.1215C11.3063 47.1868 12.1507 47.1875 13.3335 47.1875H16.6665C17.8485 47.1875 18.693 47.1875 19.3492 47.1215C19.9965 47.057 20.397 46.934 20.7098 46.7285C21.0128 46.5298 21.2723 46.2748 21.4733 45.9785C21.6803 45.6748 21.8047 45.2855 21.8707 44.6532C21.9367 44.0113 21.9375 43.1833 21.9375 42.023C21.9375 40.8628 21.9375 40.034 21.87 39.392C21.8047 38.7597 21.6802 38.3705 21.4725 38.0667C21.2693 37.7696 21.0102 37.5149 20.7098 37.3168C20.3063 37.052 19.7648 36.9283 18.7523 36.8833C17.9843 36.8758 17.3453 36.3102 17.199 35.5895C17.151 35.3677 17.0279 35.1693 16.8506 35.0277C16.6732 34.8861 16.4524 34.8101 16.2255 34.8125H13.7745ZM15 40.0625C14.5524 40.0625 14.1232 40.2403 13.8068 40.5568C13.4903 40.8732 13.3125 41.3024 13.3125 41.75C13.3125 42.1976 13.4903 42.6268 13.8068 42.9432C14.1232 43.2597 14.5524 43.4375 15 43.4375C15.4476 43.4375 15.8768 43.2597 16.1932 42.9432C16.5097 42.6268 16.6875 42.1976 16.6875 41.75C16.6875 41.3024 16.5097 40.8732 16.1932 40.5568C15.8768 40.2403 15.4476 40.0625 15 40.0625ZM12.1875 41.75C12.1875 41.0041 12.4838 40.2887 13.0113 39.7613C13.5387 39.2338 14.2541 38.9375 15 38.9375C15.7459 38.9375 16.4613 39.2338 16.9887 39.7613C17.5162 40.2887 17.8125 41.0041 17.8125 41.75C17.8125 42.4959 17.5162 43.2113 16.9887 43.7387C16.4613 44.2662 15.7459 44.5625 15 44.5625C14.2541 44.5625 13.5387 44.2662 13.0113 43.7387C12.4838 43.2113 12.1875 42.4959 12.1875 41.75ZM18.9375 39.5C18.9375 39.3508 18.9968 39.2077 19.1023 39.1023C19.2077 38.9968 19.3508 38.9375 19.5 38.9375H20.25C20.3992 38.9375 20.5423 38.9968 20.6477 39.1023C20.7532 39.2077 20.8125 39.3508 20.8125 39.5C20.8125 39.6492 20.7532 39.7923 20.6477 39.8977C20.5423 40.0032 20.3992 40.0625 20.25 40.0625H19.5C19.3508 40.0625 19.2077 40.0032 19.1023 39.8977C18.9968 39.7923 18.9375 39.6492 18.9375 39.5Z" fill="#84776E"/>
              </svg>
            <svg :class="[$style.cameraToggleIcon, isVideoMode ? '' : $style.iconHidden]" viewBox="0 0 30 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M8.69238 20.6243C8.29456 20.6243 7.91303 20.4662 7.63172 20.1849C7.35042 19.9036 7.19238 19.5221 7.19238 19.1243V10.8765C7.19238 10.4787 7.35042 10.0971 7.63172 9.81584C7.91303 9.53454 8.29456 9.3765 8.69238 9.3765H17.1006C17.2976 9.3765 17.4927 9.4153 17.6747 9.49068C17.8566 9.56607 18.022 9.67656 18.1613 9.81584C18.3006 9.95513 18.4111 10.1205 18.4865 10.3025C18.5618 10.4845 18.6006 10.6795 18.6006 10.8765V19.1243C18.6006 19.5221 18.4426 19.9036 18.1613 20.1849C17.88 20.4662 17.4985 20.6243 17.1006 20.6243H8.69238ZM18.9906 16.8758C18.8726 16.8112 18.7741 16.716 18.7055 16.6003C18.6369 16.4846 18.6007 16.3525 18.6006 16.218V13.7828C18.6007 13.6482 18.6369 13.5162 18.7055 13.4004C18.7741 13.2847 18.8726 13.1896 18.9906 13.125L21.6966 11.643C21.8108 11.5805 21.9393 11.5488 22.0695 11.5511C22.1996 11.5533 22.327 11.5894 22.439 11.6557C22.551 11.7221 22.6438 11.8165 22.7082 11.9296C22.7727 12.0427 22.8066 12.1706 22.8066 12.3008V17.7008C22.8065 17.8309 22.7725 17.9587 22.7079 18.0717C22.6434 18.1847 22.5506 18.2789 22.4386 18.3452C22.3267 18.4115 22.1994 18.4475 22.0693 18.4497C21.9392 18.4519 21.8108 18.4202 21.6966 18.3578L18.9906 16.8758Z" stroke="#84776E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15.3721 15.7432C15.1638 16.2269 14.8184 16.6389 14.3785 16.9284C13.9387 17.2179 13.4237 17.3721 12.8971 17.3721C12.3705 17.3721 11.8555 17.2179 11.4156 16.9284C10.9758 16.6389 10.6304 16.2269 10.4221 15.7432M10.5683 12.8415C10.5038 12.8464 10.4431 12.8743 10.3974 12.9201C10.3517 12.9659 10.324 13.0267 10.3193 13.0912C10.3193 13.2157 10.4438 13.3402 10.5683 13.3402C10.6329 13.3356 10.6936 13.3079 10.7395 13.2622C10.7853 13.2165 10.8132 13.1558 10.8181 13.0912C10.8181 12.966 10.6936 12.8415 10.5683 12.8415ZM15.2266 12.8415C15.162 12.8464 15.1014 12.8743 15.0557 12.9201C15.01 12.9659 14.9823 13.0267 14.9776 13.0912C14.9776 13.2157 15.1021 13.3402 15.2266 13.3402C15.2912 13.3356 15.3519 13.3079 15.3977 13.2622C15.4436 13.2165 15.4715 13.1558 15.4763 13.0912C15.4763 12.966 15.3518 12.8415 15.2266 12.8415Z" stroke="#84776E" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
          </span>
              </button>
              <div v-if="ptzOpen" :class="[$style.fullPtzPad, isDirectionPressed ? $style.directionPadPressed : '']" @click.stop>
                <img :class="$style.directionPadImage" src="/icons/Home/Cam/Cam_DirectionPad.svg" alt="" />
                <button type="button" :class="[$style.padHit, $style.padClose]" aria-label="방향 패드 닫기" @click="closePtzPad" />
                <button type="button" :class="[$style.padHit, $style.padGoto]" aria-label="저장된 위치로 이동" @click="gotoHome" />
                <button type="button" :class="[$style.padHit, $style.padSave]" aria-label="현재 위치 저장" @click="saveHome" />
                <button type="button" :class="[$style.padHit, $style.padUp]" aria-label="위로 이동" @pointerdown.prevent="move(0, 1)" @pointerup.prevent="stopPtz" @pointerleave.prevent="stopPtz" @pointercancel.prevent="stopPtz" />
                <button type="button" :class="[$style.padHit, $style.padLeft]" aria-label="왼쪽으로 이동" @pointerdown.prevent="move(-1, 0)" @pointerup.prevent="stopPtz" @pointerleave.prevent="stopPtz" @pointercancel.prevent="stopPtz" />
                <button type="button" :class="[$style.padHit, $style.padRight]" aria-label="오른쪽으로 이동" @pointerdown.prevent="move(1, 0)" @pointerup.prevent="stopPtz" @pointerleave.prevent="stopPtz" @pointercancel.prevent="stopPtz" />
                <button type="button" :class="[$style.padHit, $style.padDown]" aria-label="아래로 이동" @pointerdown.prevent="move(0, -1)" @pointerup.prevent="stopPtz" @pointerleave.prevent="stopPtz" @pointercancel.prevent="stopPtz" />
              </div>
              <button type="button" tabindex="-1" :class="[$style.fullControlBtn, $style.fullDirectionBtn]" aria-label="방향 제어" @click="togglePtzPad">
                <img src="/icons/Home/Bar/Bar_Direction.svg" :class="$style.fullDirectionIcon" alt="" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useAutoLifecycle } from '@/composables/useAutoLifecycle'
import { useCamera } from '@/composables/useCamera'
import { getHlsUrl, getWhepUrl } from '@/endpoints'
import { usePtz } from '@/composables/usePtz'
import { useWebRtcStream } from '@/composables/useWebRtcStream'

const { accessToken } = useAuth()
// Restores the always-on streaming/analysis the screens were designed for.
useAutoLifecycle()

const isMuted = ref(true)
const isExpanded = ref(false)
const isLandscape = ref(false)
const isVideoMode = ref(false)
const isRecording = ref(false)
const captureFeedbackKey = ref(0)
const captureModeFeedback = ref('')
const inlineVideo = ref(null)
const expandedVideo = ref(null)
const videoAspectRatio = ref(16 / 9)
const streamFrameStyle = computed(() => ({ '--video-aspect-ratio': videoAspectRatio.value }))

function updateVideoAspectRatio(event) {
  const video = event.currentTarget
  if (video?.videoWidth > 0 && video?.videoHeight > 0) {
    videoAspectRatio.value = video.videoWidth / video.videoHeight
  }
}
const STREAM_PROTOCOL_STORAGE_KEY = 'wally_stream_protocol'
const STREAM_PROTOCOLS = new Set(['hls', 'webrtc'])

function normalizeProtocol(value) {
  return STREAM_PROTOCOLS.has(value) ? value : 'hls'
}

function readStoredProtocol() {
  try {
    return normalizeProtocol(window.localStorage.getItem(STREAM_PROTOCOL_STORAGE_KEY))
  } catch {
    return 'hls'
  }
}

const protocol = ref(readStoredProtocol())
const { cameraUrl, loading, error, cameraViewState, reconnectKey, selectedCamera, loadCameras, setConnected, setDisconnected } = useCamera()
const { startMove, stopMove, saveHome, gotoHome } = usePtz()
const emit = defineEmits(['ptz-change'])
const ptzOpen = ref(false)
let moving = false
const isDirectionPressed = ref(false)
let mediaRecorder = null
let recordedChunks = []
let recordingCleanup = null
let captureFeedbackTimer = null
let captureModeFeedbackTimer = null


function blurFullscreenControl(event) {
  const button = event.target?.closest?.("button")
  button?.blur?.()
  requestAnimationFrame(() => button?.blur?.())
}

function openPtzPad() {
  ptzOpen.value = true
  emit('ptz-change', true)
}

function closePtzPad() {
  ptzOpen.value = false
  emit('ptz-change', false)
  stopPtz()
}

function closeExpandedView() {
  ptzOpen.value = false
  emit('ptz-change', false)
  isExpanded.value = false
  stopPtz()
}

function openExpandedView() {
  const viewportLandscape = window.innerWidth > window.innerHeight

  if (viewportLandscape) {
    document.documentElement.classList.remove('home-force-portrait')
    window.dispatchEvent(new CustomEvent('wally:home-force-portrait', { detail: false }))
    isExpanded.value = false
    isLandscape.value = true
    setNativeImmersiveMode(true)
    void nextTick().then(() => replayInlineVideo())
    return
  }

  isExpanded.value = true
}

function handleAndroidBack(event) {
  if (ptzOpen.value) {
    event.preventDefault()
    closePtzPad()
    return
  }

  if (isLandscape.value) {
    event.preventDefault()
    void exitLandscapeView()
    return
  }

  if (isExpanded.value) {
    event.preventDefault()
    closeExpandedView()
  }
}

function togglePtzPad() {
  ptzOpen.value = !ptzOpen.value
  emit('ptz-change', ptzOpen.value)
  if (!ptzOpen.value) stopPtz()
}

defineExpose({
  openPtzPad,
  togglePtzPad,
  closePtzPad,
  retryStream: () => retryStream(),
})

function move(pan, tilt) {
  moving = true
  isDirectionPressed.value = true
  startMove(pan, tilt)
}

function stopPtz() {
  isDirectionPressed.value = false
  if (!moving) return
  moving = false
  stopMove()
}

function getCaptureTarget() {
  return isExpanded.value && expandedVideo.value ? expandedVideo.value : inlineVideo.value
}

function createTimestampedFilename(extension) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
  return 'wally_' + stamp + '.' + extension
}

function createCaptureFilename() {
  return createTimestampedFilename('jpg')
}

function createRecordingFilename() {
  return createTimestampedFilename(getRecordingExtension(mediaRecorder?.mimeType || ''))
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function blobSliceToBase64(blob) {
  const dataUrl = await blobToDataUrl(blob)
  const commaIndex = String(dataUrl).indexOf(',')
  return commaIndex >= 0 ? String(dataUrl).slice(commaIndex + 1) : String(dataUrl)
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('capture failed'))
    }, 'image/jpeg', 0.92)
  })
}

function downloadCapture(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function saveCapture(blob, filename) {
  const dataUrl = await blobToDataUrl(blob)
  const gallerySaver = window.WallyGallery

  if (gallerySaver?.saveImage?.(dataUrl, filename)) {
    return
  }

  const plugins = window.Capacitor?.Plugins
  const nativeSaver = plugins?.PhotoAlbum?.saveImage || plugins?.GallerySaver?.saveImage

  if (nativeSaver) {
    await nativeSaver({ dataUrl, filename, album: 'Wally' })
    return
  }

  downloadCapture(blob, filename)
}

async function saveRecording(blob, filename) {
  const gallerySaver = window.WallyGallery

  if (
    gallerySaver?.beginVideoSave &&
    gallerySaver?.appendVideoChunk &&
    gallerySaver?.finishVideoSave
  ) {
    const token = gallerySaver.beginVideoSave(filename, blob.type || 'video/webm')
    if (token) {
      const chunkSize = 64 * 1024
      try {
        for (let offset = 0; offset < blob.size; offset += chunkSize) {
          const base64Chunk = await blobSliceToBase64(blob.slice(offset, offset + chunkSize))
          if (!gallerySaver.appendVideoChunk(token, base64Chunk)) {
            throw new Error('failed to write video chunk')
          }
        }
        if (!gallerySaver.finishVideoSave(token)) throw new Error('failed to finish video save')
        return
      } catch (error) {
        gallerySaver.abortVideoSave?.(token)
        throw error
      }
    }
  }

  const dataUrl = await blobToDataUrl(blob)

  if (gallerySaver?.saveVideo?.(dataUrl, filename)) {
    return
  }

  const plugins = window.Capacitor?.Plugins
  const nativeSaver = plugins?.PhotoAlbum?.saveVideo || plugins?.GallerySaver?.saveVideo

  if (nativeSaver) {
    await nativeSaver({ dataUrl, filename, album: 'Wally' })
    return
  }

  downloadCapture(blob, filename)
}

function getRecordingMimeType() {
  if (!window.MediaRecorder?.isTypeSupported) return ''
  const types = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=h264,aac',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  return types.find((type) => window.MediaRecorder.isTypeSupported(type)) || ''
}

function getRecordingExtension(mimeType) {
  return mimeType.toLowerCase().includes('mp4') ? 'mp4' : 'webm'
}

function getVideoStream(video) {
  return video.captureStream?.() || video.mozCaptureStream?.() || null
}

function canvasCanRecord() {
  return typeof document !== 'undefined' && typeof document.createElement('canvas').captureStream === 'function'
}

function createCanvasRecordingStream(video) {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const context = canvas.getContext('2d')
  let frameId = 0
  let stopped = false
  const draw = () => {
    if (stopped) return
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    frameId = requestAnimationFrame(draw)
  }
  const stream = canvas.captureStream(30)
  frameId = requestAnimationFrame(draw)

  return {
    stream,
    stop: () => {
      stopped = true
      cancelAnimationFrame(frameId)
      stream.getTracks().forEach((track) => track.stop())
    },
  }
}

async function startRecording() {
  const video = getCaptureTarget()
  if (!video || !video.videoWidth || !video.videoHeight || isRecording.value) return
  if (!window.MediaRecorder) return

  try {
    let stream = getVideoStream(video)
    recordingCleanup = null

    if (!stream?.getVideoTracks?.().length && canvasCanRecord()) {
      const fallback = createCanvasRecordingStream(video)
      stream = fallback.stream
      recordingCleanup = fallback.stop
    }

    if (!stream?.getVideoTracks?.().length) return

    recordedChunks = []
    const mimeType = getRecordingMimeType()
    mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    mediaRecorder.ondataavailable = (event) => {
      if (event.data?.size) recordedChunks.push(event.data)
    }
    mediaRecorder.onstop = async () => {
      isRecording.value = false
      recordingCleanup?.()
      recordingCleanup = null
      stream.getTracks().forEach((track) => track.stop())
      const blob = new Blob(recordedChunks, { type: mimeType || 'video/webm' })
      const filename = createRecordingFilename()
      recordedChunks = []
      mediaRecorder = null
      if (blob.size) {
        try {
          await saveRecording(blob, filename)
          showCaptureModeFeedback('동영상 저장 완료')
        } catch (error) {
          console.error('Failed to save camera recording', error)
          showCaptureModeFeedback('동영상 저장 실패')
        }
      }
    }
    mediaRecorder.start(250)
    isRecording.value = true
  } catch (err) {
    isRecording.value = false
    recordingCleanup?.()
    recordingCleanup = null
    console.error('Failed to record camera video', err)
  }
}

function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') return
  mediaRecorder.requestData?.()
  mediaRecorder.stop()
  showCaptureModeFeedback('동영상 저장 중')
}

function handleCaptureButton() {
  if (!isVideoMode.value) {
    triggerCaptureMotion()
    captureCurrentFrame()
    return
  }

  if (isRecording.value) {
    stopRecording()
    return
  }

  startRecording()
}

function triggerCaptureMotion() {
  captureFeedbackKey.value += 1
  if (captureFeedbackTimer) window.clearTimeout(captureFeedbackTimer)
  captureFeedbackTimer = window.setTimeout(() => {
    captureFeedbackKey.value = 0
    captureFeedbackTimer = null
  }, 360)
}

async function captureCurrentFrame() {
  const video = getCaptureTarget()
  if (!video || !video.videoWidth || !video.videoHeight) return

  try {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await canvasToBlob(canvas)
    await saveCapture(blob, createCaptureFilename())
  } catch (err) {
    console.error('Failed to capture camera frame', err)
  }
}
async function exitLandscapeView() {
  setNativeImmersiveMode(false)
  isExpanded.value = false
  isLandscape.value = false
  ptzOpen.value = false
  emit('ptz-change', false)
  stopPtz()
  document.documentElement.classList.add('home-force-portrait')
  window.dispatchEvent(new CustomEvent('wally:home-force-portrait', { detail: true }))

  const orientation = window.screen?.orientation
  if (orientation?.lock) {
    try {
      await orientation.lock('portrait-primary')
    } catch {
      try {
        await orientation.lock('portrait')
      } catch {
        // Some browsers only allow orientation lock in fullscreen/PWA contexts.
      }
    }
  }

  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen?.()
    } catch {
      // Ignore unsupported fullscreen exit failures.
    }
  }
}

const playbackError = ref('')
const streamLoading = ref(false)
const timedOut = ref(false)
let inlineHls = null
let expandedHls = null
let HlsLib = null
let timeoutTimer = null
let retryTimer = null
const setNativeImmersiveMode = (enabled) => {
  try {
    window.WallySystemUi?.setImmersive(Boolean(enabled))
  } catch (err) {
    console.warn('Failed to update Android system bars', err)
  }
}
let stallTimer = null
let streamSessionId = 0
let connectDeadline = 0
let retryAttempts = 0
const CONNECT_TIMEOUT = 15000
const RETRY_DELAY = 3000
const STALL_TIMEOUT = 8000
const MAX_AUTO_RETRIES = 3

const {
  mediaStream: webRtcMediaStream,
  connect: connectWebRtc,
  disconnect: disconnectWebRtc,
} = useWebRtcStream({
  getUrl: getWhepUrl,
  getHeaders: () => (accessToken.value ? { Authorization: `Bearer ${accessToken.value}` } : {}),
  connectTimeout: CONNECT_TIMEOUT,
  retryDelay: RETRY_DELAY,
  onTerminalFailure: () => fallbackToHls(),
})

const videoSrc = computed(() => cameraUrl.value || (cameraViewState.value === 'configured' ? getHlsUrl() : ''))
const isHlsStream = computed(() => protocol.value === 'hls' && videoSrc.value.includes('.m3u8'))
const nativeVideoSrc = computed(() => (protocol.value === 'webrtc' || isHlsStream.value ? '' : videoSrc.value))

const statusText = computed(() => {
  if (loading.value || streamLoading.value) return '카메라 연결 중'
  if (timedOut.value) return '카메라 연결 시간이 초과되었습니다.'
  if (error.value) return error.value
  if (playbackError.value && videoSrc.value) return playbackError.value
  if (cameraViewState.value === 'unconfigured') return '등록된 카메라가 없습니다.'
  if (!videoSrc.value) return '카메라 영상이 없습니다.'
  return ''
})
const canRetry = computed(() => Boolean(timedOut.value || error.value || playbackError.value || (!loading.value && !videoSrc.value)))
const captureIconSrc = computed(() => (isVideoMode.value ? '/icons/Home/Cam/Cam_Shutter_vedio.svg' : '/icons/Home/Cam/Cam_Shutter.svg'))

function toggleCaptureMode() {
  if (isRecording.value) stopRecording()
  isVideoMode.value = !isVideoMode.value
  showCaptureModeFeedback(isVideoMode.value ? '동영상 모드' : '사진 모드')
}

function showCaptureModeFeedback(message) {
  captureModeFeedback.value = message
  if (captureModeFeedbackTimer) window.clearTimeout(captureModeFeedbackTimer)
  captureModeFeedbackTimer = window.setTimeout(() => {
    captureModeFeedback.value = ''
    captureModeFeedbackTimer = null
  }, 1200)
}

const syncMutedState = (target) => {
  if (!target) return
  target.defaultMuted = isMuted.value
  target.muted = isMuted.value
}

const handleVideoError = () => {
  if (!videoSrc.value) return
  playbackError.value = '카메라 영상을 재생할 수 없습니다.'
  streamLoading.value = false
  setDisconnected()
}

const clearStreamTimers = () => {
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
    timeoutTimer = null
  }
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  if (stallTimer) {
    clearInterval(stallTimer)
    stallTimer = null
  }
}

const onPlaying = () => {
  streamLoading.value = false
  timedOut.value = false
  playbackError.value = ''
  retryAttempts = 0
  setConnected()
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
    timeoutTimer = null
  }
}

const scheduleRetry = (sessionId) => {
  if (Date.now() >= connectDeadline || retryAttempts >= MAX_AUTO_RETRIES) {
    streamLoading.value = false
    timedOut.value = true
    setDisconnected()
    return
  }
  retryAttempts += 1
  if (retryTimer) clearTimeout(retryTimer)
  retryTimer = setTimeout(() => {
    if (sessionId !== streamSessionId || Date.now() >= connectDeadline) return
    replayInlineVideo({ preserveRetryCount: true })
  }, RETRY_DELAY)
}

const startTimeout = (sessionId) => {
  if (timeoutTimer) clearTimeout(timeoutTimer)
  timeoutTimer = setTimeout(() => {
    if (sessionId !== streamSessionId) return
    streamLoading.value = false
    timedOut.value = true
    setDisconnected()
    destroyHls('inline')
  }, CONNECT_TIMEOUT)
}

const startStallDetection = (sessionId) => {
  if (stallTimer) clearInterval(stallTimer)
  let lastTime = 0
  stallTimer = setInterval(() => {
    if (sessionId !== streamSessionId) {
      clearInterval(stallTimer)
      stallTimer = null
      return
    }

    const video = inlineVideo.value
    if (!video || streamLoading.value || timedOut.value) return
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.paused || video.ended || video.currentTime <= lastTime + 0.05) {
      scheduleRetry(sessionId)
      return
    }
    lastTime = video.currentTime
  }, STALL_TIMEOUT)
}

const ensureHls = async () => {
  if (HlsLib) return HlsLib
  const mod = await import('hls.js/light')
  HlsLib = mod.default
  return HlsLib
}

const destroyHls = (target = 'all') => {
  if ((target === 'all' || target === 'inline') && inlineHls) {
    inlineHls.destroy()
    inlineHls = null
  }

  if ((target === 'all' || target === 'expanded') && expandedHls) {
    expandedHls.destroy()
    expandedHls = null
  }
}

function selectProtocol(nextProtocol) {
  protocol.value = normalizeProtocol(nextProtocol)
}

function writeStoredProtocol(nextProtocol) {
  try {
    window.localStorage.setItem(STREAM_PROTOCOL_STORAGE_KEY, normalizeProtocol(nextProtocol))
  } catch {
    // The in-memory selection remains usable when storage is unavailable.
  }
}

function fallbackToHls() {
  if (protocol.value !== 'webrtc') return
  protocol.value = 'hls'
}

function clearVideoStream(video) {
  if (!video?.srcObject) return
  video.pause()
  video.srcObject = null
}

async function attachSharedWebRtcStream(video) {
  if (!video || !webRtcMediaStream.value) return false
  resetVideoElement(video)
  video.srcObject = webRtcMediaStream.value
  await playVideo(video)
  return true
}

async function startWebRtcStream() {
  if (!videoSrc.value || protocol.value !== 'webrtc') return
  streamLoading.value = true
  timedOut.value = false
  playbackError.value = ''
  setDisconnected()

  const stream = await connectWebRtc()
  if (!stream || protocol.value !== 'webrtc') return

  await attachSharedWebRtcStream(inlineVideo.value)
  if (isExpanded.value) await attachSharedWebRtcStream(expandedVideo.value)
  onPlaying()
}

const resetVideoElement = (video) => {
  if (!video) return
  video.pause()
  video.removeAttribute('src')
  video.load()
}

const attachHls = async (video, target, sessionId = streamSessionId) => {
  if (!video || !videoSrc.value || !isHlsStream.value) return

  const Hls = await ensureHls().catch(() => null)
  if (!Hls) {
    handleVideoError()
    return
  }

  destroyHls(target)
  if (Hls.isSupported()) {
    const hls = new Hls({
      liveSyncDurationCount: 1,
      liveMaxLatencyDurationCount: 3,
      maxBufferLength: 3,
      maxMaxBufferLength: 6,
      // The HLS relay sits behind the router and every request —
      // playlist and segments alike — must carry the access token.
      xhrSetup: (xhr) => {
        if (accessToken.value) xhr.setRequestHeader('Authorization', `Bearer ${accessToken.value}`)
      },
    })
    hls.loadSource(videoSrc.value)
    hls.attachMedia(video)
    hls.on(Hls.Events.MANIFEST_PARSED, () => playVideo(video))
    hls.on(Hls.Events.ERROR, (_, data) => {
      if (!data?.fatal) return
      if (target === 'inline' && sessionId === streamSessionId && Date.now() < connectDeadline) {
        scheduleRetry(sessionId)
        return
      }
      handleVideoError()
    })

    if (target === 'inline') inlineHls = hls
    if (target === 'expanded') expandedHls = hls
    return
  }

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS cannot set headers; the token rides the playlist URL.
    // Segment requests do not inherit it, so native-only environments are
    // limited — hls.js above is the supported path.
    const separator = videoSrc.value.includes('?') ? '&' : '?'
    video.src = `${videoSrc.value}${separator}token=${encodeURIComponent(accessToken.value || '')}`
    await playVideo(video)
    return
  }

  handleVideoError()
}

const setupVideoSource = async (video, target, sessionId = streamSessionId) => {
  if (!video) return
  syncMutedState(video)

  if (protocol.value === 'webrtc') {
    if (webRtcMediaStream.value) {
      await attachSharedWebRtcStream(video)
    } else if (target === 'inline') {
      await startWebRtcStream()
    }
    return
  }

  if (isHlsStream.value) {
    await attachHls(video, target, sessionId)
    return
  }

  destroyHls(target)
  if (videoSrc.value && video.src !== videoSrc.value) {
    video.src = videoSrc.value
  }
  await playVideo(video)
}

const playVideo = async (target) => {
  if (!target) return

  try {
    syncMutedState(target)
    await target.play()
    if (target === inlineVideo.value) onPlaying()
  } catch (error) {
    // Ignore autoplay failures; browser policies may require user interaction.
  }
}

const replayInlineVideo = async ({ preserveRetryCount = false } = {}) => {
  if (!videoSrc.value) return
  if (!preserveRetryCount) retryAttempts = 0
  const sessionId = ++streamSessionId
  streamLoading.value = true
  timedOut.value = false
  playbackError.value = ''
  setDisconnected()
  connectDeadline = Date.now() + CONNECT_TIMEOUT
  if (protocol.value === 'hls') startTimeout(sessionId)
  startStallDetection(sessionId)
  await nextTick()
  await setupVideoSource(inlineVideo.value, 'inline', sessionId)
}

const retryStream = async () => {
  streamSessionId++
  clearStreamTimers()
  destroyHls()
  disconnectWebRtc()
  clearVideoStream(inlineVideo.value)
  clearVideoStream(expandedVideo.value)
  resetVideoElement(inlineVideo.value)
  resetVideoElement(expandedVideo.value)
  playbackError.value = ''
  timedOut.value = false
  retryAttempts = 0
  await loadCameras({ force: true })
  await replayInlineVideo()
  if (isExpanded.value) {
    await setupVideoSource(expandedVideo.value, 'expanded')
  }
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    replayInlineVideo()
  }
}

const updateOrientation = async () => {
  const wasLandscape = isLandscape.value
  const viewportLandscape = window.innerWidth > window.innerHeight

  if (document.documentElement.classList.contains('home-force-portrait')) {
    if (!viewportLandscape) {
      document.documentElement.classList.remove('home-force-portrait')
      window.dispatchEvent(new CustomEvent('wally:home-force-portrait', { detail: false }))
    } else {
      isLandscape.value = false
      return
    }
  }

  const wasExpanded = isExpanded.value
  isLandscape.value = viewportLandscape
  setNativeImmersiveMode(isLandscape.value)

  if (wasLandscape && !isLandscape.value && ptzOpen.value) {
    ptzOpen.value = false
    stopPtz()
  }

  if (isLandscape.value) {
    isExpanded.value = false
  } else if (wasLandscape) {
    isExpanded.value = true
  }

  if (wasLandscape !== isLandscape.value && !wasExpanded) {
    await nextTick()
    await replayInlineVideo()
  }
}

onMounted(async () => {
  updateOrientation()
  await loadCameras({ force: true })
  window.addEventListener('resize', updateOrientation)
  window.addEventListener('wally:android-back', handleAndroidBack)
  window.addEventListener('orientationchange', updateOrientation)
  window.visualViewport?.addEventListener('resize', updateOrientation)
  window.addEventListener('pageshow', replayInlineVideo)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  setNativeImmersiveMode(false)
  if (isRecording.value) stopRecording()
  if (captureFeedbackTimer) {
    window.clearTimeout(captureFeedbackTimer)
    captureFeedbackTimer = null
  }
  if (captureModeFeedbackTimer) {
    window.clearTimeout(captureModeFeedbackTimer)
    captureModeFeedbackTimer = null
  }
  document.documentElement.classList.remove('home-force-portrait')
  window.dispatchEvent(new CustomEvent('wally:home-force-portrait', { detail: false }))
  streamSessionId++
  clearStreamTimers()
  destroyHls()
  disconnectWebRtc()
  clearVideoStream(inlineVideo.value)
  clearVideoStream(expandedVideo.value)
  window.removeEventListener('resize', updateOrientation)
  window.removeEventListener('wally:android-back', handleAndroidBack)
  window.removeEventListener('orientationchange', updateOrientation)
  window.visualViewport?.removeEventListener('resize', updateOrientation)
  window.removeEventListener('pageshow', replayInlineVideo)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

watch(
  videoSrc,
  async () => {
    streamSessionId++
    clearStreamTimers()
    destroyHls('inline')
    playbackError.value = ''
    if (!videoSrc.value) {
      streamLoading.value = false
      timedOut.value = false
      setDisconnected()
      return
    }
    await replayInlineVideo()
    if (isExpanded.value) {
      await setupVideoSource(expandedVideo.value, 'expanded')
    }
  },
  { immediate: true },
)

watch(protocol, async (nextProtocol) => {
  writeStoredProtocol(nextProtocol)
  streamSessionId++
  clearStreamTimers()
  destroyHls()
  disconnectWebRtc()
  clearVideoStream(inlineVideo.value)
  clearVideoStream(expandedVideo.value)
  resetVideoElement(inlineVideo.value)
  resetVideoElement(expandedVideo.value)
  playbackError.value = ''
  timedOut.value = false
  retryAttempts = 0
  await replayInlineVideo()
  if (isExpanded.value) await setupVideoSource(expandedVideo.value, 'expanded')
})

watch(webRtcMediaStream, async (stream) => {
  if (protocol.value !== 'webrtc') return
  if (!stream) {
    clearVideoStream(inlineVideo.value)
    clearVideoStream(expandedVideo.value)
    return
  }
  await nextTick()
  await attachSharedWebRtcStream(inlineVideo.value)
  if (isExpanded.value) await attachSharedWebRtcStream(expandedVideo.value)
})

watch(reconnectKey, async () => {
  await retryStream()
})

watch(isMuted, () => {
  syncMutedState(inlineVideo.value)
  syncMutedState(expandedVideo.value)
})

watch(isExpanded, async (expanded) => {
  if (!expanded) {
    destroyHls('expanded')
    clearVideoStream(expandedVideo.value)
    await nextTick()
    await replayInlineVideo()
    return
  }

  await nextTick()
  await setupVideoSource(expandedVideo.value, 'expanded')
})
</script>

<style module>
.wrapper {
  --landscape-overlay-icon-size-phone: clamp(2.4rem, 6.2vmin, 4.6rem);
  --landscape-overlay-icon-size-tablet: clamp(3.2rem, 7.4vmin, 5.8rem);
  --landscape-overlay-icon-size: var(--landscape-overlay-icon-size-phone);
  width: 100%;
  background-color: var(--home-bg);
  display: flex;
  justify-content: center;
}
@media (orientation: landscape) {
  .wrapper {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    background-color: #000;
    justify-content: stretch;
    align-items: stretch;
  }
}
.video {
  width: 100%;
  aspect-ratio: 16 / 9;
  position: relative;
  background-color: #050403;
  border: 0.08rem solid var(--home-camera-border);
  box-shadow: var(--home-shadow);
  overflow: hidden;
}
.streamFrame {
  position: relative;
  width: 100%;
  height: 100%;
}

.protocolSwitch {
  position: absolute;
  z-index: 4;
  display: flex;
  width: 80px;
  height: 23px;
  padding: 2px 0 2px 2px;
  border-radius: 20px;
  background-color: var(--home-protocol-bg);
  box-sizing: border-box;
  overflow: hidden;
  text-align: center;
  font-family: 'Hancom MalangMalang', Malang, sans-serif;
  font-size: 10px;
  line-height: 19px;
  transition: background-color 0.16s ease;
}

.protocolSwitch::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 26px;
  height: 19px;
  border-radius: 20px;
  background-color: var(--home-protocol-active-bg);
  transition:
    left 0.24s cubic-bezier(0.22, 1, 0.36, 1),
    width 0.24s cubic-bezier(0.22, 1, 0.36, 1),
    background-color 0.16s ease;
  pointer-events: none;
}

.inlineProtocolSwitch {
  top: 0.65rem;
  right: 0.65rem;
}

.protocolOption {
  position: relative;
  height: 19px;
  border: 0;
  border-radius: 20px;
  padding: 0;
  color: var(--home-protocol-text);
  background: transparent;
  font: inherit;
  line-height: 19px;
  cursor: pointer;
  overflow: hidden;
  transition: color 0.16s ease, background-color 0.16s ease;
  z-index: 1;
  outline: none;
  box-shadow: none;
  appearance: none;
  -webkit-appearance: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  user-select: none;
}

.protocolOption:focus,
.protocolOption:focus-visible,
.protocolOption:active {
  outline: none;
  box-shadow: none;
}

.protocolOption:first-child {
  flex: 0 0 26px;
  width: 26px;
}

.protocolOption:last-child {
  flex: 0 0 52px;
  width: 52px;
}

.protocolSwitchHls {
  background-color: var(--home-protocol-bg);
}

.protocolSwitchHls .protocolOption {
  color: var(--home-protocol-text);
}

.protocolSwitchHls .protocolOptionActive {
  color: var(--home-protocol-active-text);
  background-color: transparent;
}

.protocolSwitchWebRtc {
  background-color: var(--home-protocol-bg);
}

.protocolSwitchWebRtc .protocolOption {
  color: var(--home-protocol-text);
}

.protocolSwitchWebRtc .protocolOptionActive {
  color: var(--home-protocol-active-text);
  background-color: transparent;
}

.protocolSwitchWebRtc::before {
  left: 28px;
  width: 52px;
  background-color: var(--home-protocol-active-bg);
}
@media (orientation: landscape) {
  .video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    aspect-ratio: auto;
    margin: 0;
    border: 0;
    box-shadow: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .streamFrame {
    width: min(100%, calc(100vh * var(--video-aspect-ratio)));
    height: auto;
    max-height: 100%;
    aspect-ratio: var(--video-aspect-ratio);
  }

  .inlineProtocolSwitch {
    top: 0.75rem;
    right: calc(max(env(safe-area-inset-right), var(--wally-safe-right, 0px)) + 0.75rem);
    z-index: 6;
  }

}
.videoImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.captureFeedback {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.captureFlash {
  position: absolute;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.72);
  animation: captureFlash 360ms ease-out both;
}
.captureRing {
  width: clamp(4.6rem, 18vmin, 9.2rem);
  height: clamp(4.6rem, 18vmin, 9.2rem);
  border: 0.42rem solid rgba(255, 251, 245, 0.95);
  border-radius: 50%;
  background-color: rgba(255, 251, 245, 0.22);
  box-shadow:
    0 0 0 0.75rem rgba(0, 0, 0, 0.22),
    0 0 2.2rem rgba(255, 251, 245, 0.34);
  animation: captureRing 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes captureFlash {
  0% {
    opacity: 0;
  }
  18% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
@keyframes captureRing {
  0% {
    opacity: 0;
    transform: scale(0.72);
  }
  24% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.18);
  }
}
.statusOverlay {
  position: absolute;
  top: 1rem;
  left: 50%;
  z-index: 3;
  transform: translateX(-50%);
  max-width: calc(100% - 2rem);
  min-height: 2rem;
  padding: 0.45rem 0.7rem;
  border-radius: 0.8rem;
  background-color: rgba(0, 0, 0, 0.56);
  color: #fffbf5;
  border: 0.06rem solid rgba(255, 251, 245, 0.16);
  box-shadow: 0 0.35rem 1rem rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(0.6rem);
  font-family: 'Malang', sans-serif;
  font-size: clamp(0.9rem, 2.8vw, 1.15rem);
  line-height: 1.3;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  pointer-events: auto;
  box-sizing: border-box;
}
.fullStatusOverlay {
  position: fixed;
  top: 1.7rem;
  left: 50%;
  z-index: 1005;
}
:global(html.wally-native) .fullStatusOverlay {
  top: max(3.7rem, calc(env(safe-area-inset-top) + 1.7rem));
}
.captureModeFeedback {
  position: absolute;
  top: 0.7rem;
  left: 50%;
  z-index: 5;
  min-height: 2.2rem;
  padding: 0.38rem 0.85rem;
  border-radius: 999rem;
  background-color: rgba(255, 251, 245, 0.9);
  border: 0.06rem solid rgba(132, 119, 110, 0.12);
  box-shadow: 0 0.22rem 0.7rem rgba(0, 0, 0, 0.14);
  transform: translateX(-50%);
  color: #3d332d;
  font-family: 'Malang', sans-serif;
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  animation: captureModeToast 1.2s ease both;
}
.fullCaptureModeFeedback {
  position: fixed;
  top: 1.7rem;
  left: 50%;
  z-index: 1005;
}
:global(html.wally-native) .fullCaptureModeFeedback {
  top: max(3.7rem, calc(env(safe-area-inset-top) + 1.7rem));
}
@keyframes captureModeToast {
  0% {
    opacity: 0;
    transform: translate(-50%, -0.45rem);
  }
  15%,
  82% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -0.25rem);
  }
}
.retryBtn {
  min-width: 4.4rem;
  min-height: 1.7rem;
  padding: 0.25rem 0.55rem;
  border: 0.06rem solid var(--home-panel-border);
  border-radius: 0.55rem;
  background-color: var(--home-panel-bg);
  color: var(--home-text);
  font-family: 'Malang', sans-serif;
  font-size: 0.85rem;
  line-height: 1.2;
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}
.recordingBadge {
  position: absolute;
  top: 0.8rem;
  left: 50%;
  z-index: 3;
  min-height: 2rem;
  padding: 0.32rem 0.58rem;
  border-radius: 999rem;
  background-color: rgba(255, 251, 245, 0.68);
  border: 0.06rem solid rgba(132, 119, 110, 0.1);
  box-shadow: 0 0.2rem 0.55rem rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(0.45rem);
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
  box-sizing: border-box;
  color: #84776e;
  font-family: 'Malang', sans-serif;
  font-weight: 400;
  font-size: 1rem;
  pointer-events: none;
  transform: translateX(-50%);
}
.recordingCameraIcon {
  width: 1.35rem;
  height: 1.35rem;
  display: block;
  filter: var(--home-icon-filter);
  flex-shrink: 0;
}
.recordingDot {
  width: 0.6rem;
  height: 0.6rem;
  display: block;
  flex-shrink: 0;
}
.recordingText {
  line-height: 1;
  white-space: nowrap;
}
.recordingPulseDot {
  width: 0.62rem;
  height: 0.62rem;
  display: block;
  flex: 0 0 auto;
  border-radius: 50%;
  background-color: #ff9f70;
  box-shadow: 0 0 0.42rem rgba(255, 159, 112, 0.52);
  animation: recordingPulse 1s ease-in-out infinite;
}
@keyframes recordingPulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.25;
    transform: scale(0.78);
  }
}
.recordingBadge.fullRecordingBadge {
  position: fixed;
  top: 1.6rem;
  left: 50%;
  z-index: 1004;
  background-color: rgba(255, 251, 245, 0.9);
  color: #3d332d;
  transform: translate(-50%, 0.2rem);
}
:global(html.wally-native) .recordingBadge.fullRecordingBadge {
  top: max(3.6rem, calc(env(safe-area-inset-top) + 1.6rem));
}
.overlay {
  position: absolute;
  bottom: 1rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 1rem;
  z-index: 2;
}
.landscapeControls,
.landscapeLeftControls {
  display: none;
}
.landscapeCapture,
.landscapeCameraToggle,
.landscapeRefresh,
.landscapePtzButton,
.landscapeLeftButton {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.landscapeCapture:focus,
.landscapeCameraToggle:focus,
.landscapeRefresh:focus,
.landscapePtzButton:focus,
.landscapeLeftButton:focus,
.landscapeCapture:focus-visible,
.landscapeCameraToggle:focus-visible,
.landscapeRefresh:focus-visible,
.landscapePtzButton:focus-visible,
.landscapeLeftButton:focus-visible {
  outline: none;
}
.landscapePtzButton img,
.landscapeRefresh img,
.landscapeLeftButton.soundToggleButton img {
  width: 1.9rem;
  height: 1.9rem;
  display: block;
  filter: brightness(0) invert(1);
}

.landscapeLeftButton img {
  width: 1.9rem;
  height: 1.9rem;
  display: block;
  filter: brightness(0) invert(1);
}
.portraitPtzLayer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: calc(5.6rem + 7.2rem);
  left: 0;
  z-index: 10000;
  background: transparent;
}
.portraitPtzPad {
  position: absolute;
  right: clamp(0.9rem, 4vw, 1.6rem);
  bottom: clamp(0.6rem, 2.4vw, 1rem);
  width: min(clamp(19rem, 72vw, 26rem), calc(100vw - 1.8rem));
  aspect-ratio: 260 / 143;
  z-index: 81;
}
.fullPtzPad {
  position: absolute;
  left: 50%;
  right: auto;
  bottom: 14.4rem;
  width: min(clamp(17rem, 56%, 22rem), calc(100% - 3rem));
  aspect-ratio: 260 / 143;
  transform: translateX(-50%);
  z-index: 10001;
}
.landscapePtzPad {
  position: absolute;
  right: calc(100% + 0.4rem);
  bottom: -1.3rem;
  width: clamp(16rem, 40vmin, 26rem);
  aspect-ratio: 260 / 143;
  z-index: 5;
}
.directionPadImage {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 0.8rem;
  max-width: 100%;
  overflow: hidden;
  display: block;
  object-fit: contain;
}

.landscapePtzPad,
.portraitPtzPad,
.fullPtzPad {
  transition: transform 0.12s ease;
  transform-origin: center;
}

.directionPadPressed {
  transform: scale(0.96);
}

.fullPtzPad.directionPadPressed {
  transform: translateX(-50%) scale(0.96);
}
.padHit {
  position: absolute;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
}

.padHit:focus,
.padHit:focus-visible {
  outline: none;
}
.padClose {
  left: 2%;
  top: 4%;
  width: 10%;
  height: 20%;
}
.padGoto {
  left: 82%;
  top: 10%;
  width: 14%;
  height: 28%;
}
.padSave {
  left: 82%;
  top: 68%;
  width: 14%;
  height: 26%;
}
.padUp {
  left: 45.5%;
  top: 6%;
  width: 9%;
  height: 25%;
}
.padLeft {
  left: 34.5%;
  top: 32%;
  width: 10%;
  height: 30%;
}
.padRight {
  left: 55.5%;
  top: 32%;
  width: 10%;
  height: 30%;
}
.padDown {
  left: 45.5%;
  top: 66%;
  width: 9%;
  height: 25%;
}

@media (orientation: landscape) {
  .overlay {
    display: none;
  }

  .landscapeLeftControls {
    position: absolute;
    top: 0;
    bottom: 0;
    left: max(env(safe-area-inset-left), var(--wally-safe-left, 0px));
    z-index: 3;
    width: 5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 1.6rem 0 1.3rem;
    box-sizing: border-box;
    pointer-events: auto;
  }

  .landscapeLeftButton {
    width: 2.8rem;
    height: 2.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .landscapeLeftButton:active {
    transform: scale(0.94);
  }

  .landscapeControls {
    position: absolute;
    top: 0;
    right: max(env(safe-area-inset-right), var(--wally-safe-right, 0px));
    bottom: 0;
    z-index: 2;
    display: block;
    width: 6rem;
    height: 100%;
    transform: none;
    overflow: visible;
    pointer-events: none;
  }

  .landscapeControls > * {
    pointer-events: auto;
  }

  .landscapeRefresh {
    position: absolute;
    top: 1.6rem;
    left: calc(50% - 1.4rem);
    width: 2.8rem;
    height: 2.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .landscapeCapture {
    position: absolute;
    top: calc(50% - 1.4rem);
    left: calc(50% - 5.6rem);
    width: 2.8rem;
    height: 2.8rem;
  }

  .landscapeCapture img {
    width: 100%;
    height: 100%;
    display: block;
  }

  .landscapeCapture,
  .fullCaptureBtn {
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    -webkit-touch-callout: none;
    appearance: none;
    background-color: transparent;
    outline: none;
    user-select: none;
    touch-action: manipulation;
  }

  .landscapeCapture:hover,
  .landscapeCapture:focus,
  .landscapeCapture:focus-visible,
  .landscapeCapture:active,
  .fullCaptureBtn:hover,
  .fullCaptureBtn:focus,
  .fullCaptureBtn:focus-visible,
  .fullCaptureBtn:active {
    background-color: transparent;
    outline: none;
    transform: none;
  }

  .landscapeCameraToggle {
    position: absolute;
    top: 50%;
    left: calc(50% - 1.3rem);
    width: 2.6rem;
    height: 4.8rem;
    transform: translateY(-50%);
  }


  .cameraToggleTrack {
    position: absolute;
    inset: 0;
    border-radius: 1.5rem;
    background-color: #eee8de;
    overflow: hidden;
  }

  .cameraToggleThumb {
    position: absolute;
    left: 0.2rem;
    top: 2.4rem;
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 50%;
    background-color: #fffbf5;
    box-shadow: 0 0.08rem 0.25rem rgba(0, 0, 0, 0.08);
    transition: top 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .toggleOn .cameraToggleThumb {
    top: 0.2rem;
  }

  .cameraToggleIcon {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
    transition: opacity 0.18s ease;
  }

  .iconHidden {
    opacity: 0;
  }

  .landscapePtzWrap {
    position: absolute;
    bottom: 1.3rem;
    left: calc(50% - 1.4rem);
    width: 2.8rem;
    height: 2.8rem;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-sizing: border-box;
  }

  .landscapePtzButton {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
.iconBtn {
  cursor: pointer;
  width: 2rem;
  height: 2rem;
  border-radius: 999rem;
  background-color: rgba(0, 0, 0, 0.22);
  border: 0.06rem solid rgba(255, 251, 245, 0.14);
  box-shadow: 0 0.25rem 0.8rem rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(0.45rem);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease,
    border-color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.iconBtn:hover {
  background-color: rgba(255, 159, 112, 0.18);
  border-color: rgba(255, 176, 133, 0.28);
}
.iconBtn:active {
  transform: scale(0.94);
}
.soundToggleButton {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  -webkit-touch-callout: none;
  appearance: none;
  background-color: transparent;
  outline: none;
  user-select: none;
  touch-action: manipulation;
}
.soundToggleButton:hover,
.soundToggleButton:focus,
.soundToggleButton:focus-visible,
.soundToggleButton:active {
  background-color: transparent;
  outline: none;
  transform: none;
}
.soundIcon {
  width: 2rem;
  height: 2rem;
  display: block;
  flex-shrink: 0;
}
@media (orientation: landscape) {
  .videoImg {
    width: calc(
      100% - max(env(safe-area-inset-left), var(--wally-safe-left, 0px)) -
      max(env(safe-area-inset-right), var(--wally-safe-right, 0px))
    );
    margin-left: max(env(safe-area-inset-left), var(--wally-safe-left, 0px));
    object-fit: contain;
    object-position: center center;
  }

  .overlay {
    right: auto;
    bottom: 1.5rem;
    justify-content: flex-start;
    padding: 0 0 0 1.5rem;
  }

  .statusOverlay {
    top: max(1rem, env(safe-area-inset-top));
    max-width: min(70vw, 32rem);
    font-size: clamp(0.95rem, 2.2vmin, 1.25rem);
  }

  .recordingBadge {
    top: max(1rem, env(safe-area-inset-top));
    left: 50%;
    transform: translateX(-50%);
    min-height: 2.2rem;
    padding: 0.36rem 0.68rem;
    font-size: 1rem;
  }

  .iconBtn {
    width: var(--landscape-overlay-icon-size);
    height: var(--landscape-overlay-icon-size);
  }

  .soundIcon {
    width: var(--landscape-overlay-icon-size);
    height: var(--landscape-overlay-icon-size);
  }
}
.fullscreen button,
.fullscreen button:focus,
.fullscreen button:focus-visible,
.fullscreen button:active,
.fullscreen button:hover {
  outline: none !important;
  box-shadow: none !important;
  background-color: transparent !important;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0) !important;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  appearance: none;
  -webkit-appearance: none;
}
.fullscreen button *,
.fullscreen img,
.fullscreen svg,
.fullscreen span {
  outline: none !important;
  box-shadow: none !important;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0) !important;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
.fullscreen button::-moz-focus-inner {
  border: 0;
}

/* Keep the inline home card in its portrait layout while a failed orientation
   unlock leaves the physical viewport in landscape. */
:global(html.home-force-portrait) .wrapper {
  position: relative;
  inset: auto;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  background-color: var(--home-bg);
  justify-content: center;
  align-items: center;
  container-type: size;
}

:global(html.home-force-portrait) .video {
  position: relative;
  inset: auto;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  aspect-ratio: auto;
  display: block;
  border: 0.08rem solid var(--home-camera-border);
  box-shadow: var(--home-shadow);
}

:global(html.home-force-portrait) .streamFrame {
  width: 100%;
  height: 100%;
  max-height: none;
  aspect-ratio: auto;
}

:global(html.home-force-portrait) .videoImg {
  width: 100%;
  height: 100%;
  margin-left: 0;
  object-fit: cover;
}

:global(html.home-force-portrait) .inlineProtocolSwitch {
  top: 0.65rem;
  right: 0.65rem;
}

:global(html.home-force-portrait) .overlay {
  right: 0;
  bottom: 1rem;
  left: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 1rem;
}

@media (orientation: landscape) {
  :global(html.home-force-portrait) .overlay {
    bottom: 8.2rem;
    z-index: 101;
  }
}
.fullscreen {
  position: fixed;
  inset: 0;
  background-color: #000;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-sizing: border-box;
  cursor: pointer;
}
.fullscreenStage {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: auto;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0;
}
.fullscreenContent {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
}
.fullVideoArea {
  position: relative;
  container-type: size;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.fullStreamFrame {
  position: relative;
  width: min(100%, calc(100cqh * var(--video-aspect-ratio)));
  height: auto;
  max-height: 100%;
  aspect-ratio: var(--video-aspect-ratio);
}
.fullProtocolSwitch {
  top: 0.75rem;
  right: 0.75rem;
  z-index: 6;
}
.fullImg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center center;
  transform: none;
}

:global(html.wally-native) .fullscreen {
  background-color: #000;
  align-items: center;
  padding: 0;
}

:global(html.wally-native) .fullscreenStage {
  width: 100%;
  height: 100%;
  max-height: 100%;
  aspect-ratio: auto;
  overflow: visible;
  border-radius: 0;
}

:global(html.wally-native) .fullImg {
  object-position: center center;
}

:global(html.wally-native) .fullPtzPad {
  bottom: max(16.8rem, calc(env(safe-area-inset-bottom) + 13.4rem));
  width: min(clamp(19rem, 72vw, 26rem), calc(100vw - 1.8rem));
}
.fullLandscapeControls {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: block;
  pointer-events: none;
}
.fullLandscapeControls > * {
  pointer-events: auto;
}
.fullCloseBtn {
  top: 1.6rem;
  left: 2rem;
  width: 2.4rem;
  height: 2.4rem;
}
.fullRefreshBtn {
  top: 1.6rem;
  right: 2rem;
  width: 2.4rem;
  height: 2.4rem;
}
.fullSoundBtn {
  bottom: 2rem;
  left: 2rem;
  width: 3.2rem;
  height: 3.2rem;
}
.fullDirectionBtn {
  right: 2rem;
  bottom: 2rem;
  width: 3.2rem;
  height: 3.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fullCaptureBtn {
  left: 50%;
  bottom: 9.6rem;
  transform: translateX(-50%);
}
.fullCaptureBtn:active {
  transform: translateX(-50%);
}
.fullCameraToggle {
  left: 50%;
  bottom: 2.1rem;
  width: 5.6rem;
  height: 3rem;
  transform: translateX(-50%);
  background: transparent;
}

:global(html.wally-native) .fullCloseBtn {
  top: max(3.6rem, calc(env(safe-area-inset-top) + 1.6rem));
}

:global(html.wally-native) .fullRefreshBtn {
  top: max(3.6rem, calc(env(safe-area-inset-top) + 1.6rem));
}

:global(html.wally-native) .fullSoundBtn,
:global(html.wally-native) .fullDirectionBtn {
  bottom: max(5.4rem, calc(env(safe-area-inset-bottom) + 2rem));
}

:global(html.wally-native) .fullCaptureBtn {
  bottom: max(13rem, calc(env(safe-area-inset-bottom) + 9.6rem));
}

:global(html.wally-native) .fullCameraToggle {
  bottom: max(5.5rem, calc(env(safe-area-inset-bottom) + 2.1rem));
}
.fullCameraToggle .cameraToggleTrack {
  display: block;
  position: absolute;
  inset: 0;
  border-radius: 2rem;
  background-color: #eee8de;
  overflow: hidden;
}
.fullCameraToggle .cameraToggleThumb {
  position: absolute;
  left: 0.2rem;
  top: 0.2rem;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  background-color: #fffbf5;
  box-shadow: 0 0.08rem 0.25rem rgba(0, 0, 0, 0.08);
  transition: left 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
.fullCameraToggle.toggleOn .cameraToggleThumb {
  left: 2.8rem;
}
.fullCameraToggle .cameraToggleIcon {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: none;
  pointer-events: none;
  transform: rotate(90deg);
  transition: opacity 0.18s ease;
}
.fullCameraToggle .cameraToggleIcon:nth-of-type(2) {
  left: 0;
}
.fullCameraToggle .cameraToggleIcon path {
  transform-box: fill-box;
  transform-origin: center;
  transform: rotate(-90deg) scale(1.32);
}
.fullCameraToggle .iconHidden {
  opacity: 0;
}
.fullCameraToggle::after {
  display: block;
  content: "";
  position: absolute;
  left: 1.5rem;
  top: 1.5rem;
  width: 1.8rem;
  height: 1.8rem;
  transform: translate(-50%, -50%);
  background: center / contain no-repeat url("data:image/svg+xml,%3Csvg viewBox=%276 7 18 16%27 fill=%27none%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath fill-rule=%27evenodd%27 clip-rule=%27evenodd%27 d=%27M11.6985 9.36525C11.8987 8.38275 12.7733 7.6875 13.7745 7.6875H16.2255C17.2267 7.6875 18.1005 8.38275 18.3015 9.36525C18.3237 9.47344 18.3816 9.57103 18.4659 9.64231C18.5503 9.7136 18.6561 9.75444 18.7665 9.75825H18.7913C19.8435 9.80475 20.652 9.93375 21.327 10.377C21.7523 10.656 22.1182 11.0145 22.4032 11.4337C22.758 11.9542 22.914 12.5528 22.989 13.2758C23.0625 13.983 23.0625 14.8688 23.0625 15.9908V16.0545C23.0625 17.1765 23.0625 18.063 22.989 18.7695C22.914 19.4925 22.758 20.091 22.4032 20.6122C22.1167 21.0312 21.7511 21.3901 21.327 21.669C20.7998 22.0148 20.1945 22.1677 19.461 22.2405C18.7425 22.3125 17.8417 22.3125 16.6972 22.3125H13.3028C12.1583 22.3125 11.2575 22.3125 10.539 22.2405C9.8055 22.1677 9.20025 22.0155 8.673 21.669C8.24883 21.3899 7.88324 21.0307 7.59675 20.6115C7.242 20.091 7.086 19.4925 7.011 18.7695C6.9375 18.063 6.9375 17.1765 6.9375 16.0545V15.9908C6.9375 14.8688 6.9375 13.983 7.011 13.2758C7.086 12.5528 7.242 11.9542 7.59675 11.4337C7.88324 11.0146 8.24883 10.6553 8.673 10.3763C9.348 9.93375 10.1565 9.80475 11.2088 9.759L11.2215 9.75825H11.2335C11.3439 9.75444 11.4497 9.7136 11.5341 9.64231C11.6184 9.57103 11.6763 9.47344 11.6985 9.36525ZM13.7745 8.8125C13.2945 8.8125 12.8917 9.14475 12.801 9.5895C12.6547 10.3095 12.0157 10.8765 11.247 10.8833C10.236 10.9283 9.6945 11.052 9.2895 11.3175C8.98909 11.5154 8.73003 11.7699 8.52675 12.0667C8.31975 12.3705 8.19525 12.7597 8.12925 13.392C8.06325 14.034 8.0625 14.862 8.0625 16.023C8.0625 17.184 8.0625 18.0113 8.13 18.6532C8.19525 19.2855 8.31975 19.6748 8.5275 19.9792C8.7285 20.2747 8.98725 20.5298 9.29025 20.7285C9.603 20.9333 10.0035 21.057 10.6508 21.1215C11.3063 21.1868 12.1507 21.1875 13.3335 21.1875H16.6665C17.8485 21.1875 18.693 21.1875 19.3492 21.1215C19.9965 21.057 20.397 20.934 20.7098 20.7285C21.0128 20.5298 21.2723 20.2748 21.4733 19.9785C21.6803 19.6748 21.8047 19.2855 21.8707 18.6532C21.9367 18.0113 21.9375 17.1833 21.9375 16.023C21.9375 14.8628 21.9375 14.034 21.87 13.392C21.8047 12.7597 21.6802 12.3705 21.4725 12.0667C21.2693 11.7696 21.0102 11.5149 20.7098 11.3168C20.3063 11.052 19.7648 10.9283 18.7523 10.8833C17.9843 10.8758 17.3453 10.3102 17.199 9.5895C17.151 9.3677 17.0279 9.16927 16.8506 9.02771C16.6732 8.88614 16.4524 8.81013 16.2255 8.8125H13.7745ZM15 14.0625C14.5524 14.0625 14.1232 14.2403 13.8068 14.5568C13.4903 14.8732 13.3125 15.3024 13.3125 15.75C13.3125 16.1976 13.4903 16.6268 13.8068 16.9432C14.1232 17.2597 14.5524 17.4375 15 17.4375C15.4476 17.4375 15.8768 17.2597 16.1932 16.9432C16.5097 16.6268 16.6875 16.1976 16.6875 15.75C16.6875 15.3024 16.5097 14.8732 16.1932 14.5568C15.8768 14.2403 15.4476 14.0625 15 14.0625ZM12.1875 15.75C12.1875 15.0041 12.4838 14.2887 13.0113 13.7613C13.5387 13.2338 14.2541 12.9375 15 12.9375C15.7459 12.9375 16.4613 13.2338 16.9887 13.7613C17.5162 14.2887 17.8125 15.0041 17.8125 15.75C17.8125 16.4959 17.5162 17.2113 16.9887 17.7387C16.4613 18.2662 15.7459 18.5625 15 18.5625C14.2541 18.5625 13.5387 18.2662 13.0113 17.7387C12.4838 17.2113 12.1875 16.4959 12.1875 15.75ZM18.9375 13.5C18.9375 13.3508 18.9968 13.2077 19.1023 13.1023C19.2077 12.9968 19.3508 12.9375 19.5 12.9375H20.25C20.3992 12.9375 20.5423 12.9968 20.6477 13.1023C20.7532 13.2077 20.8125 13.3508 20.8125 13.5C20.8125 13.6492 20.7532 13.7923 20.6477 13.8977C20.5423 14.0032 20.3992 14.0625 20.25 14.0625H19.5C19.3508 14.0625 19.2077 14.0032 19.1023 13.8977C18.9968 13.7923 18.9375 13.6492 18.9375 13.5Z%27 fill=%27%2384776E%27/%3E%3C/svg%3E");
  pointer-events: none;
  transition: left 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.fullCameraToggle.toggleOn::after {
  left: 4.1rem;
  background-image: url("data:image/svg+xml,%3Csvg viewBox=%2732 7 18 16%27 fill=%27none%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M34.6925 20.6243C34.2947 20.6243 33.9131 20.4662 33.6318 20.1849C33.3505 19.9036 33.1925 19.5221 33.1925 19.1243V10.8765C33.1925 10.4787 33.3505 10.0972 33.6318 9.81587C33.9131 9.53456 34.2947 9.37653 34.6925 9.37653H43.1008C43.2977 9.37653 43.4928 9.41532 43.6748 9.49071C43.8568 9.56609 44.0221 9.67658 44.1614 9.81587C44.3007 9.95515 44.4112 10.1205 44.4866 10.3025C44.562 10.4845 44.6008 10.6795 44.6008 10.8765V19.1243C44.6008 19.5221 44.4427 19.9036 44.1614 20.1849C43.8801 20.4662 43.4986 20.6243 43.1008 20.6243H34.6925ZM44.9908 16.8758C44.8727 16.8112 44.7742 16.7161 44.7056 16.6003C44.637 16.4846 44.6008 16.3526 44.6008 16.218V13.7828C44.6008 13.6482 44.637 13.5162 44.7056 13.4005C44.7742 13.2847 44.8727 13.1896 44.9908 13.125L47.6968 11.643C47.811 11.5805 47.9395 11.5489 48.0696 11.5511C48.1998 11.5533 48.3271 11.5894 48.4391 11.6558C48.5511 11.7221 48.6439 11.8165 48.7083 11.9296C48.7728 12.0427 48.8067 12.1706 48.8068 12.3008V17.7008C48.8066 17.8309 48.7726 17.9587 48.7081 18.0717C48.6435 18.1847 48.5507 18.279 48.4388 18.3452C48.3268 18.4115 48.1995 18.4475 48.0694 18.4497C47.9393 18.4519 47.8109 18.4202 47.6968 18.3578L44.9908 16.8758Z%27 stroke=%27%2384776E%27 stroke-width=%271.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3Cpath d=%27M41.372 15.7433C41.1637 16.2269 40.8183 16.6389 40.3785 16.9284C39.9386 17.2179 39.4236 17.3722 38.897 17.3722C38.3704 17.3722 37.8554 17.2179 37.4155 16.9284C36.9757 16.6389 36.6303 16.2269 36.422 15.7433M36.5683 12.8416C36.5037 12.8464 36.4431 12.8743 36.3973 12.9202C36.3516 12.966 36.3239 13.0267 36.3193 13.0913C36.3193 13.2158 36.4438 13.3403 36.5683 13.3403C36.6328 13.3356 36.6936 13.3079 36.7394 13.2622C36.7852 13.2165 36.8131 13.1559 36.818 13.0913C36.818 12.9661 36.6935 12.8416 36.5683 12.8416ZM41.2265 12.8416C41.162 12.8464 41.1013 12.8743 41.0556 12.9202C41.0099 12.966 40.9822 13.0267 40.9775 13.0913C40.9775 13.2158 41.102 13.3403 41.2265 13.3403C41.2911 13.3356 41.3518 13.3079 41.3977 13.2622C41.4435 13.2165 41.4714 13.1559 41.4763 13.0913C41.4763 12.9661 41.3518 12.8416 41.2265 12.8416Z%27 stroke=%27%2384776E%27 stroke-width=%271.5%27 stroke-miterlimit=%2710%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E");
}

.fullControlBtn,
.fullCaptureBtn,
.fullCameraToggle {
  position: absolute;
  z-index: 4;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.fullCameraToggle {
  background: transparent;
}
.fullCameraToggle.toggleOn {
}
.fullControlBtn,
.fullCaptureBtn,
.fullCameraToggle {
  outline: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  appearance: none;
  user-select: none;
}
.fullControlBtn:focus,
.fullControlBtn:focus-visible,
.fullControlBtn:active,
.fullControlBtn:hover,
.fullRefreshBtn:focus,
.fullRefreshBtn:focus-visible,
.fullRefreshBtn:active,
.fullRefreshBtn:hover,
.fullCaptureBtn:focus,
.fullCaptureBtn:focus-visible,
.fullCameraToggle:focus,
.fullCameraToggle:focus-visible,
.fullCameraToggle:active {
  outline: none;
  box-shadow: none;
  background-color: transparent;
}
.fullControlBtn img,
.fullCaptureBtn img {
  outline: none;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  pointer-events: none;
}
.fullControlBtn:active {
  transform: scale(0.94);
}
.fullControlBtn.soundToggleButton:active {
  transform: none;
}
.fullControlIcon {
  width: 2.4rem;
  height: 2.4rem;
  display: block;
  filter: brightness(0) invert(1);
}
.fullDirectionIcon {
  width: 3.2rem;
  height: 3.2rem;
  display: block;
  filter: brightness(0) invert(1);
}
.fullCaptureBtn {
  width: 3.7rem;
  height: 3.7rem;
}
.fullCaptureBtn img {
  width: 100%;
  height: 100%;
  display: block;
}
.fullCameraToggle {
  width: 5.6rem;
  height: 3rem;
}



@media (orientation: landscape) {
  .fullLandscapeControls {
    position: absolute;
    inset: 0;
    z-index: 4;
    display: block;
    pointer-events: none;
  }

  .fullLandscapeControls > * {
    pointer-events: auto;
  }

  .fullCloseBtn {
    top: 2.2rem;
    left: max(1.2rem, env(safe-area-inset-left), var(--wally-safe-left, 0px));
  }

  .fullSoundBtn {
    bottom: 1.6rem;
    left: max(1.2rem, env(safe-area-inset-left), var(--wally-safe-left, 0px));
  }

  .fullRefreshBtn {
    top: 2.2rem;
    right: max(1.2rem, env(safe-area-inset-right), var(--wally-safe-right, 0px));
  }

  .fullCaptureBtn {
    top: 50%;
    right: calc(max(env(safe-area-inset-right), var(--wally-safe-right, 0px)) + 6.5rem);
    transform: translateY(-50%);
  }

  .fullCaptureBtn:active {
    transform: translateY(-50%);
  }

  .fullCameraToggle {
    top: 50%;
    right: max(1rem, env(safe-area-inset-right), var(--wally-safe-right, 0px));
    width: 3rem;
    height: 5.6rem;
    transform: translateY(-50%);
    background: transparent;
  }

  .fullCameraToggle .cameraToggleTrack {
    display: block;
    border-radius: 1.5rem;
  }

  .fullCameraToggle .cameraToggleThumb {
    left: 0.2rem;
    top: 2.8rem;
    transition: top 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .fullCameraToggle.toggleOn .cameraToggleThumb {
    left: 0.2rem;
    top: 0.2rem;
  }

  .fullCameraToggle .cameraToggleIcon {
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    transform: none;
  }

  .fullCameraToggle .cameraToggleIcon path {
    transform: none;
  }

  .fullCameraToggle::after {
    display: none;
  }

  .fullCameraToggle .cameraToggleIcon:nth-of-type(2) {
    left: 0;
  }


  .fullDirectionBtn {
    right: max(1.8rem, env(safe-area-inset-right), var(--wally-safe-right, 0px));
    bottom: 2rem;
    width: 2.4rem;
    height: 2.4rem;
    border: 0.18rem solid #00dc6a;
    border-radius: 0.35rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.16);
  }

  .fullscreenContent {
    width: 100%;
    height: 100%;
  }

  .fullVideoArea {
    position: absolute;
    top: 0;
    right: max(env(safe-area-inset-right), var(--wally-safe-right, 0px));
    bottom: 0;
    left: max(env(safe-area-inset-left), var(--wally-safe-left, 0px));
  }

  .fullImg {
    object-fit: contain;
    object-position: center center;
  }
}

@container (min-aspect-ratio: 1 / 1) {
  .fullStreamFrame {
    position: relative;
    display: block;
    width: min(100%, calc(100cqh * var(--video-aspect-ratio)));
    aspect-ratio: var(--video-aspect-ratio);
    max-height: 100%;
    transform: none;
  }

  .fullStreamFrame > .fullImg {
    width: 100%;
    height: 100%;
    transform: none;
  }

  .fullStreamFrame > .fullProtocolSwitch {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    left: auto;
    transform: none;
    z-index: 4;
  }
}

@media (orientation: landscape) and (min-width: 56.25rem) and (min-height: 37.5rem) {
  .wrapper {
    --landscape-overlay-icon-size: var(--landscape-overlay-icon-size-tablet);
  }
}
</style>

<style>
.fullscreenNoHighlight,
.fullscreenNoHighlight *,
.fullscreenNoHighlight button,
.fullscreenNoHighlight button *,
.fullscreenNoHighlight img,
.fullscreenNoHighlight svg {
  -webkit-tap-highlight-color: transparent !important;
  -webkit-touch-callout: none !important;
  -webkit-user-select: none !important;
  user-select: none !important;
  outline: none !important;
  box-shadow: none !important;
}
.fullscreenNoHighlight button,
.fullscreenNoHighlight button:focus,
.fullscreenNoHighlight button:focus-visible,
.fullscreenNoHighlight button:active,
.fullscreenNoHighlight button:hover {
  appearance: none !important;
  -webkit-appearance: none !important;
  background: transparent !important;
  outline: none !important;
  box-shadow: none !important;
}
.fullscreenNoHighlight button::-moz-focus-inner {
  border: 0 !important;
}

.fullscreenNoHighlight button.streamRetryButton,
.fullscreenNoHighlight button.streamRetryButton:focus,
.fullscreenNoHighlight button.streamRetryButton:focus-visible,
.fullscreenNoHighlight button.streamRetryButton:active,
.fullscreenNoHighlight button.streamRetryButton:hover {
  background: var(--home-panel-bg) !important;
  color: var(--home-text) !important;
  border: 0.06rem solid var(--home-panel-border) !important;
}

[data-debug-id='full-protocol-switch'][data-protocol='hls'] {
  background-color: var(--home-protocol-bg) !important;
}

[data-debug-id='full-protocol-switch'][data-protocol='hls'] > button {
  color: var(--home-protocol-text) !important;
  background-color: transparent !important;
}

[data-debug-id='full-protocol-switch'][data-protocol='hls'] > button:first-child {
  color: var(--home-protocol-active-text) !important;
  background-color: transparent !important;
}

[data-debug-id='full-protocol-switch'][data-protocol='webrtc'] {
  background-color: var(--home-protocol-bg) !important;
}

[data-debug-id='full-protocol-switch'][data-protocol='webrtc'] > button {
  color: var(--home-protocol-text) !important;
  background-color: transparent !important;
}

[data-debug-id='full-protocol-switch'][data-protocol='webrtc'] > button:last-child {
  color: var(--home-protocol-active-text) !important;
  background-color: transparent !important;
}

</style>
