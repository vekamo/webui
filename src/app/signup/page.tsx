"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAuth } from "@/app/hooks/useAuth";
import Link from "next/link";

export default function SignupPage() {
  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Track whether we've finished checking auth state
  const [authCheckDone, setAuthCheckDone] = useState(false);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  // We’ll store the `next` param after parsing from the URL
  const [nextUrl, setNextUrl] = useState("/miners");

  // Next.js 13 router for client-side navigation
  const router = useRouter();

  // Custom signup/login hooks
  const { signup, login, authError, isLoading: authIsLoading } = useAuth();

  // --------------------------------
  // 1) Our local loading state
  // --------------------------------
  const [localLoading, setLocalLoading] = useState(false);

  // --------------------------------
  // 2) On mount, check if user is already logged in and parse ?next= param
  // --------------------------------
  useEffect(() => {
    const token = Cookies.get("token");
    setAlreadyLoggedIn(!!token);
    setAuthCheckDone(true);

    // Parse ?next= if in the browser
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const nextParam = params.get("next") || "/miners";
      setNextUrl(nextParam);
    }
  }, []);

  // --------------------------------
  // 3) If we're already logged in, redirect right away
  // --------------------------------
  useEffect(() => {
    if (!authCheckDone) return;
    if (alreadyLoggedIn) {
      router.push(nextUrl);
      router.refresh();
    }
  }, [authCheckDone, alreadyLoggedIn, nextUrl, router]);

  // --------------------------------
  // 4) Signup form submission
  // --------------------------------
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Turn on local loading
    setLocalLoading(true);

    const success = await signup(username, password);

    // Turn local loading off
    setLocalLoading(false);

    if (success) {
      // If signup is successful, redirect after a short delay
      setTimeout(() => {
        router.refresh();
        router.push(nextUrl);
      }, 1000);

      // If you also want to auto-login after signup, you could do:
      // const loginSuccess = await login(username, password);
      // if (loginSuccess) {
      //   router.push(nextUrl);
      // }
    }
  }

  // --------------------------------
  // 5) If we're still checking auth, show a loader
  // --------------------------------
  if (!authCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Checking authentication...</p>
      </div>
    );
  }

  // --------------------------------
  // 6) If already logged in, we've already redirected above
  // --------------------------------
  if (alreadyLoggedIn) {
    // No UI needed here because we redirect in useEffect
    return null;
  }

  // --------------------------------
  // 7) Combine localLoading + authIsLoading
  // --------------------------------
  const buttonIsLoading = localLoading || authIsLoading;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 sm:px-16 bg-black text-white">
      <h1 className="text-5xl font-extrabold mb-4">Sign Up</h1>

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
            disabled={buttonIsLoading}
            className="w-full mt-4 bg-white text-black font-medium py-2 
                       rounded-md hover:bg-gray-300 transition disabled:opacity-70"
          >
            {buttonIsLoading ? "Please wait..." : "Sign Up"}
          </button>
        </div>
      </form>

      <p className="text-gray-500 text-sm mt-4">
        Already have an account?{" "}
        <Link href="/login" className="ml-1 text-white hover:underline">
          Sign In
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
