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

  const handleSubmit = async () => {
    setError("");
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
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("Server error");
      console.error(err);
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
      />
      <input
        className="p-2 rounded bg-gray-700 text-white"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
        onClick={handleSubmit}
      >
        {mode === "login" ? "Login" : "Sign Up"}
      </button>
      <button
        className="text-sm text-gray-300 underline"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
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
  const [error, setError] = useState("");

  // ---------- Check auth and load roster ----------
  useEffect(() => {
    async function checkAuthAndFetchRoster() {
      try {
        const res = await fetch("/api/roster/get");
        if (res.status === 401) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.roster) {
          setRoster(data.roster);
        }
        setUserId("authenticated"); // Indicate authenticated state
      } catch (err) {
        console.error(err);
        setError("Failed to load roster");
      } finally {
        setLoading(false);
      }
    }
    checkAuthAndFetchRoster();
  }, [router]);

  // ---------- Add player to roster & auto-save ----------
  const addPlayerToRoster = async (player: Player) => {
    const newRoster = { ...roster };
    switch (player.position) {
      case "QB":
        newRoster.QB = player;
        break;
      case "WR":
        if (!roster.WR1) newRoster.WR1 = player;
        else if (!roster.WR2) newRoster.WR2 = player;
        else newRoster.FLEX = player;
        break;
      case "RB":
        if (!roster.RB1) newRoster.RB1 = player;
        else if (!roster.RB2) newRoster.RB2 = player;
        else newRoster.FLEX = player;
        break;
      case "TE":
        if (!roster.TE) newRoster.TE = player;
        else newRoster.FLEX = player;
        break;
      case "K":
        newRoster.K = player;
        break;
      case "DEF":
        newRoster.DEF = player;
        break;
    }
    setRoster(newRoster);
    setSelectedTeam(null);

    // Auto-save roster
    try {
      const res = await fetch("/api/roster/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roster: newRoster }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save roster");
      } else {
        setError("");
      }
    } catch (err) {
      console.error("Failed to save roster:", err);
      setError("Server error");
    }
  };

  // ---------- Reset roster ----------
  const resetRoster = async () => {
    const emptyRoster: Roster = {
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
    setRoster(emptyRoster);
    try {
      const res = await fetch("/api/roster/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roster: emptyRoster }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to reset roster");
      } else {
        setError("");
      }
    } catch (err) {
      console.error("Failed to reset roster:", err);
      setError("Server error");
    }
  };

  // ---------- Logout ----------
  const handleLogout = async () => {
    try {
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
      router.push("/");
    } catch (err) {
      console.error("Failed to logout:", err);
      setError("Failed to logout");
    }
  };

  const isRosterComplete = () =>
    roster.QB &&
    roster.WR1 &&
    roster.WR2 &&
    roster.RB1 &&
    roster.RB2 &&
    roster.TE &&
    roster.FLEX &&
    roster.K &&
    roster.DEF;

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
      <div className="flex gap-4">
        <button
          disabled={!isRosterComplete()}
          className={`px-6 py-3 rounded-lg font-semibold ${
            isRosterComplete() ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-500 cursor-not-allowed"
          }`}
        >
          {isRosterComplete()
            ? "Submit Team"
            : `${9 - Object.values(roster).filter(Boolean).length} spots left`}
        </button>
        <button
          className="px-6 py-3 bg-gray-600 rounded hover:bg-gray-700 transition-colors"
          onClick={resetRoster}
        >
          Reset Roster
        </button>
      </div>
    </div>
  );
}



