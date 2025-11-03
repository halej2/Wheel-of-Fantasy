// app/play-friend/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, Key, Copy } from 'lucide-react';

interface UserResult {
  id: string;
  username: string;
}

export default function PlayFriend() {
  const [search, setSearch] = useState('');
  const [code, setCode] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatedGameId, setGeneratedGameId] = useState<string | null>(null); // NEW

  const router = useRouter();

  // === 1. SEARCH USER (live) ===
  const searchUsers = useCallback(async () => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/user/search?q=${encodeURIComponent(search.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchUsers]);

  // === 2. INVITE BY USERNAME ===
  const inviteUser = async (friendId: string) => {
    setInviting(friendId);
    try {
      const res = await fetch('/api/invite/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });
      const { gameId } = await res.json();
      alert('Invite sent!');
      router.push(`/game/${gameId}`);
    } catch (err) {
      alert('Failed to send invite.');
    } finally {
      setInviting(null);
    }
  };

  // === 3. GENERATE CODE ===
  const generateCode = async () => {
    try {
      const res = await fetch('/api/game/create', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create game');
      const { gameId, code } = await res.json();

      setGeneratedCode(code);
      setGeneratedGameId(gameId);
      alert(`Give this code to your friend: ${code}`);
      router.push(`/game/${gameId}`); // AUTO-ENTER GAME
    } catch (err) {
      alert('Failed to generate code.');
    }
  };

  // === 4. JOIN BY CODE ===
  const joinByCode = async () => {
    if (!code.trim()) return;
    try {
      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      if (!res.ok) throw new Error('Invalid code');
      const { gameId } = await res.json();
      router.push(`/game/${gameId}`);
    } catch (err: any) {
      alert(err.message || 'Invalid code');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Play A Friend
        </h1>

        {/* === SEARCH USER === */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Find by @username
          </h2>
          <input
            placeholder="@tombrady"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {loading && <Loader2 className="w-5 h-5 animate-spin mt-2" />}
          <div className="mt-3 space-y-2">
            {results.map((u) => (
              <div
                key={u.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">@{u.username}</span>
                <button
                  onClick={() => inviteUser(u.id)}
                  disabled={inviting === u.id}
                  className="px-4 py-1 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {inviting === u.id ? 'Sending...' : 'Invite'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-gray-600 font-medium">OR</div>

        {/* === GENERATE CODE === */}
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <h2 className="text-lg font-semibold mb-3 flex items-center justify-center gap-2">
            <Key className="w-5 h-5 text-purple-600" />
            Generate Invite Code
          </h2>
          <button
            onClick={generateCode}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
          >
            Generate Code
          </button>
          {generatedCode && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700 mb-2">Give this code to your friend:</p>
              <code className="text-2xl font-mono tracking-widest">{generatedCode}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode);
                  alert('Copied!');
                }}
                className="ml-3 text-purple-700"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* === ENTER CODE === */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-3">Enter Friend's Code</h2>
          <div className="flex gap-2">
            <input
              placeholder="ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-2 border rounded-lg uppercase font-mono text-lg tracking-widest text-center"
              maxLength={6}
            />
            <button
              onClick={joinByCode}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}