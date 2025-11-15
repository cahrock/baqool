'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api'; 

type Message = {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  createdAt: string;
};

type Conversation = {
  id: string;
  title: string | null;
  modelProfile: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[]; // we'll get last message as preview from backend
};

export default function ConversationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [creating, setCreating] = useState(false);

  // Auth guard (same spirit as your dashboard)
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Fetch conversations once user is loaded
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        setLoadingConvos(true);
        const { data } = await api.get<Conversation[]>('/conversations');
        setConversations(data);
      } catch (error) {
        console.error('Failed to load conversations', error);
      } finally {
        setLoadingConvos(false);
      }
    };

    fetchConversations();
  }, [user]);

  const handleNewConversation = async () => {
    try {
      setCreating(true);
      const { data } = await api.post<Conversation>('/conversations', {
        title: 'New conversation',
      });

      // Add new conversation at the top of the list
      setConversations((prev) => [data, ...prev]);

      // Navigate to detailed chat page (we’ll build /conversations/[id] next)
      router.push(`/conversations/${data.id}`);
    } catch (error) {
      console.error('Failed to create conversation', error);
    } finally {
      setCreating(false);
    }
  };

  // While auth is resolving, show a simple loading state
  if (loading || (!user && typeof window !== 'undefined')) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
          Loading...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex h-full">
        {/* Sidebar with conversations */}
        <aside className="w-72 border-r border-slate-200 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-base font-semibold text-slate-900">
              Conversations
            </h1>
            <button
              onClick={handleNewConversation}
              disabled={creating}
              className="text-xs px-3 py-1 rounded bg-slate-900 text-white disabled:opacity-60"
            >
              {creating ? 'Creating...' : '+ New chat'}
            </button>
          </div>

          {loadingConvos ? (
            <div className="text-sm text-slate-500">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="text-sm text-slate-500">
              No conversations yet. Click <span className="font-semibold">New chat</span> to start.
            </div>
          ) : (
            <ul className="space-y-1 overflow-y-auto">
              {conversations.map((c) => {
                const lastMessage = c.messages && c.messages[0];
                return (
                  <li key={c.id}>
                    <Link
                      href={`/conversations/${c.id}`}
                      className="block rounded px-2 py-2 hover:bg-slate-100"
                    >
                      <div className="flex items-center justify-between">
                        <div className="mr-2">
                          <div className="text-sm font-medium text-slate-900">
                            {c.title || 'Untitled conversation'}
                          </div>
                          {lastMessage && (
                            <div className="text-xs text-slate-500 truncate">
                              {lastMessage.content}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
                          {c.modelProfile}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Main area (placeholder until we build /conversations/[id]) */}
        <main className="flex-1 flex items-center justify-center text-slate-400">
          <p className="text-sm">
            Select a conversation on the left, or click <span className="font-semibold">New chat</span> to start.
          </p>
        </main>
      </div>
    </AppShell>
  );
}
