# Cafe Pricing Calculator

카페 운영자가 `현재 비용 구조`, `메뉴 원가`, `목표 순이익`을 바탕으로 메뉴 가격을 빠르게 설계할 수 있게 만든 Next.js 웹앱입니다.

초기 버전 목표는 아래 4가지를 한 화면에서 바로 확인하는 것입니다.

- 월 순수익
- 연 순수익
- 목표 순수익 기준 메뉴별 권장 판매가
- 현재 가격과 비용 구조를 기준으로 한 손익 상태

## 핵심 UX

- `초간단 시작` 카드에서 월/연 기준, 부가세 포함/별도, 템플릿을 먼저 선택
- 좌측은 입력과 단가 관리, 중앙은 손익/권장가 결과로 구성
- `묶음 입력`과 `세부 입력`, `고급 설정 숨기기`를 같이 제공해 초보자와 고급 사용자 모두 대응
- 메뉴 가격을 수정하면 전체 손익과 권장가가 즉시 다시 계산
- 브라우저 `localStorage` 기반 자동 저장 + 현재 설정 저장/불러오기 지원

## 기술 스택

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Vitest

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열면 됩니다.

### AI 분석 연결

`자동 분석` 패널은 기본 규칙 분석으로 먼저 동작하고, OpenAI API 키가 있으면 `GPT 분석 보기` 버튼으로 더 자연스러운 인사이트를 불러올 수 있습니다.

1. 루트에 `.env.local` 파일을 만들고 아래 값을 넣습니다.
2. 개발 서버를 다시 실행합니다.

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-mini
```

- `OPENAI_API_KEY` 는 서버에서만 사용됩니다.
- `OPENAI_MODEL` 은 선택값입니다. 비워두면 `gpt-5-mini` 를 기본 사용합니다.
- 새 앱 기준으로는 더 최신 소형 모델을 쓰고 싶을 때 `gpt-5.4-mini` 로 바꿔도 됩니다.

## 스크립트

```bash
npm run dev
npm run lint
npm run test
npm run build
```

## 정보 구조

### 상단 작업판

- 브랜딩 헤더
- Control Rail
- 답 먼저 요약 바

### 결과 중심 본문

- 3초 퀵셋업
- 메뉴별 가격/권장가 카드
- 대시보드
- 자동 분석
- 전체 손익 구조
- 접히는 상세 설정 트레이

## 데이터 모델 요약

도메인 타입은 `src/lib/types.ts` 에 정리되어 있습니다.

- `AppState`: 전체 앱 상태
- `StoreState`: 단일 매장 손익 입력과 메뉴 구성
- `MenuState`: 메뉴별 가격, 비중, HOT/ICE variant
- `PriceCatalogItem`: 원재료/포장재 단가
- `StoreCalculationResult`, `AppCalculationResult`: 계산 결과

## 계산 로직

계산 엔진은 `src/lib/calculations.ts` 에 있고, UI와 분리된 순수 함수로 구성했습니다.

포함된 계산:

- 메뉴별 직접원가 계산
- 메뉴별 포장원가 계산
- 메뉴별 변동비 계산
- 메뉴별 로스 비용 계산
- 메뉴별 원가율 계산
- 메뉴별 공헌이익 계산
- 월 손익 계산
- 연 손익 계산
- 목표 순이익 기준 권장가 역산
- 부가세 포함가/별도가 자동 변환

### 기본 계산 기준

- VAT는 10% 고정
- 매출은 `선택한 기준값 > 보조 입력값` 우선순위로 월 기준으로 정규화
- 메뉴 판매량은 `매출 x 메뉴 판매 비중 ÷ 현재 판매가` 로 추정
- 목표 권장가는 `현재 메뉴 매출 비중 가중` 방식으로 배분
- 목표 달성 가능 여부는 `권장가 평균 인상폭` 기준으로 판정

## 시드 데이터 정책

시드 데이터는 `src/lib/seeds.ts` 에 있습니다.

- 원재료 기본 금액은 `쿠팡 최저가 가정` 기준
- 실시간 크롤링은 하지 않음
- 기본 메뉴 11종 제공
- 템플릿 4종 제공
  - 기본 카페형
  - 테이크아웃형
  - 중가형
  - 프리미엄형

## 테스트

`tests/calculations.test.ts` 에서 아래 시나리오를 검증합니다.

- 월 기준 기본 손익 계산
- 연매출 기준 환산
- 카테고리 OFF 반영 및 경고
- 목표 순이익 기준 권장가 상승
- 부가세 포함/별도 차이

## 파일 구조

```text
src/
  app/
  components/
    cafe-pricing-app.tsx
    input-tray.tsx
    onboarding-flow.tsx
    results-dashboard.tsx
  lib/
    ai-insights.ts
    app-state.ts
    calculations.ts
    constants.ts
    format.ts
    seeds.ts
    storage.ts
    types.ts
    utils.ts
tests/
  calculations.test.ts
```

## 추후 확장 포인트

- Supabase/Postgres 기반 사용자 계정 및 시나리오 동기화
- POS 데이터 연동으로 실제 판매량/메뉴 구성 자동 반영
- 원재료 단가 관리자 화면과 변경 히스토리
- 메뉴군별 권장 인상 전략
- 매장별 비교 리포트 export
- CSV/엑셀 다운로드
- 팀 협업용 공유 링크

## 배포 메모

이 프로젝트는 Vercel 배포를 기준으로 설계했습니다.

- Next.js 정적/하이브리드 페이지 구조
- 별도 서버나 DB 없이 바로 배포 가능
- 이후 Supabase를 붙여도 프런트 상태 구조를 유지하면서 확장 가능
