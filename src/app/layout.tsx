import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

export const metadata = {
  title: "TrainTrack - ระบบบันทึก & อนุมัติงานฝึกงาน",
  description: "Hybrid App สำหรับบันทึกงานของนักศึกษาฝึกงาน พร้อมระบบอนุมัติจากพี่เลี้ยงและหัวหน้าพี่เลี้ยง",
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable}`}>
      <body className="font-sans antialiased bg-slate-50 text-slate-800 min-h-screen selection:bg-emerald-100 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
