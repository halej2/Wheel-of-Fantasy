'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Clock, Trophy, Users, RotateCw, SkipForward } from "lucide-react";
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
  status: string;
  player1: { id: string; username: string };
  player2: { id: string; username: string } | null;
  currentTurn: string | null;
  isPlayer1: boolean;
  skipsUsedP1: number;
  skipsUsedP2: number;
  picks: { position: string; player: Player | null; playerId: string }[];
}

const POSITIONS = ["QB", "RB1", "RB2", "WR1", "WR2", "TE", "FLEX", "K", "DEF"] as const;

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;

  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // ------------------------
  // Fetch game from API
  // ------------------------
  const fetchGame = async () => {
    try {
      const res = await fetch(`/api/game/${gameId}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setGame(data);
      else if (res.status === 404) setGame(null);
    } catch (err) {
      console.error("Error fetching game:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGame();
    const interval = setInterval(fetchGame, 3000);
    return () => clearInterval(interval);
  }, [gameId]);

  // ------------------------
  // Early return guards
  // ------------------------
  if (loading) return <div className="p-8 text-white">Loading...</div>;
  if (!game) return <div className="p-8 text-red-400">Game not found</div>;

  // ------------------------
  // Safe data access
  // ------------------------
  const currentTurnId = game.currentTurn?.toString() ?? null;

  const player1 = game.player1 ?? { id: "unknown", username: "Player 1" };
  const player2 = game.player2 ?? null;

  const myId = game.isPlayer1
    ? player1.id ?? null
    : player2?.id ?? null;

  const myTurn = myId && currentTurnId === myId;

  const mySkips = game.isPlayer1 ? game.skipsUsedP1 : game.skipsUsedP2 ?? 0;
  const canSkip = myTurn && mySkips < 1 && game.status === "DRAFTING";

  // ------------------------
  // Skip team
  // ------------------------
  const skipTeam = async () => {
    if (!canSkip) return;
    await fetch("/api/game/skip-team", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId }),
    });
    setSelectedTeam(null);
    fetchGame();
  };

  // ------------------------
  // Picks
  // ------------------------
  const myPicks = myId
    ? game.picks.filter(p => p.playerId === myId)
    : [];
  const oppPicks = myId
    ? game.picks.filter(p => p.playerId !== myId)
    : [];
  const takenPlayers = game.picks.map(p => p.player?.name).filter(Boolean);

  // ------------------------
  // Waiting message
  // ------------------------
  const waitingFor = game.isPlayer1
    ? player2?.username || "opponent"
    : player1.username;

  // ------------------------
  // Render
  // ------------------------
  return (
    <div className="flex flex-col items-center gap-6 p-6 min-h-screen bg-gray-900 text-white">
      {/* HEADER */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Game #{game.id}</h1>
        <p className="text-gray-400">
          {player1.username} vs {player2?.username || "???"}
        </p>
      </div>

      {/* STATUS */}
      {game.status === "PENDING" ? (
        <p className="flex items-center gap-2 text-orange-400">
          <Clock className="w-5 h-5" />
          Waiting for <strong>@{waitingFor}</strong> to accept invite
        </p>
      ) : game.status === "DRAFTING" ? (
        <p className="flex items-center gap-2 text-green-400">
          <RotateCw className={`w-5 h-5 ${myTurn ? "animate-spin" : ""}`} />
          {myTurn
            ? "Your turn!"
            : `@${game.isPlayer1 ? player2?.username || "opponent" : player1.username}'s turn`}
        </p>
      ) : (
        <p className="flex items-center gap-2 text-yellow-400">
          <Trophy className="w-5 h-5" />
          Draft Complete!
        </p>
      )}

      {/* SKIP TEAM BUTTON */}
      {game.status === "DRAFTING" && myTurn && (
        <div className="flex items-center gap-2">
          <button
            disabled={!canSkip}
            onClick={skipTeam}
            className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
              canSkip
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-gray-600 cursor-not-allowed"
            }`}
          >
            <SkipForward className="w-4 h-4" />
            Skip Team
          </button>
          <span className="text-sm text-gray-400">
            Skips: {mySkips}/1
          </span>
        </div>
      )}

      {/* WHEEL + PICKER */}
      {game.status === "DRAFTING" && myTurn && (
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
              onPickPlayer={async (player) => {
                if (takenPlayers.includes(player.name)) return;
                await fetch("/api/game/pick", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ gameId, player }),
                });
                setSelectedTeam(null);
                fetchGame();
              }}
              roster={{}}
              takenPlayers={takenPlayers}
            />
          )}
        </div>
      )}

      {/* SIDE-BY-SIDE ROSTERS */}
      <div className="w-full max-w-5xl grid grid-cols-2 gap-6">
        <RosterCard
          title={`Your Team (@${game.isPlayer1 ? player1.username : player2?.username || "You"})`}
          picks={myPicks}
        />
        <RosterCard
          title={`Opponent (@${game.isPlayer1 ? player2?.username || "Waiting..." : player1.username})`}
          picks={oppPicks}
        />
      </div>
    </div>
  );
}

// ------------------------
// RosterCard Component
// ------------------------
function RosterCard({ title, picks }: { title: string; picks: any[] }) {
  const roster = POSITIONS.reduce((acc, pos) => {
    const pick = picks.find(p => p.position === pos);
    acc[pos] = pick?.player || null;
    return acc;
  }, {} as any);

  return (
    <div className="bg-gray-800 p-6 rounded-xl w-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {POSITIONS.map(pos => (
          <div key={pos} className="flex justify-between">
            <strong>{pos}:</strong>
            <span className={roster[pos] ? "text-white" : "text-gray-500"}>
              {roster[pos]?.name || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

