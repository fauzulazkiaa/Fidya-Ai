#!/usr/bin/env node
/**
 * Fidya.ai — AI SEO Automator
 * ===========================================================================
 * Membaca web/content/seo_copy.json, menulis ulang copywriting per-halaman
 * lewat LLM (Google Gemini ATAU OpenAI), lalu menimpa file tersebut.
 *
 * PENTING: Request dikirim PER HALAMAN (bukan seluruh JSON sekaligus) agar
 * payload kecil dan tidak memicu error 500/limit token di sisi provider.
 *
 * CARA PAKAI:
 *   1. Set salah satu API key (di .env.local atau export langsung):
 *        GEMINI_API_KEY=...    (provider gemini, default)
 *        OPENAI_API_KEY=...    (provider openai)
 *      Opsional:
 *        LLM_PROVIDER=gemini|openai      # default: gemini
 *        GEMINI_MODEL=gemini-2.0-flash   # default
 *        OPENAI_MODEL=gpt-4o-mini        # default
 *        SEO_TREND="tren EdTech minggu ini"
 *        SEO_LOCALES=en,id               # locale yang ikut dioptimalkan
 *        SEO_ONLY=home,about             # proses halaman tertentu saja
 *        SEO_DRY_RUN=true                # preview saja, tanpa overwrite
 *   2. Jalankan: npm run seo-auto
 *
 * CATATAN:
 *   - Backup otomatis ke seo_copy.json.bak sebelum overwrite.
 *   - Struktur key JSON dijaga identik; hanya nilai string yang berubah.
 *   - Review diff + `npm run build` sebelum commit!
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "..");
const CONTENT_FILE = path.join(ROOT, "content", "seo_copy.json");
const BACKUP_FILE = CONTENT_FILE + ".bak";

const PROVIDER = (process.env.LLM_PROVIDER || "gemini").toLowerCase();
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const LOCALES = (process.env.SEO_LOCALES || "en,id")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const ONLY_PAGES = (process.env.SEO_ONLY || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const DRY_RUN = /^true$/i.test(process.env.SEO_DRY_RUN || "");
const MAX_RETRIES = Number(process.env.SEO_MAX_RETRIES || 4);
const TREND =
  process.env.SEO_TREND ||
  "(placeholder) tren EdTech minggu ini — set env SEO_TREND untuk hasil nyata";

function getApiKey() {
  const key =
    PROVIDER === "openai"
      ? process.env.OPENAI_API_KEY
      : process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) {
    console.error(
      `[ai-seo] API key belum diset. Butuh ${PROVIDER === "openai" ? "OPENAI_API_KEY" : "GEMINI_API_KEY"}.`,
    );
    process.exit(1);
  }
  return key;
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt() {
  return [
    "You are a senior bilingual (English/Indonesian) SEO copywriter for Fidya.ai,",
    "an AI-powered personalized education platform (EdTech).",
    "Your job: rewrite UI/marketing copy so it ranks better on Google WITHOUT changing the meaning.",
    "",
    "RULES:",
    "- Keep the EXACT same JSON structure and keys. Return valid JSON only.",
    "- Rewrite ONLY string values; keep numbers, booleans, arrays' lengths, and nesting identical.",
    "- Preserve brand names (Fidya, SYNTAX, agent names like The Architect), prices, stats, URLs, href.",
    "- Keep every locale's language: rewrite 'en' values in English, 'id' values in Indonesian.",
    "- Naturally weave in target keywords; avoid keyword stuffing; keep tone confident and concise.",
    "- Keep strings short enough for their UI role (titles stay title-length, descriptions stay 1-2 sentences).",
    "- Do not add HTML or markdown unless it already exists in the original string.",
  ].join("\n");
}

function buildUserPrompt(pageName, pageLocales, locales) {
  return [
    `Analisis teks copywriting halaman "${pageName}" ini, asumsikan tren SEO EdTech minggu ini adalah "${TREND}",`,
    "lalu tulis ulang teksnya agar lebih SEO-friendly tanpa mengubah makna.",
    `Optimalkan locale berikut: ${locales.join(", ")}.`,
    "",
    "Return the full rewritten JSON object with identical structure:",
    JSON.stringify(pageLocales, null, 2),
  ].join("\n");
}

// ---------------------------------------------------------------------------
// HTTP with retry (untuk 429/5xx — termasuk 500 Internal Server Error)
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, options, label) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      const body = await res.text();
      // 429 rate-limit & 5xx server error → retry dengan backoff eksponensial
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`${label} ${res.status}: ${body.slice(0, 300)}`);
        const waitMs = Math.min(30_000, 2 ** attempt * 1000) + Math.random() * 1000;
        console.warn(
          `[ai-seo]   ⚠ ${res.status} (percobaan ${attempt}/${MAX_RETRIES}) — retry dalam ${Math.round(waitMs / 1000)}s…`,
        );
        await sleep(waitMs);
        continue;
      }
      // 4xx lainnya (key salah, model salah, dsb.) → gagal permanen
      throw new Error(`${label} ${res.status}: ${body.slice(0, 500)}`);
    } catch (err) {
      // network error juga di-retry, error 4xx permanen dilempar
      if (!/^.*(429|\s5\d\d)/.test(String(err.message)) && attempt < MAX_RETRIES && !err.message.includes(label)) {
        throw err;
      }
      lastErr = err;
      if (attempt >= MAX_RETRIES) break;
    }
  }
  throw lastErr ?? new Error(`${label} gagal setelah ${MAX_RETRIES} percobaan`);
}

// ---------------------------------------------------------------------------
// LLM adapters
// ---------------------------------------------------------------------------

/** Extract the first valid JSON object from a model response. */
function parseJsonLoose(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Tidak menemukan JSON di respons LLM.");
  return JSON.parse(raw.slice(start, end + 1));
}

