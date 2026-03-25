/**
 * Portfolio Upload Tool
 * Cloudinary 자동 업로드 + Google Sheets 업데이트
 *
 * 폴더 구조:
 *   portfolio-images/
 *     my-project/
 *       cover/          ← 커버 이미지 (1장)
 *       photo_a.jpg     ← 순서 = 파일명 알파벳 순
 *       photo_b.jpg
 *
 * 순서 변경 방법:
 *   파일명 앞에 숫자를 붙이면 그 순서로 업로드됩니다.
 *   예: 01_hero.jpg, 02_detail.jpg, 03_closeup.jpg
 *   이미 업로드된 파일을 재정렬하려면 --reorder 플래그 사용:
 *   node upload.js --reorder my-project
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");
const { google } = require("googleapis");
const sharp = require("sharp");

// ── 옵션 파싱 ──
const args = process.argv.slice(2);
const DRY_RUN    = args.includes("--dry-run");   // 실제 업로드 없이 미리보기
const REORDER    = args.includes("--reorder");    // 특정 프로젝트 재정렬
const TARGET     = args.find(a => !a.startsWith("--")) || null; // 특정 프로젝트만

// ── 설정 ──
const PORTFOLIO_DIR = process.env.PORTFOLIO_DIR
  || path.join(__dirname, "../portfolio-images");
const CLD_BASE   = "portfolio-images";
const STATE_FILE = path.join(__dirname, ".upload-state.json");
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".tiff"];

// ── Cloudinary 설정 ──
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "doyfzvsly",
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ────────────────────────────────────────────
// 상태 파일 (어떤 파일이 어떤 번호로 올라갔는지 기록)
// ────────────────────────────────────────────
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")); }
  catch { return {}; }
}
function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ────────────────────────────────────────────
// 이미지 파일 목록 (알파벳 순 정렬)
// 파일명 앞에 숫자를 붙이면 그 순서로 정렬됨
// 예: 01_hero.jpg → 02_detail.jpg
// ────────────────────────────────────────────
function getImageFiles(dir) {
  return fs.readdirSync(dir)
    .filter(f => {
      const full = path.join(dir, f);
      return fs.statSync(full).isFile()
        && IMAGE_EXTS.includes(path.extname(f).toLowerCase());
    })
    .sort(); // 알파벳 순 = 숫자 prefix 순
}

// ────────────────────────────────────────────
// 이미지 처리 + Cloudinary 업로드
//
// cover:  16:9 (1920×1080) 자동 크랍
// 일반:   가로 최대 1920px 유지, 72dpi
// ────────────────────────────────────────────
async function uploadFile(localPath, publicId, isCover = false) {
  if (DRY_RUN) {
    const tag = isCover ? "[cover 16:9 크랍]" : "[1920px 리사이즈]";
    console.log(`  [dry-run] ${tag} ${path.basename(localPath)} → ${publicId}`);
    return { public_id: publicId };
  }

  // publicId = "portfolio-images/project/001"
  // Dynamic Folder Mode에서는 folder + filename 분리 필요
  const parts    = publicId.split("/");
  const filename = parts.pop();
  const folder   = parts.join("/");

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        asset_folder:    folder,   // 미디어 라이브러리 위치 (Dynamic Folder Mode)
        public_id:       publicId, // URL 경로 (슬래시 포함 전체 경로)
        use_filename:    false,
        unique_filename: false,
        overwrite:       true,
        resource_type:   "image",
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );

    let pipeline = sharp(localPath).withMetadata({ density: 72 });

    if (isCover) {
      // 16:9 크랍 — 중앙 기준
      pipeline = pipeline.resize(1920, 1080, { fit: "cover", position: "centre" });
    } else {
      // 가로 최대 1920px, 세로는 비율 유지, 작은 이미지는 확대 안 함
      pipeline = pipeline.resize(1920, null, { withoutEnlargement: true });
    }

    pipeline.pipe(uploadStream);
  });
}

// ────────────────────────────────────────────
// 프로젝트 처리
// ────────────────────────────────────────────
async function processProject(projectDir, state) {
  const dirName  = path.basename(projectDir);
  // YYYY-MM_folder-name 형식 파싱, 아니면 전체 이름을 folder로 사용
  const match    = dirName.match(/^(\d{4})-(\d{2})_(.+)$/);
  const folder   = match ? match[3] : dirName; // Cloudinary 경로 + state key

  if (!state[folder]) state[folder] = { files: {}, cover: null };
  const ps = state[folder]; // project state

  console.log(`\n[${dirName}]`);

  // ── cover ──
  const coverDir = path.join(projectDir, "cover");
  if (fs.existsSync(coverDir)) {
    const coverFiles = getImageFiles(coverDir);
    if (coverFiles.length > 0) {
      const coverFile = coverFiles[0];
      const publicId = `${CLD_BASE}/${folder}/cover`;

      if (ps.cover === coverFile && !REORDER) {
        console.log(`  ⏭  cover (스킵)`);
      } else {
        try {
          await uploadFile(path.join(coverDir, coverFile), publicId, true);
          ps.cover = coverFile;
          console.log(`  ✓  cover → ${publicId}`);
        } catch (e) {
          console.error(`  ✗  cover 오류: ${e.message}`);
        }
      }
    }
  } else {
    console.log(`  ⚠  cover 폴더 없음`);
  }

  // ── 일반 이미지 (루트 파일만, 하위 폴더 제외) ──
  const imageFiles = getImageFiles(projectDir);

  if (REORDER) {
    // 재정렬: 현재 파일 순서 기준으로 전체 재번호 부여 + 재업로드
    console.log(`  재정렬 모드: ${imageFiles.length}장 재업로드`);
    ps.files = {};
    for (let i = 0; i < imageFiles.length; i++) {
      const num      = String(i + 1).padStart(3, "0");
      const publicId = `${CLD_BASE}/${folder}/${num}`;
      try {
        await uploadFile(path.join(projectDir, imageFiles[i]), publicId);
        ps.files[imageFiles[i]] = num;
        console.log(`  ✓  ${imageFiles[i]} → ${num}`);
      } catch (e) {
        console.error(`  ✗  ${imageFiles[i]} 오류: ${e.message}`);
      }
    }
  } else {
    // 일반 모드: 새 파일만 업로드, 기존은 스킵
    const alreadyUploaded = new Set(Object.keys(ps.files));
    const newFiles        = imageFiles.filter(f => !alreadyUploaded.has(f));

    const existingNums = Object.values(ps.files).map(Number).filter(n => !isNaN(n));
    let nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;

    if (imageFiles.length - newFiles.length > 0)
      console.log(`  ⏭  ${imageFiles.length - newFiles.length}장 스킵`);

    for (const file of newFiles) {
      const num      = String(nextNum).padStart(3, "0");
      const publicId = `${CLD_BASE}/${folder}/${num}`;
      try {
        await uploadFile(path.join(projectDir, file), publicId);
        ps.files[file] = num;
        nextNum++;
        console.log(`  ✓  ${file} → ${num}`);
      } catch (e) {
        console.error(`  ✗  ${file} 오류: ${e.message}`);
      }
    }
  }

  const imageCount = Object.keys(ps.files).length;
  console.log(`  → 총 ${imageCount}장`);

  const year  = match ? match[1] : "";
  const month = match ? String(parseInt(match[2])) : "";
  const title = match
    ? folder.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : folder;

  return { dirName, folder, title, year, month, imageCount };
}

// ────────────────────────────────────────────
// 시간 역순으로 id 자동 부여 (최신 = 1)
// ────────────────────────────────────────────
function assignIds(results) {
  const sorted = [...results].sort((a, b) => {
    const dateA = `${a.year}-${String(a.month).padStart(2, "0")}`;
    const dateB = `${b.year}-${String(b.month).padStart(2, "0")}`;
    return dateB.localeCompare(dateA); // 최신이 앞
  });
  sorted.forEach((r, i) => { r.id = i + 1; });
  return results; // id가 각 result에 부여됨
}

// ────────────────────────────────────────────
// Google Sheets 업데이트
// ────────────────────────────────────────────
async function updateGoogleSheets(results) {
  const keyFile       = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!keyFile || !spreadsheetId) {
    console.log("\n[Google Sheets] 설정 없음. 아래 데이터를 시트에 붙여넣기하세요:");
    console.log("folder\timageCount");
    results.forEach(r => console.log(`${r.folder}\t${r.imageCount}`));
    return;
  }

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "시트1!A:Z",
  });
  const rows    = res.data.values || [];
  const headers = rows[0] || [];
  const folderCol = headers.indexOf("folder");
  const countCol  = headers.indexOf("imageCount");

  const idCol       = headers.indexOf("id");
  const titleCol    = headers.indexOf("title");
  const yearCol     = headers.indexOf("year");
  const monthCol    = headers.indexOf("month");
  const categoryCol = headers.indexOf("category");
  const descCol     = headers.indexOf("description");
  const coworkCol   = headers.indexOf("coworkers");

  console.log("\n[Google Sheets]");
  for (const result of results) {
    if (DRY_RUN) {
      console.log(`  [dry-run] id=${result.id} ${result.folder} (${result.year}-${result.month}) imageCount=${result.imageCount}`);
      continue;
    }
    const existingIdx = rows.findIndex((r, i) => i > 0 && r[folderCol] === result.folder);
    if (existingIdx > 0) {
      // 기존 행: id, imageCount 업데이트
      const updates = [];
      if (idCol    >= 0) updates.push({ col: idCol,    val: result.id });
      if (countCol >= 0) updates.push({ col: countCol, val: result.imageCount });
      for (const { col, val } of updates) {
        const cell = `시트1!${String.fromCharCode(65 + col)}${existingIdx + 1}`;
        await sheets.spreadsheets.values.update({
          spreadsheetId, range: cell,
          valueInputOption: "RAW",
          requestBody: { values: [[val]] },
        });
      }
      console.log(`  ✓  업데이트: ${result.folder} (id=${result.id}, imageCount=${result.imageCount})`);
    } else {
      // 새 행: 파싱된 메타데이터 자동 입력
      const newRow = new Array(Math.max(...[idCol, titleCol, yearCol, monthCol, folderCol, countCol, categoryCol, descCol, coworkCol].filter(c => c >= 0)) + 1).fill("");
      if (idCol       >= 0) newRow[idCol]       = result.id;
      if (titleCol    >= 0) newRow[titleCol]    = result.title;
      if (yearCol     >= 0) newRow[yearCol]     = result.year;
      if (monthCol    >= 0) newRow[monthCol]    = result.month;
      if (folderCol   >= 0) newRow[folderCol]   = result.folder;
      if (countCol    >= 0) newRow[countCol]    = result.imageCount;
      if (categoryCol >= 0) newRow[categoryCol] = "test";
      if (descCol     >= 0) newRow[descCol]     = "test";
      if (coworkCol   >= 0) newRow[coworkCol]   = "test";
      await sheets.spreadsheets.values.append({
        spreadsheetId, range: "시트1!A:Z",
        valueInputOption: "RAW",
        requestBody: { values: [newRow] },
      });
      console.log(`  ✓  추가: ${result.folder} (id=${result.id}, ${result.year}-${result.month}, title="${result.title}")`);
    }
  }
}

// ────────────────────────────────────────────
// 메인
// ────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(PORTFOLIO_DIR)) {
    console.error(`오류: "${PORTFOLIO_DIR}" 폴더를 찾을 수 없습니다.`);
    console.error(".env 파일의 PORTFOLIO_DIR 경로를 확인해주세요.");
    process.exit(1);
  }

  let projectDirs = fs.readdirSync(PORTFOLIO_DIR)
    .map(f => path.join(PORTFOLIO_DIR, f))
    .filter(f => fs.statSync(f).isDirectory());

  // 특정 프로젝트만 처리
  if (TARGET) {
    projectDirs = projectDirs.filter(d => path.basename(d) === TARGET);
    if (projectDirs.length === 0) {
      console.error(`프로젝트를 찾을 수 없습니다: ${TARGET}`);
      process.exit(1);
    }
  }

  console.log(`총 ${projectDirs.length}개 프로젝트${DRY_RUN ? " [DRY RUN]" : ""}${REORDER ? " [재정렬]" : ""}`);

  const state   = loadState();
  const results = [];

  for (const dir of projectDirs) {
    const result = await processProject(dir, state);
    results.push(result);
    if (!DRY_RUN) saveState(state); // 프로젝트마다 저장 (중간 중단 시 진행 상황 보존)
  }

  // 전체 프로젝트 기준 id 재부여 (특정 프로젝트만 처리할 때도 전체 기준으로)
  if (!TARGET) assignIds(results);

  await updateGoogleSheets(results);

  console.log("\n완료");
}

main().catch(err => {
  console.error("오류:", err.message);
  process.exit(1);
});
