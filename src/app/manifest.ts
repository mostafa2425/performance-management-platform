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
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  };
}