import type { MetadataRoute } from "next";

// PWA manifest (served at /manifest.webmanifest). Powers "Add to Home Screen"
// and is the base for a TWA / Capacitor store build.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "БОСГО — Байшингаа бүтээх ухаалаг туслах",
    short_name: "БОСГО",
    description:
      "Монголд хувийн байшин барихыг хүссэн хүн бүрт зориулсан төлөвлөлтийн туслах.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    lang: "mn",
    orientation: "portrait",
    categories: ["lifestyle", "productivity", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
