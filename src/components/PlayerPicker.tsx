"use client"

import React from "react"

interface Player {
  name: string // Changed to required since DEF now has name
  position: "QB" | "WR" | "RB" | "TE" | "K" | "DEF"
  team: string
  injuryStatus?: string // Optional, as not all players may have this
}

interface PlayerPickerProps {
  team: string
  players: Record<string, Player[]>
  onPickPlayer: (player: Player) => void
  roster: {
    QB: Player | null
    WR1: Player | null
    WR2: Player | null
    RB1: Player | null
    RB2: Player | null
    TE: Player | null
    FLEX: Player | null
    K: Player | null
    DEF: Player | null
  }
}

export default function PlayerPicker({ team, players, onPickPlayer, roster }: PlayerPickerProps) {
  if (!team) return null

  const teamPlayers = players[team] || []

  const eligiblePlayers = teamPlayers.filter((p) => {
    switch (p.position) {
      case "QB":
        return !roster.QB
      case "WR":
        return !roster.WR1 || !roster.WR2 || (!roster.FLEX && ["WR", "RB", "TE"].includes(p.position))
      case "RB":
        return !roster.RB1 || !roster.RB2 || (!roster.FLEX && ["WR", "RB", "TE"].includes(p.position))
      case "TE":
        return !roster.TE || (!roster.FLEX && ["WR", "RB", "TE"].includes(p.position))
      case "K":
        return !roster.K
      case "DEF":
        return !roster.DEF
      default:
        return false
    }
  })

  return (
    <div className="mt-4 w-full max-w-md">
      <h2 className="text-xl font-bold">{team} Players</h2>
      <div className="flex flex-col gap-2 mt-2">
        {eligiblePlayers.length > 0 ? (
          eligiblePlayers.map((player, idx) => (
            <button
              key={`${player.name}-${player.position}-${idx}`}
              onClick={() => onPickPlayer(player)}
              className="px-4 py-2 bg-green-500 text-white rounded text-left"
            >
              {player.name} ({player.position})
            </button>
          ))
        ) : (
          <p>No eligible players available from this team.</p>
        )}
      </div>
    </div>
  )
}




