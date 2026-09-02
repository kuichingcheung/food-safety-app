import "./globals.css";

export const metadata = {
  title: "食安通知",
  description: "每日自動檢查食安中心違規樣本",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
