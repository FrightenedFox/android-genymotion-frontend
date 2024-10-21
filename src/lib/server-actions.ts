"use server";

import { AMI, Session, Game, ApiResult } from "@/types";

const API_URL = process.env.API_URL!;
const API_KEY = process.env.API_KEY!;

// Helper function to make API requests
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const url = `${API_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
    ...options.headers,
  };

  console.log(`Making API request to ${url} with options:`, options);

  try {
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `API request failed: ${response.status} ${response.statusText}`,
        errorText
      );
      // Return an error instead of throwing
      return {
        success: false,
        error: errorText || response.statusText,
      };
    }

    const data = await response.json();
    console.log(`Received API response from ${url}:`, data);
    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    console.error(`API request error:`, error);
    let errorMessage = "An unknown error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function getAmis(): Promise<ApiResult<AMI[]>> {
  console.log("Fetching AMIs (server-side)");
  return apiFetch<AMI[]>("/amis");
}

export async function getRecommendedAmi(): Promise<ApiResult<AMI>> {
  console.log("Fetching recommended AMI (server-side)");
  return apiFetch<AMI>("/amis/recommended");
}

export async function createSession(
  year: number,
  userIp: string,
  browserInfo: string
): Promise<ApiResult<Session>> {
  console.log(`Creating session for year ${year} (server-side)`);
  return apiFetch<Session>(`/sessions/${year}`, {
    method: "POST",
    body: JSON.stringify({ user_ip: userIp, browser_info: browserInfo }),
  });
}

export async function fetchSessionData(sessionId: string): Promise<ApiResult<Session>> {
  console.log(`Fetching session data for sessionId ${sessionId} (server-side)`);
  return apiFetch<Session>(`/sessions/${sessionId}`);
}

export async function endSession(sessionId: string): Promise<ApiResult<void>> {
  console.log(`Ending session ${sessionId} (server-side)`);
  return apiFetch<void>(`/sessions/${sessionId}/end`, { method: "POST" });
}

export async function fetchGames(amiId: string): Promise<ApiResult<Game[]>> {
  console.log(`Fetching games for AMI ${amiId} (server-side)`);
  return apiFetch<Game[]>(`/games/ami/${amiId}`);
}

export async function fetchRecommendedGame(amiId: string): Promise<ApiResult<Game>> {
  console.log(`Fetching recommended game for AMI ${amiId} (server-side)`);
  return apiFetch<Game>(`/games/ami/${amiId}/recommended`);
}

export async function startGame(
  sessionId: string,
  gameId: string
): Promise<ApiResult<void>> {
  console.log(`Starting game ${gameId} for session ${sessionId} (server-side)`);
  return apiFetch<void>(`/sessions/${sessionId}/games/${gameId}/start`, {
    method: "POST",
  });
}

export async function stopGame(sessionId: string): Promise<ApiResult<void>> {
  console.log(`Stopping game for session ${sessionId} (server-side)`);
  return apiFetch<void>(`/sessions/${sessionId}/games/stop`, { method: "POST" });
}

export async function pingSession(sessionId: string): Promise<ApiResult<void>> {
  console.log(`Pinging session ${sessionId} (server-side)`);
  return apiFetch<void>(`/sessions/${sessionId}/ping`);
}
