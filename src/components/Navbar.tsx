"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/app/context/AuthContext";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

export default function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { isLoggedIn, setIsLoggedIn, handleLogout } = useAuthContext();
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If you click outside the nav, close the mobile menu
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
    setMounted(true);
    const token = Cookies.get("token");
    setIsLoggedIn(!!token);
  }, [setIsLoggedIn]);

  

  const rawUsername = Cookies.get("username") || "User";
  const displayUsername =
    rawUsername.length > 7 ? rawUsername.slice(0, 7) + "..." : rawUsername;

  return (
    <>
      {/* 
        1) Keep the <hr> you originally had, EXACTLY as you wrote it:
      */}
      <hr
        className="
          w-full h-px border-0
          bg-gradient-to-r
          from-transparent via-gray-700 to-transparent
          my-0
        "
      />

      {/* 2) NAVBAR */}
      <nav
        ref={navRef}
        className="
          relative w-full flex items-center justify-between
          px-10 sm:px-20 py-6 bg-black text-white
        "
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl tracking-tight font-semibold">MWC Pool</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center gap-10 text-base">
          <Link href="/dashboard" className="hover:text-gray-400 transition">
            Dashboard
          </Link>
          <Link href="/miners" className="hover:text-gray-400 transition">
            Miners
          </Link>
          <Link href="/rigs" className="hover:text-gray-400 transition">
            Rigs
          </Link>
          <Link href="/payout" className="hover:text-gray-400 transition">
            Payout
          </Link>
          <Link href="/guide" className="hover:text-gray-400 transition">
            Guide
          </Link>
          {mounted && isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="
                flex items-center gap-2
                px-5 py-2
                border border-red-500 text-red-500
                bg-black rounded-full
                hover:bg-red-500 hover:text-black
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-red-400
                cursor-pointer
              "
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>{displayUsername}</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="
                rounded-full border border-white/[.1] px-5 py-2
                hover:bg-white/[.1] transition
                cursor-pointer
              "
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile: Show either login or logout, plus the burger menu */}
        <div className="sm:hidden flex items-center gap-5">
          {mounted && isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="
                flex items-center gap-2
                px-4 py-2
                border border-red-500 text-red-500
                bg-black rounded-full
                hover:bg-red-500 hover:text-black
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-red-400
                text-base font-medium
                cursor-pointer
              "
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>{displayUsername}</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="
                rounded-full border border-white/[.1]
                px-4 py-2 text-base
                hover:bg-white/[.1] transition
                cursor-pointer
              "
            >
              Login
            </Link>
          )}
          {/* Burger menu icon */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle mobile menu"
            className="focus:outline-none"
          >
            {menuOpen ? (
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
      </nav>

      {/* 
        MOBILE NAVIGATION (Burger Dropdown Menu) 
        with a black background to match the navbar:
      */}
      <div
        className={`
          sm:hidden flex flex-col items-center
          absolute top-[72px] left-0 w-full
          bg-black 
          rounded-b shadow-lg z-100
          pt-1 pb-0
          transition-all duration-500 ease-in-out
          overflow-hidden
          ${menuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div className="w-11/12 max-w-md flex flex-col items-center">
          <hr
            className="
              w-full h-px border-0 
              bg-gradient-to-r 
              from-transparent via-gray-600 to-transparent
              my-4
            "
          />
          <Link
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="
              block w-full px-5 py-3 text-center
              text-white hover:text-gray-300
              transition
            "
          >
            Dashboard
          </Link>
          <hr
            className="
              w-full h-px border-0 
              bg-gradient-to-r 
              from-transparent via-gray-600 to-transparent
              my-4
            "
          />

          <Link
            href="/miners"
            onClick={() => setMenuOpen(false)}
            className="
              block w-full px-5 py-3 text-center
              text-white hover:text-gray-300
              transition
            "
          >
            Miners
          </Link>

          <hr
            className="
              w-full h-px border-0 
              bg-gradient-to-r 
              from-transparent via-gray-600 to-transparent
              my-4
            "
          />

          <Link
            href="/rigs"
            onClick={() => setMenuOpen(false)}
            className="
              block w-full px-5 py-3 text-center
              text-white hover:text-gray-300
              transition
            "
          >
            Rigs
          </Link>
          <hr
            className="
              w-full h-px border-0 
              bg-gradient-to-r 
              from-transparent via-gray-600 to-transparent
              my-4
            "
          />

          <Link
            href="/payout"
            onClick={() => setMenuOpen(false)}
            className="
              block w-full px-5 py-3 text-center
              text-white hover:text-gray-300
              transition
            "
          >
            Payout
          </Link>
          <hr
            className="
              w-full h-px border-0 
              bg-gradient-to-r 
              from-transparent via-gray-600 to-transparent
              my-4
            "
          />

          <Link
            href="/guide"
            onClick={() => setMenuOpen(false)}
            className="
              block w-full px-5 py-3 text-center
              text-white hover:text-gray-300
              transition
            "
          >
            Guide
          </Link>
          <hr
            className="
              w-full h-px border-0 
              bg-gradient-to-r 
              from-transparent via-gray-600 to-transparent
              my-4
            "
          />
          <hr
        className="
          w-full h-px border-0
          bg-gradient-to-r
          from-transparent via-gray-700 to-transparent
          my-0
        "
      />
        </div>
        
      </div>
      <hr
        className="
          w-full h-px border-0
          bg-gradient-to-r
          from-transparent via-gray-700 to-transparent
          my-0
        "
      />
    </>
  );
}
