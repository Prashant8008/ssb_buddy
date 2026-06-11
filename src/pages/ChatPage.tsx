import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  MoreVertical,
  Phone,
  Video,
  Send,
  Paperclip,
  Smile,
  Mic,
  CheckCheck,
  Check,
  Plus,
  Users,
  ArrowLeft,
  MessageSquare,
  Loader2,
  WifiOff,
  Trash2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AuthService, ChatService, getChatWebSocketUrl } from '../services/api';

/* ─── Types matching DRF serializers ─────────────────────────────────────── */

interface ApiUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface ApiLastMessage {
  body: string;
  sender: string;
  created_at: string;
}

interface ApiConversation {
  id: number;
  title: string;
  is_group_chat: boolean;
  participants: ApiUser[];
  created_by: number;
  created_at: string;
  last_message: ApiLastMessage | null;
  unread_count: number;
}

interface ApiMessage {
  id: number;
  conversation: number;
  sender: ApiUser;
  body: string;
  image: string | null;
  created_at: string;
  read_by: number[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/** Return the current user's ID from JWT (decode payload without verification) */
function getCurrentUserIdFromToken(): number | null {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const id = payload.user_id ?? payload.id ?? null;
    return id != null ? Number(id) : null;
  } catch {
    return null;
  }
}

function isOwnMessage(
  sender: ApiUser,
  myId: number | null,
  myUsername: string | null
): boolean {
  if (myId != null && Number(sender.id) === myId) return true;
  if (myUsername && sender.username === myUsername) return true;
  return false;
}

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatConvoTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const oneDay = 86_400_000;

  if (diff < oneDay && d.getDate() === now.getDate()) {
    return formatMessageTime(iso);
  }
  if (diff < 2 * oneDay) return 'Yesterday';
  if (diff < 7 * oneDay) return d.toLocaleDateString('en-IN', { weekday: 'long' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getOtherParticipant(
  convo: ApiConversation,
  myId: number | null,
  myUsername: string | null
): ApiUser | undefined {
  return convo.participants.find((p) => {
    if (myId != null && Number(p.id) === myId) return false;
    if (myUsername && p.username === myUsername) return false;
    return true;
  });
}

function getConvoDisplayName(
  convo: ApiConversation,
  myId: number | null,
  myUsername: string | null = null
): string {
  if (convo.is_group_chat) return convo.title || 'Group Chat';

  const other = getOtherParticipant(convo, myId, myUsername);
  if (other) {
    const fullName = `${other.first_name} ${other.last_name}`.trim();
    return fullName || other.username;
  }
  return 'Chat';
}

function getAvatarSeed(
  convo: ApiConversation,
  myId: number | null,
  myUsername: string | null = null
): string {
  if (convo.is_group_chat) return convo.title || `group-${convo.id}`;
  const other = getOtherParticipant(convo, myId, myUsername);
  return other?.username || `chat-${convo.id}`;
}

function getParticipantCount(convo: ApiConversation): string {
  const count = convo.participants.length;
  return `${count} member${count !== 1 ? 's' : ''}`;
}

/* ─── Component ──────────────────────────────────────────────────────────── */

const ChatPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [myId, setMyId] = useState<number | null>(getCurrentUserIdFromToken());
  const [myUsername, setMyUsername] = useState<string | null>(null);

  // ── State ──
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deletingConvoId, setDeletingConvoId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    AuthService.me()
      .then((res) => {
        setMyId(Number(res.data.id));
        setMyUsername(res.data.username);
      })
      .catch(() => {
        setMyId(getCurrentUserIdFromToken());
      });
  }, []);

