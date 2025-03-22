// /app/api/login/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  const authHeader = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

  const responseV2 = await fetch(`${process.env.API_URL_V2}pool/users`, {
    method: "GET",
    headers: { Authorization: authHeader },
  });

  if (!responseV2.ok) return NextResponse.json({ success: false }, { status: 401 });

  const { token } = await responseV2.json();

  const res = NextResponse.json({ success: true });

  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return res;
}

