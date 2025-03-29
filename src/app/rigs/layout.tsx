import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function RigsLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  if (!token) {
    redirect("/login?next=/rigs");
  }
  return <>{children}</>;
}