  // ── Fetch conversations ──
  const fetchConversations = useCallback(async () => {
    try {
      const res = await ChatService.getConversations();
      const data = res.data.results ?? res.data;
      const list = Array.isArray(data) ? data : [];
      const unique = Array.from(new Map(list.map((c) => [c.id, c])).values());
      setConversations(unique);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvos(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearMessages = async (convoId: number) => {
    const convo = conversations.find((c) => c.id === convoId);
    const name = convo ? getConvoDisplayName(convo, myId, myUsername) : 'this chat';
    const confirmed = window.confirm(
      `Clear all messages with ${name}? The chat will stay in your messages list.`
    );
    if (!confirmed) return;

    setDeletingConvoId(convoId);
    setMenuOpen(false);
    try {
      await ChatService.clearMessages(convoId);
      setMessages((prev) => (activeConvoId === convoId ? [] : prev));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convoId ? { ...c, last_message: null, unread_count: 0 } : c
        )
      );
    } catch (err) {
      console.error('Failed to clear messages:', err);
      window.alert('Could not clear messages. Please try again.');
    } finally {
      setDeletingConvoId(null);
    }
  };

  // Open DM from ?user= or ?conversation= query params
  useEffect(() => {
    const userId = searchParams.get('user');
    const conversationId = searchParams.get('conversation');
    if (!userId && !conversationId) return;

    let cancelled = false;

    (async () => {
      try {
        if (conversationId) {
          if (!cancelled) setActiveConvoId(Number(conversationId));
        } else if (userId) {
          const res = await ChatService.getOrCreateDM(Number(userId));
          if (!cancelled) {
            setActiveConvoId(res.data.id);
            await fetchConversations();
          }
        }
      } catch (err) {
        console.error('Failed to open chat:', err);
      } finally {
        if (!cancelled) {
          setSearchParams({}, { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams, fetchConversations]);

  // ── Fetch messages when active conversation changes ──
  useEffect(() => {
    if (activeConvoId === null) return;
    let cancelled = false;
    setLoadingMsgs(true);

    (async () => {
      try {
        const res = await ChatService.getMessages(activeConvoId);
        if (!cancelled) {
          setMessages(Array.isArray(res.data) ? res.data : []);
          // Mark unread as read locally
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConvoId ? { ...c, unread_count: 0 } : c))
          );
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (!cancelled) setLoadingMsgs(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeConvoId]);

  // ── WebSocket for real-time ──
  useEffect(() => {
    if (activeConvoId === null) return;

    const url = getChatWebSocketUrl(activeConvoId);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat.message' || data.message) {
          // Re-fetch messages to get full serialized data
          ChatService.getMessages(activeConvoId).then((res) => {
            setMessages(Array.isArray(res.data) ? res.data : []);
          });
        }
      } catch { /* ignore parse errors */ }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setWsConnected(false);
    };
  }, [activeConvoId]);

  // ── Scroll to bottom on new messages ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ──
  const handleSend = async () => {
    if (!inputText.trim() || activeConvoId === null || sendingMsg) return;

    const body = inputText.trim();
    setInputText('');
    setSendingMsg(true);

    try {
      const res = await ChatService.sendMessage(activeConvoId, body);
      const newMsg: ApiMessage = res.data;

      // Add to local messages
      setMessages((prev) => [...prev, newMsg]);

      // Update conversation last_message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvoId
            ? {
                ...c,
                last_message: {
                  body: newMsg.body,
                  sender: newMsg.sender.username,
                  created_at: newMsg.created_at,
                },
              }
            : c
        )
      );

      // Broadcast via WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          message: body,
          sender: newMsg.sender.username,
        }));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setInputText(body); // restore on failure
    } finally {
      setSendingMsg(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Derived ──
  const activeConvo = conversations.find((c) => c.id === activeConvoId) ?? null;

  const filteredConversations = searchQuery.trim()
    ? conversations.filter((c) => {
        const q = searchQuery.toLowerCase();
        const name = getConvoDisplayName(c, myId, myUsername).toLowerCase();
        const lastMsg = c.last_message?.body.toLowerCase() ?? '';
        return name.includes(q) || lastMsg.includes(q);
      })
    : conversations;

  // ── Render helpers ──
  const renderAvatar = (seed: string, size = 'w-12 h-12') => (
    <div className={cn(size, 'rounded-full bg-gradient-to-br from-navy-200 to-navy-300 overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm')}>
      <img
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`}
        alt=""
        className="w-full h-full"
      />
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="pt-16 h-[calc(100vh-0px)] flex bg-white overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-96 border-r border-navy-100 flex flex-col bg-white',
          activeConvo ? 'hidden md:flex' : 'flex'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-navy-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-navy-900">Messages</h2>
            <div className="flex gap-1">
              <button className="p-2 hover:bg-navy-50 rounded-lg text-navy-600 transition-colors">
                <Plus size={20} />
              </button>
              <button className="p-2 hover:bg-navy-50 rounded-lg text-navy-600 transition-colors">
                <Users size={20} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-navy-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300 transition-all"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-navy-400" />
              <span className="ml-2 text-sm text-navy-400">Loading chats...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <MessageSquare className="w-10 h-10 text-navy-300 mb-3" />
              <p className="text-sm text-navy-500">
                {searchQuery ? 'No chats match your search.' : 'No conversations yet.'}
              </p>
            </div>
          ) : (
            filteredConversations.map((convo) => {
              const displayName = getConvoDisplayName(convo, myId, myUsername);
              const seed = getAvatarSeed(convo, myId, myUsername);
              const isActive = convo.id === activeConvoId;

              return (
                <div
                  key={convo.id}
                  className={cn(
                    'group p-4 flex items-center gap-3 cursor-pointer transition-all border-b border-navy-50',
                    isActive
                      ? 'bg-navy-50 border-l-4 border-l-gold-500'
                      : 'hover:bg-navy-50/50 border-l-4 border-l-transparent'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveConvoId(convo.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    {renderAvatar(seed)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="font-bold text-sm text-navy-900 truncate">{displayName}</h4>
                          {convo.is_group_chat && (
                            <Users size={12} className="text-navy-400 flex-shrink-0" />
                          )}
                        </div>
                        {convo.last_message && (
                          <span className="text-[10px] text-navy-400 font-medium flex-shrink-0 ml-2">
                            {formatConvoTime(convo.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-navy-500 truncate">
                          {convo.last_message
                            ? convo.is_group_chat
                              ? `${convo.last_message.sender}: ${convo.last_message.body}`
                              : convo.last_message.body
                            : 'No messages yet'}
                        </p>
                        {convo.unread_count > 0 && (
                          <span className="bg-gold-500 text-navy-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 min-w-[18px] text-center">
                            {convo.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearMessages(convo.id);
                    }}
                    disabled={deletingConvoId === convo.id}
                    className="p-2 rounded-lg text-navy-300 hover:text-red-500 hover:bg-red-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all disabled:opacity-50"
                    title="Clear messages"
                    aria-label={`Clear messages with ${displayName}`}
                  >
                    {deletingConvoId === convo.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat Window ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex-1 flex flex-col bg-navy-50/30',
          !activeConvo ? 'hidden md:flex' : 'flex'
        )}
      >
        {activeConvo ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-navy-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConvoId(null)}
                  className="md:hidden p-1 hover:bg-navy-50 rounded-lg text-navy-600 transition-colors mr-1"
                >
                  <ArrowLeft size={20} />
                </button>
                {renderAvatar(getAvatarSeed(activeConvo, myId, myUsername), 'w-10 h-10')}
                <div>
                  <h4 className="font-bold text-sm text-navy-900">
                    {getConvoDisplayName(activeConvo, myId, myUsername)}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    {wsConnected ? (
                      <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                        Online
                      </p>
                    ) : (
                      <p className="text-[10px] text-navy-400 font-medium flex items-center gap-1">
                        <WifiOff size={10} />
                        Offline
                      </p>
                    )}
                    {activeConvo.is_group_chat && (
                      <span className="text-[10px] text-navy-400">
                        &middot; {getParticipantCount(activeConvo)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => handleClearMessages(activeConvo.id)}
                  disabled={deletingConvoId === activeConvo.id}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-100 transition-colors disabled:opacity-50"
                  title="Clear messages"
                >
                  {deletingConvoId === activeConvo.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  <span className="text-xs font-bold">Clear</span>
                </button>
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    className="p-2 hover:bg-navy-50 rounded-lg text-navy-400 hover:text-navy-900 transition-colors"
                    aria-label="More options"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-navy-100 rounded-xl shadow-lg py-1 z-20">
                      <button
                        type="button"
                        onClick={() => handleClearMessages(activeConvo.id)}
                        disabled={deletingConvoId === activeConvo.id}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deletingConvoId === activeConvo.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Clear messages
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Area — own messages right, received left */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-navy-400" />
                  <span className="ml-2 text-sm text-navy-400">Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-12 h-12 text-navy-200 mb-3" />
                  <p className="text-sm text-navy-400">
                    No messages yet. Say hello!
                  </p>
                </div>
              ) : (
                <>
                  {/* Date separator at the top */}
                  {messages.length > 0 && (
                    <div className="flex items-center justify-center my-4">
                      <span className="text-[10px] bg-navy-100 text-navy-500 px-3 py-1 rounded-full font-medium">
                        {new Date(messages[0].created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col w-full gap-3">
                  {messages.map((msg, idx) => {
                    const isOwn = isOwnMessage(msg.sender, myId, myUsername);
                    const showSenderName =
                      activeConvo.is_group_chat &&
                      !isOwn &&
                      (idx === 0 || messages[idx - 1].sender.id !== msg.sender.id);
                    const isReadByOthers =
                      msg.read_by.filter((id) => Number(id) !== myId).length > 0;

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex w-full animate-[fadeIn_0.2s_ease-out]',
                          isOwn ? 'justify-end' : 'justify-start'
                        )}
                      >
                      <div
                        className={cn(
                          'flex flex-col max-w-[75%]',
                          isOwn ? 'items-end' : 'items-start'
                        )}
                      >
                        {showSenderName && (
                          <span className="text-[10px] font-bold text-navy-500 mb-1 ml-1">
                            {msg.sender.first_name || msg.sender.username}
                          </span>
                        )}
                        <div
                          className={cn(
                            'px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                            isOwn
                              ? 'bg-navy-900 text-white rounded-2xl rounded-tr-md'
                              : 'bg-white text-navy-900 border border-navy-100 rounded-2xl rounded-tl-md'
                          )}
                        >
                          {msg.body}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 px-1">
                          <span className="text-[10px] text-navy-400 font-medium">
                            {formatMessageTime(msg.created_at)}
                          </span>
                          {isOwn && (
                            isReadByOthers ? (
                              <CheckCheck size={12} className="text-gold-500" />
                            ) : (
                              <Check size={12} className="text-navy-300" />
                            )
                          )}
                        </div>
                      </div>
                      </div>
                    );
                  })}
                  </div>
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-navy-100">
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={() => handleClearMessages(activeConvo.id)}
                  disabled={deletingConvoId === activeConvo.id}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 disabled:opacity-50"
                >
                  {deletingConvoId === activeConvo.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Clear messages
                </button>
              </div>
              <div className="flex items-center gap-2 bg-navy-50 rounded-2xl p-1.5">
                <button className="p-2 text-navy-400 hover:text-navy-900 transition-colors rounded-lg hover:bg-navy-100">
                  <Paperclip size={20} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm py-2 px-1"
                  disabled={sendingMsg}
                />
                <button className="p-2 text-navy-400 hover:text-navy-900 transition-colors rounded-lg hover:bg-navy-100">
                  <Smile size={20} />
                </button>
                <button className="p-2 text-navy-400 hover:text-navy-900 transition-colors rounded-lg hover:bg-navy-100">
                  <Mic size={20} />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sendingMsg}
                  className={cn(
                    'p-3 rounded-xl transition-all',
                    inputText.trim() && !sendingMsg
                      ? 'bg-navy-900 text-white hover:bg-navy-800 shadow-md hover:shadow-lg active:scale-95'
                      : 'bg-navy-200 text-navy-400 cursor-not-allowed'
                  )}
                >
                  {sendingMsg ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-gradient-to-br from-navy-100 to-navy-200 rounded-full flex items-center justify-center text-navy-400 mb-5 shadow-inner">
              <Send size={36} />
            </div>
            <h3 className="text-xl font-display font-bold text-navy-900 mb-2">
              Select a Chat
            </h3>
            <p className="text-sm text-navy-500 max-w-xs">
              Connect with fellow aspirants, join study groups, and start preparing together.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
