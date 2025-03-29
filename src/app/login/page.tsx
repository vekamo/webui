import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";
import LoginForm from "./LoginForm";

export default async function LoginPage(props: any) {
  // We extract searchParams from props (typed as `any` to avoid conflicts)
  const { searchParams } = props;

  // If you're on Next 13.2–13.3, cookies() might be async, so we await it:
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  const sParams = await searchParams;
  const nextUrl = sParams?.next || "/miners";

  if (token) {
    redirect(nextUrl);
  }

  return <LoginForm />
}
