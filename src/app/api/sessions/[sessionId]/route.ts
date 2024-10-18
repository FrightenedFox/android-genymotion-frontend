import { NextResponse } from "next/server";

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;

  try {
    const response = await fetch(`${API_URL}sessions/${sessionId}`, {
      headers: {
        "x-api-key": API_KEY!,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch session status");
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Error fetching session status:", error);
    return NextResponse.json({ error: "Failed to fetch session status" }, { status: 500 });
  }
}