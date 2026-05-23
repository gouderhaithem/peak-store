import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/lib/auth";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Peak Store El Oued - Premium Sportswear & Sneakers",
  description:
    "El Oued's premier destination for authentic sportswear and sneakers. Quality athletic gear for champions.",
  icons: {
    icon: [{ url: "/peak-logo.webp", type: "image/webp" }],
    shortcut: "/peak-logo.webp",
    apple: "/peak-logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-white text-[#0A0A0A]">
        <LocaleProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
