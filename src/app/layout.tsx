import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageBackground from "@/components/layout/PageBackground";

export const metadata: Metadata = {
  title: "БОСГО | Байшингаа бүтээх ухаалаг туслах",
  description:
    "Монголд хувийн байшин барихыг хүссэн хүн бүрт зориулсан алхам алхмаар төлөвлөлтийн туслах.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn">
      <body>
        <PageBackground />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
