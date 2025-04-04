"use client";

import React from "react";
import { useDataContext } from "@/app/context/DataContext";

export default function HomePage() {
  const { isLoggedIn } = useDataContext();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col items-center text-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Welcome to MWC Pool
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-xl leading-relaxed">
            Mine MWC with ease and efficiency. Track your rigs, payouts, and real-time pool stats.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex gap-4 mt-8 flex-col sm:flex-row">
            {isLoggedIn ? (
              <>
                <a
                  href="/miners"
                  className="rounded-full border border-white/[.1] transition-colors flex items-center justify-center bg-white text-black hover:bg-gray-300 font-medium text-sm sm:text-base h-10 sm:h-12 px-5"
                >
                  Miner Dashboard
                </a>
                <a
                  href="/payout"
                  className="rounded-full border border-white/[.1] transition-colors flex items-center justify-center hover:bg-white/[.1] text-white font-medium text-sm sm:text-base h-10 sm:h-12 px-5"
                >
                  Payout
                </a>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="rounded-full border border-white/[.1] transition-colors flex items-center justify-center bg-white text-black hover:bg-gray-300 font-medium text-sm sm:text-base h-10 sm:h-12 px-5"
                >
                  Login
                </a>
                <a
                  href="/signup"
                  className="rounded-full border border-white/[.1] transition-colors flex items-center justify-center hover:bg-white/[.1] text-white font-medium text-sm sm:text-base h-10 sm:h-12 px-5"
                >
                  Sign Up
                </a>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Subtle gradient line at the bottom for visual polish */}
      <hr
        className="w-full h-px border-0 bg-gradient-to-r from-transparent via-gray-700 to-transparent"
      />
    </div>
  );
}
