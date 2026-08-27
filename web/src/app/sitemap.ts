import type { MetadataRoute } from "next";

const SITE_URL = "https://fidya.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/subscribe", priority: 0.9, changeFrequency: "monthly" },
    { path: "/business", priority: 0.8, changeFrequency: "monthly" },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
    { path: "/customers", priority: 0.7, changeFrequency: "monthly" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/team", priority: 0.5, changeFrequency: "monthly" },
    { path: "/careers", priority: 0.5, changeFrequency: "weekly" },
    { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
    { path: "/help", priority: 0.6, changeFrequency: "monthly" },
    { path: "/study-guides", priority: 0.7, changeFrequency: "weekly" },
    { path: "/webinars", priority: 0.6, changeFrequency: "weekly" },
    { path: "/changelog", priority: 0.6, changeFrequency: "weekly" },
    { path: "/roadmap", priority: 0.5, changeFrequency: "weekly" },
    { path: "/api-docs", priority: 0.5, changeFrequency: "monthly" },
    { path: "/status", priority: 0.4, changeFrequency: "daily" },
    { path: "/security", priority: 0.5, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
