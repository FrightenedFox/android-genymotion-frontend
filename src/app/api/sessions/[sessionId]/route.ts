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
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch session status");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching session status:", error);
    return NextResponse.json(
      { error: "Failed to fetch session status" },
      { status: 500 }
    );
  }
}
