"use client";

import React, { createContext, useContext, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

interface AuthContextValue {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  handleLogout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  handleLogout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /**
   * This is your logout function,
   * called by any component that needs to log out.
   */
  function handleLogout() {
    // Remove cookies
    Cookies.remove("username");
    Cookies.remove("id");
    Cookies.remove("token", { path: "/" });
    Cookies.remove("legacyToken", { path: "/" });
    Cookies.remove("expiration");

    // Flip auth state to false
    setIsLoggedIn(false);

    // Optionally refresh the page and redirect
    //setTimeout(() => {
    //  
    //}, 300);
    router.refresh();
    router.push("/login");
    //router.refresh();
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
