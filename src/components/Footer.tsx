import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-black text-gray-400 border-t border-white/[.1] py-8 flex flex-col items-center">
      {/* Footer Navigation */}
      <div className="flex flex-wrap justify-center gap-6 text-sm sm:text-base max-w-6xl w-full px-6 sm:px-12">
        <Link className="hover:text-white transition" href="/about">
          About Us
        </Link>
        <Link className="hover:text-white transition" href="/api">
          API
        </Link>
        <Link className="hover:text-white transition" href="/guide">
          Guide
        </Link>
        <Link className="hover:text-white transition" href="/terms">
          Terms of Service
        </Link>
      </div>

      {/* Divider */}
      <div className="w-full max-w-5xl border-t border-white/[.1] my-6"></div>

      {/* Copyright & Branding */}
      <div className="flex flex-col items-center text-xs text-gray-500">
        <p className="font-[family-name:var(--font-geist-mono)]">© {new Date().getFullYear()} MWC Pool. All rights reserved.</p>
      </div>
    </footer>
  );
}
