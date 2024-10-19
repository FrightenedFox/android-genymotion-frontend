// src/app/page.tsx

"use client";

import { useEffect, useState } from "react";
import { AndroidScreen } from "@/components/AndroidScreen";
import { GameList } from "@/components/GameList";
import { Instructions } from "@/components/Instructions";
import { useSession } from "@/app/hooks/useSession";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Game, AMI } from "@/types";
import { Loader2 } from "lucide-react";
import Cookies from "js-cookie";

const SESSION_COOKIE_NAME = "genymotion_session";

export default function Home() {
  const {
    sessionData,
    isLoading,
    error: sessionError,
    amis,
    recommendedAmi,
    createSession,
    setSessionData,
  } = useSession();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [recommendedGame, setRecommendedGame] = useState<Game | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedAmi, setSelectedAmi] = useState<string>("recommended");
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStartingGame, setIsStartingGame] = useState<boolean>(false);

  // Fetch games when sessionData changes and session is running
  useEffect(() => {
    const fetchGames = async (amiId: string) => {
      try {
        const response = await fetch(`/api/proxy?path=/games/ami/${amiId}`);
        if (!response.ok) throw new Error("Failed to fetch games");
        const fetchedGames: Game[] = await response.json();
        setGames(fetchedGames);

        const recommendedResponse = await fetch(
          `/api/proxy?path=/games/ami/${amiId}/recommended`
        );
        if (recommendedResponse.ok) {
          const recommendedGame: Game = await recommendedResponse.json();
          setRecommendedGame(recommendedGame);
        }
      } catch (error) {
        console.error("Error fetching games:", error);
        setError("Failed to fetch games.");
      }
    };

    if (sessionData?.instance?.instance_state === "running" && !games.length) {
      fetchGames(sessionData.ami_id);
    }
  }, [sessionData, games.length]);

  // Check if 15 minutes have passed since game started
  useEffect(() => {
    if (gameStartTime) {
      const checkGameTime = () => {
        if (Date.now() - gameStartTime > 15 * 60 * 1000) {
          stopGame();
          alert(
            "Your 15 minutes of playtime have expired. Please select another game or change the session."
          );
        }
      };
      const interval = setInterval(checkGameTime, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [gameStartTime]);

  const handleStartSession = async () => {
    const amiId = selectedAmi === "recommended" ? recommendedAmi?.SK : selectedAmi;
    if (amiId) {
      await createSession(amiId);
    } else {
      setError("No AMI selected.");
    }
  };

  const handleChangeSession = async () => {
    // End the current session
    if (sessionData?.SK) {
      try {
        const response = await fetch(`/api/proxy?path=/sessions/${sessionData.SK}/end`, {
          method: "POST",
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to end session: ${response.status} ${response.statusText}. ${errorText}`
          );
        }
        Cookies.remove(SESSION_COOKIE_NAME);
        setSessionData(null);
        setSelectedGame(null);
        setGames([]);
        setRecommendedGame(null);
      } catch (error) {
        console.error("Error ending session:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      }
    }
    await handleStartSession();
  };

  const handleGameSelect = async (game: Game) => {
    if (!sessionData?.SK) return;

    setIsStartingGame(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/proxy?path=/sessions/${sessionData.SK}/games/${game.SK}/start`,
        { method: "POST" }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to start game: ${response.status} ${response.statusText}. ${errorText}`
        );
      }
      // Wait for 5 seconds before displaying the AndroidScreen
      await new Promise((resolve) => setTimeout(resolve, 5000));
      setSelectedGame(game);
      setGameStartTime(Date.now());
    } catch (error) {
      console.error("Error starting game:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsStartingGame(false);
    }
  };

  const stopGame = async () => {
    if (!sessionData?.SK) return;

    try {
      const response = await fetch(`/api/proxy?path=/sessions/${sessionData.SK}/games/stop`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to stop game: ${response.status} ${response.statusText}. ${errorText}`
        );
      }
      setSelectedGame(null);
      setGameStartTime(null);
    } catch (error) {
      console.error("Error stopping game:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 bg-gray-100">
        <h1 className="text-2xl font-bold">Android Game Tester</h1>
      </header>

      <main className="flex-grow overflow-hidden flex flex-col">
        {!sessionData ? (
          <div className="p-4 overflow-auto">
            <Instructions />
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-4">
              <Select value={selectedAmi} onValueChange={setSelectedAmi}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {recommendedAmi && (
                    <SelectItem value="recommended">
                      Recommended ({recommendedAmi.representing_year})
                    </SelectItem>
                  )}
                  {amis.map((ami) => (
                    <SelectItem key={ami.SK} value={ami.SK}>
                      {ami.representing_year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleStartSession} disabled={isLoading} className="mt-2 sm:mt-0">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Start Session
              </Button>
            </div>
            {error && <p className="text-red-500 mb-2">{error}</p>}
            {sessionError && <p className="text-red-500 mb-2">{sessionError}</p>}
          </div>
        ) : !selectedGame ? (
          sessionData.instance?.instance_state === "running" ? (
            <div className="p-4 overflow-auto">
              <GameList
                games={games}
                recommendedGame={recommendedGame}
                onSelectGame={handleGameSelect}
                isStartingGame={isStartingGame}
                sessionReady={sessionData.instance?.instance_state === "running"}
              />
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
          ) : (
            // Show a loading state while the instance is initializing
            <div className="flex items-center justify-center h-full">
              <Loader2 className="mr-2 h-8 w-8 animate-spin" />
              <span>Initializing Genymotion Instance...</span>
            </div>
          )
        ) : (
          <AndroidScreen
            instanceAddress={sessionData.instance?.secure_address || ""}
            instanceId={sessionData.instance?.instance_id || ""}
          />
        )}
      </main>

      <footer className="p-4 bg-gray-100 flex flex-col sm:flex-row justify-between items-center">
        {sessionData && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <Select value={selectedAmi} onValueChange={setSelectedAmi}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {recommendedAmi && (
                    <SelectItem value="recommended">
                      Recommended ({recommendedAmi.representing_year})
                    </SelectItem>
                  )}
                  {amis.map((ami) => (
                    <SelectItem key={ami.SK} value={ami.SK}>
                      {ami.representing_year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleChangeSession}
                variant="secondary"
                disabled={isLoading}
                className="mt-2 sm:mt-0"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Change Session
              </Button>
            </div>
            {selectedGame && (
              <Button onClick={stopGame} variant="secondary" className="mt-4 sm:mt-0">
                Stop Game
              </Button>
            )}
          </>
        )}
      </footer>
    </div>
  );
}
