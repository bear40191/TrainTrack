import "./globals.css";

export const metadata = {
  title: "TrainTrack - ระบบบันทึก & อนุมัติงานฝึกงาน",
  description: "Hybrid App สำหรับบันทึกงานของนักศึกษาฝึกงาน พร้อมระบบอนุมัติจากพี่เลี้ยงและหัวหน้าพี่เลี้ยง",
  icons: {
    icon: "/icon.svg",
    shortcut: "/favicon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#16A34A",
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
    <html lang="th">
      <body className="font-sans antialiased bg-[#EFEFEF] text-slate-800 min-h-screen selection:bg-[#6FD098]/30 selection:text-[#0E3E35]">
        {children}
      </body>
    </html>
  );
}
