"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface AuthCheckProps {
  children: React.ReactNode;
}

const AuthCheck: React.FC<AuthCheckProps> = ({ children }) => {
  const router = useRouter();
  const [authCheckDone, setAuthCheckDone] = useState(false);
  const [nextUrl, setNextUrl] = useState("/");

  useEffect(() => {
    // Check token in cookies
    const token = Cookies.get("token");

    // Parse the ?next= param from the URL
    const params = new URLSearchParams(window.location.search);
    const nextParam = params.get("next") || "/miners";
    setNextUrl(nextParam);

    if (!token) {
      // If no token, redirect to login page with 'next' param
      router.push(`/login?next=${encodeURIComponent(nextParam)}`);
    }

    // Set authCheckDone to true to render the children
    setAuthCheckDone(true);
  }, [router]);

  // If the auth check is still in progress, show a smooth loading animation or transition
  if (!authCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full w-12 h-12 border-b-4 border-white"></div>
          <p className="mt-4 text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If we have a token, render the children smoothly
  return <>{children}</>;
};

export default AuthCheck;
