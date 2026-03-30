/**
 * Portfolio Upload Tool
 *
 * 로컬 폴더 구조:
 *   portfolio-images/
 *     YYYY-MM_project-name/
 *       cover/            ← 커버 이미지 1장 (파일명 무관)
 *         any-name.jpg
 *       01/               ← 순서 폴더 (숫자만), 파일명 무관
 *         any-name.jpg
 *       02/
 *         any-name.jpg
 *
 * Cloudinary 자동 변환:
 *   01/ → portfolio-images/{project}/001
 *   02/ → portfolio-images/{project}/002
 *
 * 이미지 교체:  01/ 안 파일을 새 파일로 교체 후 실행 (자동 감지)
 * 순서 변경:   폴더 번호 rename 후 실행 (자동 감지)
 * 강제 재업로드: --reorder (state 무시하고 전체 재업로드)
 *
 * 사용법:
 *   node upload.js                          전체 업로드
 *   node upload.js --dry-run                미리보기
 *   node upload.js 2025-03_my-project       특정 프로젝트만
 *   node upload.js --reorder 2025-03_...    강제 전체 재업로드
 */

require("dotenv").config();
const fs   = require("fs");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");
const { google }         = require("googleapis");
const sharp              = require("sharp");

// ── 옵션 파싱 ──────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const REORDER = args.includes("--reorder");  // state 무시, 전체 재업로드
const TARGET  = args.find(a => !a.startsWith("--")) || null;

// ── 설정 ───────────────────────────────────────────────────────────────────
const PORTFOLIO_DIR = process.env.PORTFOLIO_DIR
  || path.join(__dirname, "../portfolio-images");
const CLD_BASE   = "portfolio-images";
const STATE_FILE = path.join(__dirname, ".upload-state.json");
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".tiff"];

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "doyfzvsly",
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── State ──────────────────────────────────────────────────────────────────
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")); }
  catch { return {}; }
}
function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ── 숫자 폴더 목록 (01, 02, 03 ... 정수 순 정렬) ──────────────────────────
function getNumberedFolders(dir) {
  return fs.readdirSync(dir)
    .filter(f => {
      const full = path.join(dir, f);
      return fs.statSync(full).isDirectory() && /^\d+$/.test(f);
    })
    .sort((a, b) => parseInt(a) - parseInt(b));
}

// ── 폴더 안 첫 번째 이미지 파일명 ──────────────────────────────────────────
function getFirstImage(folderPath) {
  const files = fs.readdirSync(folderPath)
    .filter(f => IMAGE_EXTS.includes(path.extname(f).toLowerCase()))
    .sort();
  return files.length > 0 ? files[0] : null;
}

// ── Cloudinary 업로드 ──────────────────────────────────────────────────────
// cover:  1920×1080 16:9 크랍 (centre)
// 일반:   가로 최대 1920px, 비율 유지
// overwrite + invalidate → 교체 시 CDN 캐시 즉시 반영
async function uploadFile(localPath, publicId, isCover = false) {
  if (DRY_RUN) {
    const tag = isCover ? "[cover 16:9 크랍]" : "[1920px 리사이즈]";
    console.log(`  [dry-run] ${tag} ${path.basename(localPath)} → ${publicId}`);
    return { public_id: publicId };
  }

  const parts  = publicId.split("/");
  parts.pop(); // filename 제거
  const folder = parts.join("/");

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        asset_folder:    folder,
        public_id:       publicId,
        use_filename:    false,
        unique_filename: false,
        overwrite:       true,
        invalidate:      true,   // ← CDN 캐시 즉시 무효화
        resource_type:   "image",
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );

    let pipeline = sharp(localPath).withMetadata({ density: 72 });
    if (isCover) {
      pipeline = pipeline.resize(1920, 1080, { fit: "cover", position: "centre" });
    } else {
      pipeline = pipeline.resize(1920, null, { withoutEnlargement: true });
    }
    pipeline.pipe(uploadStream);
  });
}

