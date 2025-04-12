"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { useAuth } from "@/app/hooks/useAuth";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pull the ?next= param from the URL, default to "/miners"
  const nextUrl = searchParams.get("next") || "/miners";

  // Local form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Our custom auth hook
  const { login, authError, isLoading: authIsLoading } = useAuth();

  // We'll also track a local loading state
  const [localLoading, setLocalLoading] = useState(false);
  const buttonIsLoading = localLoading || authIsLoading;

  // --------------------------------
  // 1) Handle form submission
  // --------------------------------
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalLoading(true);

    const success = await login(username, password);
    if (success) {
      router.refresh();
      router.push(nextUrl); // go to nextUrl upon success
    }

    setLocalLoading(false);
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
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-black border border-white/[.1] 
                         rounded-md text-white focus:outline-none 
                         focus:ring-2 focus:ring-white/50"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-black border border-white/[.1] 
                         rounded-md text-white focus:outline-none 
                         focus:ring-2 focus:ring-white/50"
            />
          </div>

          {/* Display any auth error */}
          {authError && <p className="text-red-500 text-sm">{authError}</p>}

          <button
            type="submit"
            disabled={buttonIsLoading}
            className={`w-full mt-4 bg-white text-black font-medium py-2 
                        rounded-md hover:bg-gray-300 transition disabled:opacity-70 
                        ${
                          buttonIsLoading
                            ? "cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
          >
            {buttonIsLoading ? "Please wait..." : "Sign In"}
          </button>
        </div>
      </form>

      {/* 
        ADDITIONAL LINKS FOR 
        "Don't have an account?" and "Back to Home" 
      */}
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
