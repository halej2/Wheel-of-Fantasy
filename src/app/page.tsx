// src/app/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Users, Clock, RotateCw, Bell } from 'lucide-react';

// ──────────────────────────────────────────────────────
// PLAYER & ROSTER TYPES
// ──────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────
// AUTH FORM
// ──────────────────────────────────────────────────────
interface AuthFormProps {
  onLogin: (userId: string, username: string) => void;
}
const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const handleSubmit = useCallback(async () => {
    setError("");
    setLoggingIn(true);
    const endpoint = `/api/auth/${mode}`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include", // ← Send cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.userId, data.username);
        setTimeout(() => window.location.reload(), 300);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Server error");
    } finally {
      setLoggingIn(false);
    }
  }, [username, password, mode, onLogin]);

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      <h1 className="text-4xl font-bold mb-2 text-white">Wheel of Fantasy</h1>
      <p className="text-center text-sm text-gray-300 mb-6 max-w-xs">
        Bad season? Star players hurt? No problem. Spin the wheel, draft a fresh superstar roster every week — play head-to-head with friends or go solo and chase the highest score!
      </p>
      <div className="w-full bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-center mb-4">
          {mode === "login" ? "Login" : "Sign Up"}
        </h2>
        {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}
        <input
          className="w-full p-3 mb-3 rounded bg-gray-700 text-white placeholder-gray-400"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loggingIn}
        />
        <input
          className="w-full p-3 mb-4 rounded bg-gray-700 text-white placeholder-gray-400"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loggingIn}
        />
        <button
          disabled={loggingIn}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            loggingIn ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
          onClick={handleSubmit}
        >
          {loggingIn ? "Loading..." : mode === "login" ? "Login" : "Sign Up"}
        </button>
        <button
          className="w-full text-center text-sm text-gray-300 underline mt-3"
          onClick={() => setMode((prev) => (prev === "login" ? "signup" : "login"))}
          disabled={loggingIn}
        >
          {mode === "login" ? "Create an account" : "Already have an account?"}
        </button>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────
// INVITE BADGE (TOP RIGHT)
// ──────────────────────────────────────────────────────
const InviteBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;
  return (
    <div className="fixed top-4 right-4 bg-green-600 text-white p-3 rounded-full shadow-lg animate-pulse flex items-center gap-2 z-50">
      <Bell className="w-5 h-5" />
      <span className="absolute -top-1 -right-1 bg-red-600 text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {count}
      </span>
    </div>
  );
};

