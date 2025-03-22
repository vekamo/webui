"use client";
export const dynamic = "force-dynamic";

import React, { Suspense } from "react";
import Auth from "@/components/Auth";

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading signup page...</div>}>
      <Auth isSignUp={true} />
    </Suspense>
  );
}
