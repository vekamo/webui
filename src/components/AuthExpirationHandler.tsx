"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";
import { useAuth } from "@/app/hooks/useAuth";

export default function AuthExpirationHandler() {
  const { logout } = useAuth();

  useEffect(() => {
    const token = Cookies.get("token");
    const expiration = Cookies.get("expiration");

    if (token && expiration) {
      const expirationTimeMs = parseInt(expiration, 10) * 1000;
      const currentTimeMs = Date.now();

      if (currentTimeMs >= expirationTimeMs) {
        // Token already expired: log out immediately
        logout();
      } else {
        // Set timeout for auto-logout
        const timeout = expirationTimeMs - currentTimeMs;
        const timer = setTimeout(() => {
          logout();
        }, timeout);

        // Cleanup on unmount
        return () => clearTimeout(timer);
      }
    }
  }, [logout]);

  return null;
}
