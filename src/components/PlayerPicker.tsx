"use client"

interface PlayerPickerProps {
  team: string
  players: Record<string, string[]>
  onPickPlayer: (player: string) => void
}

export default function PlayerPicker({ team, players, onPickPlayer }: PlayerPickerProps) {
  if (!team) return null

  const teamPlayers = players[team] || []

  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold">{team} Players</h2>
      <div className="flex flex-col gap-2 mt-2">
        {teamPlayers.map((player) => (
          <button
            key={player}
            onClick={() => onPickPlayer(player)}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            {player}
          </button>
        ))}
      </div>
    </div>
  )
}
