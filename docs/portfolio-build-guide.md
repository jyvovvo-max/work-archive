# 포트폴리오 만들기 — 처음부터 배포까지

> Deep Field 포트폴리오 사이트를 만든 전 과정 기록. 학습용 / 공유용.
>
> 스택: **Next.js 16 (App Router, Turbopack) + TypeScript + Framer Motion + Tailwind CSS v4**
> 호스팅: **Vercel (자동 배포)**
> 데이터: **Google Sheets (CMS) + Cloudinary (이미지/비디오)**
> 메일: **Resend (Next.js API Route)**

---

## 목차

1. [왜 이 스택인가](#1-왜-이-스택인가)
2. [초기 세팅 — Next.js + Git + Vercel](#2-초기-세팅--nextjs--git--vercel)
3. [콘텐츠 관리 — Google Sheets + Cloudinary](#3-콘텐츠-관리--google-sheets--cloudinary)
4. [비디오 슬롯 시스템의 진화](#4-비디오-슬롯-시스템의-진화)
5. [Contact 폼 — Resend + API Route](#5-contact-폼--resend--api-route)
6. [커스텀 도메인 설정](#6-커스텀-도메인-설정)
7. [트러블슈팅 기록](#7-트러블슈팅-기록)
8. [배운 점과 앞으로](#8-배운-점과-앞으로)

---

## 1. 왜 이 스택인가

### Next.js를 선택한 이유

- **React 기반**이라 생태계가 크고, 컴포넌트 재사용이 자연스럽다
- **App Router**로 라우팅이 파일 기반이라 직관적 (`app/project/[id]/page.tsx` → `/project/123` URL 자동 생성)
- **Turbopack**이 개발 서버 속도가 빠르다 (HMR 체감 빠름)
- 정적 페이지 + API Route를 한 프로젝트에서 같이 돌릴 수 있다 (Contact 폼 같은 건 API Route로)

### Vercel을 선택한 이유

- Next.js를 만든 회사라 통합이 가장 매끄럽다
- GitHub 연결하면 **push할 때마다 자동 배포**
- 브랜치마다 **preview URL**이 자동 생성돼서 실험하기 좋다
- 개인 포트폴리오 수준은 **무료 Hobby 플랜**으로 충분
- 환경변수 관리 UI가 편하다

### Google Sheets + Cloudinary를 데이터/미디어로 쓴 이유

- 코드 건드리지 않고 프로젝트 추가/수정 가능 (디자이너 친화적)
- 시트는 **CMS 대용**. DB 안 세팅해도 됨. 무료
- Cloudinary는 **이미지/비디오 자동 최적화 + CDN + 변환 API** 한 번에
- 둘 다 무료 플랜으로 개인 포트폴리오엔 충분

---

## 2. 초기 세팅 — Next.js + Git + Vercel

### 2-1. Next.js 프로젝트 만들기

터미널에서:

```bash
npx create-next-app@latest portfolio
```

옵션 선택:
- TypeScript? → **Yes**
- ESLint? → **Yes**
- Tailwind CSS? → **Yes**
- `src/` directory? → **Yes**
- App Router? → **Yes**
- Turbopack? → **Yes**
- Import alias? → `@/*` (기본값 유지)

생성 후:

```bash
cd portfolio
npm run dev
```

→ `http://localhost:3000`에서 기본 페이지 확인.

### 2-2. Git 저장소 만들기

프로젝트 폴더에서:

```bash
git init
git add .
git commit -m "Initial commit"
```

`.gitignore`는 Next.js가 자동으로 만들어주는데, 추가로 다음 항목들을 넣어두면 좋음:

```gitignore
# Local env
.env
.env.local
.env.*.local

# Vercel
.vercel

# Cloudinary upload state (나중에 tools/로 자동 업로드 만들면)
tools/.upload-state.json

# Cloud credentials (service account json 파일들)
gen-lang-client-*.json
*service-account*.json
```

### 2-3. GitHub에 올리기

1. https://github.com/new → 저장소 만들기 (예: `work-archive`)
2. 저장소 생성하면 뜨는 안내대로:

```bash
git remote add origin https://github.com/{username}/{repo-name}.git
git branch -M main
git push -u origin main
```

### 2-4. Vercel에 배포

1. https://vercel.com/signup → GitHub 계정으로 가입 (추천)
2. Dashboard → **Add New → Project**
3. **Import Git Repository** → 방금 만든 GitHub 저장소 선택 → Import
4. Framework Preset은 자동으로 **Next.js** 감지됨
5. 특별한 설정 없이 **Deploy** 클릭
6. 1~2분 후 `https://{project-name}.vercel.app` URL 생성

이후부터는 **git push만 하면 자동 배포**. 따로 명령 실행할 필요 없음.

### 2-5. 브랜치 전략 (Production vs Preview)

Vercel은 브랜치별로 배포를 나눕니다:

- **Production 브랜치** (프로젝트 설정에서 지정, 보통 `main`): 이 브랜치에 push하면 공식 프로덕션 URL에 반영
- **그 외 브랜치**: 각 브랜치마다 **고유한 Preview URL**이 자동 생성. 실험, PR 리뷰, 고객 공유용으로 좋음

### 실전 팁: 작업 브랜치 vs 프로덕션 브랜치

- `main` 또는 `production`을 Vercel 프로덕션 브랜치로 지정
- 실험은 `feat/xxx`, `design-v2` 같은 별도 브랜치에서 → 각자 preview URL로 확인
- 검증되면 main으로 merge → 프로덕션 배포
- Preview URL 형태: `https://{project}-git-{branch-slug}-{team}.vercel.app`

> **주의**: 작업 브랜치와 프로덕션 브랜치가 다른데 무심코 "프로덕션 도메인"이라고 부르다 보면 혼동됩니다. 항상 현재 작업 중인 브랜치의 preview URL로 테스트하는 습관이 안전해요.

---

## 3. 콘텐츠 관리 — Google Sheets + Cloudinary

### 3-1. Google Sheets를 CMS로 쓰기

**핵심 아이디어**: 구글시트 한 장에 프로젝트 데이터 전부 적고, 웹에서 CSV로 public publish해서 fetch.

#### 설정 단계

1. 구글시트 만들기. 첫 행은 헤더 (`id`, `title`, `year`, `folder`, `imageCount`, `pairs`, `Video`, `videoUrl`, `selected`, `Award` 등)
2. 각 행에 프로젝트 데이터 입력
3. **파일 > 공유 > 웹에 게시** → CSV 형식 선택 → 게시 → URL 복사
4. 코드에서 fetch:

```ts
// src/components/v2/dataFetch.ts
const SHEETS_CSV = "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv";

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${SHEETS_CSV}&_=${Date.now()}`, { cache: "no-store" });
  const text = await res.text();
  return parseCSV(text).map(rowToProject).filter((p): p is Project => p !== null);
}
```

`&_=${Date.now()}` 쿼리스트링은 브라우저 캐시 무효화용. `cache: "no-store"`는 Next.js fetch 캐시 무효화용. 둘 다 해야 업데이트가 바로 반영됨.

#### CSV 파싱 주의점

단순히 `split(",")` 하면 **쉼표가 포함된 필드**(예: 설명문 안의 쉼표)에서 깨짐. 큰따옴표로 감싼 필드를 제대로 파싱하는 로직이 필요:

```ts
function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }  // escaped quote
      else inQuote = !inQuote;
    } else if (!inQuote && c === ',') {
      fields.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  fields.push(cur);
  return fields;
}
```

#### 퍼블리시 캐시 지연 주의

구글시트의 "웹에 게시" CSV 출력은 **최대 5분 정도 캐시 지연**이 있어요. 시트 수정해도 바로 반영 안 되면:

- `파일 > 웹에 게시 > 다시 게시(Republish)` 눌러서 강제 갱신
- 또는 5분 기다리기

### 3-2. Cloudinary로 이미지/비디오 호스팅

**왜 Cloudinary?**: 이미지 업로드하면 자동으로 포맷 변환(`f_auto`), 크기 조절, CDN 배포까지 해줌. 무료 플랜도 충분히 넉넉.

#### 폴더 구조 컨벤션

```
portfolio-images/
  {project-folder}/
    cover            ← 커버 이미지 (썸네일)
    001              ← 첫 번째 갤러리 슬롯
    002
    ...
```

#### Public ID는 **확장자 없이**

업로드 시 Cloudinary 대시보드에서 "Use filename as public ID" 옵션을 **끄고**, public_id를 `001`처럼 숫자 3자리로 직접 지정. 확장자(`001.jpg`, `001.mp4`)가 public_id에 포함되면 나중에 URL 짜기 귀찮아짐.

#### 코드에서 URL 빌드

```ts
export const CLD = "https://res.cloudinary.com/doyfzvsly/image/upload/f_auto,q_auto/portfolio-images/";

// 이미지 1~N까지 URL 배열 생성
export const cldImgs = (folder: string, count: number) =>
  Array.from({ length: count }, (_, i) => {
    const num = String(i + 1).padStart(3, "0");
    return `${CLD}${folder}/${num}`;
  });
```

`f_auto,q_auto` = Cloudinary가 브라우저에 맞는 최적 포맷(WebP, AVIF 등) + 품질 자동 선택.

---

## 4. 비디오 슬롯 시스템의 진화

이 부분은 세 번 리팩터한 흥미로운 히스토리가 있어요. 디자이너가 **"이미지 폴더에 비디오도 섞어 올리고 싶다"**는 요구사항을 만족시키는 최적 방법을 찾는 과정.

### v1 — 비디오 자동감지 (Video First)

초창기 로직:
1. 갤러리의 모든 아이템을 `<video>` 태그로 먼저 시도
2. 비디오 로드 실패(`onError`) → `<img>`로 swap

```tsx
const [isImg, setIsImg] = useState(false);
return isImg ? <img src={src} /> : <video src={videoSrc} onError={() => setIsImg(true)} />;
```

**문제점**:
- 갤러리의 99%는 이미지인데 전부 video 요청 먼저 날림 = 대역폭 낭비
- Cloudinary의 `f_auto`가 특정 원본 인코딩에서 간헐적으로 404 반환 (엣지 케이스 감지 실패)

### v2 — 감지 순서 역전 (Image First)

**핵심 인사이트**: "이미지가 상식적인 default"

```tsx
const [isVideo, setIsVideo] = useState(false);
return !isVideo ? <img src={src} onError={() => setIsVideo(true)} /> : <video src={videoSrc} />;
```

대부분의 아이템(이미지)은 `<img>` 로드 성공 → 끝. 일부 슬롯(비디오)은 `<img>` 404 → `<video>`로 swap.

**요청 수가 거의 절반으로 감소** (15개 이미지 갤러리 기준: 이전 30개 요청 → 새 15개 + 1개).

### v2의 한계 — 이미지가 404가 아닐 때

Cloudinary는 `image`와 `video`가 **완전 별개의 네임스페이스**. 같은 `public_id`에 대해 두 타입이 동시 존재 가능. 그래서 다음 상황이 생길 수 있음:

- 원래 이미지 `002.jpg` 업로드 → `image/upload/002` 저장
- 대시보드에서 "Replace" 기능으로 비디오 `002.mp4` 덮어쓰기 시도
- 결과: **image 네임스페이스의 이전 이미지는 그대로**, video 네임스페이스에 비디오 추가
- `image/upload/002` → 200 (기존 이미지 그대로), `video/upload/002` → 200 (신규)
- 코드 로직: `<img>`가 성공 → 이미지로 렌더링 → **비디오 안 나옴**

### v3 — 명시적 슬롯 (Single Source of Truth)

교훈: **자동감지는 Cloudinary의 dual namespace 때문에 항상 불안정.** 시트에 명시적으로 적자.

시트에 `Video` 컬럼 추가:
- `2` → 슬롯 2가 비디오
- `1,5` → 슬롯 1, 5 둘 다 비디오
- (빈칸) → 비디오 없음

```ts
// dataFetch.ts
videoSlots: row.Video
  ? row.Video.split(",").map(s => parseInt(s.trim(), 10)).filter(n => n > 0)
  : undefined,
```

```tsx
// ProjectDetailV2.tsx
const videoUrlSet = new Set(
  (project.videoSlots ?? []).map(slot => galleryImages[slot - 1]).filter(Boolean)
);

<GalleryImage isVideo={videoUrlSet.has(src)} src={src} ... />
```

추가 규칙: **Selected Works 카드 썸네일은 슬롯 1이 리스트에 있을 때만** 비디오 루프 재생.

```ts
const hasSlot1Video = project.videoSlots?.includes(1) ?? false;
const videoSrc = hasSlot1Video ? `${CLD_VIDEO}/${folder}/001` : null;
```

### 배운 점

- **Trust the source** — 콘텐츠 관리자(시트)가 진실의 근원. 추론하지 말고 명시.
- **Auto-detect는 fallback, not primary** — 동작할 때는 편하지만 엣지 케이스에서 무너짐.
- **네임스페이스가 분리된 시스템**(Cloudinary image/video)은 교차 상태가 숨어있을 수 있음.

---

## 5. Contact 폼 — Resend + API Route

### 왜 Resend?

정적 사이트에서 실제 메일을 보내려면 서버가 필요합니다. 선택지:

| 방식 | 장단점 |
|---|---|
| **mailto: 링크** | 사용자 메일앱을 열어주는 것뿐. "실제 발송"이 아님 |
| **Web3Forms / Formspree** | 서드파티 폼 서비스. 무료지만 브랜드 노출/제약 있음 |
| **Resend + Next.js API route** | ★ 전문적. Next.js와 통합 깔끔. 무료 플랜 100통/일 |
| **SendGrid / Mailgun** | 기능 많지만 과함. 포트폴리오엔 오버킬 |

**Resend 장점**:
- Next.js 공식 파트너 (공식 예제 존재)
- API key만 있으면 바로 시작 (도메인 verify는 나중에 해도 됨)
- 테스트용 샌드박스 발신자(`onboarding@resend.dev`) 제공
- 로그/분석 대시보드 깔끔

### 구현

#### 패키지 설치

```bash
npm install resend
```

#### API Route 작성

파일 경로: `src/app/api/contact/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const FROM_DEFAULT = "Portfolio <onboarding@resend.dev>";

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM || FROM_DEFAULT;

  if (!apiKey || !to) {
    return NextResponse.json(
      { error: "Contact endpoint not configured" },
      { status: 500 }
    );
  }

  const { from: senderEmail, message } = await req.json();
  const trimmedMessage = (message || "").trim();

  if (!trimmedMessage) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (trimmedMessage.length > 5000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const resend = new Resend(apiKey);
  const label = (senderEmail || "").trim() || "anonymous visitor";
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail || "");

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: isValidEmail ? senderEmail : undefined,
      subject: `Portfolio contact — ${label}`,
      text: `From: ${label}\n\n${trimmedMessage}`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ success: true, id: data?.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
```

#### 클라이언트에서 호출

ContactModal 안에서:

```ts
const handleSend = async () => {
  if (!message.trim() || status === "sending") return;
  setStatus("sending");
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, message }),
    });
    if (res.ok) {
      setStatus("sent");
      setFrom("");
      setMessage("");
    } else {
      setStatus("error");
    }
  } catch {
    setStatus("error");
  }
};
```

### 환경변수 설정 (Vercel)

#### 1. Resend에서 API Key 발급

1. https://resend.com/signup → GitHub 로그인
2. Dashboard → **API Keys** → **Create API Key**
3. Permission: **Sending access**
4. 발급된 `re_xxxxxxxx...` 키 복사 (한 번만 표시됨!)

#### 2. Vercel에 환경변수 등록

Vercel 프로젝트 → **Settings → Environment Variables** → 다음 3개 추가:

| Key | Value | Environments |
|---|---|---|
| `RESEND_API_KEY` | `re_xxxxxxxx...` | Production + Preview |
| `CONTACT_TO` | 받을 메일 주소 | Production + Preview |
| `CONTACT_FROM` | `Portfolio <onboarding@resend.dev>` | Production + Preview |

- **Sensitive** 토글은 켜두면 좋음 (API key니까). 단 Development 환경은 Sensitive 미지원이라 Production+Preview만 선택
- **Branch** 필터는 비워둠 (특정 브랜치 제한 없음)

#### 3. Redeploy

환경변수는 **새 deploy에만 적용됨**. 기존 deploy는 재배포 필요.

- Deployments 탭 → 최신 deploy `⋯` → **Redeploy** → "Use existing Build Cache" 해제 → Redeploy

1~2분 후 테스트.

### 동작 확인

배포 후:
1. 사이트 Contact 모달 열기
2. 이메일 + 메시지 입력 → Send
3. "메시지 전송됨" 초록 표시
4. `CONTACT_TO`에 지정한 메일함에서 확인 (스팸함도 체크)

---

## 6. 커스텀 도메인 설정

두 종류의 "도메인 연결"이 있습니다. 헷갈리지 말기:

1. **사이트 도메인** — `yourdomain.com` → Vercel 배포된 사이트에 연결
2. **이메일 발신 도메인** — `hi@yourdomain.com`에서 Resend가 메일 보낼 수 있게 verify

### 6-1. 도메인 사기

**어디서**:
- Cloudflare Registrars (추천, 마진 없이 원가 판매)
- Namecheap
- 가비아 (국내)
- Google Domains은 종료됨

**가격**: `.com` 연 1~2만원, `.design`/`.studio` 연 3~5만원

### 6-2. Vercel에 사이트 도메인 연결

1. Vercel 프로젝트 → **Settings → Domains**
2. **Add** → 도메인 입력 (예: `jyvovvo.com`)
3. Vercel이 DNS 레코드 알려줌. 보통:
   - `A` 레코드: `@` → `76.76.21.21`
   - 또는 `CNAME`: `www` → `cname.vercel-dns.com`
4. 도메인 등록처(Cloudflare/Namecheap 등) DNS 설정에 레코드 추가
5. 몇 분~몇 시간 후 Vercel에서 자동 verify → `https://jyvovvo.com` 활성화
6. SSL 인증서는 Vercel이 자동 발급/갱신 (무료, Let's Encrypt)

### 6-3. Resend에 이메일 도메인 verify

#### 왜 해야 하나

`onboarding@resend.dev`로 계속 발송하면:
- 수신자에게 "resend.dev"라는 낯선 발신자로 보여 덜 프로페셔널
- Gmail이 점점 스팸함으로 분류할 수 있음 (많은 사람이 쓰니까)
- 답장을 받고 싶으면 From을 본인 도메인으로 해야 자연스러움

#### 절차

1. **Resend 대시보드 → Domains → Add Domain**
2. 도메인 입력 (예: `jyvovvo.com`)
3. Region: **Asia** (도쿄 리전, 한국에서 가장 빠름)
4. Resend가 **DNS 레코드 3~5개** 알려줌:
   - `TXT` — domain verification
   - `MX` — mail routing
   - `TXT` — DKIM 서명 (보통 2개)
   - `TXT` — SPF (선택)
5. 이 레코드들을 도메인 DNS 설정에 추가 (등록처 어디든 방법 동일)
6. **Verify DNS Records** 버튼 클릭 → 전파 완료되면 "Verified" 상태

보통 10분~1시간 내에 verify 완료. Cloudflare DNS 쓰면 빠름.

#### Vercel 환경변수 한 줄 수정

```
CONTACT_FROM = Portfolio <hi@jyvovvo.com>    ← 원하는 주소
```

(여기서 `hi@`, `contact@`, `noreply@` 등 뭐든 가능. Resend는 verified 도메인의 아무 주소나 허용)

저장 → Redeploy → 끝.

> **코드는 아무것도 안 건드려요** — 이미 환경변수로 설계해뒀기 때문.

#### 답장 받기

`hi@jyvovvo.com`으로 발송한 메일에 누가 답장하면 그 주소로 오는데, `hi@jyvovvo.com`을 실제 inbox로 쓰려면:

- 도메인 등록처 또는 DNS에서 **메일 포워딩** 설정
  - Cloudflare Email Routing (무료)
  - ImprovMX (무료)
  - 둘 다 `hi@jyvovvo.com` → `jyvovvo@gmail.com` 같이 자동 전달
- 또는 Google Workspace 등 유료 이메일 서비스 연결

포트폴리오용이라면 **Cloudflare Email Routing 무료**가 가장 간단.

---

## 7. 트러블슈팅 기록

실제로 막혔던 문제들.

### 7-1. Cloudinary `f_auto`가 특정 비디오에서 404

**증상**: 어떤 비디오는 `video/upload/q_auto,f_auto/folder/001` 요청하면 404. 다른 비디오는 200.

**원인**: Cloudinary의 `f_auto`(자동 포맷 선택)가 특정 원본 인코딩에서 변환 파이프라인 실패. 샌드박스 이슈라 재현성 낮음.

**해결**: 비디오 URL prefix에서 `f_auto` 빼고 `q_auto`만 쓰기.

```ts
// Before
const CLD_VID_PREFIX = "https://res.cloudinary.com/doyfzvsly/video/upload/q_auto,f_auto/";
// After
const CLD_VID_PREFIX = "https://res.cloudinary.com/doyfzvsly/video/upload/q_auto/";
```

**교훈**: `f_auto`는 이미지엔 안전하지만 비디오에선 간헐 이슈 있음. 비디오는 `q_auto`만 쓰는 게 안전.

### 7-2. 대시보드 vs CDN 상태 불일치

**증상**: Cloudinary 대시보드는 `002`를 "Video 27.3 MB"로 보여주는데, `video/upload/002` URL은 404.

**원인**: image namespace에 기존 이미지가 남아있고, video namespace에는 비디오가 업로드 안 됨 (또는 다른 public_id로 업로드됨).

**해결 절차**:
1. 대시보드에서 asset details 열고 **URL** 필드 확인
2. `image/upload/...`로 시작하면 → image namespace에 있는 이전 이미지. 이걸 **삭제**.
3. 비디오 파일을 **새로 업로드** (Resource type = Video, Public ID = `002`, 확장자 없이)
4. `video/upload/portfolio-images/.../002` 브라우저에서 직접 열어서 재생 확인

**교훈**: Cloudinary 대시보드의 UI 표시와 실제 CDN 리소스가 다를 수 있음. 항상 브라우저에서 직접 URL로 확인하는 게 확실.

### 7-3. Footer 색상이 adaptive palette를 무시하는 버그

**증상**: 프로젝트 디테일 페이지에서 배경색이 밝은지 어두운지에 따라 본문 텍스트는 자동으로 검은색/흰색으로 바뀌는데, Footer의 headline과 name만 항상 흰색으로 고정.

**원인**: Footer가 `overrideColors` prop을 받아 쓰긴 했는데, headline과 name은 **오버라이드 유무만 체크**하고 실제 색상값은 하드코딩.

```tsx
// Before — 오버라이드 있으면 무조건 흰색
color: overrideColors ? "#F0F0F0" : "#0A0A0A"

// After — 실제 색상값을 오버라이드에서 읽음
color: overrideColors?.textStrong ?? "#0A0A0A"
```

그리고 호출부에서 adaptive palette를 넘기게 수정:

```tsx
<Footer overrideColors={{ ..., textStrong: T.solid, textFaint: T.footerFaint }} />
```

**교훈**: "prop을 받아 쓴다"와 "prop의 값을 실제로 반영한다"는 다르다. 코드 리뷰에서 흔히 놓치는 실수.

### 7-4. 시트 컬럼 rename 시 주의점

**상황**: 시트 컬럼 `thumbnail` → `Selected_video` → 최종 `Video`로 두 번 이름 변경.

**주의**:
- 시트에서 컬럼명 바꾸면 **퍼블리시 CSV에도 즉시 반영** (다른 곳보다 빠름)
- 코드는 `row.thumbnail` → `row.Video`로 명시적으로 바꿔야 함
- 두 이름을 동시에 지원하는 fallback 코드는 **가급적 피함**. 임시로 두면 언젠가 혼동 생김
- 한 번에 바꾸고 양쪽(시트 + 코드) 같이 push

### 7-5. 작업 브랜치 vs 프로덕션 브랜치 혼동

**상황**: 메모리엔 "design-v2.1 = production branch"로 기록돼 있었는데, 실제론 `design-v2`가 production 브랜치. design-v2.1에 작업한 커밋이 "내 브랜치 preview URL에서는 보이지만 프로덕션 URL에는 반영 안 됨".

**해결**:
- Vercel 프로젝트 → Settings → Git → **Production Branch** 필드 확인
- 실제 production 브랜치가 뭔지 **현재 상태**로 확인 (메모리 말고)
- 작업 브랜치와 production 브랜치가 다르면 주기적으로 merge하거나, 아예 production 브랜치를 바꿔버리거나

**교훈**: 배포 관련 설정은 **현재 상태를 직접 확인**. 기억에만 의존하지 말기.

### 7-6. 모바일 히어로 이미지가 화면 맨 위로 몰리는 버그

**증상**: 모바일 히어로 캐러셀의 이미지 6개가 전부 화면 최상단에 쌓여서 보이지 않음. `top: 52%` 같은 값이 적용되지 않는 것처럼 동작.

**원인**: `ParallaxCard` 컴포넌트가 `motion.div` + `style={{ y: transformValue }}`를 사용했는데, CSS에서 **`transform` 속성이 있는 요소는 새로운 containing block**을 생성함. 그래서 내부의 `position: absolute` 카드가 뷰포트 전체가 아니라 `ParallaxCard`(높이 0px)를 기준으로 위치를 잡게 됨.

- `top: 52%` of 0px = 0px → 모든 카드가 y=0으로 이동
- `ParallaxCard` 자체는 크기 지정이 없어서 높이 0

**해결**: `ParallaxCard` wrapper를 제거하고, parallax `y`를 캐러셀 **전체 컨테이너**에 직접 적용.

```tsx
// Before — 각 카드를 wrapper로 감싸서 깨짐
<ParallaxCard speed={1.3}>
  <motion.div style={{ position: "absolute", top: "52%" }}>...</motion.div>
</ParallaxCard>

// After — 컨테이너에 한번에 적용
<motion.div style={{ position: "absolute", inset: 0, y: scrollTranslateY }}>
  {cards.map(card => <motion.div style={{ position: "absolute", top: "52%" }}>...</motion.div>)}
</motion.div>
```

**교훈**: CSS `transform`은 containing block을 새로 만든다. `position: absolute` 자식이 있는 요소에 `transform`을 걸면 자식의 위치 기준이 바뀜. 특히 Framer Motion의 `style={{ y: ... }}`는 내부적으로 `transform: translateY()`를 사용하므로 주의.

---

## 8. 배운 점과 앞으로

### 배운 점

1. **"왜 이게 안 될까?"는 대부분 인프라 레벨 문제** — 코드가 아니라 DNS, 캐시, 네임스페이스, 환경변수 같은 것.
2. **자동화는 편하지만 엣지 케이스에서 무너진다** — 명시적 설정이 장기적으로 안정적.
3. **단일 진실의 원천(Single Source of Truth)** — 시트든 코드든, 어느 한 곳이 기준이어야 함. 두 곳에 같은 정보를 두면 언젠가 불일치 발생.
4. **커밋은 작은 단위로** — 디버깅할 때 bisect하기 좋고, 롤백 쉽고, 리뷰하기 좋음.
5. **도메인과 네임스페이스의 분리를 이해해야 함** — 같은 이름(public_id)이 image에도 video에도 있을 수 있다.

### 앞으로 공부/개선할 것

- [ ] Selected Works 레이아웃 프로토타입 (Stacked Reveal / Marquee Ticker / Feature Spotlight)
- [ ] Hero Z축 회전 효과
- [ ] 파티클 효과 테스트 페이지 적용 여부 결정
- [ ] 나머지 프로젝트 업로드 완성
- [ ] 커스텀 도메인 붙이기 + Resend 이메일 verify
- [ ] Contact 폼에 hCaptcha 또는 rate limit 추가 (스팸 대응)
- [ ] OG 이미지 / SEO 메타 태그 정비
- [ ] Vercel Speed Insights / Web Analytics 활성화

---

## 부록 — 편리한 명령어 모음

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드 로컬 확인
npm run build && npm run start

# TypeScript 타입 체크만
npx tsc --noEmit

# Lint
npm run lint

# 브랜치 만들고 이동
git checkout -b feat/new-thing

# 현재 상태 확인
git status
git log --oneline -10

# 커밋 + 푸시
git add .
git commit -m "feat: ..."
git push origin feat/new-thing

# Vercel 로그 (Vercel CLI 설치 필요)
npx vercel logs
```

---

## 9. 용어 사전 — 처음 들어본 단어들

> 코드를 처음 접하면 영어 단어가 쏟아져서 당황스러움. 여기에 이 프로젝트에서 실제로 쓰는 단어들만 모아둠. 외울 필요 없고, 모를 때 찾아보는 용도.

### Git 관련

| 용어 | 한 줄 설명 |
|---|---|
| **Git** | 파일의 "변경 이력"을 추적하는 도구. 포토샵의 히스토리 패널 같은 것. 언제든 과거 버전으로 돌아갈 수 있음 |
| **GitHub** | Git으로 관리하는 프로젝트를 인터넷에 올려두는 저장소. 구글 드라이브인데 코드 전용 |
| **Repository (레포)** | 프로젝트 폴더 하나 = 레포 하나. "이 포트폴리오 레포"라고 하면 이 프로젝트 전체를 뜻함 |
| **Commit (커밋)** | "지금 상태를 저장"하는 행위. 게임의 세이브 포인트. 메시지를 같이 적어서 뭘 바꿨는지 기록 |
| **Push (푸시)** | 로컬(내 컴퓨터)의 커밋을 GitHub(인터넷)에 올리는 것. "업로드"와 비슷 |
| **Pull (풀)** | GitHub(인터넷)의 최신 상태를 내 컴퓨터로 가져오는 것. "다운로드"와 비슷 |
| **Clone (클론)** | GitHub에 있는 프로젝트를 내 컴퓨터에 통째로 복사하는 것. 처음 한 번만 함. 이후엔 pull로 업데이트 |
| **Branch (브랜치)** | "가지"라는 뜻. 원본을 건드리지 않고 실험용 복사본을 만드는 것. 마음에 들면 합침(merge) |
| **Merge (머지)** | 두 브랜치를 하나로 합치는 것. 실험이 성공하면 원본에 반영 |
| **Main / Master** | 기본 브랜치 이름. "원본". 여기가 최종본 |

### 배포 / 서버 관련

| 용어 | 한 줄 설명 |
|---|---|
| **Deploy (배포)** | 만든 사이트를 인터넷에 올려서 누구나 볼 수 있게 하는 것. "오픈" |
| **Vercel (버셀)** | 코드를 올리면 자동으로 사이트를 만들어주는 서비스. GitHub에 push하면 자동 배포해줌 |
| **Production (프로덕션)** | 실제로 사람들이 보는 진짜 사이트. "본 서버" |
| **Preview (프리뷰)** | 실험용 임시 사이트. 브랜치마다 자동 생성됨. 미리보기 URL |
| **Build (빌드)** | 코드를 브라우저가 이해할 수 있는 형태로 변환하는 과정. 요리의 "조리" 단계 |
| **Local (로컬)** | 내 컴퓨터. "로컬에서 돌린다" = 내 컴퓨터에서 테스트한다 |
| **Server (서버)** | 사이트 파일을 저장하고 방문자에게 보내주는 컴퓨터. Vercel이 대신 해줌 |
| **Domain (도메인)** | 사이트 주소. `jyvovvo.com` 같은 것. 별도로 사야 함 |
| **DNS** | 도메인 이름(`jyvovvo.com`)을 실제 서버 위치(IP 주소)로 연결해주는 전화번호부 |
| **SSL / HTTPS** | 사이트 주소 앞에 자물쇠 아이콘 나오게 하는 보안 인증서. Vercel이 자동으로 해줌 |
| **CDN** | 전 세계 여러 곳에 사이트 복사본을 두는 것. 어디서 접속해도 빠르게. Cloudinary가 이걸 해줌 |

### 개발 도구 / 환경

| 용어 | 한 줄 설명 |
|---|---|
| **Terminal (터미널)** | 컴퓨터에 글자로 명령하는 창. 마우스 대신 키보드로 "이거 실행해"라고 타이핑 |
| **npm** | JavaScript 세계의 앱스토어. 다른 사람이 만든 도구를 `npm install 이름`으로 설치 |
| **npm run dev** | 개발 서버 켜기. 내 컴퓨터에서 사이트 미리보기 (`localhost:3000`) |
| **npm run build** | 사이트를 배포용으로 포장하기 (빌드) |
| **Package (패키지)** | npm으로 설치하는 도구/라이브러리 하나. "앱" 같은 개념 |
| **Dependencies (의존성)** | 이 프로젝트가 돌아가려면 필요한 패키지 목록. `package.json`에 적혀 있음 |
| **Environment Variable (환경변수)** | 코드에 직접 안 적고 따로 보관하는 비밀 값. API 키 같은 것. `.env` 파일에 저장 |
| **API** | 프로그램끼리 대화하는 규칙. "이 URL로 이런 데이터 보내면 이런 결과 줄게" |
| **API Key** | API 쓸 때 필요한 비밀번호 같은 것. 남에게 공유하면 안 됨 |
| **Localhost** | 내 컴퓨터 자체를 가리키는 주소. `localhost:3000` = 내 컴에서 돌아가는 사이트 |

### 프레임워크 / 라이브러리

| 용어 | 한 줄 설명 |
|---|---|
| **Next.js** | React 기반 웹사이트 만드는 틀(프레임워크). 라우팅, 빌드, 배포 다 해줌 |
| **React** | 웹페이지를 "컴포넌트"(레고 블록)로 조립하는 라이브러리 |
| **TypeScript** | JavaScript에 "타입"(이건 숫자, 이건 글자)을 표시하는 확장판. 실수 방지용 |
| **Tailwind CSS** | CSS를 클래스 이름으로 쓰는 방식. `bg-black text-white` = 검은 배경에 흰 글자 |
| **Framer Motion** | 애니메이션 라이브러리. 페이드인, 슬라이드, 스프링 효과 등을 쉽게 |
| **Turbopack** | Next.js 개발 서버를 빠르게 해주는 엔진. 코드 수정하면 거의 즉시 반영 |
| **App Router** | Next.js의 라우팅(페이지 구조) 방식. 폴더 이름 = URL 경로 |

### 데이터 / 미디어

| 용어 | 한 줄 설명 |
|---|---|
| **Cloudinary** | 이미지/비디오를 올리면 자동으로 최적화해서 빠르게 전달해주는 서비스 |
| **Google Sheets (CMS 대용)** | 구글 스프레드시트를 데이터베이스처럼 쓰는 것. 코드 안 건드리고 콘텐츠 수정 가능 |
| **CSV** | 쉼표로 구분된 데이터 파일. 엑셀에서 "다른 이름으로 저장" 할 때 보이는 그것 |
| **Fetch** | 코드에서 인터넷의 데이터를 "가져오기". 시트 CSV를 fetch한다 = 시트 데이터를 다운받는다 |
| **Cache (캐시)** | 한번 가져온 데이터를 임시 저장. 빠르지만 업데이트가 바로 안 보일 수 있음 |
| **Namespace (네임스페이스)** | 이름이 겹치지 않게 구분해놓은 영역. Cloudinary에서 image/video가 별개 |
| **Public ID** | Cloudinary에서 파일을 찾는 이름. 파일명에서 확장자 뺀 것 (`001.jpg` → `001`) |
| **Resend** | 이메일 발송 서비스. Contact 폼에서 실제 메일을 보내는 데 사용 |

### 자주 보이는 코드 용어

| 용어 | 한 줄 설명 |
|---|---|
| **Component (컴포넌트)** | 재사용 가능한 UI 조각. 레고 블록 하나. 헤더, 카드, 모달 각각이 컴포넌트 |
| **Props** | 컴포넌트에 전달하는 설정값. "이 카드의 제목은 이거야"라고 알려주는 것 |
| **State (상태)** | 컴포넌트가 기억하는 값. "지금 모달이 열려있나 닫혀있나" 같은 것 |
| **Import / Export** | 다른 파일의 코드를 가져오기(import) / 내보내기(export) |
| **Function (함수)** | 특정 작업을 하는 코드 묶음. "이미지 URL 만들기" 같은 하나의 기능 단위 |
| **Route (라우트)** | URL 경로. `/project/123` = "project 폴더의 123번 페이지" |
| **Lint** | 코드의 맞춤법 검사. 문법 실수나 스타일 위반을 자동으로 찾아줌 |

---

## 10. 세션 노트

> 매 작업 세션이 끝날 때마다 여기에 기록. 다음에 이어서 할 때 참고.

### 2026-04-13

- 빌드 가이드에 **용어 사전** (섹션 9) 추가 — Git, 배포, 개발도구, 프레임워크, 데이터, 코드 기초 용어 약 50개
- **세션 노트** (섹션 10) 구조 추가 — 앞으로 매 세션 종료 시 여기에 작업 기록
- 이전 세션까지의 작업: 캐시버스터 전체 적용, 컨택트 모달 디자인 완성 (아크릴 글라스 + 타이포 + Send 버튼)

### 2026-04-14

**모바일 최적화 대작업**

- **모바일 헤더**: 폰트 105% 확대 (`clamp(13px, 1.8vw, 26px)`)
- **모바일 히어로**: scatter 레이아웃 → **타원 궤도 캐러셀**로 전면 교체
  - 6개 이미지, 대(50vw)/중(33vw)/소(24vw) 3단계 크기
  - 회전: 빠르게 출발 → 느리게 안착, 3초 정지 후 다음
  - wander: 매 회전마다 기본 위치 ±10~14% 랜덤 오프셋 (충돌 검사 포함)
  - 관성 drift: 이동 방향 그대로 서서히 밀려감 (멈추는 시간 없음)
  - 등장: 웹과 동일하게 제자리에서 blur→clean 페이드인 + settle(0.95 축소)
- **타이틀 런타임 피팅**: 숨겨진 span으로 텍스트 폭 측정 → GUTTER 양끝에 정확히 맞춤 (웹과 동일 방식)
- **영상 썸네일**: IntersectionObserver play/pause + webkit-playsinline 추가
- **스크롤 버그 수정**: ParallaxCard wrapper의 `transform`이 CSS containing block을 생성하여 absolute 위치 깨짐 → wrapper 제거, 컨테이너에 직접 적용 (트러블슈팅 7-6 참조)

---

## 참고 링크

- [Next.js App Router 공식 문서](https://nextjs.org/docs/app)
- [Vercel 배포 가이드](https://vercel.com/docs/deployments/overview)
- [Cloudinary 이미지 변환 레퍼런스](https://cloudinary.com/documentation/image_transformations)
- [Resend Next.js 예제](https://resend.com/docs/send-with-nextjs)
- [Framer Motion 공식 문서](https://motion.dev)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

---

### 세션 노트 — 2026-04-14

**모바일 히어로 SSR 렌더링 수정**

- **문제:** 모바일에서 "This page couldn't load" 에러. 원인 2가지:
  1. `isMobile = useState(false)` → SSR에서 항상 데스크톱 HTML만 보냄 → 모바일 레이아웃 지연/미표시
  2. `OrbitCarousel`에서 `projects = []`(초기값)일 때 `% 0` 연산으로 JS 크래시
- **해결:**
  - `if (isMobile) return <Mobile/>` 패턴 제거 → 모바일/데스크톱 **동시 렌더링** + CSS 미디어쿼리(`hero-mobile-only`, `hero-desktop-only`)로 표시 전환
  - `OrbitCarousel` 빈 배열 방어 코드 추가 (`projects.length || 1`, items 생성 가드)
- **배포:** Vercel 빌드 시간 소진(0s 남음) → `vercel deploy --prod` CLI로 직접 배포 성공
- **교훈:** 화면 크기 분기는 JS(`useState`) 대신 CSS(`@media`)로 해야 SSR에서도 안전

---

### 세션 노트 — 2026-04-16

**모바일 캐러셀 개선 + Vercel Analytics**

- **캐러셀 tick/setIndex 분리:** 궤도 회전(자동)과 이미지 교체(풀다운)를 독립 제어로 변경
- **풀다운 블러 전환:** 놓으면 전체 블러 → 다음 프로젝트 세트 교체 → 클린 크로스페이드
- **gather 효과:** 풀다운 시 이미지들이 터치 지점으로 모이는 인터랙션 추가
- **애니메이션 경량화:** 이동 시간 1.8s→1.0s, wander 범위 축소, CSS transition 속성 정리
- **센터 이미지 정중앙 정렬:** x:56→50 (나머지 슬롯은 비대칭 유지)
- **Vercel Analytics 추가:** `@vercel/analytics` 패키지 + layout.tsx에 `<Analytics />` 삽입
- **배포:** `vercel deploy --prod` 성공

---

### 2026-04-18 세션 노트

**히어로 레이아웃 실험 + ProjectDetail 개선 + 도메인 연결**

- **모바일 캐러셀 풀다운 → 전체 프로젝트 순환:** `selectedWorks`만이 아니라 전체 프로젝트에서 순환하도록 변경 (page.tsx에 `shuffledAll` 추가)
- **데스크톱/모바일 겹침 수정:** `hero-mobile-only` div의 인라인 `display:contents`가 CSS 클래스보다 우선순위 높아서 데스크톱에서도 모바일 레이아웃 표시됨 → 인라인 style 제거
- **ProjectDetail Prev/Next 개선:**
  - 배경색 명도 구분: Previous 어둡게(-30), Next 밝게(+30)
  - 글자 크기 유동화: 고정값 → `clamp()` 기반 vw 반응형
  - 라이트박스 X 버튼: 화면 우측상단 → 이미지 바로 우측 상단으로 이동
- **workarchive.kr 도메인:** Vercel에 도메인 추가 + 후이즈 네임서버를 `ns1/ns2.vercel-dns.com`으로 변경
- **히어로 레이아웃 실험 (WIP):**
  - scatter 방식의 근본적 문제 분석: vw↔vh 변환 오류, 추정 높이 부정확, 중앙 비는 현상
  - 템플릿 기반 레이아웃 시스템 시도 — 5개 사전 디자인 템플릿 + 16:9 고정 비율
  - 아직 이전 scatter 버전이 더 유효. 추가 검토 필요
- **배포:** `vercel deploy --prod` + git push 완료

---

### 2026-05-04 세션 노트

**이미지 생성 워크플로우 — 별도 프로젝트 신규 생성**

- **위치:** `c:\Users\jyvov\.gemini\antigravity\scratch\image-generation-workflow` (포트폴리오와 별개 프로젝트)
- **목적:** Claude로 기획·프롬프트 패키지 생성 → Gemini Nano Banana 2 (베이스/캐릭터 일관성) → ChatGPT gpt-image-2 (스타일라이즈/한글 텍스트) 순서로 이미지 시리즈 만드는 개인 워크플로우
- **모델 조사 (2026-05 기준):**
  - **Gemini Nano Banana 2** (`gemini-3.1-flash-image-preview`, 2026-02-26 출시): 4K 해상도, 캐릭터 일관성·이미지 편집 강함
  - **ChatGPT gpt-image-2** (2026-04-21 웹, 2026-05 초 API): 한글 등 다국어 텍스트 렌더링 압도적, O-series reasoning 통합
  - 미드저니 제외(공식 API 없음)
- **비용 전략:** Claude Max + ChatGPT Pro + Gemini Pro 모두 보유 → API ❌, 모든 이미지 생성은 웹/앱에서 수동 복붙 → **추가 비용 0원**
- **1단계 구현 — 프롬프트 패키지 생성기:**
  - `CLAUDE.md`: Claude가 따라야 할 4파일 패키지 생성 규칙 (`00_brief.md`, `01_character-sheet.md`, `02_scenes.md` Gemini A/ChatGPT B 분리, `03_workflow.md`)
  - `templates/character-sheet.md`, `scene-prompt.md`, `workflow.md`: 참조 템플릿
  - `outputs/` 폴더에 `YYYY-MM-DD_프로젝트명/` 형식으로 저장 (.gitignore로 PNG 제외)
  - `README.md`: 사용법 정리
- **설계 원칙:** 영문 프롬프트 우선 / 한글 텍스트는 ChatGPT 단계에서만 / Gemini reference 이미지를 모든 씬에 재첨부(일관성 핵심)
- **다음 단계 (미구현):** 2단계 피드백 기반 프롬프트 자동 개선, 3단계 API 자동화(대량 생성 시)

---

### 2026-05-07 세션 노트

**널싱퀴즈 — 해부생리(420) + 기초치과(240) 두 과목 신규 추가**

- **위치:** `c:\Users\jyvov\.gemini\antigravity\scratch\nursing-quiz` (포트폴리오와 별개 프로젝트, VS Code 워크스페이스로 추가)
- **추가 과목:**
  - **해부생리** (인체구조와기능 14단원, 초록 #34A853): 14단원 × 30문제 = 420문제 — 연세대 간호대 '인체 구조와 기능(기초 해부 생리)' 교재 목차 기준
  - **기초치과** (기초간호학개요 8단원, 주황 #F59E0B): 8단원 × 30문제 = 240문제 — 치의학·구강해부·구강생리·표준기구·간호조무업무·기구관리/소독·구강외과·예방치과
- **총 누적 문제:** 기본간호 688 + 기초한방 300 + 해부생리 420 + 기초치과 240 = **1,648문제**
- **검수 프로세스 정착:**
  1. 단원 추가 (2~3단원씩 묶어 커밋)
  2. 4개 병렬 에이전트로 교차검증·팩트체크 (Tortora·Marieb·연세대 간호 교재 등 표준 교재 기준)
  3. 보고서 받아 우선순위별 수정 패치
  4. 새 에이전트로 재검증
  5. Vercel `npx vercel --prod --yes` 배포
- **검수에서 발견된 주요 오류 패턴:**
  - 해부생리: 성인 척주 26개(33개 아님), giantism 영문 철자, 옵션 중복(평활근/위장근), 후각상피 위치 표기 불일치
  - 기초치과: 침샘 도관(루이샘관 → 바르톨린관), 부정교합 Class I 정의, 칫솔질 시간(2~3분), 기본 진찰기구 4종, 스폴딩 분류 한글 번역(반결정적 → 준결정적)
- **배포 URL:** https://nursing-quiz-lake.vercel.app
- **데이터 구조:** `index.html` 단일 파일에 `QB_RAW`(기본간호), `HB_RAW`(기초한방), `AN_RAW`(해부생리), `DT_RAW`(기초치과) 객체로 분리. `parseBank(raw, prefix)`가 ID 자동 생성. 시스템·구조 변경 없이 데이터만 추가하는 패턴.

---

### 2026-05-18 세션 노트

**널싱퀴즈 — 기초간호학개요 9챕터 구조 완성 (+1,170문제) + 초기 버전 보존**

- **위치:** `c:\Users\jyvov\.gemini\antigravity\scratch\nursing-quiz` (포트폴리오와 별개 프로젝트)
- **배경:** 사용자가 책 사진(은하출판사 "기초 간호학 개요")을 첨부하며 "원래 9챕터로 구분돼 있었는데 어느 순간 합쳐진 것 같다"고 요청. 실제로 9챕터로 나뉜 적은 없었으나, 교재 구성과 일치하도록 7개 챕터를 별도 과목으로 추가.
- **신규 추가 7과목 (단원당 30문제):**
  - 간호 관련 (NR, #6B7280): 4단원 / 120문제
  - 모성간호 (MN, #EC4899): 6단원 / 180문제
  - 아동간호 (CN, #FBBF24): 6단원 / 180문제
  - 노인간호 (GN, #92400E): 6단원 / 180문제
  - 응급간호 (ER, #B91C1C): 11단원 / 330문제 — 두 에이전트로 분할 생성(1~6 / 7~11)
  - 기초약리 (PM, #06B6D4): 2단원 / 60문제
  - 기초영양 (NT, #84CC16): 4단원 / 120문제
- **총 누적:** 6과목 2,143문제 → **13과목 3,313문제** (+1,170)
- **작업 패턴:** 8개 병렬 에이전트로 단원별 30문제 생성 → `c:/tmp/quiz-*.txt` 저장 → Node 머지 스크립트로 검증·부족분 보충(3문제)·RAW 객체 직렬화·index.html 자동 삽입 → SUBJECTS·SUBJECT_PREFIX 자동 업데이트
- **검수 권장 사항(에이전트 자체 보고):**
  - 간호관련: 보수교육 시간(8h/년), 한국 최초 면허간호사 졸업연도 교과서 표기 대조
  - 모성간호 04단원 19번: 자간전증 발병 시기 "임신 20주 이후"로 보정
- **추가 작업:** 첫 커밋(8350103, 2026-04-26) 시점의 단일 과목 UI를 `legacy.html`로 박제, 홈 화면 하단 노란 카드로 진입 가능. 이전 세션의 미커밋이었던 다크모드(18~07시 자동 전환)·폰트 폴리시도 함께 커밋.
- **커밋:** `a3ba21d`(legacy.html + 다크모드), `9d42cb9`(7과목 추가)
- **배포 URL:** https://nursing-quiz-lake.vercel.app (alias 적용)

---

*이 문서는 Deep Field 포트폴리오 작업 기록입니다. 2026-05-18 기준 최종 수정.*
