"use client";
export const dynamic = "force-dynamic"; 
// or "force-no-static", either one will disable SSR/SSG for this route

import React, { Suspense } from "react";
import Auth from "@/components/Auth";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading login page...</div>}>
      <Auth isSignUp={false} />
    </Suspense>
  );
}
