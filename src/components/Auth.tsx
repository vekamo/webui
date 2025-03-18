"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"; // or your cookie method
import { useAuth } from "@/app/hooks/useAuth";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const router = useRouter();
  const { login, signup, logout, authError, isLoading } = useAuth();

  // Check if user is logged in (via cookie) on component mount
  useEffect(() => {
    const token = Cookies.get("token");
    setIsLoggedIn(!!token);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isSignUp) {
      // Sign Up
      const result = await signup(username, password);
      if (result) {
        router.push("/miners");
      }
    } else {
      // Sign In
      const result = await login(username, password);
      if (result) {
        router.push("/miners");
      }
    }
  }

  function handleLogout() {
    logout();
    setIsLoggedIn(false);
  }

  // 1) If already logged in, replace sign in/up form with a logout button
  if (isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8 sm:px-16 bg-black text-white">
        <h1 className="text-3xl font-extrabold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          You are already logged in!
        </h1>
        <button
          onClick={handleLogout}
          className="rounded-full border border-white/[.1] transition-colors flex items-center justify-center bg-white text-black hover:bg-gray-300 font-medium text-sm sm:text-base h-10 sm:h-12 px-5 sm:w-auto"
        >
          Logout
        </button>
        <Link href="/miners" className="mt-6 text-gray-500 text-sm hover:text-white transition">
          Go to Miners →
        </Link>
      </div>
    );
  }

  // 2) If not logged in, show sign in/up form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 sm:px-16 bg-black text-white">
      {/* Title */}
      <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
        {isSignUp ? "Create an Account" : "Sign In"}
      </h1>
      <p className="text-gray-400 text-md sm:text-lg mt-2">
        {isSignUp ? "Join MWC Pool and start mining." : "Log in to track your mining performance."}
      </p>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-black/[.15] border border-white/[.1] p-6 mt-6 rounded-lg shadow-lg"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-gray-400 text-sm font-[family-name:var(--font-geist-mono)]">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-black border border-white/[.1] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm font-[family-name:var(--font-geist-mono)]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-black border border-white/[.1] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
          </div>

          {/* Show error if any */}
          {authError && <p className="text-red-500 text-sm">{authError}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-white text-black font-medium py-2 rounded-md hover:bg-gray-300 transition"
          >
            {isLoading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </form>

      {/* Toggle Between Login & Sign Up */}
      <p className="text-gray-500 text-sm mt-4">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}
        <button onClick={() => setIsSignUp(!isSignUp)} className="ml-1 text-white hover:underline">
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </p>

      {/* Back to Home */}
      <Link href="/" className="mt-6 text-gray-500 text-sm hover:text-white transition">
        ← Back to Home
      </Link>
    </div>
  );
}
