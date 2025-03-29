"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
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

  const handleLogout = useCallback(() => {
    Cookies.remove("username");
    Cookies.remove("id");
    Cookies.remove("token", { path: "/" });
    Cookies.remove("legacyToken", { path: "/" });
    Cookies.remove("expiration");
    console.log("[AuthContext] -> handleLogout() => setIsLoggedIn(false)");
    setIsLoggedIn(false);
    router.refresh();
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
