// src/components/GameList.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Game } from "@/types";

interface GameListProps {
  games: Game[];
  recommendedGame?: Game;
  onSelectGame: (game: Game) => void;
  isStartingGame: boolean;
  sessionReady: boolean;
}

export function GameList({
  games,
  recommendedGame,
  onSelectGame,
  isStartingGame,
  sessionReady,
}: GameListProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (gameId: string) => {
    setImageErrors((prev) => ({ ...prev, [gameId]: true }));
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
      {games.map((game) => {
        const isRecommended = recommendedGame?.SK === game.SK;
        return (
          <Button
            key={game.SK}
            onClick={() => onSelectGame(game)}
            variant={isRecommended ? "default" : "outline"}
            className={`flex flex-col items-center p-2 h-auto aspect-square ${
              isRecommended ? "border-blue-500" : ""
            }`}
            disabled={isStartingGame || !sessionReady}
          >
            {!imageErrors[game.SK] ? (
              <Image
                src={`/icons/${game.android_package_name}.png`}
                alt={game.name}
                width={48}
                height={48}
                className="mb-2"
                onError={() => handleImageError(game.SK)}
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 flex items-center justify-center mb-2">
                {game.name.charAt(0)}
              </div>
            )}
            <span className="text-xs text-center">{game.name}</span>
          </Button>
        );
      })}
    </div>
  );
}
