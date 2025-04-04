import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function PayoutLayout({ children }: { children: React.ReactNode }) {
  // read the cookie on the server
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  // if no token => redirect
  if (!token) {
    // optionally preserve next=... in the query if you like
    redirect("/login?next=/payout");
  }

  // otherwise, render children
  return <>{children}</>;
}