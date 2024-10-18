import { useState, useEffect } from 'react';

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

export function useSession() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    createSession();
  }, []);

  useEffect(() => {
    if (sessionData) {
      const intervalId = setInterval(() => {
        pollSessionStatus(sessionData.SK);
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(intervalId);
    }
  }, [sessionData]);

  const createSession = async () => {
    try {
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_ip: '127.0.0.1', // Replace with actual user IP
          browser_info: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data: SessionData = await response.json();
      setSessionData(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error creating session:', error);
      setIsLoading(false);
    }
  };

  const pollSessionStatus = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch session status');
      }

      const data: SessionData = await response.json();
      setSessionData(data);

      if (data.instance.instance_state === 'running') {
        // Session is ready, stop polling
        clearInterval();
      }
    } catch (error) {
      console.error('Error polling session status:', error);
    }
  };

  const closeSession = async () => {
    if (sessionData) {
      try {
        const response = await fetch(`/api/sessions/${sessionData.SK}/end`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to close session');
        }

        // Reset state
        setSessionData(null);
        setIsLoading(true);
        createSession(); // Start a new session
      } catch (error) {
        console.error('Error closing session:', error);
      }
    }
  };

  return { sessionData, isLoading, closeSession };
}