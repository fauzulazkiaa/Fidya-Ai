/**
 * Fidya.ai — SEO Tracker (Google Search Console)
 * ================================================
 *
 * BLUEPRINT — belum ada implementasi API penuh.
 *
 * SETUP YANG DIBUTUHKAN NANTI:
 * 1. Buka https://console.cloud.google.com → buat project (atau pakai existing).
 * 2. Enable "Search Console API" pada project tersebut.
 * 3. Buat Service Account:
 *    IAM & Admin → Service Accounts → Create → buat key JSON.
 * 4. Simpan file credential JSON sebagai `web/scripts/gsc_credentials.json`
 *    (JANGAN di-commit — sudah/akan masuk .gitignore).
 * 5. Di Google Search Console (https://search.google.com/search-console):
 *    Settings → Users and permissions → Add user
 *    → masukkan email service account (format: nama@project.iam.gserviceaccount.com)
 *    dengan role "Restricted" (cukup untuk read).
 * 6. Install dependency saat implementasi penuh:
 *        npm install googleapis
 * 7. Set env var (opsional, override default):
 *        GSC_SITE_URL="sc-domain:fidya.ai"   # property GSC
 *        GSC_CREDENTIALS_PATH=./scripts/gsc_credentials.json
 *
 * CATATAN PENTING: data Search Console memiliki delay ~2-3 hari dan
 * hanya menyediakan data hingga 16 bulan ke belakang.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KeywordMetric {
  /** Query/keyword yang diketik pengguna di Google. */
  keyword: string;
  /** Rata-rata posisi di SERP (1 = teratas). */
  position: number;
  /** Jumlah klik dari halaman hasil pencarian. */
  clicks: number;
  /** Jumlah tayangan (impressions) di SERP. */
  impressions: number;
  /** CTR = clicks / impressions. */
  ctr: number;
}

export interface KeywordGap {
  keyword: string;
  impressions: number;
  position: number;
  /** Skor peluang 0–100: impression tinggi + posisi buruk = prioritas naik. */
  opportunityScore: number;
}

export interface GscConfig {
  siteUrl: string;
  credentialsPath: string;
  /** Rentang analisis dalam hari ke belakang (default 28). */
  daysBack: number;
}

export interface SeoReport {
  generatedAt: string;
  siteUrl: string;
  topKeywords: KeywordMetric[];
  gaps: KeywordGap[];
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: GscConfig = {
  siteUrl: process.env.GSC_SITE_URL ?? "sc-domain:fidya.ai",
  credentialsPath:
    process.env.GSC_CREDENTIALS_PATH ??
    resolve(__dirname, "gsc_credentials.json"),
  daysBack: Number(process.env.GSC_DAYS_BACK ?? 28),
};

/**
 * Inisialisasi client Search Console.
 *
 * IMPLEMENTASI NANTI (pseudo):
 *   import { google } from "googleapis";
 *   const auth = new google.auth.GoogleAuth({
 *     keyFile: config.credentialsPath,
 *     scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
 *   });
 *   return google.searchconsole({ version: "v1", auth });
 */
async function initSearchConsoleClient(_config: GscConfig): Promise<unknown> {
  throw new Error(
    "initSearchConsoleClient() belum diimplementasikan — pasang googleapis + credential JSON dulu.",
  );
}

function loadCredentials(config: GscConfig): object {
  return JSON.parse(readFileSync(config.credentialsPath, "utf8"));
}

/** Hitung rentang tanggal [start, end] untuk query GSC (format YYYY-MM-DD). */
function dateRange(daysBack: number): { start: string; end: string } {
  const end = new Date();
  end.setDate(end.getDate() - 3); // GSC butuh ~3 hari agar data stabil
  const start = new Date(end);
  start.setDate(start.getDate() - daysBack);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Ambil N keyword teratas berdasarkan klik dalam rentang waktu config.
 *
 * IMPLEMENTASI NANTI (pseudo):
 *   const res = await searchconsole.searchconsole.query({
 *     siteUrl: config.siteUrl,
 *     requestBody: {
 *       startDate, endDate,
 *       dimensions: ["query"],
 *       rowLimit: limit,
 *       dataState: "all",   // include fresh (unfinalized) data
 *     },
 *   });
 *   return res.data.rows?.map(r => ({
 *     keyword: r.keys![0],
 *     clicks: r.clicks!,
 *     impressions: r.impressions!,
 *     ctr: r.ctr!,
 *     position: r.position!,
 *   })) ?? [];
 */
export async function fetchTopKeywords(
  _limit = 50,
  _config: GscConfig = DEFAULT_CONFIG,
): Promise<KeywordMetric[]> {
  await initSearchConsoleClient(_config);
  throw new Error("fetchTopKeywords() belum diimplementasikan.");
}

/**
 * Temukan "keyword gaps": query dengan impressions tinggi tapi posisi jelek
 * (di luar top-10) — kandidat terbaik untuk dioptimalkan lewat copywriting.
 *
 * Logika:
 *   1. fetchTopKeywords(limit besar, mis. 500)
 *   2. filter: impressions >= MIN_IMPRESSIONS && position > 10
 *   3. skor peluang = impressions / position (semakin tinggi semakin baik)
 */
export async function analyzeKeywordGaps(
  _config: GscConfig = DEFAULT_CONFIG,
): Promise<KeywordGap[]> {
  const MIN_IMPRESSIONS = 30;
  // const keywords = await fetchTopKeywords(500, config);
  // return keywords
  //   .filter((k) => k.impressions >= MIN_IMPRESSIONS && k.position > 10)
  //   .map((k) => ({
  //     ...k,
  //     opportunityScore: Math.round(k.impressions / k.position),
  //   }))
  //   .sort((a, b) => b.opportunityScore - a.opportunityScore);
  void MIN_IMPRESSIONS;
  throw new Error("analyzeKeywordGaps() belum diimplementasikan.");
}

/**
 * Gabungkan metrik GSC dengan konten lokal: petakan keyword ke halaman/kunci
 * copywriting di web/content/seo_copy.json yang relevan, sehingga
 * ai_seo_automator tahu bagian mana yang harus ditulis ulang.
 *
 * IMPLEMENTASI NANTI:
 *   - Bangun mapping statis keyword→page (mis. "fidya ai tutor" → home,
 *     "bootcamp coding jakarta" → solutions_bootcamps).
 *   - Atau query GSC per-page: dimensions: ["query", "page"] lalu cocokkan URL.
 */
export async function mapKeywordsToPages(
  _gaps: KeywordGap[],
): Promise<Record<string, KeywordGap[]>> {
  throw new Error("mapKeywordsToPages() belum diimplementasikan.");
}

/**
 * Entry point CLI: jalankan `npx tsx scripts/seo_tracker.ts` (setelah setup)
 * untuk mencetak laporan SEO lengkap ke stdout / seo_report.json.
 */
export async function generateSeoReport(
  config: GscConfig = DEFAULT_CONFIG,
): Promise<SeoReport> {
  void loadCredentials(config);
  const [topKeywords, gaps] = await Promise.all([
    fetchTopKeywords(50, config),
    analyzeKeywordGaps(config),
  ]);
  return {
    generatedAt: new Date().toISOString(),
    siteUrl: config.siteUrl,
    topKeywords,
    gaps,
  };
}

// Jalankan langsung: `npx tsx scripts/seo_tracker.ts`
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop()!)) {
  generateSeoReport()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
    })
    .catch((err) => {
      console.error("[seo_tracker]", err.message);
      process.exit(1);
    });
}
