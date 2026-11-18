import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Performance Management Platform",
    short_name: "Performance",
    description: "Employee performance management platform",
    start_url: "/en",
    display: "standalone",
    background_color: "#f4f6f9",
    theme_color: "#153b63",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ]
  };
}