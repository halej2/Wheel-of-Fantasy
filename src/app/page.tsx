"use client"

import Image from "next/image"
import { useState } from "react"
import Wheel from "../components/Wheel"
import PlayerPicker from "../components/PlayerPicker"
import teams from "../data/teams.json"
import players from "../data/players.json"

// Define NFLTeam type
type NFLTeam = 
  | "Arizona Cardinals"
  | "Atlanta Falcons"
  | "Baltimore Ravens"
  | "Buffalo Bills"
  | "Carolina Panthers"
  | "Chicago Bears"
  | "Cincinnati Bengals"
  | "Cleveland Browns"
  | "Dallas Cowboys"
  | "Denver Broncos"
  | "Detroit Lions"
  | "Green Bay Packers"
  | "Houston Texans"
  | "Indianapolis Colts"
  | "Jacksonville Jaguars"
  | "Kansas City Chiefs"
  | "Las Vegas Raiders"
  | "Los Angeles Chargers"
  | "Los Angeles Rams"
  | "Miami Dolphins"
  | "Minnesota Vikings"
  | "New England Patriots"
  | "New Orleans Saints"
  | "New York Giants"
  | "New York Jets"
  | "Philadelphia Eagles"
  | "Pittsburgh Steelers"
  | "San Francisco 49ers"
  | "Seattle Seahawks"
  | "Tampa Bay Buccaneers"
  | "Tennessee Titans"
  | "Washington Commanders"

// Your fantasy lineup structure
const lineupTemplate = {
  QB: null,
  WR1: null,
  WR2: null,
  RB1: null,
  RB2: null,
  TE: null,
  FLEX: null,
  K: null,
  DEF: null,
}

export default function Home() {
  const [selectedTeam, setSelectedTeam] = useState<NFLTeam | null>(null)
  const [lineup, setLineup] = useState<Record<string, string | null>>(lineupTemplate)
  const [message, setMessage] = useState<string>("")

  // Helper to check if lineup is full
  const isLineupFull = Object.values(lineup).every((slot) => slot !== null)

  // When a player is picked
  const handlePickPlayer = (player: string) => {
    // determine position from player name (you can adjust how you store this)
    const playerPosition = getPlayerPosition(player)

    if (!playerPosition) {
      setMessage("Could not determine player position.")
      return
    }

    // find the correct open slot for that position
    const openSlotKey = findOpenSlotForPosition(playerPosition, lineup)

    if (!openSlotKey) {
      setMessage(`You already filled all ${playerPosition} positions! Spin again.`)
      return
    }

    // fill the slot
    setLineup((prev) => ({
      ...prev,
      [openSlotKey]: player,
    }))

    // reset for next spin
    setSelectedTeam(null)
    setMessage("")
  }

  // --- helper functions ---
  const getPlayerPosition = (player: string): string | null => {
    // Example assumes player string looks like "Patrick Mahomes - QB"
    const parts = player.split("-")
    if (parts.length < 2) return null
    return parts[1].trim().toUpperCase()
  }

  const findOpenSlotForPosition = (pos: string, lineup: Record<string, string | null>): string | null => {
    if (pos === "QB" && !lineup.QB) return "QB"
    if (pos === "RB") return !lineup.RB1 ? "RB1" : !lineup.RB2 ? "RB2" : lineup.FLEX ? null : "FLEX"
    if (pos === "WR") return !lineup.WR1 ? "WR1" : !lineup.WR2 ? "WR2" : lineup.FLEX ? null : "FLEX"
    if (pos === "TE" && !lineup.TE) return "TE"
    if (pos === "K" && !lineup.K) return "K"
    if (pos === "DEF" && !lineup.DEF) return "DEF"
    return null
  }

  return (
    <div className="font-sans flex flex-col items-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Fantasy Wheel Draft!</h1>

      {isLineupFull ? (
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">🎉 Draft Complete!</h2>
          <ul className="text-left">
            {Object.entries(lineup).map(([pos, player]) => (
              <li key={pos} className="mb-1">
                <strong>{pos}:</strong> {player}
              </li>
            ))}
          </ul>
          <button
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => {
              setLineup(lineupTemplate)
              setSelectedTeam(null)
              setMessage("")
            }}
          >
            Restart Draft
          </button>
        </div>
      ) : (
        <>
          {/* --- Step 1: Spin Wheel --- */}
          <Wheel teams={teams as NFLTeam[]} onSelectTeam={setSelectedTeam} selectedTeam={selectedTeam} />

          {/* --- Step 2: Show Player Picker --- */}
          {selectedTeam && (
            <PlayerPicker
              team={selectedTeam}
              players={players}
              onPickPlayer={handlePickPlayer}
            />
          )}

          {/* --- Step 3: Show lineup and message --- */}
          <div className="mt-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2 text-center">Your Lineup</h2>
            <ul className="divide-y divide-gray-300">
              {Object.entries(lineup).map(([pos, player]) => (
                <li key={pos} className="py-1 flex justify-between">
                  <span className="font-semibold">{pos}</span>
                  <span>{player ?? <span className="text-gray-400">Open</span>}</span>
                </li>
              ))}
            </ul>
          </div>

          {message && <p className="text-red-600 mt-4">{message}</p>}
        </>
      )}
    </div>
  )
}

