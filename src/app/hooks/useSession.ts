// src/app/hooks/useSession.ts

import { useState, useEffect, useCallback, useRef } from "react";
import Cookies from "js-cookie";
import { AMI, Session } from "@/types";

const SESSION_COOKIE_NAME = "genymotion_session";
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export function useSession() {
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amis, setAmis] = useState<AMI[]>([]);
  const [recommendedAmi, setRecommendedAmi] = useState<AMI | null>(null);
  const [userIp, setUserIp] = useState<string>("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user IP on mount
  useEffect(() => {
    const fetchUserIp = async () => {
      try {
        const response = await fetch("/api/get-ip");
        const data = await response.json();
        setUserIp(data.ip);
      } catch (err) {
        console.error("Error fetching IP:", err);
        setUserIp("Unknown");
      }
    };
    fetchUserIp();
  }, []);

  // Fetch session data by session ID
  const fetchSessionData = useCallback(async (sessionId: string): Promise<Session> => {
    const response = await fetch(`/api/proxy?path=/sessions/${sessionId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch session status");
    }
    return await response.json();
  }, []);

  // Start polling the session status
  const startSessionPolling = useCallback(
    (sessionId: string) => {
      // Clear any existing polling
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }

      const poll = async () => {
        try {
          const data = await fetchSessionData(sessionId);
          setSessionData(data);

          if (data.instance && data.instance.instance_state === "running") {
            // Once running, poll every 1 minute
            pollingRef.current = setTimeout(poll, 60000);
          } else {
            // If not running, continue polling every 15 seconds
            pollingRef.current = setTimeout(poll, 15000);
          }
        } catch (error) {
          console.error("Error polling session:", error);
          setError("Error polling session status.");
          // Optionally stop polling on error
          clearTimeout(pollingRef.current as NodeJS.Timeout);
        }
      };

      // Start polling
      poll();
    },
    [fetchSessionData]
  );

  // Create a new session
  const createSession = useCallback(
    async (amiId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const selectedAmi = amis.find((ami) => ami.SK === amiId) || recommendedAmi;
        if (!selectedAmi) {
          throw new Error("Selected AMI not found");
        }

        const targetYear = selectedAmi.representing_year;
        const response = await fetch(`/api/proxy?path=/sessions/${targetYear}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_ip: userIp,
            browser_info: navigator.userAgent,
          }),
        });

        // Log the response for debugging
        console.log("Session creation response:", response);

        if (response.status === 503) {
          throw new Error("You have reached your EC2 vCPU limit. Please try again later.");
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create session: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const data: Session = await response.json();
        setSessionData(data);
        Cookies.set(SESSION_COOKIE_NAME, data.SK, { expires: 1 }); // Set cookie to expire in 1 day
        startSessionPolling(data.SK);
      } catch (error) {
        console.error("Error in createSession:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [amis, recommendedAmi, userIp, startSessionPolling]
  );

  // Check for existing session on mount
  const checkExistingSession = useCallback(async () => {
    const sessionId = Cookies.get(SESSION_COOKIE_NAME);
    if (sessionId) {
      try {
        const data = await fetchSessionData(sessionId);
        const sessionAge = Date.now() - new Date(data.start_time).getTime();
        if (
          sessionAge < SESSION_TIMEOUT &&
          data.instance &&
          data.instance.instance_state === "running"
        ) {
          setSessionData(data);
          startSessionPolling(sessionId);
        } else {
          // Session is too old or not running, remove the cookie
          Cookies.remove(SESSION_COOKIE_NAME);
        }
      } catch (error) {
        console.error("Error checking existing session:", error);
        Cookies.remove(SESSION_COOKIE_NAME);
      }
    }
  }, [fetchSessionData, startSessionPolling]);

  // Fetch AMIs and Recommended AMI
  const fetchAmis = useCallback(async () => {
    try {
      const response = await fetch("/api/proxy?path=/amis");
      if (!response.ok) {
        throw new Error("Failed to fetch AMIs");
      }
      const data: AMI[] = await response.json();
      setAmis(data);
    } catch (error) {
      console.error("Error fetching AMIs:", error);
    }
  }, []);

  const fetchRecommendedAmi = useCallback(async () => {
    try {
      const response = await fetch("/api/proxy?path=/amis/recommended");
      if (!response.ok) {
        throw new Error("Failed to fetch recommended AMI");
      }
      const data: AMI = await response.json();
      setRecommendedAmi(data);
    } catch (error) {
      console.error("Error fetching recommended AMI:", error);
    }
  }, []);

  useEffect(() => {
    checkExistingSession();
    fetchAmis();
    fetchRecommendedAmi();
    // Cleanup on unmount
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, [checkExistingSession, fetchAmis, fetchRecommendedAmi]);

  return {
    sessionData,
    isLoading,
    error,
    amis,
    recommendedAmi,
    createSession,
    setSessionData,
  };
}
