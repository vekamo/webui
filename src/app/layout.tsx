import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "../app/globals.css";
import { AuthProvider } from "@/app/context/AuthContext";
import { DataProvider } from "./context/DataContext";
import AuthExpirationHandler from "@/components/AuthExpirationHandler";

/**
 * 1) We import Geist + Geist_Mono with 'variable' fields 
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MWC Pool",
  description: "Mine MWC with ease and efficiency in real-time.",
  openGraph: {
    title: "MWC Pool",
    description: "Mine MWC with ease and efficiency in real-time.",
    url: "https://mwcpool.com", 
    siteName: "MWC Pool",
    images: [
      {
        url: "https://mwcpool.com/images/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MWC Pool",
    description: "Mine MWC with ease and efficiency in real-time.",
    images: ["https://mwcpool.com/images/og-image.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // 2) Attach the variable classes to <html>
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="bg-black text-white">
        <AuthProvider>
          <AuthExpirationHandler />
          <DataProvider>
            <Navbar />
            {children}
            <Footer />
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
