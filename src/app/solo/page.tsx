'use client';

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Wheel from "@/components/Wheel";
import PlayerPicker from "@/components/PlayerPicker";
import playersData from "@/data/players.json" assert { type: "json" };
import { ArrowLeft } from "lucide-react";

interface Player {
  name: string;
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DEF";
  team: string;
  injuryStatus?: string;
}

interface Roster {
  QB: Player | null;
  WR1: Player | null;
  WR2: Player | null;
  RB1: Player | null;
  RB2: Player | null;
  TE: Player | null;
  FLEX: Player | null;
  K: Player | null;
  DEF: Player | null;
}

type NFLTeam = string;

export default function SoloPlay() {
  const router = useRouter();

  // USER
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // SOLO STATE
  const teams: NFLTeam[] = Object.keys(playersData) as NFLTeam[];
  const [selectedTeam, setSelectedTeam] = useState<NFLTeam | null>(null);
  const [roster, setRoster] = useState<Roster>({
    QB: null, WR1: null, WR2: null, RB1: null, RB2: null,
    TE: null, FLEX: null, K: null, DEF: null,
  });
  const [skipsUsed, setSkipsUsed] = useState<number>(0);
  const [soloError, setSoloError] = useState<string>("");
  const maxSkips = 1;

  // LOAD USER + ROSTER
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // 1. USER
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) throw new Error("unauth");
        const { userId: uid } = await userRes.json();
        if (!mounted) return;
        setUserId(uid);

        // 2. ROSTER
        const rosterRes = await fetch("/api/roster/get");
        if (rosterRes.ok) {
          const data = await rosterRes.json();
          setRoster(data.roster ?? roster);
          setSkipsUsed(data.skipsUsed ?? 0);
        }
      } catch (e) {
        router.replace("/");
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [router]);

  // PERSIST
  const persist = useCallback(async (newRoster: Roster, newSkips?: number) => {
    try {
      const payload: any = { roster: newRoster };
      if (newSkips !== undefined) payload.skipsUsed = newSkips;
      const res = await fetch("/api/roster/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setSoloError(data.error || "Save failed");
      } else {
        setSoloError("");
      }
    } catch {
      setSoloError("Server error");
    }
  }, []);

  // ADD PLAYER
  const addPlayerToRoster = useCallback(async (player: Player) => {
    const already = Object.values(roster).some(
      (p) => p && p.name === player.name && p.team === player.team
    );
    if (already) {
      setSoloError(`${player.name} already on roster`);
      setTimeout(() => setSoloError(""), 3000);
      return;
    }

    const newRoster = { ...roster };
    switch (player.position) {
      case "QB":
        if (!newRoster.QB) newRoster.QB = player;
        break;
      case "WR":
        if (!newRoster.WR1) newRoster.WR1 = player;
        else if (!newRoster.WR2) newRoster.WR2 = player;
        else if (!newRoster.FLEX) newRoster.FLEX = player;
        break;
      case "RB":
        if (!newRoster.RB1) newRoster.RB1 = player;
        else if (!newRoster.RB2) newRoster.RB2 = player;
        else if (!newRoster.FLEX) newRoster.FLEX = player;
        break;
      case "TE":
        if (!newRoster.TE) newRoster.TE = player;
        else if (!newRoster.FLEX) newRoster.FLEX = player;
        break;
      case "K":
        if (!newRoster.K) newRoster.K = player;
        break;
      case "DEF":
        if (!newRoster.DEF) newRoster.DEF = player;
        break;
    }

    setRoster(newRoster);
    setSelectedTeam(null);
    await persist(newRoster, skipsUsed);
  }, [roster, skipsUsed, persist]);

  // SKIP
  const skipTeam = useCallback(async () => {
    if (skipsUsed >= maxSkips) return;
    setSkipsUsed((v) => v + 1);
    setSelectedTeam(null);
    await persist(roster, skipsUsed + 1);
  }, [skipsUsed, roster, persist]);

  // RESET
  const resetRoster = useCallback(async () => {
    const empty: Roster = {
      QB: null, WR1: null, WR2: null, RB1: null, RB2: null,
      TE: null, FLEX: null, K: null, DEF: null,
    };
    setRoster(empty);
    setSkipsUsed(0);
    await persist(empty, 0);
  }, [persist]);

  const filled = Object.values(roster).filter(Boolean).length;
  const spotsLeft = 9 - filled;

  // RENDER
  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-xl">Loading…</p>
      </div>
    );
  }

  if (!userId) {
    router.replace("/");
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4 md:p-6 min-h-screen bg-gray-900 text-white">
      {/* HEADER */}
      <div className="flex items-center justify-between w-full max-w-2xl">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-bold">Solo Draft</h1>
        <div />
      </div>

      {/* ERROR */}
      {soloError && (
        <p className="text-red-400 bg-red-900/50 px-4 py-2 rounded-lg">{soloError}</p>
      )}

      {/* WHEEL */}
      <Wheel
        teams={teams}
        selectedTeam={selectedTeam}
        onSelectTeam={setSelectedTeam}
      />

      {/* PLAYER PICKER */}
      {selectedTeam && (
        <PlayerPicker
          team={selectedTeam}
          players={playersData}
          onPickPlayer={addPlayerToRoster}
          roster={roster}
        />
      )}

      {/* ROSTER */}
      <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-xl">
        <h2 className="text-lg font-semibold mb-3">Your Roster</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {Object.entries(roster).map(([slot, p]) => (
            <div key={slot}>
              <strong>{slot}:</strong> {p?.name ?? "—"}
            </div>
          ))}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap gap-3 items-center justify-center">
        <button
          disabled={skipsUsed >= maxSkips}
          onClick={skipTeam}
          className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
            skipsUsed >= maxSkips
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-yellow-600 hover:bg-yellow-700"
          }`}
        >
          Skip ({skipsUsed}/{maxSkips})
        </button>

        <button
          onClick={resetRoster}
          className="px-6 py-3 bg-gray-600 rounded-lg hover:bg-gray-700"
        >
          Reset Roster
        </button>

        <div className="px-6 py-3 bg-blue-600 rounded-lg text-center font-semibold min-w-[140px]">
          {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
        </div>
      </div>
    </div>
  );
}