/**
 * Canonical blog post metadata shared by the /blog index page and the
 * landing-page teasers so the two surfaces can never drift apart.
 */
import type { Locale } from "@/components/providers/locale-provider";

export type BlogCat = "product" | "company" | "engineering" | "science" | "ai";

export type BlogAuthorKey =
  | "fauzul"
  | "clara"
  | "arif"
  | "maya"
  | "siti"
  | "jonathan";

export interface BlogPostMeta {
  cat: BlogCat;
  day: number;
  month: number; // 0-indexed
  year: number;
  readTime: number;
  authors: BlogAuthorKey[];
  img?: string;
  title: Record<Locale, string>;
  excerpt: Record<Locale, string>;
}

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    cat: "product",
    day: 24,
    month: 7,
    year: 2026,
    readTime: 3,
    authors: ["fauzul", "clara"],
    img: "/blog/launch.jpg",
    title: {
      en: "Launch Week: seven agents, seven days of releases",
      id: "Launch Week: tujuh agen, tujuh hari rilis",
    },
    excerpt: {
      en: "Every SYNTAX agent gets an upgrade this week: faster re-planning, richer citations, and a new Forge mode that stress-tests what you produce before your exam does.",
      id: "Setiap agen SYNTAX mendapat upgrade pekan ini: re-plan lebih cepat, sitasi lebih kaya, dan mode Forge baru yang menguji keras hasil kerjamu sebelum ujian melakukannya.",
    },
  },
  {
    cat: "product",
    day: 18,
    month: 7,
    year: 2026,
    readTime: 4,
    authors: ["jonathan"],
    img: "/blog/android.jpg",
    title: {
      en: "Fidya for Android is now in open beta",
      id: "Fidya untuk Android kini open beta",
    },
    excerpt: {
      en: "Learn offline, get nudged by the Catalyst, and review Forge feedback on the go. The Android app syncs everything back to your curriculum in real time.",
      id: "Belajar offline, dapat dorongan dari Catalyst, dan tinjau masukan Forge di mana saja. Aplikasi Android menyinkronkan semuanya ke kurikulummu secara realtime.",
    },
  },
  {
    cat: "engineering",
    day: 7,
    month: 7,
    year: 2026,
    readTime: 8,
    authors: ["arif"],
    img: "/blog/factcheck.jpg",
    title: {
      en: "How the Fact-Checker grounds every sentence you read",
      id: "Bagaimana Fact-Checker menopang setiap kalimat yang kamu baca",
    },
    excerpt: {
      en: "A deep dive into the verification pipeline: claim extraction, source matching, confidence thresholds, and what happens when a sentence can't be grounded.",
      id: "Bedah dalam pipeline verifikasi: ekstraksi klaim, pencocokan sumber, ambang keyakinan, dan apa yang terjadi saat sebuah kalimat tak bisa ditopang sumber.",
    },
  },
  {
    cat: "company",
    day: 5,
    month: 7,
    year: 2026,
    readTime: 3,
    authors: ["fauzul"],
    title: {
      en: "Fidya Labs raises pre-seed to fix course completion",
      id: "Fidya Labs meraih pendanaan awal untuk memperbaiki tingkat penyelesaian kursus",
    },
    excerpt: {
      en: "We're building the platform where people actually finish. This round lets us scale SYNTAX and bring team analytics to bootcamps and companies.",
      id: "Kami membangun platform tempat orang benar-benar selesai belajar. Dana ini untuk menskalakan SYNTAX dan menghadirkan analitik tim untuk bootcamp dan perusahaan.",
    },
  },
  {
    cat: "product",
    day: 31,
    month: 6,
    year: 2026,
    readTime: 5,
    authors: ["maya"],
    title: {
      en: "Adaptive re-planning: curricula that survive real life",
      id: "Re-plan adaptif: kurikulum yang tahan banting kenyataan",
    },
    excerpt: {
      en: "Life happens — deadlines move, weeks go sideways. Here's how the Architect re-plans your week around reality instead of guilt-tripping you.",
      id: "Hidup terjadi — deadline bergeser, minggu berjalan tak sesuai rencana. Beginilah Architect menyusun ulang pekanmu menyesuaikan kenyataan, bukan menyalahkanmu.",
    },
  },
  {
    cat: "engineering",
    day: 29,
    month: 6,
    year: 2026,
    readTime: 7,
    authors: ["jonathan", "arif"],
    title: {
      en: "Row-level security and the architecture of learner trust",
      id: "Row-level security dan arsitektur kepercayaan pembelajar",
    },
    excerpt: {
      en: "Your notes, progress, and chats are yours alone. A tour of the Postgres policies that isolate every row by learner.",
      id: "Catatan, progres, dan percakapan milikmu sendiri. Tur kebijakan Postgres yang mengisolasi setiap baris data per pembelajar.",
    },
  },
  {
    cat: "science",
    day: 23,
    month: 6,
    year: 2026,
    readTime: 6,
    authors: ["siti"],
    title: {
      en: "Why deadlines beat motivation every time",
      id: "Kenapa deadline selalu mengalahkan motivasi",
    },
    excerpt: {
      en: "Motivation is weather; a deadline is climate. The research on why backward-planning from a fixed date beats waiting until you feel ready.",
      id: "Motivasi itu cuaca; deadline itu iklim. Riset tentang kenapa merencanakan mundur dari tanggal tetap mengalahkan menunggu merasa siap.",
    },
  },
  {
    cat: "ai",
    day: 16,
    month: 6,
    year: 2026,
    readTime: 9,
    authors: ["clara"],
    title: {
      en: "Seven agents, one goal: you finishing",
      id: "Tujuh agen, satu tujuan: kamu selesai",
    },
    excerpt: {
      en: "Inside SYNTAX: how Architect, Hunter, Synthesizer, Fact-Checker, Inquisitor, Forge, and Catalyst divide the work of getting you across the finish line.",
      id: "Di dalam SYNTAX: bagaimana Architect, Hunter, Synthesizer, Fact-Checker, Inquisitor, Forge, dan Catalyst membagi tugas mengantar kamu sampai garis akhir.",
    },
  },
  {
    cat: "company",
    day: 4,
    month: 6,
    year: 2026,
    readTime: 2,
    authors: ["fauzul"],
    title: {
      en: "100,000 citations served — a milestone for grounded tutoring",
      id: "100.000 sitasi tersaji — tonggak sejarah tutor AI berbasis bukti",
    },
    excerpt: {
      en: "One hundred thousand verified citations later, here's what we've learned about keeping an AI tutor honest at scale.",
      id: "Seratus ribu sitasi terverifikasi kemudian, inilah pelajaran kami tentang menjaga tutor AI tetap jujur dalam skala besar.",
    },
  },
  {
    cat: "engineering",
    day: 30,
    month: 5,
    year: 2026,
    readTime: 10,
    authors: ["arif", "jonathan"],
    title: {
      en: "Grounding evals: how we measure our hallucination rate",
      id: "Evaluasi grounding: cara kami mengukur tingkat halusinasi",
    },
    excerpt: {
      en: "Hallucination rate isn't a vibe — it's a metric. Our eval harness replays real lessons against sources nightly to catch drift before learners do.",
      id: "Tingkat halusinasi bukan perasaan — itu metrik. Harness evaluasi kami memutar ulang pelajaran nyata dibanding sumbernya setiap malam.",
    },
  },
  {
    cat: "science",
    day: 22,
    month: 5,
    year: 2026,
    readTime: 6,
    authors: ["siti"],
    title: {
      en: "Spaced repetition without the spreadsheet",
      id: "Spaced repetition tanpa spreadsheet",
    },
    excerpt: {
      en: "The forgetting curve is real, but managing review schedules manually is a chore. How adaptive re-planning keeps material fresh for you.",
      id: "Kurva lupa itu nyata, tapi mengatur jadwal review manual melelahkan. Beginilah cara re-plan adaptif menjaga materi tetap segar.",
    },
  },
  {
    cat: "ai",
    day: 9,
    month: 5,
    year: 2026,
    readTime: 8,
    authors: ["clara", "maya"],
    title: {
      en: "AI-assisted study is not cheating",
      id: "Belajar berbantuan AI bukan cheating",
    },
    excerpt: {
      en: "The difference between outsourcing thinking and scaffolding it. Where AI tutors genuinely help — and where they quietly hurt.",
      id: "Bedanya menyewa pikiran orang lain dengan membangun perancahnya. Di mana AI tutor benar-benar membantu — dan di mana diam-diam merugikan.",
    },
  },
];

export const MONTHS_SHORT: Record<Locale, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  id: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
};

export function formatPostDate(post: BlogPostMeta, locale: Locale): string {
  const months = MONTHS_SHORT[locale];
  return `${months[post.month]} ${post.day}, ${post.year}`;
}
