'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

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

interface AddMessageResponse {
  userMessage: Message;
  assistantMessage: Message | null;
}

interface Conversation {
  id: string;
  title: string | null;
  modelProfile: string;
  createdAt: string;
  updatedAt: string;
}

export default function ConversationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.id as string | undefined;

  const { user, loading: authLoading } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Fetch conversation + messages
  useEffect(() => {
    if (!user || !conversationId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [convRes, messagesRes] = await Promise.all([
          api.get<Conversation>(`/conversations/${conversationId}`),
          api.get<Message[]>(`/conversations/${conversationId}/messages`),
        ]);

        setConversation(convRes.data);
        setMessages(messagesRes.data);
      } catch (error) {
        console.error('Failed to load conversation', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, conversationId]);

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId) return;

    setSending(true);

    try {
      const { data } = await api.post<AddMessageResponse>(
        `/conversations/${conversationId}/messages`,
        { content: input.trim() },
      );

      // Immediately update UI with both user + assistant messages
      setMessages((prev) => [
        ...prev,
        data.userMessage,
        ...(data.assistantMessage ? [data.assistantMessage] : []),
      ]);

      setInput('');
    } catch (error) {
      console.error('Send error:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // prevent full page reload
    if (!sending) {
      await handleSendMessage();
    }
  };

  if (authLoading || !user || !conversationId || loading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
          Loading conversation...
        </div>
      </AppShell>
    );
  }

  if (!conversation) {
    return (
      <AppShell>
        <div className="flex h-full flex-col items-center justify-center text-sm text-slate-500">
          <p>Conversation not found.</p>
          <button
            onClick={() => router.push('/conversations')}
            className="mt-4 rounded bg-slate-900 px-4 py-2 text-xs font-medium text-white"
          >
            Back to conversations
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
          <div>
            <button
              className="text-xs text-slate-500 hover:text-slate-700"
              onClick={() => router.push('/conversations')}
            >
              ← Back to conversations
            </button>
            <h1 className="mt-1 text-base font-semibold text-slate-900">
              {conversation.title || 'Untitled conversation'}
            </h1>
          </div>
          <span className="text-[10px] rounded-full bg-slate-100 px-3 py-1 text-slate-600">
            {conversation.modelProfile}
          </span>
        </header>

        {/* Messages */}
        
        <main className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-slate-50">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No messages yet. Start the conversation below.
            </div>
          ) : (
            <>
              {messages.map((m) => {
                const isUser = m.role === 'USER';
                return (
                  <div
                    key={m.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                        isUser
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-900 border border-slate-200'
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {m.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator while AI is thinking */}
              {sending && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] rounded-lg px-3 py-2 text-sm bg-white border border-slate-200 text-slate-500 flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse [animation-delay:120ms]" />
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse [animation-delay:240ms]" />
                    </div>
                    <span>Baqool is thinking…</span>
                  </div>
                </div>
              )}
            </>
          )}
        </main>


        {/* Input */}
        <form
          onSubmit={handleFormSubmit}
          className="border-t border-slate-200 px-6 py-3 bg-white"
        >
          <div className="flex items-end gap-2">
            <textarea
              className="flex-1 resize-none rounded-md border border-slate-300 px-3 py-2 text-sm
                         text-slate-800 placeholder-slate-600 bg-white
                         outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              rows={2}
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <button
              type="submit"
              disabled={sending || !input.trim()}
              className={`rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
                sending ? 'animate-pulse' : ''
              }`}
            >
              {sending ? 'Sending…' : 'Send'}
            </button>

          </div>
        </form>
      </div>
    </AppShell>
  );
}
