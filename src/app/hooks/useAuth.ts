"use client";
import { useState } from "react";
import Cookies from "js-cookie";
import { useAuthContext } from "@/app/context/AuthContext";
import { API_URL_V2, API_URL } from "@/constants/constants";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const [isLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { setIsLoggedIn } = useAuthContext();

  async function login(username: string, password: string) {
    try {
      //setIsLoading(true);
      setAuthError(null);

      const authHeader = "Basic " + btoa(`${username}:${password}`);

      const responseV2 = await fetch(`${API_URL_V2}pool/users`, {
        method: "GET",
        headers: { Authorization: authHeader },
      });
      if (!responseV2.ok) throw new Error("Login failed (v2)");
      const dataV2 = await responseV2.json();
      const { id, token } = dataV2;

      const responseLegacy = await fetch(`${API_URL}pool/users`, {
        method: "GET",
        headers: { Authorization: authHeader },
      });
      if (!responseLegacy.ok) throw new Error("Login failed (legacy)");
      const dataLegacy = await responseLegacy.json();
      const { token: legacyToken } = dataLegacy;

      const expirationTimestamp = Math.floor(Date.now() / 1000 + 86400*6).toString();

      // Store tokens in cookies
      Cookies.set("username", username, { expires: 6 });
      Cookies.set("id", id, { expires: 6 });
      Cookies.set("token", token, { expires: 6 });
      Cookies.set("legacyToken", legacyToken, { expires: 6 });
      Cookies.set("expiration", expirationTimestamp, { expires: 6 });
      //Cookies.set("expiration", expirationTimestamp, { expires: 1 });
      router.refresh()
      // Update global auth state
      setIsLoggedIn(true);
      //setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error("Login error:", err);
      //setIsLoading(false);
      setAuthError(err.message || "Login failed");
      return false;
    }
  }

  async function signup(username: string, password: string) {
    try {
      //setIsLoading(true);
      setAuthError(null);

      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch(`${API_URL_V2}pool/users`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      // If signup succeeded, auto-login
      if (data.username) {
        const didLogin = await login(username, password);
        if (!didLogin) {
          // If the auto-login failed for some reason, handle error
          throw new Error("Auto-login failed after signup");
        }
      }

      //setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error("Signup error:", err);
      //setIsLoading(false);
      setAuthError(err.message || "Signup failed");
      return false;
    }
  }

  return {
    login,
    signup,
    isLoading,
    authError,
  };
}
