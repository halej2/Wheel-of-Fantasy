// components/UserSearchInvite.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Search, UserPlus, X } from 'lucide-react';

interface UserResult {
  id: string;
  username: string;
  name?: string;
  avatar?: string;
}

interface UserSearchInviteProps {
  currentUser: User | null;
  onInviteSent?: (friendUsername: string) => void;
}

export default function UserSearchInvite({ currentUser, onInviteSent }: UserSearchInviteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviting, setInviting] = useState<string | null>(null);

  // Debounced search
  const searchUsers = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !currentUser) {
      setResults([]);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, name, avatar')
        .ilike('username', `%${searchQuery.trim()}%`)
        .neq('id', currentUser.id) // exclude self
        .limit(6);

      if (error) throw error;

      setResults(data || []);
      if (data?.length === 0) {
        setError(`No user found for "@${searchQuery}"`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  const sendInvite = async (friendId: string, friendUsername: string) => {
    if (!currentUser) return;

    setInviting(friendId);
    try {
      // Create pending game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          player1Id: currentUser.id,
          status: 'PENDING'
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Send invite
      const { error: inviteError } = await supabase
        .from('invites')
        .insert({
          senderId: currentUser.id,
          receiverId: friendId,
          gameId: game.id
        });

      if (inviteError) throw inviteError;

      onInviteSent?.(friendUsername);
      alert(`Invite sent to @${friendUsername}!`);
      setQuery('');
      setResults([]);
    } catch (err) {
      console.error(err);
      alert('Failed to send invite. Try again.');
    } finally {
      setInviting(null);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" />
          Invite by @username
        </h2>

        {/* Search Input */}
        <div className="relative">
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <Search className="w-5 h-5 text-gray-400 ml-3" />
            <input
              type="text"
              placeholder="Search @username..."
              value={query}
              onChange={(e) => setQuery(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              className="flex-1 px-3 py-2 outline-none text-gray-700"
              autoFocus
            />
            {query && (
              <button
                onClick={clearSearch}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-4 flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <p className="mt-3 text-sm text-red-600 text-center bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="mt-4 space-y-2">
            {results.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">@{user.username}</p>
                    {user.name && <p className="text-xs text-gray-500">{user.name}</p>}
                  </div>
                </div>

                <button
                  onClick={() => sendInvite(user.id, user.username)}
                  disabled={inviting === user.id}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    inviting === user.id
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                  }`}
                >
                  {inviting === user.id ? 'Sending...' : 'Invite'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && query && results.length === 0 && (
          <p className="mt-8 text-center text-gray-500 text-sm">
            Start typing to find friends
          </p>
        )}
      </div>

      {/* Pro Tip */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        Tip: Usernames are unique. Ask your friend for their exact @username!
      </p>
    </div>
  );
}