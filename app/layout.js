import "./globals.css";
import ServiceWorkerRegister from "./ServiceWorkerRegister";

export const metadata = {
  title: "食安通知",
  description: "每日自動檢查食安中心違規樣本",
  applicationName: "食安通知",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "食安通知",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  themeColor: "#2e7d6b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
