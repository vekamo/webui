"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAuth } from "@/app/hooks/useAuth";
import Link from "next/link";

const waitForToken = async () => {
  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (Cookies.get("token")) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });
};

export default function LoginPage() {
  const router = useRouter();
  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // We’ll store the ?next= path here
  const [nextUrl, setNextUrl] = useState("/miners");
  // Track if we've finished our "check if already logged in" step
  const [authCheckDone, setAuthCheckDone] = useState(false);

  // Next.js 13's router for client navigation
  

  // Custom auth hook
  const { login, authError, isLoading } = useAuth();

  // 1) On mount, check if user has a token -> if so, they're already logged in
  // 2) Parse the ?next= param from the URL
  useEffect(() => {
    const token = Cookies.get("token");
    // If token exists, we are (likely) already logged in
    if (token) {
      // We'll redirect below once we've set nextUrl
    }

    // Parse the next param
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const nextParam = params.get("next") || "/miners";
      setNextUrl(nextParam);
    }

    setAuthCheckDone(true);
  }, []);

  // 3) If user is already logged in, skip the form and go directly
  //    But only do this AFTER we've read the next param
  useEffect(() => {
    if (!authCheckDone) return;

    const token = Cookies.get("token");
    if (token) {
      // Force server-side re-check (if using middleware) and navigate
      router.push(nextUrl);
      // If you still need a server re-check, you can do:
      // router.refresh();
    }
  }, [authCheckDone, nextUrl, router]);

  // 4) Form submission -> call login API
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const success = await login(username, password);
    console.log('isSuccess', success);
    if (success) {
      // Navigate to the originally intended page
      setTimeout(() => {
        router.push(nextUrl);
      }, 300);
      //window.location.href = nextUrl
    }
  }

  // If there's no token, render the login form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 sm:px-16 bg-black text-white">
      <h1 className="text-5xl font-extrabold mb-4">Sign In</h1>

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
              className="w-full px-4 py-2 bg-black border border-white/[.1] 
                         rounded-md text-white focus:outline-none 
                         focus:ring-2 focus:ring-white/50"
              required
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-black border border-white/[.1] 
                         rounded-md text-white focus:outline-none 
                         focus:ring-2 focus:ring-white/50"
              required
            />
          </div>

          {authError && <p className="text-red-500 text-sm">{authError}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-white text-black font-medium py-2 
                       rounded-md hover:bg-gray-300 transition"
          >
            {isLoading ? "Please wait..." : "Sign In"}
          </button>
        </div>
      </form>

      <p className="text-gray-500 text-sm mt-4">
        Don&apos;t have an account?
        <Link href="/signup" className="ml-1 text-white hover:underline">
          Sign Up
        </Link>
      </p>

      <Link
        href="/"
        className="mt-6 text-gray-500 text-sm hover:text-white transition"
      >
        ← Back to Home
      </Link>
    </div>
  );
}