// ── 프로젝트 처리 ──────────────────────────────────────────────────────────
async function processProject(projectDir, state) {
  const dirName = path.basename(projectDir);
  const match   = dirName.match(/^(\d{4})-(\d{2})_(.+)$/);
  const folder  = match ? match[3] : dirName;

  // state 구조: { cover: "filename", folders: { "01": "filename", "02": "filename" } }
  if (!state[folder]) state[folder] = {};
  const ps = state[folder];
  if (!ps.folders) ps.folders = {};

  console.log(`\n[${dirName}]`);

  // ── cover ──
  const coverDir = path.join(projectDir, "cover");
  if (fs.existsSync(coverDir)) {
    const coverFile = getFirstImage(coverDir);
    if (coverFile) {
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

  // ── 숫자 폴더 이미지 ──
  // 01/ → 001, 02/ → 002 ...
  // 파일이 바뀌거나 폴더가 새로 생기면 자동 감지 → overwrite 업로드
  const numberedFolders = getNumberedFolders(projectDir);
  let uploaded = 0;
  let skipped  = 0;

  for (const folderNum of numberedFolders) {
    const folderPath = path.join(projectDir, folderNum);
    const file       = getFirstImage(folderPath);

    if (!file) {
      console.log(`  ⚠  ${folderNum}/ 이미지 없음 (스킵)`);
      continue;
    }

    const num      = String(parseInt(folderNum)).padStart(3, "0"); // "01" → "001"
    const publicId = `${CLD_BASE}/${folder}/${num}`;

    // 같은 파일이면 스킵 (--reorder면 항상 재업로드)
    if (ps.folders[folderNum] === file && !REORDER) {
      skipped++;
      continue;
    }

    try {
      await uploadFile(path.join(folderPath, file), publicId);
      ps.folders[folderNum] = file;
      uploaded++;
      console.log(`  ✓  ${folderNum}/${file} → ${num}`);
    } catch (e) {
      console.error(`  ✗  ${folderNum}/ 오류: ${e.message}`);
    }
  }

  if (skipped  > 0) console.log(`  ⏭  ${skipped}장 스킵`);
  if (uploaded > 0) console.log(`  ↑  ${uploaded}장 업로드`);

  // imageCount = 숫자 폴더 수 (cover 제외, gaps 없이 폴더 수 기준)
  const imageCount = numberedFolders.length;
  console.log(`  → 총 ${imageCount}장`);

  const year  = match ? match[1] : "";
  const month = match ? String(parseInt(match[2])) : "";
  const title = match
    ? folder.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : folder;

  return { dirName, folder, title, year, month, imageCount };
}

// ── id 부여 (시간 역순, 최신=1) ────────────────────────────────────────────
function assignIds(results) {
  const sorted = [...results].sort((a, b) => {
    const dA = `${a.year}-${String(a.month).padStart(2, "0")}`;
    const dB = `${b.year}-${String(b.month).padStart(2, "0")}`;
    return dB.localeCompare(dA);
  });
  sorted.forEach((r, i) => { r.id = i + 1; });
  return results;
}

// ── Google Sheets 업데이트 ─────────────────────────────────────────────────
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

  const col = (name) => headers.indexOf(name);

  console.log("\n[Google Sheets]");
  for (const result of results) {
    if (DRY_RUN) {
      console.log(`  [dry-run] id=${result.id} ${result.folder} (${result.year}-${result.month}) imageCount=${result.imageCount}`);
      continue;
    }

    const existingIdx = rows.findIndex((r, i) => i > 0 && r[col("folder")] === result.folder);

    if (existingIdx > 0) {
      // 기존 행: id, imageCount 업데이트
      const updates = [];
      if (col("id")         >= 0) updates.push({ c: col("id"),         v: result.id });
      if (col("imageCount") >= 0) updates.push({ c: col("imageCount"), v: result.imageCount });

      for (const { c, v } of updates) {
        const cell = `시트1!${String.fromCharCode(65 + c)}${existingIdx + 1}`;
        await sheets.spreadsheets.values.update({
          spreadsheetId, range: cell,
          valueInputOption: "RAW",
          requestBody: { values: [[v]] },
        });
      }
      console.log(`  ✓  업데이트: ${result.folder} (id=${result.id}, imageCount=${result.imageCount})`);
    } else {
      // 새 행 추가
      const maxCol = Math.max(
        col("id"), col("title"), col("year"), col("month"),
        col("folder"), col("imageCount"), col("category"),
        col("description"), col("coworkers")
      );
      const newRow = new Array(maxCol + 1).fill("");
      if (col("id")          >= 0) newRow[col("id")]          = result.id;
      if (col("title")       >= 0) newRow[col("title")]       = result.title;
      if (col("year")        >= 0) newRow[col("year")]        = result.year;
      if (col("month")       >= 0) newRow[col("month")]       = result.month;
      if (col("folder")      >= 0) newRow[col("folder")]      = result.folder;
      if (col("imageCount")  >= 0) newRow[col("imageCount")]  = result.imageCount;
      if (col("category")    >= 0) newRow[col("category")]    = "";
      if (col("description") >= 0) newRow[col("description")] = "";
      if (col("coworkers")   >= 0) newRow[col("coworkers")]   = "";

      await sheets.spreadsheets.values.append({
        spreadsheetId, range: "시트1!A:Z",
        valueInputOption: "RAW",
        requestBody: { values: [newRow] },
      });
      console.log(`  ✓  추가: ${result.folder} (id=${result.id}, ${result.year}-${result.month}, title="${result.title}")`);
    }
  }
}

// ── 메인 ───────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(PORTFOLIO_DIR)) {
    console.error(`오류: "${PORTFOLIO_DIR}" 폴더를 찾을 수 없습니다.`);
    console.error(".env 파일의 PORTFOLIO_DIR 경로를 확인해주세요.");
    process.exit(1);
  }

  let projectDirs = fs.readdirSync(PORTFOLIO_DIR)
    .map(f => path.join(PORTFOLIO_DIR, f))
    .filter(f => fs.statSync(f).isDirectory());

  if (TARGET) {
    projectDirs = projectDirs.filter(d => path.basename(d) === TARGET);
    if (projectDirs.length === 0) {
      console.error(`프로젝트를 찾을 수 없습니다: ${TARGET}`);
      process.exit(1);
    }
  }

  console.log(`총 ${projectDirs.length}개 프로젝트${DRY_RUN ? " [DRY RUN]" : ""}${REORDER ? " [강제 재업로드]" : ""}`);

  const state   = loadState();
  const results = [];

  for (const dir of projectDirs) {
    const result = await processProject(dir, state);
    results.push(result);
    if (!DRY_RUN) saveState(state);
  }

  if (!TARGET) assignIds(results);

  await updateGoogleSheets(results);

  console.log("\n완료");
}

main().catch(err => {
  console.error("오류:", err.message);
  process.exit(1);
});
