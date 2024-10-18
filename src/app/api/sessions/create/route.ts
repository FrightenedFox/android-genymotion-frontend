import { NextResponse } from "next/server";

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

export async function POST(request: Request) {
  const { user_ip, browser_info } = await request.json();

  try {
    const response = await fetch(`${API_URL}sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY!,
      },
      body: JSON.stringify({ user_ip, browser_info }),
    });

    if (!response.ok) {
      console.log("Failed to create session:", response.status, response.statusText);
      throw new Error("Failed to create session");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
