"use client";

import { useState, useEffect, useCallback } from "react";
import { useCookies } from "react-cookie";
import { AMI, Game, Session } from "@/types";
import { Instructions } from "@/components/Instructions";
import { GameList } from "@/components/GameList";
import { AndroidScreen } from "@/components/AndroidScreen";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  createSession,
  fetchSessionData,
  endSession,
  fetchGames,
  fetchRecommendedGame,
  startGame,
  stopGame,
} from "@/lib/server-actions";

interface HomeClientProps {
  amis: AMI[];
  recommendedAmi: AMI;
}

export default function HomeClient({ amis, recommendedAmi }: HomeClientProps) {
  console.log("Rendering HomeClient (client-side)");

  const [cookies, setCookie, removeCookie] = useCookies(["genymotion_session"]);
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [selectedAmi, setSelectedAmi] = useState<string>("recommended");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [games, setGames] = useState<Game[]>([]);
  const [recommendedGame, setRecommendedGame] = useState<Game | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isStartingGame, setIsStartingGame] = useState<boolean>(false);

  const [userIp, setUserIp] = useState<string>("");

  // Fetch user IP on mount
  useEffect(() => {
    console.log("Fetching user IP");
    fetch("/api/get-ip")
      .then((res) => res.json())
      .then((data) => {
        setUserIp(data.ip);
        console.log("User IP:", data.ip);
      })
      .catch((err) => console.error("Error fetching user IP:", err));
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const sessionId = cookies.genymotion_session;
    if (sessionId) {
      console.log("Found existing session ID in cookies:", sessionId);
      fetchSessionData(sessionId)
        .then((data) => {
          console.log("Fetched existing session data:", data);
          setSessionData(data);
        })
        .catch((err) => {
          console.error("Error fetching existing session data:", err);
          removeCookie("genymotion_session");
        });
    }
  }, [cookies.genymotion_session, removeCookie]);

  // Polling for sessionData updates until ssl_configured is true
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (sessionData && !sessionData.ssl_configured) {
      // Start polling every 10 seconds
      console.log("Starting polling for sessionData updates");
      intervalId = setInterval(async () => {
        try {
          const updatedSessionData = await fetchSessionData(sessionData.SK);
          console.log("Updated session data:", updatedSessionData);
          setSessionData(updatedSessionData);

          if (updatedSessionData.ssl_configured) {
            // Session is ready, clear interval
            console.log("Session is ready, stopping polling");
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error("Error fetching session data during polling:", error);
        }
      }, 10000); // 10 seconds
    }

    // Cleanup function to clear the interval when the component unmounts or when sessionData changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [sessionData]);

  // Fetch games when sessionData changes
  useEffect(() => {
    if (sessionData?.ami_id) {
      console.log("Fetching games for AMI ID:", sessionData.ami_id);
      fetchGames(sessionData.ami_id)
        .then((games) => {
          setGames(games);
          console.log("Fetched games:", games);
        })
        .catch((err) => console.error("Error fetching games:", err));

      fetchRecommendedGame(sessionData.ami_id)
        .then((game) => {
          setRecommendedGame(game);
          console.log("Fetched recommended game:", game);
        })
        .catch((err) => console.error("Error fetching recommended game:", err));
    }
  }, [sessionData]);

  // Start session action
  const handleStartSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const selectedAmiObj =
      selectedAmi === "recommended"
        ? recommendedAmi
        : amis.find((ami) => ami.SK === selectedAmi);

    if (!selectedAmiObj) {
      setError("No AMI selected");
      setIsLoading(false);
      return;
    }

    const year = selectedAmiObj.representing_year;

    try {
      const session = await createSession(year, userIp, navigator.userAgent);
      console.log("Session created:", session);
      setSessionData(session);
      setCookie("genymotion_session", session.SK, { path: "/" });
    } catch (err) {
      console.error("Error creating session:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [amis, recommendedAmi, selectedAmi, userIp, setCookie]);

  // Handle game selection
  const handleGameSelect = useCallback(
    async (game: Game) => {
      if (!sessionData) return;

      setIsStartingGame(true);
      setError(null);

      try {
        await startGame(sessionData.SK, game.SK);
        console.log("Game started:", game);
        setSelectedGame(game);
      } catch (err) {
        console.error("Error starting game:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsStartingGame(false);
      }
    },
    [sessionData]
  );

  // Handle stopping the game
  const handleStopGame = useCallback(async () => {
    if (!sessionData) return;

    setIsLoading(true);
    setError(null);

    try {
      await stopGame(sessionData.SK);
      console.log("Game stopped");
      setSelectedGame(null);
    } catch (err) {
      console.error("Error stopping game:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [sessionData]);

  // Handle changing the session
  const handleChangeSession = useCallback(async () => {
    if (!sessionData) return;

    setIsLoading(true);
    setError(null);

    try {
      await endSession(sessionData.SK);
      console.log("Session ended");
      removeCookie("genymotion_session");
      setSessionData(null);
      setSelectedGame(null);
      setGames([]);
      setRecommendedGame(null);

      await handleStartSession();
    } catch (err) {
      console.error("Error changing session:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [sessionData, removeCookie, handleStartSession]);

  // Disable buttons until session is fully initialized
  const isSessionReady = sessionData?.ssl_configured;

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 bg-gray-100">
        <h1 className="text-2xl font-bold">Android Game Tester</h1>
      </header>

      <main className="flex-grow overflow-hidden flex flex-col">
        {!sessionData ? (
          <div className="p-4 overflow-auto">
            <Instructions />
            <div className="flex space-x-4 mb-4">
              <Select value={selectedAmi} onValueChange={setSelectedAmi}>
                <SelectTrigger className="w-[200px]">
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
              <Button onClick={handleStartSession} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Start Session
              </Button>
            </div>
            {error && <p className="text-red-500">{error}</p>}
          </div>
        ) : !selectedGame ? (
          <>
            {!isSessionReady ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                <span>Initializing Session...</span>
              </div>
            ) : (
              <div className="p-4 overflow-auto">
                <GameList
                  games={games}
                  recommendedGame={recommendedGame}
                  onSelectGame={handleGameSelect}
                  isStartingGame={isStartingGame}
                  sessionReady={isSessionReady}
                />
              </div>
            )}
          </>
        ) : (
          <AndroidScreen
            instanceAddress={`${sessionData.SK}.session.morskyi.org` || ""}
            instanceId={sessionData.instance_id || ""}
          />
        )}
      </main>

      <footer className="p-4 bg-gray-100 flex justify-between items-center">
        {sessionData && (
          <>
            <div className="flex space-x-4">
              <Select value={selectedAmi} onValueChange={setSelectedAmi}>
                <SelectTrigger className="w-[200px]">
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
                disabled={isLoading || !isSessionReady}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Change Session
              </Button>
            </div>
            {selectedGame && (
              <Button
                onClick={handleStopGame}
                variant="secondary"
                disabled={isLoading}
              >
                Stop Game
              </Button>
            )}
          </>
        )}
      </footer>
    </div>
  );
}
