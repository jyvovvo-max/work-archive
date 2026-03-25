# 프로젝트 가이드라인

## 보안 원칙

- API 키, 시크릿, 토큰은 절대 코드에 하드코딩하지 않는다
- 모든 민감한 값은 `.env` 파일로만 관리 (`.gitignore`에 포함됨)
- 사용자에게 API Secret 등 민감한 값을 채팅으로 공유하지 말 것을 항상 안내
- `.env.example`에는 키 이름만 작성, 실제 값은 넣지 않음
- `tools/.upload-state.json`은 로컬 전용, 커밋하지 않음

## 코드 스타일

- 단순하고 읽기 쉬운 코드 우선. 추상화는 필요할 때만
- 함수는 하나의 역할만. 길어지면 분리
- 주석은 "무엇"이 아니라 "왜"를 설명할 때만 작성
- 에러는 조용히 삼키지 말고 명확하게 출력
- 외부 라이브러리는 꼭 필요한 것만 추가

## 기술 스택

- **프레임워크:** Next.js (Turbopack) + TypeScript
- **애니메이션:** Framer Motion
- **이미지 호스팅:** Cloudinary (`cloud_name: doyfzvsly`)
- **데이터:** Google Sheets CSV fetch (실패 시 FALLBACK_PROJECTS)
- **폰트:** Lexend + Noto Sans KR

## 자동화 툴 (`tools/`)

- `upload.js` — Cloudinary 업로드 + Google Sheets 업데이트
- `.env` — 로컬 전용 크레덴셜 (커밋 금지)
- `.upload-state.json` — 업로드 상태 추적 (커밋 금지)
- 실행: `node upload.js` / `node upload.js --dry-run` / `node upload.js --reorder <project>`

## 폴더 구조 규칙 (portfolio-images)

```
portfolio-images/
  project-name/
    cover/        ← 커버 이미지 1장
    01_image.jpg  ← 숫자 prefix로 순서 지정
    02_image.jpg
```

## 작업 원칙

- 요청하지 않은 리팩터링, 기능 추가 하지 않음
- 변경 전 반드시 해당 파일 읽기
- 파괴적인 작업(파일 삭제, force push 등) 전 반드시 확인
- 보안 취약점 발견 시 즉시 알림
