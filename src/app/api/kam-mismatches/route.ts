import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.BOOKING_PUBLIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const res = await fetch("https://book.photowaermo.de/api/public/kam-mismatches", {
    headers: { "x-api-key": apiKey },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Upstream error" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
