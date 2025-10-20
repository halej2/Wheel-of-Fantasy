"use client"

import React, { useState } from "react"
import Wheel from "./Wheel"
import PlayerPicker from "./PlayerPicker"
import playersData from "../data/players.json"

interface Player {
  name?: string
  position: "QB" | "WR" | "RB" | "TE" | "K" | "DEF"
  team: string
}

type Roster = {
  QB: Player | null
  WR: Player[]
  RB: Player[]
  TE: Player | null
  FLEX: Player | null
  K: Player | null
  DEF: Player | null
}

export default function TeamBuilder() {
  const teams = Object.keys(playersData)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [roster, setRoster] = useState<Roster>({
    QB: null,
    WR: [],
    RB: [],
    TE: null,
    FLEX: null,
    K: null,
    DEF: null,
  })

  const canBeFlex = (p: Player) => ["WR", "RB", "TE"].includes(p.position)

  const addPlayerToRoster = (player: Player) => {
    setRoster((prev) => {
      const updated = { ...prev }

      switch (player.position) {
        case "QB":
          if (!updated.QB) updated.QB = player
          break
        case "WR":
          if (updated.WR.length < 2) updated.WR.push(player)
          else if (!updated.FLEX && canBeFlex(player)) updated.FLEX = player
          break
        case "RB":
          if (updated.RB.length < 2) updated.RB.push(player)
          else if (!updated.FLEX && canBeFlex(player)) updated.FLEX = player
          break
        case "TE":
          if (!updated.TE) updated.TE = player
          else if (!updated.FLEX && canBeFlex(player)) updated.FLEX = player
          break
        case "K":
          if (!updated.K) updated.K = player
          break
        case "DEF":
          if (!updated.DEF) updated.DEF = player
          break
      }

      return updated
    })

    setSelectedTeam(null)
  }

  const isRosterComplete = () =>
    roster.QB &&
    roster.WR.length === 2 &&
    roster.RB.length === 2 &&
    roster.TE &&
    roster.FLEX &&
    roster.K &&
    roster.DEF

  return (
    <div className="flex flex-col items-center gap-6 p-6 text-white">
      <h1 className="text-3xl font-bold">Fantasy Wheel Draft</h1>

      {/* Spin the wheel */}
      <Wheel teams={teams} selectedTeam={selectedTeam} onSelectTeam={setSelectedTeam} />

      {/* Pick player */}
      {selectedTeam && (
        <PlayerPicker
          team={selectedTeam}
          players={playersData}
          onPickPlayer={addPlayerToRoster}
          roster={roster}
        />
      )}

      {/* Current roster */}
      <div className="grid grid-cols-2 gap-4 bg-gray-800 p-6 rounded-xl mt-6 w-full max-w-lg">
        <div>QB: {roster.QB?.name ?? "—"}</div>
        <div>WR: {roster.WR.length > 0 ? roster.WR.map((p) => p.name ?? "WR").join(", ") : "—"}</div>
        <div>RB: {roster.RB.length > 0 ? roster.RB.map((p) => p.name ?? "RB").join(", ") : "—"}</div>
        <div>TE: {roster.TE?.name ?? "—"}</div>
        <div>FLEX: {roster.FLEX?.name ?? "—"}</div>
        <div>K: {roster.K?.name ?? "—"}</div>
        <div>DEF: {roster.DEF?.name ?? "Defense"}</div>
      </div>

      {/* Submit */}
      <button
        disabled={!isRosterComplete()}
        className={`px-6 py-3 mt-4 rounded-lg font-semibold ${
          isRosterComplete() ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-500 cursor-not-allowed"
        }`}
      >
        Submit Team
      </button>
    </div>
  )
}


