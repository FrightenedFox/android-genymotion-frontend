"use client";

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
  console.log("Rendering GameList");

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (gameId: string) => {
    setImageErrors((prev) => ({ ...prev, [gameId]: true }));
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
      {games.map((game) => {
        const isRecommended = recommendedGame?.SK === game.SK;

        // Determine button styles based on state
        const buttonVariant: "default" | "outline" = isRecommended ? "default" : "outline";
        
        // Define base styles
        const borderColor = isRecommended ? "border-amber-500" : "border-blue-500";
        const bgColor = isRecommended ? "bg-amber-100" : "bg-blue-100";
        const textColor = isRecommended ? "text-amber-700" : "text-blue-700";
        
        // Define hover styles
        const hoverBorderColor = isRecommended ? "border-amber-600" : "border-blue-600";
        const hoverBgColor = isRecommended ? "bg-amber-200" : "bg-blue-200";
        const hoverTextColor = isRecommended ? "text-amber-800" : "text-blue-800";

        // Determine if the button should be disabled
        const isDisabled = isStartingGame || !sessionReady;

        return (
          <Button
            key={game.SK}
            onClick={() => onSelectGame(game)}
            variant={buttonVariant}
            className={`relative flex flex-col items-center p-2 h-auto aspect-square ${borderColor} ${bgColor} ${textColor} ${
              isRecommended ? "border-4" : "border"
            } rounded-lg shadow-sm transition-all duration-200 ${
              !isDisabled
                ? `hover:${hoverBorderColor} hover:${hoverBgColor} hover:${hoverTextColor} hover:shadow-md`
                : "cursor-not-allowed opacity-50"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isRecommended ? "focus:ring-amber-500" : "focus:ring-blue-500"
            }`}
            disabled={isDisabled}
            aria-label={`Select ${game.name}`}
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
              <div className="w-12 h-12 bg-gray-200 flex items-center justify-center mb-2 rounded-full">
                <span className="text-xl font-bold text-gray-700">
                  {game.name.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-xs text-center">{game.name}</span>
            {isRecommended && (
              <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-1 py-0.5 rounded shadow-sm z-10">
                Recommended
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
