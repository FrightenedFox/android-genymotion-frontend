import { NextResponse } from "next/server";

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;

  try {
    const response = await fetch(`${API_URL}sessions/${sessionId}/end`, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to end session");
    }

    return NextResponse.json({ message: "Session ended successfully" });
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      { error: "Failed to end session" },
      { status: 500 }
    );
  }
}
