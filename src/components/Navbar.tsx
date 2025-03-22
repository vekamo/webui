"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/app/context/AuthContext";

export default function Navbar() {
  const router = useRouter();

  // State for mobile menu toggle
  const [menuOpen, setMenuOpen] = useState(false);

  // Helps ensure we check cookies on the client side
  const [mounted, setMounted] = useState(false);

  // Authentication context
  const { isLoggedIn, setIsLoggedIn } = useAuthContext();

  // Ref to detect clicks outside of the nav
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close menu if we click outside the nav
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Check cookie token on mount
    setMounted(true);
    const token = Cookies.get("token");
    setIsLoggedIn(!!token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Log out user by removing cookies and redirecting to login
  function handleLogout() {
    Cookies.remove("username");
    Cookies.remove("id");
    Cookies.remove("token", { path: "/" });
    Cookies.remove("legacyToken", { path: "/" });
    Cookies.remove("expiration");
    setIsLoggedIn(false);
    router.push("/login");
  }

  return (
    <nav
      ref={navRef}
      className="relative w-full flex items-center justify-between px-10 sm:px-20 py-6 bg-black text-white border-b border-white/20"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <span className="text-xl tracking-tight font-semibold">MWC Pool</span>
      </Link>

      {/* Desktop Menu */}
      <div className="hidden sm:flex items-center gap-10 text-base font-[family-name:var(--font-geist-mono)]">
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
        {/* Login / Logout (Desktop) */}
        {mounted && isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="rounded-full border border-red-500 px-5 py-2 text-red-500 hover:bg-red-500 hover:text-white transition"
          >
            Logout
          </button>
        ) : (
          <Link
            href="/login"
            className="rounded-full border border-white/[.1] px-5 py-2 hover:bg-white/[.1] transition"
          >
            Login
          </Link>
        )}
      </div>

      {/* Mobile: Login/Logout + Burger Icon */}
      <div className="sm:hidden flex items-center gap-3">
        {mounted && (
          <>
            {isLoggedIn ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="rounded-full border border-red-500 px-5 py-2 text-red-500 hover:bg-red-500 hover:text-white transition"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-white/[.1] px-5 py-2 hover:bg-white/[.1] transition"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </>
        )}

        {/* Toggle Button for Mobile Menu */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle mobile menu"
          className="focus:outline-none"
        >
          {menuOpen ? (
            // "X" icon
            <svg
              className="w-8 h-8 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            // Hamburger icon
            <svg
              className="w-8 h-8 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu (Dropdown) */}
      {menuOpen && (
        <div
          className="absolute top-full left-0 w-full bg-gray-800/40 border-t border-white/20
                     sm:hidden flex flex-col items-center p-5 gap-5 text-base
                     font-[family-name:var(--font-geist-mono)] z-50"
        >
          <Link
            href="/dashboard"
            className="hover:text-gray-400 transition"
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </Link>
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
        </div>
      )}
    </nav>
  );
}
