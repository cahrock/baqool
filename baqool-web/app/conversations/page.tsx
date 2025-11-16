'use client';

import { useEffect, useState, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

type Role = 'USER' | 'ASSISTANT' | 'SYSTEM';

interface Message {
  id: string;
  conversationId: string;
  role: Role;
  content: string;
  modelUsed?: string | null;
  createdAt: string;
  userId?: string | null;
}

interface ConversationListItem {
  id: string;
  title: string | null;
  modelProfile: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[]; // last message included from backend
}

export default function ConversationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Fetch conversations list
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        setLoadingList(true);
        const res = await api.get<ConversationListItem[]>('/conversations');
        setConversations(res.data);
      } catch (err) {
        console.error('Failed to load conversations', err);
      } finally {
        setLoadingList(false);
      }
    };

    fetchConversations();
  }, [user]);

  if (authLoading) {
    return (
      <AppShell>
        <main className="flex h-full items-center justify-center bg-slate-50">
          <div className="rounded-xl bg-white/80 px-6 py-4 text-slate-700 shadow-sm border border-slate-200">
            Checking auth…
          </div>
        </main>
      </AppShell>
    );
  }

  if (!user) return null;

  const handleOpen = (id: string) => {
    router.push(`/conversations/${id}`);
  };

  const handleNewConversation = async () => {
    try {
      const res = await api.post<ConversationListItem>('/conversations', {
        title: 'New conversation',
        modelProfile: 'gpt-4o',
      });
      // Prepend to list and open it
      setConversations((prev) => [res.data, ...prev]);
      router.push(`/conversations/${res.data.id}`);
    } catch (err) {
      console.error('Failed to create conversation', err);
    }
  };

  const handleRename = async (convo: ConversationListItem) => {
    const currentTitle = convo.title || 'Untitled conversation';
    const newTitle = window.prompt('Rename conversation', currentTitle);
    if (!newTitle || newTitle.trim() === currentTitle.trim()) return;

    try {
      const res = await api.patch<ConversationListItem>(
        `/conversations/${convo.id}`,
        { title: newTitle },
      );
      setConversations((prev) =>
        prev.map((c) => (c.id === convo.id ? { ...c, ...res.data } : c)),
      );
      setMenuOpenId(null);
    } catch (err) {
      console.error('Failed to rename conversation', err);
    }
  };

  const handleDelete = async (convo: ConversationListItem) => {
    const ok = window.confirm(
      `Delete conversation "${convo.title || 'Untitled conversation'}"? This cannot be undone.`,
    );
    if (!ok) return;

    try {
      await api.delete(`/conversations/${convo.id}`);
      setConversations((prev) => prev.filter((c) => c.id !== convo.id));
      setMenuOpenId(null);
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  const handleDuplicate = async (convo: ConversationListItem) => {
    try {
      const res = await api.post<ConversationListItem>(
        `/conversations/${convo.id}/duplicate`,
        {},
      );
      // Add the new copy to the top of the list
      setConversations((prev) => [res.data, ...prev]);
      setMenuOpenId(null);
    } catch (err) {
      console.error('Failed to duplicate conversation', err);
    }
  };

  const handleRowContextMenu = (
    e: MouseEvent<HTMLDivElement>,
    convoId: string,
  ) => {
    e.preventDefault(); // prevent the browser context menu
    setMenuOpenId((prev) => (prev === convoId ? null : convoId));
  };

  return (
    <AppShell
      title="Conversations"
      subtitle="Browse and manage your chats."
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Your conversations
        </h2>
        <button
          onClick={handleNewConversation}
          className="rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
        >
          + New chat
        </button>
      </div>

      {loadingList ? (
        <div className="rounded-xl bg-white/80 px-6 py-4 text-slate-700 shadow-sm border border-slate-200">
          Loading…
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-sm text-slate-500">
          You don&apos;t have any conversations yet.
          <button
            onClick={handleNewConversation}
            className="ml-2 text-slate-700 underline"
          >
            Start a new chat.
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="space-y-2">
            {conversations.map((convo) => {
              const lastMessage = convo.messages[0];
              const subtitle =
                lastMessage?.content?.slice(0, 80) ||
                'No messages yet. Click to start chatting.';

              return (
                <div
                  key={convo.id}
                  className="relative flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                  onClick={() => handleOpen(convo.id)}
                  onContextMenu={(e) => handleRowContextMenu(e, convo.id)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">
                      {convo.title || 'Untitled conversation'}
                    </span>
                    <span className="text-xs text-slate-500">{subtitle}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] rounded-full bg-slate-100 px-2 py-1 text-slate-500">
                      {convo.modelProfile}
                    </span>

                    {/* ⋮ menu trigger */}
                    <div className="relative">
                      <button
                        type="button"
                        className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId((prev) =>
                            prev === convo.id ? null : convo.id,
                          );
                        }}
                      >
                        ⋮
                      </button>

                      {menuOpenId === convo.id && (
                        <div className="absolute right-0 top-6 z-20 w-40 rounded-md border border-slate-200 bg-white py-1 text-xs text-slate-700 shadow-lg">
                          <button
                            className="flex w-full items-center justify-between px-3 py-1 hover:bg-slate-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRename(convo);
                            }}
                          >
                            <span>Rename</span>
                            <span className="text-[10px] text-slate-400">
                              ✏️
                            </span>
                          </button>
                          <button
                            className="flex w-full items-center justify-between px-3 py-1 hover:bg-slate-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(convo);
                            }}
                          >
                            <span>Duplicate</span>
                            <span className="text-[10px] text-slate-400">
                              ⧉
                            </span>
                          </button>
                          <button
                            className="flex w-full items-center justify-between px-3 py-1 text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(convo);
                            }}
                          >
                            <span>Delete</span>
                            <span className="text-[10px] text-red-400">
                              🗑
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
