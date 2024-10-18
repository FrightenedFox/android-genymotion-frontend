import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";

interface SessionData {
  PK: string;
  SK: string;
  instance: {
    instance_id: string;
    instance_type: string;
    instance_state: string;
    instance_ip: string | null;
    instance_aws_address: string | null;
    ssl_configured: boolean;
    secure_address: string | null;
  };
  user_ip: string;
  browser_info: string;
  start_time: string;
  end_time: string | null;
  last_accessed_on: string | null;
}

const SESSION_COOKIE_NAME = "genymotion_session";
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const INITIAL_DELAY = 5000; // 5 seconds delay after session creation

export function useSession() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessionData = useCallback(async (sessionId: string): Promise<SessionData> => {
    const response = await fetch(`/api/sessions/${sessionId}`, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch session status");
    }

    return await response.json();
  }, []);

  const createSession = useCallback(async () => {
    console.log("Creating a new session...");
    try {
      const response = await fetch("/api/sessions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
        cache: "no-store",
        body: JSON.stringify({
          user_ip: "127.0.0.1", // Replace with actual user IP
          browser_info: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const data: SessionData = await response.json();
      console.log("New session created:", data);
      setSessionData(data);
      Cookies.set(SESSION_COOKIE_NAME, data.SK);

      console.log(`Waiting ${INITIAL_DELAY / 1000} seconds before verifying session...`);
      await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY));
      await verifySession(data.SK);
    } catch (error) {
      console.error("Error creating session:", error);
      setIsLoading(false);
    }
  }, []);

  const verifySession = useCallback(async (sessionId: string) => {
    console.log("Verifying session:", sessionId);
    try {
      const data = await fetchSessionData(sessionId);
      console.log("Session data received:", data);

      if (
        !data.instance ||
        data.instance.instance_state === "shutting-down" ||
        data.instance.instance_state === "terminated"
      ) {
        console.log("Instance not running or shutting down, creating new session");
        await createSession();
      } else if (data.last_accessed_on) {
        const lastAccessedTime = new Date(data.last_accessed_on + 'Z').getTime();
        const currentTime = Date.now();

        console.log("Last accessed time (UTC):", new Date(lastAccessedTime).toUTCString());
        console.log("Current time (UTC):", new Date(currentTime).toUTCString());
        console.log("Time difference:", (currentTime - lastAccessedTime) / 1000, "seconds");

        if (currentTime - lastAccessedTime > SESSION_TIMEOUT) {
          console.log("Session expired, creating new session");
          await createSession();
        } else {
          console.log("Session valid, updating session data");
          setSessionData(data);
          setIsLoading(false);
        }
      } else {
        console.log("No last_accessed_on, but instance running. Using session");
        setSessionData(data);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error verifying session:", error);
      console.log("Verification failed, creating new session");
      await createSession();
    }
  }, [createSession, fetchSessionData]);

  const refreshSession = useCallback(async () => {
    console.log("Refreshing session...");
    const sessionId = Cookies.get(SESSION_COOKIE_NAME);
    if (sessionId) {
      await verifySession(sessionId);
    } else {
      console.log("No session cookie found, creating new session");
      await createSession();
    }
  }, [verifySession, createSession]);

  useEffect(() => {
    console.log("Initializing session...");
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("Periodic session refresh");
      refreshSession();
    }, 15000); // Refresh session every minute

    return () => {
      console.log("Clearing session refresh interval");
      clearInterval(intervalId);
    };
  }, [refreshSession]);

  const restartSession = useCallback(async () => {
    console.log("Restarting session...");
    if (sessionData) {
      try {
        await fetch(`/api/sessions/${sessionData.SK}/end`, {
          method: "POST",
        });
        console.log("Session ended, removing cookie");
        Cookies.remove(SESSION_COOKIE_NAME);
        await createSession();
      } catch (error) {
        console.error("Error restarting session:", error);
      }
    } else {
      console.log("No active session, creating new one");
      await createSession();
    }
  }, [sessionData, createSession]);

  return { sessionData, isLoading, restartSession };
}