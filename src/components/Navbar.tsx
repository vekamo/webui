"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/app/context/AuthContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Grab isLoggedIn from context
  const { isLoggedIn, setIsLoggedIn } = useAuthContext();

  // On first load, read the token
  const token = (typeof window !== "undefined" && Cookies.get("token")) || "";
  const userIsLogged = !!token;

  // Sync context once on mount
  useEffect(() => {
    setIsLoggedIn(userIsLogged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const router = useRouter();

  function handleLogout() {
    Cookies.remove("username");
    Cookies.remove("id");
    Cookies.remove("token");
    Cookies.remove("legacyToken");
    Cookies.remove("expiration");
    setIsLoggedIn(false);
  }

  // FIX PART: Add 'mounted' state to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="w-full flex items-center justify-between px-8 sm:px-16 py-5 bg-black text-white border-b border-white/[.1] font-[family-name:var(--font-geist-sans)]">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Image
          className="dark:invert opacity-90"
          src="/globe.svg"
          alt="MWC Logo"
          width={24}
          height={24}
        />
        <span className="text-lg tracking-tight font-semibold">MWC Pool</span>
      </Link>

      {/* Desktop Menu */}
      <div className="hidden sm:flex items-center gap-8 text-sm font-[family-name:var(--font-geist-mono)]">
        <Link href="/dashboard" className="hover:text-gray-400 transition">
          Dashboard
        </Link>
        <Link href="/miners" className="hover:text-gray-400 transition">
          Miners
        </Link>
        <Link href="/payout" className="hover:text-gray-400 transition">
          Payout
        </Link>
        <Link href="/faq" className="hover:text-gray-400 transition">
          FAQ
        </Link>
        {mounted && isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="rounded-full border border-red-500 px-4 py-2 text-red-500 hover:bg-red-500 hover:text-white transition"
          >
            Logout
          </button>
        ) : (
          <Link
            href="/login"
            className="rounded-full border border-white/[.1] px-4 py-2 hover:bg-white/[.1] transition"
          >
            Login
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="sm:hidden focus:outline-none"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16m-7 6h7"
          ></path>
        </svg>
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 w-full bg-black border-t border-white/[.1] sm:hidden flex flex-col items-center p-4 gap-4 text-sm font-[family-name:var(--font-geist-mono)]">
          <Link
            href="/miners"
            className="hover:text-gray-400 transition"
            onClick={() => setMenuOpen(false)}
          >
            Miners
          </Link>
          <Link
            href="/payout"
            className="hover:text-gray-400 transition"
            onClick={() => setMenuOpen(false)}
          >
            Payout
          </Link>
          <Link
            href="/faq"
            className="hover:text-gray-400 transition"
            onClick={() => setMenuOpen(false)}
          >
            FAQ
          </Link>
          {mounted && isLoggedIn ? (
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="rounded-full border border-red-500 px-4 py-2 text-red-500 hover:bg-red-500 hover:text-white transition"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-white/[.1] px-4 py-2 hover:bg-white/[.1] transition"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
