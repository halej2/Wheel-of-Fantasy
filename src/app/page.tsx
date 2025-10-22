"use client"

import React, { useState } from "react"
import Wheel from "../components/Wheel"
import PlayerPicker from "../components/PlayerPicker"
import playersData from "../data/players.json"

interface Player {
  name?: string
  position: "QB" | "WR" | "RB" | "TE" | "K" | "DEF"
  team: string
}

type Roster = {
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

export default function Home() {
  const teams = Object.keys(playersData)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [roster, setRoster] = useState<Roster>({
    QB: null, WR1: null, WR2: null, RB1: null, RB2: null,
    TE: null, FLEX: null, K: null, DEF: null,
  })

  const addPlayerToRoster = (player: Player) => {
    setRoster((prev) => {
      switch (player.position) {
        case "QB": return { ...prev, QB: player }
        case "WR":
          if (!prev.WR1) return { ...prev, WR1: player }
          if (!prev.WR2) return { ...prev, WR2: player }
          if (!prev.FLEX) return { ...prev, FLEX: player }
          return prev
        case "RB":
          if (!prev.RB1) return { ...prev, RB1: player }
          if (!prev.RB2) return { ...prev, RB2: player }
          if (!prev.FLEX) return { ...prev, FLEX: player }
          return prev
        case "TE":
          if (!prev.TE) return { ...prev, TE: player }
          if (!prev.FLEX) return { ...prev, FLEX: player }
          return prev
        case "K": return { ...prev, K: player }
        case "DEF": return { ...prev, DEF: player }
        default: return prev
      }
    })
    setSelectedTeam(null)
  }

  const isRosterComplete = () =>
    roster.QB && roster.WR1 && roster.WR2 && roster.RB1 && roster.RB2 &&
    roster.TE && roster.FLEX && roster.K && roster.DEF

  return (
    <div className="flex flex-col items-center gap-6 p-6 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold">Fantasy Wheel Draft</h1>
      
      <Wheel teams={teams} selectedTeam={selectedTeam} onSelectTeam={setSelectedTeam} />
      
      {selectedTeam && (
        <PlayerPicker
          team={selectedTeam}
          players={playersData}
          onPickPlayer={addPlayerToRoster}
          roster={roster}
        />
      )}
      
      <div className="grid grid-cols-2 gap-4 bg-gray-800 p-6 rounded-xl w-full max-w-lg">
        <div>QB: {roster.QB?.name ?? "—"}</div>
        <div>WR1: {roster.WR1?.name ?? "—"}</div>
        <div>WR2: {roster.WR2?.name ?? "—"}</div>
        <div>RB1: {roster.RB1?.name ?? "—"}</div>
        <div>RB2: {roster.RB2?.name ?? "—"}</div>
        <div>TE: {roster.TE?.name ?? "—"}</div>
        <div>FLEX: {roster.FLEX?.name ?? "—"}</div>
        <div>K: {roster.K?.name ?? "—"}</div>
        <div>DEF: {roster.DEF?.name ?? "—"}</div>
      </div>
      
      <button
        disabled={!isRosterComplete()}
        className={`px-6 py-3 mt-4 rounded-lg font-semibold ${
          isRosterComplete() ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-500 cursor-not-allowed"
        }`}
      >
        {isRosterComplete() ? "Submit Team" : `${9 - Object.values(roster).filter(Boolean).length} spots left`}
      </button>
    </div>
  )
}

