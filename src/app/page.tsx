'use client';

import { useState } from 'react';
import { AndroidScreen } from '@/components/AndroidScreen';
import { GameList } from '@/components/GameList';
import { Instructions } from '@/components/Instructions';
import { useSession } from '@/app/hooks/useSession';
import { Button } from "@/components/ui/button"

const DUMMY_GAMES = [
  { id: '1', name: 'Tetris', icon: '/favicon.ico' },
  { id: '2', name: 'Snake', icon: '/favicon.ico' },
  { id: '3', name: 'Pac-Man', icon: '/favicon.ico' },
  { id: '4', name: 'Solitaire', icon: '/favicon.ico' },
  { id: '5', name: 'Chess', icon: '/favicon.ico' },
];

export default function Home() {
  const { sessionData, isLoading, closeSession } = useSession();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const handleGameSelect = (gameId: string) => {
    setSelectedGame(gameId);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 bg-gray-100">
        <h1 className="text-2xl font-bold">My Genymotion App</h1>
      </header>

      <main className="flex-grow p-4 overflow-auto">
        {!selectedGame ? (
          <>
            <Instructions />
            <GameList
              games={DUMMY_GAMES}
              onSelectGame={handleGameSelect}
              disabled={!sessionData || sessionData.instance.ssl_configured !== true}
            />
          </>
        ) : (
          <AndroidScreen
            instanceAddress={sessionData?.instance.secure_address || ''}
            instanceId={sessionData?.instance.instance_id || ''}
          />
        )}
      </main>

      <footer className="p-4 bg-gray-100 flex justify-between items-center">
        <Button
          onClick={closeSession}
          variant="destructive"
        >
          Close Session
        </Button>
        {selectedGame && (
          <Button
            onClick={() => setSelectedGame(null)}
            variant="secondary"
          >
            Back to Games
          </Button>
        )}
      </footer>
    </div>
  );
}