"use client"

import React from "react"

interface Player {
  name: string
  position: "QB" | "WR" | "RB" | "TE" | "K" | "DEF"
  team: string
  injuryStatus?: string
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

  // ✅ CHECK IF PLAYER IS ALREADY PICKED (ANYWHERE ON ROSTER)
  const isPlayerPicked = (player: Player) => {
    return Object.values(roster).some((rosterPlayer) =>
      rosterPlayer && 
      rosterPlayer.name === player.name && 
      rosterPlayer.team === player.team
    )
  }

  // ✅ YOUR EXISTING ELIGIBILITY LOGIC (KEEPING IT!)
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
          eligiblePlayers.map((player, idx) => {
            const picked = isPlayerPicked(player)
            
            return (
              <button
                key={`${player.name}-${player.position}-${idx}`}
                onClick={() => !picked && onPickPlayer(player)} // ✅ Only clickable if NOT picked
                disabled={picked}
                className={`
                  px-4 py-2 rounded text-left transition-all duration-200 font-medium
                  ${picked
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed line-through"
                    : "bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md"
                  }
                `}
              >
                {player.name} ({player.position})
                {picked && " ✓"}
              </button>
            )
          })
        ) : (
          <p className="text-gray-400 text-center py-4 bg-gray-800 rounded p-4">
            No eligible players available from this team. 
            <br />
            <span className="text-sm">Try another team or use your skip! 🎯</span>
          </p>
        )}
      </div>
    </div>
  )
}




