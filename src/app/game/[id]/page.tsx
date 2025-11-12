// src/app/game/[id]/page.tsx
'use client';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Clock, Trophy, RotateCw, SkipForward, Users } from "lucide-react";
import Wheel from "@/components/Wheel";
import PlayerPicker from "@/components/PlayerPicker";
import playersData from "@/data/players.json" assert { type: "json" };

interface Player {
  name: string;
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DEF";
  team: string;
}

interface GameData {
  id: number;
  status: "PENDING" | "DRAFTING" | "COMPLETE";
  player1: { id: number; username: string };
  player2: { id: number; username: string } | null;
  currentTurn: number | null;
  currentTurnUsername: string | null;
  isPlayer1: boolean;
  skipsUsedP1: number;
  skipsUsedP2: number;
  picks: {
    position: string;
    player: Player | null;
    playerId: string;
  }[];
}

const POSITIONS = ["QB", "RB1", "RB2", "WR1", "WR2", "TE", "FLEX", "K", "DEF"] as const;

export default function GamePage() {
  const { id: gameId } = useParams<{ id: string }>();
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const API_URL = `${window.location.protocol}//${window.location.host}`;

  // ────── FETCH + POLL ──────
  const fetchGame = async () => {
    try {
      const res = await fetch(`${API_URL}/api/game/${gameId}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data: GameData = await res.json();
      setGame(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGame();
    const iv = setInterval(fetchGame, 2500);
    return () => clearInterval(iv);
  }, [gameId]);

  if (loading) return <div className="p-8 text-white">Loading…</div>;
  if (!game) return <div className="p-8 text-red-400">Game not found</div>;

  const myId = game.isPlayer1 ? game.player1.id : game.player2?.id ?? game.player1.id;
  const myIdStr = myId.toString();

  const myTurn = game.currentTurn?.toString() === myIdStr;
  const mySkips = game.isPlayer1 ? game.skipsUsedP1 : game.skipsUsedP2;
  const canSkip = myTurn && mySkips < 1 && game.status === "DRAFTING";
  const canPick = myTurn && game.player2 !== null && game.status === "DRAFTING";

  const takenPlayers = game.picks
    .map(p => p.player?.name)
    .filter(Boolean) as string[];

  const myPicks = game.picks.filter(p => p.playerId === myIdStr);
  const oppPicks = game.picks.filter(p => p.playerId !== myIdStr);

  // ────── SKIP ──────
  const skipTeam = async () => {
    if (!canSkip) return;
    await fetch(`${API_URL}/api/game/skip-team`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: game.id }),
    });
    setSelectedTeam(null);
    fetchGame();
  };

  // ────── PICK – WITH FULL LOGGING ──────
  const handlePick = async (player: Player) => {
    if (takenPlayers.includes(player.name)) return;

    const payload = {
      gameId: game.id,
      player: {
        name: player.name,
        position: player.position,
        team: player.team,
      },
    };

    // CLIENT: Log what we're about to send
    console.log("%cCLIENT → Sending to /api/game/pick", "color: cyan; font-weight: bold", payload);

    try {
      const res = await fetch(`${API_URL}/api/game/pick`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      console.log("%cSERVER → Raw response (status: " + res.status + ")", "color: orange", rawText);

      let json;
      try {
        json = JSON.parse(rawText);
      } catch (e) {
        console.error("Failed to parse JSON:", rawText);
        alert("Server returned invalid JSON");
        return;
      }

      console.log("%cSERVER → Parsed response", "color: green", json);

      if (json.success && json.game) {
        setGame(json.game);
        setSelectedTeam(null);
      } else {
        alert(json.error || "Pick failed");
        fetchGame();
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Network error");
    }
  };

  // ────── RENDER ──────
  return (
    <div className="flex flex-col items-center gap-6 p-6 min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Game #{game.id}</h1>
        <p className="text-gray-400">
          {game.player1.username} vs {game.player2?.username ?? "???"}
        </p>
      </div>

      {/* Status */}
      {game.status === "PENDING" ? (
        <p className="flex items-center gap-2 text-orange-400">
          <Clock className="w-5 h-5" />
          Waiting for opponent…
        </p>
      ) : game.status === "DRAFTING" ? (
        <p className="flex items-center gap-2 text-green-400">
          <RotateCw className={`w-5 h-5 ${myTurn ? "animate-spin" : ""}`} />
          {myTurn ? "Your turn!" : `${game.currentTurnUsername}'s turn`}
        </p>
      ) : (
        <p className="flex items-center gap-2 text-yellow-400">
          <Trophy className="w-5 h-5" />
          Draft Complete!
        </p>
      )}

      {/* Skip */}
      {canSkip && (
        <div className="flex items-center gap-2">
          <button
            onClick={skipTeam}
            className="flex items-center gap-2 px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-700"
          >
            <SkipForward className="w-4 h-4" />
            Skip Team
          </button>
          <span className="text-sm text-gray-400">Skips: {mySkips}/1</span>
        </div>
      )}

      {/* Wheel + Picker */}
      {canPick && (
        <div className="w-full max-w-2xl space-y-4">
          <Wheel
            teams={Object.keys(playersData)}
            selectedTeam={selectedTeam}
            onSelectTeam={setSelectedTeam}
          />
          {selectedTeam && (
            <PlayerPicker
              team={selectedTeam}
              players={playersData}
              roster={{}}
              takenPlayers={takenPlayers}
              disabled={!canPick}
              onPickPlayer={handlePick}
            />
          )}
        </div>
      )}

      {/* Rosters – Solo‑style */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <RosterCard
          title={`Your Team (@${game.isPlayer1 ? game.player1.username : game.player2?.username ?? "You"} )`}
          picks={myPicks}
        />
        <RosterCard
          title={`Opponent (@${game.isPlayer1 ? game.player2?.username ?? "Waiting…" : game.player1.username})`}
          picks={oppPicks}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------
   RosterCard – shows player in the exact slot
   ------------------------------------------------- */
function RosterCard({ title, picks }: { title: string; picks: GameData["picks"] }) {
  const rosterMap = {
    QB: null,
    RB1: null,
    RB2: null,
    WR1: null,
    WR2: null,
    TE: null,
    FLEX: null,
    K: null,
    DEF: null,
  } as Record<string, Player | null>;

  picks.forEach(pick => {
    if (pick.player && pick.position in rosterMap) {
      rosterMap[pick.position] = pick.player;
    }
  });

  return (
    <div className="bg-gray-800 p-6 rounded-xl">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {POSITIONS.map(pos => (
          <div key={pos} className="flex justify-between">
            <strong>{pos}:</strong>
            <span className={rosterMap[pos] ? "text-white" : "text-gray-500"}>
              {rosterMap[pos]?.name ?? "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}