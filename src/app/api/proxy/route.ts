import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Path is required" }, { status: 400 });
  }

  const targetUrl = `${API_URL}${path}`;

  const headers = new Headers();
  headers.set("x-api-key", API_KEY!);
  headers.set("Content-Type", "application/json");

  const requestInit: RequestInit = {
    method: request.method,
    headers: headers,
  };

  if (request.method !== "GET") {
    const body = await request.text();
    requestInit.body = body;
  }

  console.log("Proxying request to:", targetUrl);

  try {
    const response = await fetch(targetUrl, requestInit);

    console.log("Response status:", response.status);

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
