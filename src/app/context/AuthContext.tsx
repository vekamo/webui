"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import Cookies from "js-cookie";

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (logged: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 1) Immediately check if "token" cookie exists
  const hasToken = !!Cookies.get("token");
  // 2) Set isLoggedIn based on that cookie from the start
  const [isLoggedIn, setIsLoggedIn] = useState(hasToken);

  // If you like, you can still watch or update this 
  // with a useEffect if the token changes – 
  // but for the "refresh" race issue, 
  // this sync read is enough.

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
