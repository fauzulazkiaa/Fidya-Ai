import { getCopy } from "./seo-copy";

export const FAQS: Record<"en" | "id", { q: string; a: string }[]> = {
  en: getCopy("faq", "en").items,
  id: getCopy("faq", "id").items,
};
