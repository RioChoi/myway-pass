# 내 방식 QR 접근성 프로필 패스

GitHub용 소스 저장소입니다. API 키·로컬 DB·서명키·빌드 캐시·APK·개인 제출 문서와 이전 시연 서버 Git 이력은 포함하지 않습니다. `.env.example`을 복사해 각자의 서버 키를 설정하세요. `.openai/hosting.json`의 프로젝트 식별자는 비밀키가 아니며 기존 시연의 설정입니다. 다른 Sites 프로젝트로 배포할 때는 본인의 프로젝트 설정으로 바꾸세요. APK는 시연 사이트에서 별도로 배포합니다.

Android 1.3은 입력 검증·HTTPS 연결·오픈소스 고지를 보완한 버전입니다. 기존 앱에는 업데이트가 필요합니다. 글씨 크기 추천 수정도 유지합니다. [보안 점검](docs/security-audit-2026-10-22.md), [글씨 크기 추천 검증](docs/font-recommendation-fix.md).

휴대전화에서 기능 요구만 저장하고 병원·카페 키오스크에 재사용하는 MVP입니다. 기존 시제품과 별도로 구현했습니다. 실손보험 청구·주문은 가상 데이터이며 실제 보험사 전송이나 결제를 수행하지 않습니다.

## 키오스크 개선 v2

- 병원: `/hospital` — 가상 환자 확인 → 보험계약 → 진료 선택 → 청구서 → 서류 → 동의·전송 → 완료.
- 카페: `/cafe` — 메뉴·옵션·다품목 장바구니 → 매장/포장 → 포인트 → 결제수단 → 가상 승인 → 완료.
- 휴대전화 프로필: `/profile`. QR 형식은 이전 버전과 호환된다.
- 비교·기록·업무 JSON: `/verification`. 일반 이용 화면에서는 개발·평가 기능을 표시하지 않는다.
- 기존 랜딩은 제거하고 `/`는 병원으로 이동한다. 기존 `/kiosk?sector=...`도 새 경로로 연결한다.
- 상세 구조·가정·자료·검증 경계는 [개선 v2 문서](docs/kiosk-v2.md)를 참고한다.
- 포인트에는 테스트 번호 01000000000을 사용한다. 원문 번호는 서버로 보내거나 저장하지 않는다.
- 이용 종료·3분 미사용 시 키오스크 프로필과 업무 상태를 지운다. 익명 검증 기록은 브라우저에 유지한다.

## 로컬 실행

Node.js 24, npm, Android 빌드에는 Java 21과 Android SDK 36이 필요합니다. 새 PC에서는 `.env.example`을 `.env.local`로 복사한 뒤 서버 키를 넣습니다. 키는 채팅·소스·APK에 넣지 않습니다.

```powershell
npm ci
node scripts/dev-local.mjs
```

브라우저에서 `http://localhost:4173`으로 접속합니다. Windows용 Workers 실행기의 충돌을 피해 로컬에서는 Node SQLite 어댑터를 사용합니다. 생성된 `drizzle/*.sql`을 로컬 DB에 순서대로 적용하며 배포판은 D1을 사용합니다. 로컬 데이터는 `.sites-runtime/local.sqlite`에 있습니다.

개발 서버는 PC 내부의 `127.0.0.1`에만 연결됩니다. 휴대전화·태블릿에서는 공개 HTTPS 시연 주소를 사용하세요. 개발용 웹 경로 `/profile?settings=1`에서 신뢰할 수 있는 HTTPS 서버 주소를 설정할 수 있습니다. 카메라·음성 기능 미지원 시 연결번호·텍스트 입력을 사용합니다.

## Android

```powershell
npx vite build --config mobile.vite.config.ts
npx cap sync android
# JAVA_HOME을 Java 21, ANDROID_HOME을 설치된 SDK 경로로 설정
cd android
.\gradlew.bat assembleDebug
```

APK는 `android/app/build/outputs/apk/debug/app-debug.apk`에 생성됩니다. 제공하는 APK는 개발 시연용 디버그 서명본입니다. 스토어 출시용 서명본은 별도입니다. 설치 후 서버 설정을 확인하세요. 앱은 기본적으로 새 공개 시연 서버를 사용하며 다른 서버 주소를 저장할 수 있습니다.

음성 입력은 Android 인식 서비스에 오프라인 인식을 우선 요청합니다. 실제 오프라인 가능 여부와 지원 언어는 설치된 음성 인식 서비스에 달려 있습니다. 미지원·권한 거부 시 텍스트 입력을 제공합니다. 음성 내용은 앱에서 녹음 파일로 저장하지 않습니다. 인식 서비스가 네트워크를 사용할 수 있습니다.

보안 점검 후 Android 앱은 디버그·릴리스 모두 HTTPS 서버만 허용합니다. 로컬 HTTP 개발은 PC 브라우저에서 실행하세요.

