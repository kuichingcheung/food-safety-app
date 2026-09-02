export default function manifest() {
  return {
    name: "食安通知",
    short_name: "食安通知",
    description: "每日自動檢查食安中心違規樣本",
    start_url: "/",
    display: "standalone",
    background_color: "#f0f0f0",
    theme_color: "#2e7d6b",
    lang: "zh-Hant",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
