'use client';

import { useEffect, useState, MouseEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { useToast } from '@/components/ToastProvider';

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
  pinned: boolean;
  archivedAt: string | null;
  messages?: Message[];
}

type ViewTab = 'active' | 'archived';

function sortByPinnedAndUpdated(list: ConversationListItem[]) {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export default function ConversationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [activeConversations, setActiveConversations] = useState<
    ConversationListItem[]
  >([]);
  const [archivedConversations, setArchivedConversations] = useState<
    ConversationListItem[]
  >([]);

  const [loadingList, setLoadingList] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<ViewTab>('active');

  // NEW: search + bulk selection
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Delete modal state
  const [pendingDelete, setPendingDelete] =
    useState<ConversationListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // --- EFFECTS ------------------------------------------------------

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Fetch conversations list (active + archived)
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        setLoadingList(true);
        const [activeRes, archivedRes] = await Promise.all([
          api.get<ConversationListItem[]>('/conversations'),
          api.get<ConversationListItem[]>('/conversations/archived'),
        ]);

        setActiveConversations(sortByPinnedAndUpdated(activeRes.data));
        setArchivedConversations(sortByPinnedAndUpdated(archivedRes.data));
      } catch (err) {
        console.error('Failed to load conversations', err);
        showToast({
          type: 'error',
          title: 'Failed to load conversations',
          message: 'Please try refreshing the page.',
        });
      } finally {
        setLoadingList(false);
      }
    };

    fetchConversations();
  }, [user, showToast]);

  // --- DERIVED DATA (hooks must stay above any return) --------------

  // Decide which list we’re showing based on the tab
  const listToRender =
    currentTab === 'active' ? activeConversations : archivedConversations;

  // Filtered list for search
  const filteredList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return listToRender;

    return listToRender.filter((c) => {
      const title = (c.title || 'Untitled conversation').toLowerCase();
      const preview = c.messages?.[0]?.content?.toLowerCase() ?? '';
      return title.includes(q) || preview.includes(q);
    });
  }, [listToRender, searchTerm]);

  // --- AUTH RETURNS (after all hooks) -------------------------------

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

  // --- HANDLERS (no hooks below this point) -------------------------

  const handleOpen = (id: string) => {
    router.push(`/conversations/${id}`);
  };

  const handleNewConversation = async () => {
    try {
      const res = await api.post<ConversationListItem>('/conversations', {
        modelProfile: 'gpt-4o',
      });
      setActiveConversations((prev) =>
        sortByPinnedAndUpdated([res.data, ...prev]),
      );
      window.dispatchEvent(new CustomEvent('conversation-updated'));
      router.push(`/conversations/${res.data.id}`);

      showToast({
        type: 'success',
        title: 'New conversation created',
        message: 'Start chatting with your AI assistant.',
      });
    } catch (err) {
      console.error('Failed to create conversation', err);
      showToast({
        type: 'error',
        title: 'Failed to create conversation',
        message: 'Please try again.',
      });
    }
  };

  const handleRename = async (convo: ConversationListItem) => {
    const currentTitle = convo.title || 'Untitled conversation';
    const newTitle = window.prompt('Rename conversation', currentTitle);
    if (!newTitle || newTitle.trim() === currentTitle.trim()) return;

    try {
      const res = await api.patch<ConversationListItem>(
        `/conversations/${convo.id}`,
        { title: newTitle, titleAutoGenerated: false },
      );

      const updater = (list: ConversationListItem[]) =>
        sortByPinnedAndUpdated(
          list.map((c) => (c.id === convo.id ? { ...c, ...res.data } : c)),
        );

      setActiveConversations((prev) => updater(prev));
      setArchivedConversations((prev) => updater(prev));
      window.dispatchEvent(new CustomEvent('conversation-updated'));
      setMenuOpenId(null);

      showToast({
        type: 'success',
        title: 'Conversation renamed',
      });
    } catch (err) {
      console.error('Failed to rename conversation', err);
      showToast({
        type: 'error',
        title: 'Failed to rename',
        message: 'Please try again.',
      });
    }
  };

  const handleTogglePin = async (convo: ConversationListItem) => {
    try {
      const res = await api.patch<ConversationListItem>(
        `/conversations/${convo.id}`,
        { pinned: !convo.pinned },
      );

      const updater = (list: ConversationListItem[]) =>
        sortByPinnedAndUpdated(
          list.map((c) => (c.id === convo.id ? { ...c, ...res.data } : c)),
        );

      setActiveConversations((prev) => updater(prev));
      setArchivedConversations((prev) => updater(prev));
      window.dispatchEvent(new CustomEvent('conversation-updated'));
      setMenuOpenId(null);

      showToast({
        type: 'success',
        title: convo.pinned ? 'Unpinned' : 'Pinned to top',
      });
    } catch (err) {
      console.error('Failed to toggle pin', err);
      showToast({
        type: 'error',
        title: 'Failed to update pin',
      });
    }
  };

  const handleArchiveToggle = async (convo: ConversationListItem) => {
    const isArchived = !!convo.archivedAt;

    try {
      const payload = {
        archivedAt: isArchived ? null : new Date().toISOString(),
      };

      const res = await api.patch<ConversationListItem>(
        `/conversations/${convo.id}`,
        payload,
      );

      if (isArchived) {
        // move from archived -> active
        setArchivedConversations((prev) =>
          prev.filter((c) => c.id !== convo.id),
        );
        setActiveConversations((prev) =>
          sortByPinnedAndUpdated([res.data, ...prev]),
        );
      } else {
        // move from active -> archived
        setActiveConversations((prev) =>
          prev.filter((c) => c.id !== convo.id),
        );
        setArchivedConversations((prev) =>
          sortByPinnedAndUpdated([res.data, ...prev]),
        );
      }

      window.dispatchEvent(new CustomEvent('conversation-updated'));
      setMenuOpenId(null);

      showToast({
        type: 'success',
        title: isArchived ? 'Conversation unarchived' : 'Conversation archived',
      });
    } catch (err) {
      console.error('Failed to archive/unarchive conversation', err);
      showToast({
        type: 'error',
        title: 'Failed to update archive state',
      });
    }
  };

  const requestDelete = (convo: ConversationListItem) => {
    setPendingDelete(convo);
    setMenuOpenId(null);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/conversations/${pendingDelete.id}`);
      setActiveConversations((prev) =>
        prev.filter((c) => c.id !== pendingDelete.id),
      );
      setArchivedConversations((prev) =>
        prev.filter((c) => c.id !== pendingDelete.id),
      );
      window.dispatchEvent(new CustomEvent('conversation-updated'));
      setPendingDelete(null);

      showToast({
        type: 'success',
        title: 'Conversation deleted',
      });
    } catch (err) {
      console.error('Failed to delete conversation', err);
      showToast({
        type: 'error',
        title: 'Failed to delete conversation',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (convo: ConversationListItem) => {
    try {
      const res = await api.post<ConversationListItem>(
        `/conversations/${convo.id}/duplicate`,
        {},
      );
      // duplicates are always active (archivedAt = null)
      setActiveConversations((prev) =>
        sortByPinnedAndUpdated([res.data, ...prev]),
      );
      window.dispatchEvent(new CustomEvent('conversation-updated'));
      setMenuOpenId(null);

      showToast({
        type: 'success',
        title: 'Conversation duplicated',
      });
    } catch (err) {
      console.error('Failed to duplicate conversation', err);
      showToast({
        type: 'error',
        title: 'Failed to duplicate conversation',
      });
    }
  };

  const handleRowContextMenu = (
    e: MouseEvent<HTMLDivElement>,
    convoId: string,
  ) => {
    e.preventDefault();
    setMenuOpenId((prev) => (prev === convoId ? null : convoId));
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setPendingDelete(null);
  };

  // Bulk-selection helpers
  const isSelected = (id: string) => selectedIds.includes(id);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const handleSelectAllVisible = () => {
    if (selectedIds.length === filteredList.length) {
      clearSelection();
    } else {
      setSelectedIds(filteredList.map((c) => c.id));
    }
  };

  const handleBulkPin = async () => {
    if (selectedIds.length === 0) return;

    try {
      await Promise.all(
        selectedIds.map((id) =>
          api.patch(`/conversations/${id}`, { pinned: true }),
        ),
      );

      const updateList = (list: ConversationListItem[]) =>
        sortByPinnedAndUpdated(
          list.map((c) =>
            selectedIds.includes(c.id) ? { ...c, pinned: true } : c,
          ),
        );

      setActiveConversations((prev) => updateList(prev));
      setArchivedConversations((prev) => updateList(prev));
      window.dispatchEvent(new CustomEvent('conversation-updated'));
      clearSelection();

      showToast({
        type: 'success',
        title: 'Pinned to top',
        message: `${selectedIds.length} conversation(s) pinned.`,
      });
    } catch (err) {
      console.error('Bulk pin failed', err);
      showToast({
        type: 'error',
        title: 'Failed to pin conversations',
      });
    }
  };

  const handleBulkArchiveToggle = async () => {
    if (selectedIds.length === 0) return;

    const isArchiving = currentTab === 'active';

    try {
      await Promise.all(
        selectedIds.map((id) =>
          api.patch(`/conversations/${id}`, {
            archivedAt: isArchiving ? new Date().toISOString() : null,
          }),
        ),
      );

      if (isArchiving) {
        // move from active -> archived
        const moving = activeConversations.filter((c) =>
          selectedIds.includes(c.id),
        );
        setActiveConversations((prev) =>
          prev.filter((c) => !selectedIds.includes(c.id)),
        );
        setArchivedConversations((prev) =>
          sortByPinnedAndUpdated([
            ...moving.map((c) => ({
              ...c,
              archivedAt: new Date().toISOString(),
            })),
            ...prev,
          ]),
        );
      } else {
        // archived -> active
        const moving = archivedConversations.filter((c) =>
          selectedIds.includes(c.id),
        );
        setArchivedConversations((prev) =>
          prev.filter((c) => !selectedIds.includes(c.id)),
        );
        setActiveConversations((prev) =>
          sortByPinnedAndUpdated([
            ...moving.map((c) => ({ ...c, archivedAt: null })),
            ...prev,
          ]),
        );
      }

      window.dispatchEvent(new CustomEvent('conversation-updated'));
      showToast({
        type: 'success',
        title: isArchiving
          ? 'Conversations archived'
          : 'Conversations unarchived',
        message: `${selectedIds.length} conversation(s) updated.`,
      });
      clearSelection();
    } catch (err) {
      console.error('Bulk archive toggle failed', err);
      showToast({
        type: 'error',
        title: 'Failed to update conversations',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const ok = window.confirm(
      `Delete ${selectedIds.length} conversation(s)? This cannot be undone.`,
    );
    if (!ok) return;

    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/conversations/${id}`)));

      setActiveConversations((prev) =>
        prev.filter((c) => !selectedIds.includes(c.id)),
      );
      setArchivedConversations((prev) =>
        prev.filter((c) => !selectedIds.includes(c.id)),
      );
      window.dispatchEvent(new CustomEvent('conversation-updated'));
      showToast({
        type: 'success',
        title: 'Conversations deleted',
      });
      clearSelection();
    } catch (err) {
      console.error('Bulk delete failed', err);
      showToast({
        type: 'error',
        title: 'Failed to delete conversations',
      });
    }
  };


  const listIsEmpty = filteredList.length === 0;

  return (
    <AppShell
      title="Conversations"
      subtitle="Browse and manage your chats."
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Your conversations
          </h2>
          <div className="mt-2 inline-flex rounded-full bg-slate-100 p-1 text-xs">
            <button
              type="button"
              className={`rounded-full px-3 py-1 ${
                currentTab === 'active'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => {
                setCurrentTab('active');
                clearSelection();
              }}
            >
              Active
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 ${
                currentTab === 'archived'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => {
                setCurrentTab('archived');
                clearSelection();
              }}
            >
              Archived
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="hidden sm:block">
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-52 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
          <button
            onClick={handleNewConversation}
            className="rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
          >
            + New chat
          </button>
        </div>
      </div>

      {/* small search on mobile */}
      <div className="mb-3 sm:hidden">
        <input
          type="text"
          placeholder="Search conversations…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 shadow-sm outline-none focus:ring-1 focus:ring-slate-400"
        />
      </div>

      {/* Bulk selection toolbar */}
      {selectedIds.length > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-700">
          <div>
            <span className="font-semibold">{selectedIds.length}</span>{' '}
            selected
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-200"
              onClick={handleSelectAllVisible}
            >
              {selectedIds.length === filteredList.length
                ? 'Clear selection'
                : 'Select all'}
            </button>
            <button
              className="rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-200"
              onClick={handleBulkPin}
            >
              Pin to top
            </button>
            <button
              className="rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-200"
              onClick={handleBulkArchiveToggle}
            >
              {currentTab === 'active' ? 'Archive' : 'Unarchive'}
            </button>
            <button
              className="rounded-md bg-red-600 px-2 py-1 font-medium text-white hover:bg-red-700"
              onClick={handleBulkDelete}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {loadingList ? (
        <div className="rounded-xl bg-white/80 px-6 py-4 text-slate-700 shadow-sm border border-slate-200">
          Loading…
        </div>
      ) : listIsEmpty ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-sm text-slate-500">
          {searchTerm.trim()
            ? 'No conversations match your search.'
            : currentTab === 'active'
            ? "You don't have any conversations yet."
            : 'No archived conversations.'}
          {!searchTerm.trim() && currentTab === 'active' && (
            <button
              onClick={handleNewConversation}
              className="ml-2 text-slate-700 underline"
            >
              Start a new chat.
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="space-y-2">
            {filteredList.map((convo) => {
              const lastMessage = convo.messages?.[0];
              const subtitle =
                lastMessage?.content?.slice(0, 80) ||
                'No messages yet. Click to start chatting.';
              const isArchived = !!convo.archivedAt;
              const checked = isSelected(convo.id);

              return (
                <div key={convo.id} className="group relative">
                  {/* swipe-to-archive hint */}
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[11px] font-medium text-red-500 opacity-0 transition group-hover:opacity-100">
                    {isArchived ? 'Unarchive' : 'Archive'}
                  </div>

                  <div
                    className="relative flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-transform group-hover:-translate-x-2"
                    onClick={() => handleOpen(convo.id)}
                    onContextMenu={(e) => handleRowContextMenu(e, convo.id)}
                  >
                    <div className="flex items-start gap-2">
                      {/* selection checkbox */}
                      <input
                        type="checkbox"
                        className="mt-1 h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        checked={checked}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelected(convo.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 text-sm font-medium text-slate-900">
                          {convo.pinned && (
                            <span
                              className="text-[12px]"
                              title="Pinned conversation"
                            >
                              📌
                            </span>
                          )}
                          {convo.title || 'Untitled conversation'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {subtitle}
                        </span>
                      </div>
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
                          <div className="absolute right-0 top-6 z-20 w-44 rounded-md border border-slate-200 bg-white py-1 text-xs text-slate-700 shadow-lg">
                            <button
                              className="flex w-full items-center justify-between px-3 py-1 hover:bg-slate-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePin(convo);
                              }}
                            >
                              <span>{convo.pinned ? 'Unpin' : 'Pin to top'}</span>
                              <span className="text-[10px] text-slate-400">
                                📌
                              </span>
                            </button>
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
                              className="flex w-full items-center justify-between px-3 py-1 hover:bg-slate-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveToggle(convo);
                              }}
                            >
                              <span>{isArchived ? 'Unarchive' : 'Archive'}</span>
                              <span className="text-[10px] text-slate-400">
                                🗂
                              </span>
                            </button>
                            <button
                              className="flex w-full items-center justify-between px-3 py-1 text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                requestDelete(convo);
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
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50">
          <div
            className="absolute inset-0"
            onClick={closeDeleteModal}
            aria-hidden="true"
          />
          <div className="relative z-50 w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-900">
              Delete conversation?
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                “{pendingDelete.title || 'Untitled conversation'}”
              </span>
              ? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-md bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 disabled:opacity-60"
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
