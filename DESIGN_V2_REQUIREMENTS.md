# Design V2 — Requirements Checklist

## Core Concept
딥필드 컨셉 없음. 블랙&오프화이트 베이스. JetBrains Mono Light 300 + Noto Sans KR.

---

## 14가지 항목

### 1. 타이포그래피 적극 활용
- 히어로: 거대한 "Work Archive" 텍스트가 화면의 주요 시각 요소
- 레퍼런스처럼 타이틀이 화면 상단을 꽉 채우는 크기 (clamp 80px ~ 18vw ~ 220px)
- 카드들이 타이포그래피 위에 레이어드 되는 콜라주 느낌
- **STATUS: 🔧 수정 필요** — 타이틀 크기 더 키우고, 카드가 텍스트 위로 오도록

### 2. 타이포그래피 위에 프로젝트 랜덤 배치
- selected 작업 커버 이미지를 히어로 전체에 랜덤 산개
- 카드가 텍스트와 겹치는 콜라주 레이아웃
- 다양한 크기, 회전 각도
- **STATUS: 🔧 수정 필요** — 카드 위치가 텍스트와 겹치도록 재배치

### 3. 플로우카드(coverflow) 없음
- V1의 QueueCard, WarpTunnel 등 딥필드 요소 완전 제거
- **STATUS: ✅ 완료**

### 4. 이미지 드래그 자유 이동 (놓은 자리 유지)
- Framer Motion drag, dragMomentum: false
- 드래그 시 파란 테두리 강조 (accent: #0524FF)
- 놓으면 그 위치에 고정
- **STATUS: ✅ 완료**

### 5. 셀렉티드 워크만 표시 + 구글시트 칼럼
- 구글시트 Sheet 1에 `selected` 컬럼 추가 (TRUE/FALSE)
- 히어로 드래그 카드: selected=TRUE만
- 메인 그리드: selected=TRUE만
- View all: 전체 프로젝트
- **STATUS: ✅ 코드 완료** — 시트에 `selected` 컬럼 직접 추가 필요

### 6. About: 클릭 시 스크롤 다운 후 About 섹션 노출
- 레이아웃 참고: label(About) | Bio + Services + Experience
- 헤더 About 버튼 → smooth scroll
- **STATUS: ✅ 완료**

### 7. 스크롤 내리면 최근 작업 그리드
- 최신순 정렬 (year/month 기준 역순)
- 웹: 3열 / 태블릿(≤1024px): 2열 / 모바일(≤640px): 1열
- 이미지 자연 비율로 풀 컬럼 너비 사용
- **STATUS: 🔧 확인 필요** — 최신순 정렬 명시적으로 적용 필요

### 8. 프로젝트 디테일 — 풀 와이드
- 커버 이미지: 전체 너비 (max-width 제한 없음)
- 그다음 타이틀 + 설명 순서
- 좌우 여백 최소화
- **STATUS: ✅ 완료**

### 9. 프로젝트 디테일 하단 네비 — 루프 구조
- 스크롤 끝에서 다음 프로젝트로 전환
- 분할 화면 Prev(좌) / Next(우)
- 마지막 ↔ 첫번째 루프 연결
- **STATUS: ✅ 완료**

### 10. 푸터
- "We would love to hear from you!" + 흰 점
- 3열: Visit(Korea) / Say hello(이메일) / Follow us(인스타)
- 하단: Jinyoung Hwang. + KOR, 실시간 시각
- **STATUS: ✅ 완료**

### 11. 폰트
- 영문: JetBrains Mono Light 300
- 한글 본문: Noto Sans KR 300
- **STATUS: ✅ 완료**

### 12. 컬러 시스템
- 베이스: #0A0A0A (블랙) / #F0EDE8 (오프화이트)
- 강조색: #0524FF (블루) — 활성화/드래그 등 미니멀하게
- Secondary: #646ED0, Tertiary: #A60800 (필요 시)
- **STATUS: ✅ 완료**

### 13. 애니메이션 시스템
- 모든 이미지: 블러→클린 (blur(14px)→blur(0px))
- 본문 텍스트: 스크롤 진입 시 뒤집히며 등장 (rotateX 또는 Y flip)
- 헤더: 마우스 상단 접근 시 위→아래 슬라이드 (프로스티드 글라스)
- 모바일: 헤더 항상 표시
- **STATUS: ✅ 완료**

### 13-2. 헤더 타이틀 구조
- 큰 타이틀: **Work Archive**
- 작게: **2015–Present**
- 설명: "Hello, Jinyoung Hwang here. I am a brand designer at the SHINSEGAE Brand Design Team. This archive records my work at SHINSEGAE, covering a broad spectrum from branding and packaging to signage, visual direction, and seasonal campaigns."
- 카테고리 필터: `_All _Branding _Campaign ...` (언더바 prefix)
- **STATUS: ✅ 완료**

### 14. About 뼈대 + 구글시트 연동
- 구글시트 Sheet 2 (key-value 구조):
  - `landing_title`, `landing_subtitle`, `landing_description`
  - `about_bio` (파이프 | 로 문단 구분)
  - `services` (콤마 구분)
  - `experience` (콤마 구분)
- **STATUS: ✅ 코드 완료** — Sheet 2 GID 교체 필요

---

## 헤더 (6번 추가 항목)
- 데스크탑: 마우스 상단 72px 이내 → 프로스티드 글라스 바 슬라이드다운
  - 내용: `Jinyoung Hwang` (좌) / `View all` `About` `Contact` (우)
- View all: 전체 작업 마소니 그리드 오버레이 (딥필드 그리드 모드 참고)
- 모바일: 항상 표시
- **STATUS: ✅ 완료**

---

## 구글시트 작업 목록 (수동 필요)

### Sheet 1 (기존 projects 시트)에 추가
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `selected` | TRUE/FALSE | 히어로+메인그리드 노출 여부 |

### Sheet 2 신규 생성 (about/landing 데이터)
| key | value |
|-----|-------|
| landing_title | Work Archive |
| landing_subtitle | 2015–Present |
| landing_description | Hello, Jinyoung Hwang here... |
| about_bio | 문단1\|문단2 (파이프 구분) |
| services | Brand Identity,Art Direction,... |
| experience | Luxury & Retail,Fashion & Beauty,... |

Sheet 2 생성 후 `dataFetch.ts`의 `ABOUT_CSV` URL에서 `REPLACE_WITH_ABOUT_GID`를 실제 GID로 교체.

---

## 파일 구조
```
src/
  app/
    page.tsx          ← 메인 오케스트레이터
    layout.tsx        ← JetBrains Mono + Noto Sans KR 폰트
    globals.css       ← 스크롤 허용, 베이스 컬러
  components/v2/
    types.ts          ← Project, SiteData 타입
    dataFetch.ts      ← CSV 파싱, Cloudinary URL, fetchProjects, fetchSiteData
    Header.tsx        ← 호버 슬라이드다운 헤더
    HeroSection.tsx   ← 거대 타이포 + 드래그 카드 + 카테고리 필터
    WorksGrid.tsx     ← 반응형 3/2/1 그리드
    AboutSection.tsx  ← Bio + Services + Experience
    ProjectDetailV2.tsx ← 풀와이드 디테일 + 루프 네비
    GridViewOverlay.tsx ← View all 오버레이
    Footer.tsx        ← 연락처 + 실시간 시각
```
