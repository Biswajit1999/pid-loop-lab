import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PID Loop Lab",
    short_name: "PID Lab",
    description: "Interactive PID tuning and control-system simulator",
    start_url: "/pid-loop-lab/",
    display: "standalone",
    background_color: "#f2f0e9",
    theme_color: "#10201d",
    icons: [{ src: "/pid-loop-lab/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