// ──────────────────────────────────────────────────────
// MAIN HOME PAGE
// ──────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();

  // USER STATE
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // MULTIPLAYER STATE
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [currentGames, setCurrentGames] = useState<any[]>([]);
  const [multiLoading, setMultiLoading] = useState(true);

  // ──────────────────────────────────────────────────
  // LOAD USER + INVITES + GAMES
  // ──────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      try {
        // 1. USER
        const userRes = await fetch("/api/auth/me", { credentials: "include" });
        if (!userRes.ok) throw new Error("unauth");
        const { userId: uid, username: uname } = await userRes.json();
        if (!mounted) return;
        setUserId(uid);
        setUsername(uname);

        // 2. MULTIPLAYER
        const [invRes, gamesRes] = await Promise.all([
          fetch("/api/invite/pending", { credentials: "include" }),
          fetch("/api/game/current", { credentials: "include" }),
        ]);
        const invData = invRes.ok ? await invRes.json() : [];
        const gamesData = gamesRes.ok ? await gamesRes.json() : [];
        if (mounted) {
          setPendingInvites(invData);
          setCurrentGames(gamesData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) {
          setLoadingUser(false);
          setMultiLoading(false);
        }
      }
    };

    loadAll();

    // POLL INVITES every 12s
    const poll = setInterval(() => {
      if (userId) {
        fetch("/api/invite/pending", { credentials: "include" })
          .then(r => r.ok && r.json())
          .then(d => d && setPendingInvites(d));
      }
    }, 12_000);

    return () => {
      mounted = false;
      clearInterval(poll);
    };
  }, [userId]);

  // ──────────────────────────────────────────────────
  // LOGOUT
  // ──────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUserId(null);
    setUsername(null);
    router.refresh();
  }, [router]);

  // ──────────────────────────────────────────────────
  // ACCEPT / DECLINE
  // ──────────────────────────────────────────────────
  const acceptInvite = async (inviteId: string, gameId: string) => {
    await fetch("/api/invite/accept", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId }),
    });
    router.push(`/game/${gameId}`);
  };

  const declineInvite = async (inviteId: string) => {
    await fetch("/api/invite/decline", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId }),
    });
    setPendingInvites((list) => list.filter((i) => i.id !== inviteId));
  };

  // ──────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────
  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-xl">Loading…</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
        <AuthForm onLogin={(uid, uname) => { setUserId(uid); setUsername(uname); }} />
      </div>
    );
  }

  const pendingCount = pendingInvites.filter(i => i.receiverId === userId).length;

  return (
    <div className="flex flex-col items-center gap-8 p-6 min-h-screen bg-gray-900 text-white">
      {/* INVITE BADGE */}
      <InviteBadge count={pendingCount} />

      {/* HEADER */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Wheel of Fantasy</h1>
        <p className="text-gray-400">Draft. Compete. Dominate.</p>
        <p className="text-sm text-gray-300 mt-1">Logged in as @{username}</p>
      </div>

      <button
        className="px-6 py-2 bg-red-600 rounded-lg font-medium hover:bg-red-700 transition-colors"
        onClick={handleLogout}
      >
        Logout
      </button>

      {/* MULTIPLAYER SECTIONS */}
      <div className="w-full max-w-2xl space-y-6">
        {/* PENDING INVITES */}
        <section className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-xl font-semibold mb-3">Pending Invites</h2>
          {multiLoading ? (
            <p className="text-gray-400">Loading…</p>
          ) : pendingInvites.length === 0 ? (
            <p className="text-gray-400">No pending invites</p>
          ) : (
            <div className="space-y-3">
              {pendingInvites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium">@{inv.sender.username}</p>
                    <p className="text-sm text-gray-300">
                      {inv.senderId === userId ? "You sent" : "You received"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {inv.receiverId === userId && (
                      <>
                        <button
                          onClick={() => acceptInvite(inv.id, inv.gameId)}
                          className="px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => declineInvite(inv.id)}
                          className="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700"
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CURRENT GAMES */}
        <section className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-xl font-semibold mb-3">Current Games</h2>
          {multiLoading ? (
            <p className="text-gray-400">Loading…</p>
          ) : currentGames.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg">No games yet</p>
              <p className="text-sm mt-1">Start a 1v1 with a friend!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentGames.map((g) => (
                <button
                  key={g.id}
                  onClick={() => router.push(`/game/${g.id}`)}
                  className="w-full text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">vs @{g.opponent.username}</p>
                      <p className="text-xs text-gray-400">
                        {g.status === 'COMPLETED'
                          ? 'Completed'
                          : g.status === 'ACTIVE'
                          ? 'In Progress'
                          : 'Waiting for opponent'}
                      </p>
                    </div>
                    {g.status === 'COMPLETED' ? (
                      <Trophy className="w-5 h-5 text-yellow-400" />
                    ) : g.status === 'ACTIVE' ? (
                      <RotateCw className="w-5 h-5 text-green-400 animate-spin" />
                    ) : (
                      <Clock className="w-5 h-5 text-orange-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* QUICK LINKS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.push("/play-friend")}
            className="px-6 py-3 bg-purple-600 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Play A Friend
          </button>
          <button
            onClick={() => router.push("/solo")}
            className="px-6 py-3 bg-indigo-600 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Solo Play
          </button>
        </div>
      </div>
    </div>
  );
}