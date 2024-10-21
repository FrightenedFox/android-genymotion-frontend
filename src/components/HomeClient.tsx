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
  pingSession,
} from "@/lib/server-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define the ApiError interface
interface ApiError {
  status: number;
  statusText: string;
  errorText: string;
}

// Type guard to check if an error is of type ApiError
function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    "statusText" in err &&
    "errorText" in err
  );
}

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

  const [gameTimer, setGameTimer] = useState<NodeJS.Timeout | null>(null);
  const [showGameAlert, setShowGameAlert] = useState<boolean>(false);

  // Sort AMIs in descending order
  const sortedAmis = [...amis].sort(
    (a, b) => b.representing_year - a.representing_year
  );

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
          if (data.scheduled_for_deletion || data.end_time) {
            console.log("Session is no longer active");
            removeCookie("genymotion_session");
          } else {
            setSessionData(data);
          }
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
          if (
            updatedSessionData.scheduled_for_deletion ||
            updatedSessionData.end_time
          ) {
            console.log("Session is no longer active");
            removeCookie("genymotion_session");
            setSessionData(null);
            clearInterval(intervalId);
          } else {
            setSessionData(updatedSessionData);
            if (updatedSessionData.ssl_configured) {
              // Session is ready, clear interval
              console.log("Session is ready, stopping polling");
              clearInterval(intervalId);
            }
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
  }, [sessionData, removeCookie]);

  // Ping session every minute to keep it active
  useEffect(() => {
    let pingInterval: NodeJS.Timeout;

    if (sessionData) {
      // Start pinging every minute
      console.log("Starting ping interval for session");
      pingInterval = setInterval(async () => {
        try {
          await pingSession(sessionData.SK);
          console.log("Session pinged successfully");
        } catch (error) {
          console.error("Error pinging session:", error);
          // Optionally handle session expiration or other ping errors here
        }
      }, 60000); // 1 minute
    }

    return () => {
      if (pingInterval) {
        clearInterval(pingInterval);
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
      if (isApiError(err) && err.status === 503) {
        setError(
          "You have reached your EC2 vCPU limit. Unable to create more instances at this time. Please try again later or select a different year."
        );
      } else if (isApiError(err)) {
        setError(err.errorText || "An unknown error occurred");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, [amis, recommendedAmi, selectedAmi, userIp, setCookie]);

  // Handle stopping the game
  const handleStopGame = useCallback(async () => {
    if (!sessionData) return;

    setIsLoading(true);
    setError(null);

    try {
      await stopGame(sessionData.SK);
      console.log("Game stopped");
      setSelectedGame(null);

      // Clear the game timer
      if (gameTimer) {
        clearTimeout(gameTimer);
        setGameTimer(null);
      }
    } catch (err) {
      console.error("Error stopping game:", err);
      if (isApiError(err)) {
        setError(err.errorText || "An unknown error occurred");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionData, gameTimer]);

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

        // Start 15-minute timer
        if (gameTimer) {
          clearTimeout(gameTimer);
        }
        const timer = setTimeout(() => {
          // Stop the game after 15 minutes
          handleStopGame();
          setShowGameAlert(true);
        }, 15 * 60 * 1000); // 15 minutes

        setGameTimer(timer);
      } catch (err) {
        console.error("Error starting game:", err);
        if (isApiError(err)) {
          setError(err.errorText || "An unknown error occurred");
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setIsStartingGame(false);
      }
    },
    [sessionData, gameTimer, handleStopGame]
  );

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
      if (isApiError(err)) {
        setError(err.errorText || "An unknown error occurred");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionData, removeCookie, handleStartSession]);

  // Disable buttons until session is fully initialized
  const isSessionReady = sessionData?.ssl_configured;

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (gameTimer) {
        clearTimeout(gameTimer);
      }
    };
  }, [gameTimer]);

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
                  {sortedAmis.map((ami) => (
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
            {isLoading && (
              <div className="flex items-center justify-center mt-4">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span>Loading...</span>
              </div>
            )}
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        ) : !selectedGame ? (
          <>
            {!isSessionReady ? (
              <div className="p-4 overflow-auto">
                <Instructions />
                <div className="flex items-center justify-center h-full mt-4">
                  <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                  <span>Initializing Session...</span>
                </div>
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
            instanceId={sessionData.instance.instance_id || ""}
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
                  {sortedAmis.map((ami) => (
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

      {showGameAlert && (
        <AlertDialog open={showGameAlert} onOpenChange={setShowGameAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Time&apos;s Up!</AlertDialogTitle>
              <AlertDialogDescription>
                You&apos;ve been playing this game for 15 minutes. Please try
                playing another game.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowGameAlert(false)}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
