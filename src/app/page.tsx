'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Wheel from "../components/Wheel";
import PlayerPicker from "../components/PlayerPicker";
import playersData from "../data/players.json";

// ---------- Types ----------
interface Player {
  name?: string;
  position: "QB" | "WR" | "RB" | "TE" | "K" | "DEF";
  team: string;
}

type Roster = {
  QB: Player | null;
  WR1: Player | null;
  WR2: Player | null;
  RB1: Player | null;
  RB2: Player | null;
  TE: Player | null;
  FLEX: Player | null;
  K: Player | null;
  DEF: Player | null;
};

// ---------- Login / Signup Form ----------
interface AuthFormProps {
  onLogin: (userId: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false); // ✅ NEW: Loading state

  const handleSubmit = async () => {
    setError("");
    setLoggingIn(true);
    const endpoint = `/api/auth/${mode}`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.userId);
        // ✅ MAGIC: Auto-reload after 300ms (cookie sync)
        setTimeout(() => window.location.reload(), 300);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Server error");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm bg-gray-800 p-6 rounded-xl">
      <h2 className="text-xl font-bold">{mode === "login" ? "Login" : "Sign Up"}</h2>
      {error && <p className="text-red-400">{error}</p>}
      <input
        className="p-2 rounded bg-gray-700 text-white"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={loggingIn}
      />
      <input
        className="p-2 rounded bg-gray-700 text-white"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loggingIn}
      />
      <button
        disabled={loggingIn}
        className={`px-4 py-2 rounded transition-colors ${
          loggingIn
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
        onClick={handleSubmit}
      >
        {loggingIn ? "Logging in..." : mode === "login" ? "Login" : "Sign Up"}
      </button>
      <button
        className="text-sm text-gray-300 underline"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        disabled={loggingIn}
      >
        {mode === "login" ? "Create an account" : "Already have an account?"}
      </button>
    </div>
  );
};

// ---------- Main Home Page ----------
export default function Home() {
  const router = useRouter();
  const teams = Object.keys(playersData);

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [roster, setRoster] = useState<Roster>({
    QB: null,
    WR1: null,
    WR2: null,
    RB1: null,
    RB2: null,
    TE: null,
    FLEX: null,
    K: null,
    DEF: null,
  });
  const [skipsUsed, setSkipsUsed] = useState(0);
  const maxSkips = 1;
  const [error, setError] = useState("");

  // ✅ BULLETPROOF: Runs on mount, handles login/refresh perfectly
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/roster/get");
        if (res.status === 401) {
          setUserId(null); // Show login
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.roster) setRoster(data.roster);
        setSkipsUsed(data.skipsUsed ?? 0);
        setUserId("authenticated");
      } catch (e) {
        console.error("Load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []); // ✅ EMPTY deps = runs ONCE on mount

  // ---------- Save helper ----------
  const persist = async (newRoster: Roster, newSkips?: number) => {
    try {
      // ✅ FIXED: Replaced 'any' with proper type
      const payload: { roster: Roster; skipsUsed?: number } = { roster: newRoster };
      if (newSkips !== undefined) payload.skipsUsed = newSkips;

      const res = await fetch("/api/roster/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
      } else {
        setError("");
      }
    } catch {
      setError("Server error");
    }
  };

  // ---------- Add player ----------
  const addPlayerToRoster = async (player: Player) => {
    const alreadyPicked = Object.values(roster).some(
      (p) => p && p.name === player.name && p.team === player.team
    );
    if (alreadyPicked) {
      setError(`${player.name} is already on your roster!`);
      setTimeout(() => setError(""), 3000);
      return;
    }

    const newRoster = { ...roster };
    switch (player.position) {
      case "QB":
        if (newRoster.QB) return;
        newRoster.QB = player;
        break;
      case "WR":
        if (!newRoster.WR1) newRoster.WR1 = player;
        else if (!newRoster.WR2) newRoster.WR2 = player;
        else if (!newRoster.FLEX) newRoster.FLEX = player;
        else return;
        break;
      case "RB":
        if (!newRoster.RB1) newRoster.RB1 = player;
        else if (!newRoster.RB2) newRoster.RB2 = player;
        else if (!newRoster.FLEX) newRoster.FLEX = player;
        else return;
        break;
      case "TE":
        if (!newRoster.TE) newRoster.TE = player;
        else if (!newRoster.FLEX) newRoster.FLEX = player;
        else return;
        break;
      case "K":
        if (newRoster.K) return;
        newRoster.K = player;
        break;
      case "DEF":
        if (newRoster.DEF) return;
        newRoster.DEF = player;
        break;
    }

    setRoster(newRoster);
    setSelectedTeam(null);
    await persist(newRoster, skipsUsed);
  };

  // ---------- Skip ----------
  const skipTeam = async () => {
    if (skipsUsed >= maxSkips) return;
    setSkipsUsed((c) => c + 1);
    setSelectedTeam(null);
    await persist(roster, skipsUsed + 1);
  };

  // ---------- Reset ----------
  const resetRoster = async () => {
    const empty: Roster = {
      QB: null,
      WR1: null,
      WR2: null,
      RB1: null,
      RB2: null,
      TE: null,
      FLEX: null,
      K: null,
      DEF: null,
    };
    setRoster(empty);
    setSkipsUsed(0);
    await persist(empty, 0);
  };

  // ---------- Logout ----------
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUserId(null);
    setRoster({
      QB: null,
      WR1: null,
      WR2: null,
      RB1: null,
      RB2: null,
      TE: null,
      FLEX: null,
      K: null,
      DEF: null,
    });
    router.refresh();
  };

  const filled = Object.values(roster).filter(Boolean).length;
  const spotsLeft = 9 - filled;

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (!userId)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-3xl font-bold mb-4">Fantasy Wheel Draft</h1>
        <AuthForm onLogin={setUserId} />
      </div>
    );

  return (
    <div className="flex flex-col items-center gap-6 p-6 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold">Fantasy Wheel Draft</h1>
      {error && <p className="text-red-400">{error}</p>}

      <button
        className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
        onClick={handleLogout}
      >
        Logout
      </button>

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

      <div className="flex flex-wrap gap-4 items-center justify-center">
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
          className="px-6 py-3 bg-gray-600 rounded hover:bg-gray-700 transition-colors"
          onClick={resetRoster}
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



