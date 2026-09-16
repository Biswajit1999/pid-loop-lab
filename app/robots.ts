import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/pid-loop-lab/" },
    sitemap: "https://biswajit1999.github.io/pid-loop-lab/sitemap.xml",
  };
}
