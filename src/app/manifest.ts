import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Perform. | Performance Management Platform",
    short_name: "Perform.",
    description: "A unified workspace for performance cycles, objectives, reviews and employee development.",
    start_url: "/en/login",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f5f7fb",
    theme_color: "#163366",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ]
  };
}
