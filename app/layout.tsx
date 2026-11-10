import type { Metadata } from "next";
import type { ReactNode } from "react";
// @ts-ignore: Next.js handles global CSS imports during build; VS Code may need this suppression.
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "SPPG Wibawa Pasirkaliki Rawamerta  — Jadwal Draw Winner",
  description:
    "Undian acak 9 nama dengan satu pemenang dan export Excel.",
  icons: {
    icon: "/BGN.png", // Pastikan file BGN.png ada di dalam folder public/
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}