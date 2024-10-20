import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.ip || "Unknown";
  console.log("Retrieved user IP:", ip);
  return NextResponse.json({ ip });
}
