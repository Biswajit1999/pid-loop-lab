import type { MetadataRoute } from "next";
import { learnTopics } from "@/lib/learn-topics";

export const dynamic = "force-static";

const root = "https://biswajit1999.github.io/pid-loop-lab";

export default function sitemap(): MetadataRoute.Sitemap {
  const modified = new Date("2026-09-16");
  return [
    { url: `${root}/`, lastModified: modified, changeFrequency: "monthly", priority: 1 },
    { url: `${root}/lab/`, lastModified: modified, changeFrequency: "monthly", priority: 0.95 },
    { url: `${root}/missions/`, lastModified: modified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${root}/autotune/`, lastModified: modified, changeFrequency: "monthly", priority: 0.85 },
    { url: `${root}/learn/`, lastModified: modified, changeFrequency: "monthly", priority: 0.9 },
    ...learnTopics.map((topic) => ({ url: `${root}/learn/${topic.slug}/`, lastModified: modified, changeFrequency: "yearly" as const, priority: 0.75 })),
  ];
}
