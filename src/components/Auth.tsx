"use client"; // <--- MUST be a Client Component because we use useSearchParams
export const dynamic = "force-dynamic"; // If you want dynamic rendering

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { useAuth } from "@/app/hooks/useAuth";

interface AuthProps {
  /** If true => show "Sign Up" form; else "Sign In" form. */
  isSignUp?: boolean;
}

/**
 * A unified Auth component that can serve either
 * sign-up or sign-in mode, based on the isSignUp prop.
 */
export default function Auth({ isSignUp = false }: AuthProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // For showing "Checking authentication..." while reading cookies
  const [authCheckDone, setAuthCheckDone] = useState(false);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  // Next.js 13 client hooks
  const router = useRouter();
  const searchParams = useSearchParams();

  // The URL we want to send the user to *after* successful sign-in/up
  const nextUrl = searchParams.get("next") || "/miners";

  // from our custom useAuth() hook (must also be client-compatible)
  const { login, signup, authError, isLoading } = useAuth();

  /**
   * 1) Check cookies on mount => if "token" => user is "already logged in"
   */
  useEffect(() => {
    const token = Cookies.get("token");
    setAlreadyLoggedIn(!!token);
    setAuthCheckDone(true);
  }, []);

  /**
   * 2) Form submission => sign in or sign up
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    let success = false;
    if (isSignUp) {
      // Force boolean with !! if your hook returns boolean | null
      success = !!(await signup(username, password));
    } else {
      success = !!(await login(username, password));
    }

    if (success) {
      // If sign-up/log-in was successful, redirect
      router.push(nextUrl);
    }
  }

  /**
   * 3) If still checking cookies => show spinner / loader
   */
  if (!authCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Checking authentication...</p>
      </div>
    );
  }

  /**
   * 4) If a token is present => immediate redirect
   */
  if (alreadyLoggedIn) {
    router.push(nextUrl);
    return null; // so we don't render the form
  }

  /**
   * 5) Otherwise => show either login or signup form
   */
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 sm:px-16 bg-black text-white">
      <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
        {isSignUp ? "Create an Account" : "Sign In"}
      </h1>
      <p className="text-gray-400 text-md sm:text-lg mt-2">
        {isSignUp
          ? "Join MWC Pool and start mining."
          : "Log in to track your mining performance."}
      </p>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-black/[.15] border border-white/[.1] p-6 mt-6 rounded-lg shadow-lg"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-gray-400 text-sm">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-black border border-white/[.1] rounded-md text-white 
                         focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-black border border-white/[.1] rounded-md text-white 
                         focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
          </div>

          {authError && <p className="text-red-500 text-sm">{authError}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-white text-black font-medium py-2 rounded-md 
                       hover:bg-gray-300 transition"
          >
            {isLoading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </form>

      {/* The sign-in / sign-up switch link */}
      {isSignUp ? (
        <p className="text-gray-500 text-sm mt-4">
          Already have an account?
          <Link
            href={`/login?next=${encodeURIComponent(nextUrl)}`}
            className="ml-1 text-white hover:underline"
          >
            Sign In
          </Link>
        </p>
      ) : (
        <p className="text-gray-500 text-sm mt-4">
          Don&apos;t have an account?
          <Link
            href={`/signup?next=${encodeURIComponent(nextUrl)}`}
            className="ml-1 text-white hover:underline"
          >
            Sign Up
          </Link>
        </p>
      )}

      <Link href="/" className="mt-6 text-gray-500 text-sm hover:text-white transition">
        ← Back to Home
      </Link>
    </div>
  );
}