async function callGemini(systemPrompt, userPrompt, apiKey) {
  // REST API langsung — tanpa dependency tambahan.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetchWithRetry(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    },
    "Gemini API",
  );
  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const finishReason = candidate?.finishReason;
  const text = candidate?.content?.parts?.map((p) => p.text).join("") ?? "";
  if (!text.trim()) {
    throw new Error(
      `Gemini merespons kosong (finishReason=${finishReason}). Coba pecah halaman lebih kecil (SEO_ONLY) atau ganti model.`,
    );
  }
  try {
    return parseJsonLoose(text);
  } catch (err) {
    if (finishReason === "MAX_TOKENS") {
      throw new Error(
        "Output Gemini terpotong (MAX_TOKENS). Halaman ini terlalu besar — proses dengan SEO_ONLY=<page> atau pakai model ber-token lebih besar.",
      );
    }
    throw err;
  }
}

async function callOpenAI(systemPrompt, userPrompt, apiKey) {
  const res = await fetchWithRetry(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    },
    "OpenAI API",
  );
  const data = await res.json();
  return parseJsonLoose(data?.choices?.[0]?.message?.content ?? "");
}

async function callLLM(systemPrompt, userPrompt) {
  const apiKey = getApiKey();
  return PROVIDER === "openai"
    ? callOpenAI(systemPrompt, userPrompt, apiKey)
    : callGemini(systemPrompt, userPrompt, apiKey);
}

// ---------------------------------------------------------------------------
// Validation & merge
// ---------------------------------------------------------------------------

const PROTECTED_KEYS = new Set(["href", "url"]);

/**
 * Bandingkan hasil LLM vs original untuk SATU halaman.
 * Ambil nilai baru HANYA jika struktur cocok & tipenya string.
 * Mengembalikan jumlah string yang berubah; mutasi terjadi di `target`.
 */
function mergePage(target, original, rewritten, changedCounter) {
  const walk = (orig, rew) => {
    if (rew === undefined || rew === null) return;
    if (typeof orig === "string") {
      if (typeof rew === "string" && rew !== orig) {
        return rew;
      }
      return undefined;
    }
    if (Array.isArray(orig)) {
      if (!Array.isArray(rew) || rew.length !== orig.length) return undefined;
      const outArr = [];
      let touched = false;
      orig.forEach((item, i) => {
        const v = walk(item, rew[i]);
        outArr.push(v !== undefined ? v : item);
        if (v !== undefined) touched = true;
      });
      return touched ? outArr : undefined;
    }
    if (typeof orig === "object") {
      if (typeof rew !== "object") return undefined;
      const outObj = {};
      let touched = false;
      for (const key of Object.keys(orig)) {
        if (PROTECTED_KEYS.has(key)) {
          outObj[key] = orig[key]; // href/url TIDAK boleh diganti
          continue;
        }
        const v = walk(orig[key], rew[key]);
        outObj[key] = v !== undefined ? v : orig[key];
        if (v !== undefined) touched = true;
      }
      return touched ? outObj : undefined;
    }
    return undefined; // angka/boolean/null dipertahankan
  };

  const merged = walk(original, rewritten);
  if (merged !== undefined) {
    Object.assign(target, merged);
    changedCounter.n += countChangedStrings(original, merged);
  }
}