Windows Gradle 8.14.3에서 변환 캐시 디렉터리 이동 버그를 관찰했습니다. 완료된 변환 캐시를 정상 위치로 복사한 뒤 빌드가 통과했습니다. 보안 프로그램을 끄거나 예외를 추가하지 않았습니다. [Gradle 공식 이슈](https://github.com/gradle/gradle/issues/38921).

## AI와 검증 경계

- Jev: 자연어에서 기능별 Noul 점수를 받아 0.75 이상을 추천합니다. 사용자 확인 전 설정을 저장하지 않습니다. 점수는 검증된 진단 확률이 아닙니다.
- OpenAI Responses API: 확정 프로필·화면 크기·원본 화면 정의를 전송합니다. JSON Schema Structured Outputs를 이용하고 다시 Zod·필수 동작 집합·금지 문구를 검증합니다.
- AI는 업무별 일곱 화면의 제목·안내·grid/list/step 틀을 제안합니다. 버튼 문구는 검수된 일반/쉬운 문구만 허용하고 상품명·금액·문서명·실행 함수는 프로그램에서 고정합니다. 생성 HTML을 실행하지 않습니다.
- 같은 세션에서 구성안을 고정합니다. 18초 지연·서버 오류·거절·검증 실패 시 검수된 규칙 구성으로 전환합니다. 외부 API 자동 재시도는 없습니다.
- 전체 API 호출은 기본 **100회** 제한이며 D1/로컬 DB에서 원자적으로 증가합니다. 성공·실패 시도 모두 포함합니다. 이는 통화 단위 청구 상한 기능이 아닙니다. 금액 상한은 각 제공사 결제 설정에서도 관리해야 합니다.
- 연결번호는 프로필 전달 수단입니다. 본인인증·병원 예약 조회·실제 POS 연동 기능을 의미하지 않습니다.
- 업무 전달 JSON은 공급업체 중립의 `myway.handoff.v2` 시연 포맷입니다. 실제 포스기·EMR 프로토콜에 대한 검증은 하지 않았습니다.

## 테스트와 기록

```powershell
node --test tests/domain.test.ts
node --test tests/ai-failure.test.mjs
node tests/kiosk-integration.mjs
# 실제 유료 API: Jev 1회 + OpenAI 2회
node tests/kiosk-integration.mjs --live
npx tsc --noEmit
npm run build
```

`deliverables/integration-results.json`은 실제 로컬 API 검증 결과입니다. `deliverables/검증결과.md`는 수행한 것과 미수행 항목을 구분합니다. 실제 이용자 완료시간·오류·도움 요청 개선 효과는 아직 측정하지 않았습니다. 키오스크의 검증 기록에서 익명 시연 데이터를 내려받을 수 있습니다.

## 배포

Sites용 Vinext Worker 빌드와 D1 마이그레이션을 제공합니다. `.openai/hosting.json`의 기존 프로젝트 ID를 보존합니다. 서버 환경 변수 `OPENAI_API_KEY`, `TYPESAFE_API_KEY`는 호스팅의 **secret**으로 설정해야 합니다. `.env.local`은 자동으로 배포되지 않습니다. 서버만 키를 읽고 클라이언트에는 전달하지 않습니다. `AI_ENABLED=false`이면 모든 AI 호출을 차단합니다.

API는 같은 웹 출처 및 Android의 `https://localhost`에서 허용됩니다. 다른 프로필 웹 출처를 사용할 때만 서버의 `MOBILE_ORIGIN`을 정확한 origin으로 설정하세요. QR에 이름·진단명·예약정보는 허용되지 않습니다.

## 보안·라이선스 점검

`scripts/security-audit.py`는 현재 파일·Git 이력·APK·소스 ZIP의 비밀정보 패턴을 검사하며, 발견 내용 자체는 출력하지 않습니다. 빌드 후 `node scripts/check-secrets.mjs`로 알려진 키가 번들에 포함되지 않았는지도 검사합니다. `.env.local`, 인증서·서명키·로컬 DB는 Git에 올리지 않습니다.

`python scripts/generate-notices.py`로 설치된 의존성의 고지를 갱신합니다. `THIRD_PARTY_NOTICES.txt`와 앱의 ‘오픈소스 라이선스’에서 확인할 수 있습니다. 목록에는 빌드 도구도 포함됩니다. `deliverables/license-inventory.json`의 수동 검토 항목, MPL/LGPL 등 배포 조건, API 서비스 약관과 디자인·메뉴 이미지 권리는 상용 배포 전에 별도 확인해야 합니다. 이 목록은 상용 사용 전체에 대한 법률 검토 완료를 뜻하지 않습니다.

익명 시연 API는 호출 횟수 제한을 적용하지만 인증된 서비스는 아닙니다. 실제 운영 전에는 이용자 인증·게이트웨이 보호와 제공사 예산 제한을 추가해야 합니다. 남은 의존성 취약점과 검증 범위는 보안 점검 보고서에 기록합니다.

## 참고 자료

- [Capacitor Android](https://capacitorjs.com/docs/android)
- [Jev API](https://docs.typesafe.ai/introduction/quickstart)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- 제공된 내 방식 QR 제안서와 대회 공식 서식. 성과보고서의 기대효과는 실측 성과와 구분합니다.
