# CODEMAP — Flowboard Portfolio (work-archive)

> `src/` 구조 스캔 기록. 편집 전 대상 파일만 빠르게 찾기 위한 문서. 코드 자체가 바뀌면 이 문서도 갱신 필요.

## 스택 & 배포

| 항목 | 값 |
|---|---|
| 프레임워크 | Next.js 16 (Turbopack), React 19 |
| 스타일 | Tailwind v4 설치돼 있으나 실제로는 대부분 inline style 사용 |
| 애니메이션 | framer-motion ^12 |
| 이미지/영상 CDN | Cloudinary (`res.cloudinary.com/doyfzvsly`) |
| 콘텐츠 소스 | Google Sheets → CSV publish (프로젝트 데이터 + About/Site 데이터 2개 탭) |
| 메일 발송 | Resend (`src/app/api/contact/route.ts`) |
| Analytics | `@vercel/analytics` (`app/layout.tsx`) |
| dev 서버 | 포트 **3100** 사용 (3000은 bd2-hub 점유 중이라 충돌 방지 목적, `package.json`의 `dev` 스크립트 자체엔 포트 미고정 — 실행 시 `-p 3100` 필요) |
| 배포 | GitHub `jyvovvo-max/work-archive` → Vercel, production 브랜치 `design-v2.1`, 도메인 `workarchive.kr` |
| 기타 브랜치 | `master`, `design-v2`, `ascii-warp`, `perf-study` (실험용 추정) |

---

## 1. 랜딩 (Landing)

| 파일 | 역할 | 주요 export | 사용처 |
|---|---|---|---|
| `src/app/page.tsx` | 랜딩 페이지 (`/`). 데이터 fetch → Header/HeroSection/WorksGrid/Footer/ContactModal 조립 | `Page` (default) | 라우트 `/` |
| `src/components/v2/HeroSection.tsx` (1341줄) | 랜딩 히어로: 타이틀/서브타이틀/description 애니메이션, 스크롤 인터랙션 | `HeroSection` (default) | `app/page.tsx`에서만 |

## 2. Works 그리드

| 파일 | 상태 | 사용처 |
|---|---|---|
| `src/components/v2/WorksGrid.tsx` | **실사용(프로덕션)** — Selected Works 카드 그리드 | `app/page.tsx`, `app/test-hero-d/page.tsx` |
| `src/components/v2/WorksGridV3.tsx` | **미사용/실험** — import하는 페이지 없음 (dead code) | 없음 |
| `src/components/v2/WorksEditorial.tsx` | **미사용/실험** — import하는 페이지 없음 (dead code) | 없음 |
| `src/components/v2/WorksHScroll.tsx` | **미사용/실험** — 가로 스크롤 그리드 변형, `test-layout` 전용 | `app/test-layout/page.tsx`만 |

## 3. 프로젝트 상세

| 파일 | 역할 | 주요 export | 사용처 |
|---|---|---|---|
| `src/app/project/[id]/page.tsx` | 프로젝트 상세 라우트, id로 fetch 후 ProjectDetailV2에 전달 | `ProjectPage` (default) | 라우트 `/project/[id]` |
| `src/components/v2/ProjectDetailV2.tsx` (711줄) | 상세 페이지 본문: 갤러리, 비디오/GIF 슬롯 렌더링, pairs 레이아웃 | `ProjectDetailV2` (default) | `app/project/[id]/page.tsx`만 |

## 4. About

| 파일 | 역할 | 주요 export | 사용처 |
|---|---|---|---|
| `src/app/about/page.tsx` | About 라우트, Header/AboutSection/AwardsSection/Footer/ContactModal 조립 | `AboutPage` (default) | 라우트 `/about` |
| `src/components/v2/AboutSection.tsx` | 소개 문구, services/experience 리스트 | `AboutSection` (default) | `app/about/page.tsx`만 |
| `src/components/v2/AwardsSection.tsx` | 수상작 하이라이트 섹션 (award 필드 있는 project만 필터) | `AwardsSection` (default) | `app/about/page.tsx`만 |

## 5. Work 목록

| 파일 | 역할 | 주요 export | 사용처 |
|---|---|---|---|
| `src/app/work/page.tsx` (304줄) | 전체 프로젝트 목록/필터 페이지, RetryImg로 썸네일 렌더 | `WorkPage` (default) | 라우트 `/work` |

## 6. 공통 UI (v2)

실제 import 확인 결과, 프로덕션 페이지(landing/about/work/project)는 전부 **v2 계열**만 사용. 레거시 top-level `components/Header.tsx`, `Footer.tsx` 등은 어디서도 import 안 됨.

| 파일 | 역할 | 사용처 |
|---|---|---|
| `src/components/v2/Header.tsx` | 공용 헤더 (KOR pill 등) | page, about, work, project 전부 |
| `src/components/v2/Footer.tsx` | 공용 푸터 (연락처/인스타 등 siteData 기반) | page, about, work (project는 미사용) |
| `src/components/v2/ContactModal.tsx` (350줄) | 연락하기 모달, `/api/contact` 호출 | page, about, work, project |
| `src/components/v2/RetryImg.tsx` | 이미지 로드 실패 시 재시도하는 `<img>` 래퍼 | `app/work/page.tsx`만 |
| `src/components/CustomCursor.tsx` | 커스텀 커서 — **미사용** (레거시, import 0건) | 없음 |
| `src/components/NoiseOverlay.tsx` | 노이즈 텍스처 오버레이 — **미사용** (레거시, import 0건) | 없음 |

