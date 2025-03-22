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

  // Auth check state
  const [authCheckDone, setAuthCheckDone] = useState(false);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  // We'll store the `next` param once we parse it from the URL
  const [nextUrl, setNextUrl] = useState("/miners");

  // Next.js 13 router for client-side navigation
  const router = useRouter();

  // Our custom signup/login hooks (adjust if your code differs)
  const { signup, login, authError, isLoading } = useAuth();

  // Check for an existing token on mount
  // and parse any ?next= param manually from the browser
  useEffect(() => {
    // Check if a token is already set => user is logged in
    const token = Cookies.get("token");
    setAlreadyLoggedIn(!!token);
    setAuthCheckDone(true);

    // If we're in the browser, parse ?next= from window.location.search
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const nextParam = params.get("next") || "/miners";
      setNextUrl(nextParam);
    }
  }, []);

  // Submit handler for the signup form
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const success = await signup(username, password);
    if (success) {
      // If signup is successful, redirect to "nextUrl"
      router.push(nextUrl);

      // If you also want to auto-login after signup, you could do:
      /*
      const loginSuccess = await login(username, password);
      if (loginSuccess) {
        router.push(nextUrl);
      }
      */
    }
  }

  // If we haven't finished checking the user’s auth state, show a loader
  if (!authCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Checking authentication...</p>
      </div>
    );
  }

  // If already logged in, immediately redirect to nextUrl
  if (alreadyLoggedIn) {
    router.push(nextUrl);
    router.refresh()
    return null;
  }

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
                         rounded-md text-white focus:outline-none focus:ring-2 
                         focus:ring-white/50"
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
                         rounded-md text-white focus:outline-none focus:ring-2 
                         focus:ring-white/50"
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
            {isLoading ? "Please wait..." : "Sign Up"}
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
