'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

// Quick-access model buttons (segmented, ChatGPT-style)
const QUICK_MODELS = [
  {
    id: 'auto',
    label: 'Auto',
    value: 'auto',
    description: 'Let Baqool choose the best model based on your prompt.',
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    value: 'gpt-4o',
    description: 'OpenAI GPT-4o – strong for general chat and coding.',
  },
  {
    id: 'claude-3.5-sonnet',
    label: 'Claude 3.5',
    value: 'claude-3.5-sonnet',
    description: 'Anthropic Claude 3.5 Sonnet – great for long, careful reasoning.',
  },
  {
    id: 'gemini-1.5-pro',
    label: 'Gemini 1.5',
    value: 'gemini-1.5-pro',
    description: 'Google Gemini 1.5 Pro – strong at synthesis and researchy tasks.',
  },
];

// Full dropdown with groups
const MODEL_OPTIONS = [
  { value: 'auto', label: 'Auto (router)', group: 'General' },
  { value: 'gpt-4o', label: 'GPT-4o (OpenAI)', group: 'OpenAI' },
  { value: 'gpt-4o-mini', label: 'GPT-4o mini (cheap)', group: 'OpenAI' },
  { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', group: 'Anthropic' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', group: 'Google' },
];

type IntentType = 'chat' | 'code' | 'analysis' | 'rewrite';

type PreviewResponse = {
  intent: IntentType;
  suggestedModel: string;
  reason: string;
};

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