## 7. 데이터 레이어

| 파일 | 역할 | 주요 export |
|---|---|---|
| `src/components/v2/dataFetch.ts` (222줄) | Google Sheets CSV 파싱(자체 CSV 파서 포함) → `Project[]`/`SiteData` 변환, Cloudinary URL 조립(`CLD`/`CLD_VIDEO`, 일자별 cache-bust), 실패 시 FALLBACK 반환 | `fetchProjects`, `fetchSiteData`, `FALLBACK_SITE`, `CLD`, `CLD_VIDEO`, `CLD_VER`, `cldImgs` |
| `src/components/v2/types.ts` | 공용 타입 | `Project`, `SiteData`, `Lang` |
| `src/components/v2/layout.ts` | 레이아웃/타이포 상수 (clamp 기반 spacing·font size, 그리드 컬럼 수 등) | `GUTTER`, `GRID_GAP`, `GRID_COLS`, `SPACE_A~D`, `FONT_*`, `RIGHT_OPT_*` |

데이터 흐름: Google Sheet(프로젝트 탭 gid=0, About/Site 탭 gid=444601329) → publish CSV → `fetchProjects`/`fetchSiteData`가 매 요청마다 `cache: "no-store"`로 재조회 → 실패 시 `FALLBACK_PROJECTS`/`FALLBACK_SITE`(코드에 하드코딩된 최소 데이터).

## 8. 실험 페이지 (test-*)

| 라우트 | 한 줄 설명 |
|---|---|
| `src/app/test-hero-a/page.tsx` | 히어로 시안 A — 마우스 트래킹 기반 모션 실험 |
| `src/app/test-hero-b/page.tsx` (276줄) | 히어로 시안 B — 다른 스크롤/트랜지션 실험 |
| `src/app/test-hero-c/page.tsx` (220줄) | 히어로 시안 C |
| `src/app/test-hero-d/page.tsx` (374줄) | **신규, 작업 중** — "공간감" 히어로 시안. 실제 데이터(fetchProjects/fetchSiteData) + WorksGrid까지 붙여서 실제 페이지처럼 테스트 중 |
| `src/app/test-layout/page.tsx` | WorksHScroll(가로 스크롤 그리드) 레이아웃 실험용 |
| `src/app/test-particle/page.tsx` (240줄) | 파티클 애니메이션 실험 |

## 9. 레거시 v1 (top-level `src/components/`)

grep으로 전체 `src/` 확인 — **아래 4개 파일 모두 어디서도 import되지 않음 (완전 dead code)**. 삭제 후보.

| 파일 | 비고 |
|---|---|
| `src/components/ArchiveGallery.tsx` (1013줄) | v1 아카이브 갤러리, `Project` 인터페이스 자체 정의(v2/types.ts와 별개 중복) |
| `src/components/ProjectDetail.tsx` (574줄) | v1 프로젝트 상세 모달 |
| `src/components/Header.tsx` | v1 헤더 (12줄 수준의 단순 컴포넌트) |
| `src/components/Footer.tsx` | v1 푸터 |

## 10. 기타

| 파일 | 역할 |
|---|---|
| `src/app/api/contact/route.ts` | Resend 기반 컨택 폼 API. env: `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`(옵션) |
| `src/app/globals.css` | 전역 스타일 (46줄, 소량 — 대부분 스타일은 컴포넌트 inline) |
| `src/app/layout.tsx` | Root layout — 폰트(JetBrains Mono, Noto Sans KR) preconnect, `@vercel/analytics` 삽입 |
| `tools/upload.js` (+ `upload.bat`) | 로컬 `portfolio-images/` 폴더 → Cloudinary 업로드 + Google Sheets 반영 자동화 스크립트. `--dry-run`, 특정 프로젝트만, `--reorder` 옵션 지원 |
| `src/app/contact/page.tsx` | **플레이스홀더 페이지** — Next.js 기본 템플릿 잔여물 수준(`hello@example.com` 하드코딩), 실제 연락은 ContactModal이 담당하므로 사실상 미사용 라우트 |

---

### 요약 메모

- 프로덕션 4대 페이지(`/`, `/about`, `/work`, `/project/[id]`)는 전부 `components/v2/*`만 사용. top-level `components/*` (레거시 v1: ArchiveGallery, ProjectDetail, Header, Footer, CustomCursor, NoiseOverlay)는 **전량 dead code**.
- `WorksGridV3`, `WorksEditorial`도 실사용 페이지 없음 — WorksGrid 계열 실험 잔해.
- `app/contact/page.tsx`는 템플릿 잔여물, 실질 연락 기능은 `ContactModal` + `/api/contact`.