function countChangedStrings(a, b, depth = 0) {
  if (depth > 12) return 0;
  if (typeof a === "string" && typeof b === "string") return a !== b ? 1 : 0;
  if (Array.isArray(a) && Array.isArray(b))
    return a.reduce((n, v, i) => n + countChangedStrings(v, b[i], depth + 1), 0);
  if (a && b && typeof a === "object" && typeof b === "object")
    return Object.keys(a).reduce((n, k) => n + countChangedStrings(a[k], b[k], depth + 1), 0);
  return 0;
}

// ---------------------------------------------------------------------------
// Main — batch per halaman
// ---------------------------------------------------------------------------

async function main() {
  console.log(`[ai-seo] Membaca ${path.relative(process.cwd(), CONTENT_FILE)}`);
  const document = JSON.parse(fs.readFileSync(CONTENT_FILE, "utf8"));
  const pages = document.pages;

  const pageNames = ONLY_PAGES.length
    ? ONLY_PAGES.filter((p) => pages[p] || console.warn(`[ai-seo] Skip: halaman "${p}" tidak ditemukan.`))
    : Object.keys(pages);

  const systemPrompt = buildSystemPrompt();
  console.log(`[ai-seo] Provider: ${PROVIDER} | Model: ${PROVIDER === "openai" ? OPENAI_MODEL : GEMINI_MODEL}`);
  console.log(`[ai-seo] Trend: ${TREND}`);
  console.log(`[ai-seo] Memproses ${pageNames.length} halaman × locale [${LOCALES.join(", ")}]\n`);

  let totalPagesChanged = 0;

  for (let i = 0; i < pageNames.length; i++) {
    const pageName = pageNames[i];
    const originalPage = pages[pageName];

    // Susun subset locale untuk halaman ini saja → payload tetap kecil
    const subset = {};
    for (const loc of LOCALES) {
      if (originalPage[loc]) subset[loc] = originalPage[loc];
    }
    if (!Object.keys(subset).length) continue;

    const sizeKb = Math.round(JSON.stringify(subset).length / 1024);
    process.stdout.write(`[ai-seo] (${i + 1}/${pageNames.length}) ${pageName} (~${sizeKb} KB)… `);

    try {
      const userPrompt = buildUserPrompt(pageName, subset, LOCALES);
      const rewritten = await callLLM(systemPrompt, userPrompt);

      const counter = { n: 0 };
      // rewritten bisa berupa { en, id } langsung, atau dibungkus { pages: {...} }
      const rewPages = rewritten.pages ?? rewritten;
      const rewForPage = rewPages[pageName] ?? rewPages;

      const target = {};
      mergePage(target, subset, rewForPage, counter);
      if (counter.n > 0) {
        for (const loc of Object.keys(target)) originalPage[loc] = target[loc];
        totalPagesChanged++;
        console.log(`✓ ${counter.n} string diperbarui`);
      } else {
        console.log("— tidak ada perubahan valid");
      }
    } catch (err) {
      console.log(`✗ gagal`);
      console.error(`[ai-seo]   ${err.message}`);
      console.error("[ai-seo]   Halaman ini dilewati; lanjut ke halaman berikutnya.");
    }
  }

  if (totalPagesChanged === 0) {
    console.log("\n[ai-seo] Selesai: tidak ada halaman yang berubah. File tidak ditimpa.");
    return;
  }

  document.generatedAt = new Date().toISOString();

  if (DRY_RUN) {
    console.log(`\n[ai-seo] DRY RUN — ${totalPagesChanged} halaman berubah (tidak disimpan).`);
    return;
  }

  fs.copyFileSync(CONTENT_FILE, BACKUP_FILE);
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(document, null, 2) + "\n");
  console.log(`\n[ai-seo] ✓ seo_copy.json diperbarui (${totalPagesChanged} halaman). Backup: seo_copy.json.bak`);
  console.log("[ai-seo] Review diff-nya, lalu jalankan `npm run build` sebelum commit.");
}

main().catch((err) => {
  console.error("[ai-seo] FATAL:", err.message);
  process.exit(1);
});
