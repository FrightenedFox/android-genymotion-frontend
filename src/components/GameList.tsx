import { Button } from "@/components/ui/button"
import Image from 'next/image'

interface Game {
  id: string;
  name: string;
  icon: string;
}

interface GameListProps {
  games: Game[];
  onSelectGame: (id: string) => void;
  disabled: boolean;
}

export function GameList({ games, onSelectGame, disabled }: GameListProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
      {games.map((game) => (
        <Button
          key={game.id}
          onClick={() => onSelectGame(game.id)}
          disabled={disabled}
          variant="outline"
          className="flex flex-col items-center p-2 h-auto aspect-square"
        >
          <Image src={game.icon} alt={game.name} width={48} height={48} className="mb-2" />
          <span className="text-xs">{game.name}</span>
        </Button>
      ))}
    </div>
  );
}
