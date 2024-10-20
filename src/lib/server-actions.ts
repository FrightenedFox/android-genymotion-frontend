"use server";

import { AMI, Session, Game } from "@/types";

const API_URL = process.env.API_URL!;
const API_KEY = process.env.API_KEY!;

// Helper function to make API requests
async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
    ...options.headers,
  };

  console.log(`Making API request to ${url} with options:`, options);

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `API request failed: ${response.status} ${response.statusText}`,
      errorText
    );
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  console.log(`Received API response from ${url}:`, data);
  return data;
}

export async function getAmis(): Promise<AMI[]> {
  console.log("Fetching AMIs (server-side)");
  return apiFetch("/amis");
}

export async function getRecommendedAmi(): Promise<AMI> {
  console.log("Fetching recommended AMI (server-side)");
  return apiFetch("/amis/recommended");
}

export async function createSession(
  year: number,
  userIp: string,
  browserInfo: string
): Promise<Session> {
  console.log(`Creating session for year ${year} (server-side)`);
  return apiFetch(`/sessions/${year}`, {
    method: "POST",
    body: JSON.stringify({ user_ip: userIp, browser_info: browserInfo }),
  });
}

export async function fetchSessionData(sessionId: string): Promise<Session> {
  console.log(`Fetching session data for sessionId ${sessionId} (server-side)`);
  return apiFetch(`/sessions/${sessionId}`);
}

export async function endSession(sessionId: string): Promise<void> {
  console.log(`Ending session ${sessionId} (server-side)`);
  await apiFetch(`/sessions/${sessionId}/end`, { method: "POST" });
}

export async function fetchGames(amiId: string): Promise<Game[]> {
  console.log(`Fetching games for AMI ${amiId} (server-side)`);
  return apiFetch(`/games/ami/${amiId}`);
}

export async function fetchRecommendedGame(amiId: string): Promise<Game> {
  console.log(`Fetching recommended game for AMI ${amiId} (server-side)`);
  return apiFetch(`/games/ami/${amiId}/recommended`);
}

export async function startGame(
  sessionId: string,
  gameId: string
): Promise<void> {
  console.log(`Starting game ${gameId} for session ${sessionId} (server-side)`);
  await apiFetch(`/sessions/${sessionId}/games/${gameId}/start`, {
    method: "POST",
  });
}

export async function stopGame(sessionId: string): Promise<void> {
  console.log(`Stopping game for session ${sessionId} (server-side)`);
  await apiFetch(`/sessions/${sessionId}/games/stop`, { method: "POST" });
}