// Simple “icons” for each provider (emoji-based for now)
function modelIcon(model: string) {
  if (model === 'gpt-4o' || model === 'gpt-4o-mini') return '🌀';
  if (model.startsWith('claude')) return '✨';
  if (model.startsWith('gemini')) return '🔷';
  if (model === 'auto') return '⚙️';
  return '🤖';
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

  // Router / preview state
  const [routerSuggestion, setRouterSuggestion] = useState<string | null>(null);
  const [previewIntent, setPreviewIntent] = useState<IntentType | null>(null);
  const [previewReason, setPreviewReason] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Manual model override (via segmented buttons / dropdown)
  const [modelOverride, setModelOverride] = useState<string>('auto');

  // Streaming toggle (UI only for now – not sent to backend to avoid DTO issues)
  const [streamingEnabled, setStreamingEnabled] = useState(false);

  // Title editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const baseModel = conversation?.modelProfile ?? 'gpt-4o';

  // Final model we will actually use in the backend request
  const effectiveModel =
    modelOverride === 'auto'
      ? routerSuggestion ?? baseModel
      : modelOverride;

  // Sync titleDraft when conversation loads / changes
  useEffect(() => {
    if (conversation) {
      setTitleDraft(conversation.title || '');
    }
  }, [conversation]);

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

  // Call /conversations/preview whenever the user edits input
  useEffect(() => {
    const text = input.trim();
    if (!text) {
      setRouterSuggestion(null);
      setPreviewIntent(null);
      setPreviewReason(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setPreviewLoading(true);
        setPreviewError(null);

        const res = await api.post<PreviewResponse>('/conversations/preview', {
          content: text,
          lastModel: baseModel, // MUST match backend DTO (PreviewMessageDto)
        });

        if (cancelled) return;

        setRouterSuggestion(res.data.suggestedModel);
        setPreviewIntent(res.data.intent);
        setPreviewReason(res.data.reason);
      } catch (err) {
        if (cancelled) return;
        console.error('Preview failed', err);
        setRouterSuggestion(null);
        setPreviewIntent(null);
        setPreviewReason(null);
        setPreviewError('Model suggestion unavailable – using base model.');
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    };

    const handle = setTimeout(run, 400); // debounce keystrokes

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [input, baseModel]);

  // Save title (requires a PATCH /conversations/:id endpoint on backend)
  const handleSaveTitle = async () => {
    if (!conversationId) return;
    try {
      const res = await api.patch<Conversation>(
        `/conversations/${conversationId}`,
        { title: titleDraft || 'Untitled conversation' },
      );
      setConversation(res.data);
      setEditingTitle(false);
    } catch (err) {
      console.error('Failed to update title', err);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId) return;

    setSending(true);

    try {
      const body: any = {
        content: input.trim(),
        modelProfile: effectiveModel,
      };
      // NOTE: we are NOT sending streamingEnabled yet to avoid backend DTO errors

      const { data } = await api.post<AddMessageResponse>(
        `/conversations/${conversationId}/messages`,
        body,
      );

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
    e.preventDefault();
    if (!sending) {
      await handleSendMessage();
    }
  };

  // Loading / not-found guards
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

  // Group model options for dropdown headings
  const groupedOptions = MODEL_OPTIONS.reduce<Record<string, typeof MODEL_OPTIONS>>(
    (acc, opt) => {
      if (!acc[opt.group]) acc[opt.group] = [];
      acc[opt.group].push(opt);
      return acc;
    },
    {},
  );

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              className="text-xs text-slate-500 hover:text-slate-700"
              onClick={() => router.push('/conversations')}
            >
              ← Back
            </button>

            {/* Title + rename inline */}
            <div className="flex items-center gap-2">
              {editingTitle ? (
                <>
                  <input
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-800 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveTitle();
                      }
                      if (e.key === 'Escape') {
                        setEditingTitle(false);
                        setTitleDraft(conversation.title || '');
                      }
                    }}
                    onBlur={handleSaveTitle}
                    autoFocus
                  />
                </>
              ) : (
                <>
                  <h1 className="text-base font-semibold text-slate-900">
                    {conversation.title || 'Untitled conversation'}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setEditingTitle(true)}
                    className="text-[10px] text-slate-400 hover:text-slate-600"
                    title="Rename conversation"
                  >
                    ✏️
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Model controls */}
          <div className="flex flex-col items-end gap-1">
            {/* Segmented buttons (GPT-style) */}
            <div className="inline-flex rounded-full bg-slate-100 p-1">
              {QUICK_MODELS.map((m) => {
                const active = modelOverride === m.value;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModelOverride(m.value)}
                    title={m.description}
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] ${
                      active
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{modelIcon(m.value)}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Effective model + router info */}
            <div className="flex items-center gap-2">
              <span
                className="rounded-full bg-slate-50 px-3 py-1 text-[10px] text-slate-700 border border-slate-200"
                title={previewReason || undefined}
              >
                {previewLoading
                  ? 'Analyzing prompt…'
                  : `Using: ${effectiveModel}`}
              </span>

              {/* Advanced dropdown with grouped headings */}
              <select
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] text-slate-700"
                value={modelOverride}
                onChange={(e) => setModelOverride(e.target.value)}
                title="Advanced model selection"
              >
                {Object.entries(groupedOptions).map(([groupName, opts]) => (
                  <optgroup key={groupName} label={groupName}>
                    {opts.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Intent / reason / errors */}
            {previewIntent && previewReason && (
              <span className="max-w-xs text-right text-[10px] text-slate-500">
                Intent: {previewIntent} • {previewReason}
              </span>
            )}
            {previewError && (
              <span className="max-w-xs text-right text-[10px] text-red-500">
                {previewError}
              </span>
            )}
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 space-y-3 bg-slate-50 px-6 py-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
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
                  <div className="flex max-w-[70%] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]" />
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
          className="border-t border-slate-200 bg-white px-6 py-3"
        >
          <div className="flex items-end gap-3">
            <textarea
              className="flex-1 resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-600 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              rows={2}
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <div className="flex flex-col items-end gap-2">
              {/* Streaming toggle (UI only for now) */}
              <label className="flex items-center gap-1 text-[11px] text-slate-500">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={streamingEnabled}
                  onChange={(e) => setStreamingEnabled(e.target.checked)}
                />
                <span>Stream reply (soon)</span>
              </label>

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
          </div>
        </form>
      </div>
    </AppShell>
  );
}
