"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAuth } from "@/app/hooks/useAuth";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authCheckDone, setAuthCheckDone] = useState(false);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  const router = useRouter();
  const nextUrl = "/miners"; // fixed redirect target
  const { login, authError, isLoading } = useAuth();

  // Check for an existing token on mount
  useEffect(() => {
    const token = Cookies.get("token");
    setAlreadyLoggedIn(!!token);
    setAuthCheckDone(true);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      router.push(nextUrl);
    }
  }

  if (!authCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (alreadyLoggedIn) {
    router.push(nextUrl);
    return null;
  }

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
              className="w-full px-4 py-2 bg-black border border-white/[.1] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-black border border-white/[.1] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
          </div>

          {authError && <p className="text-red-500 text-sm">{authError}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-white text-black font-medium py-2 rounded-md hover:bg-gray-300 transition"
          >
            {isLoading ? "Please wait..." : "Sign In"}
          </button>
        </div>
      </form>

      <p className="text-gray-500 text-sm mt-4">
        Don&apos;t have an account?{" "}
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
