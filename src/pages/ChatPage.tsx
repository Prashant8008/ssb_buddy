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
  Shield,
  MapPin,
  Bot,
  Flag,
  Slash
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AuthService, ChatService, getChatWebSocketUrl, ProfileService } from '../services/api';

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

const getAvatar = (username: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;

/* ─── Main Chat Page Component ───────────────────────────────────────────── */
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

  // Participant details sidebar states
  const [sidebarProfile, setSidebarProfile] = useState<{
    entry_type: string;
    bio: string;
    location: string;
    ssb_board: string;
    attempts: number;
    recommended: boolean;
  } | null>(null);

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

  // Fetch target user's ssb details for right panel
  const activeConvo = conversations.find((c) => c.id === activeConvoId) ?? null;
  useEffect(() => {
    if (!activeConvo || activeConvo.is_group_chat) {
      setSidebarProfile(null);
      return;
    }
    const other = getOtherParticipant(activeConvo, myId, myUsername);
    if (!other) {
      setSidebarProfile(null);
      return;
    }

    ProfileService.getByUsername(other.username)
      .then((res) => {
        const p = res.data;
        setSidebarProfile({
          entry_type: p.entry_type || 'NDA',
          bio: p.bio || 'Dedicated defense candidate striving for selection.',
          location: [p.city, p.state].filter(Boolean).join(', ') || 'India',
          ssb_board: p.ssb_board || 'Allotted soon',
          attempts: p.ssb_attempts || 0,
          recommended: p.recommended_status || false,
        });
      })
      .catch(() => {
        setSidebarProfile({
          entry_type: 'NDA',
          bio: 'Dedicated candidate preparing for SSB.',
          location: 'India',
          ssb_board: 'IMA Entry',
          attempts: 0,
          recommended: false,
        });
      });
  }, [activeConvo, myId, myUsername]);

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
    } finally {
      setDeletingConvoId(null);
    }
  };

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

  useEffect(() => {
    if (activeConvoId === null) return;
    let cancelled = false;
    setLoadingMsgs(true);

    (async () => {
      try {
        const res = await ChatService.getMessages(activeConvoId);
        if (!cancelled) {
          setMessages(Array.isArray(res.data) ? res.data : []);
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
          ChatService.getMessages(activeConvoId).then((res) => {
            setMessages(Array.isArray(res.data) ? res.data : []);
          });
        }
      } catch {}
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setWsConnected(false);
    };
  }, [activeConvoId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || activeConvoId === null || sendingMsg) return;

    const body = inputText.trim();
    setInputText('');
    setSendingMsg(true);

    try {
      const res = await ChatService.sendMessage(activeConvoId, body);
      const newMsg: ApiMessage = res.data;

      setMessages((prev) => [...prev, newMsg]);

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

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          message: body,
          sender: newMsg.sender.username,
        }));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setInputText(body);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConversations = searchQuery.trim()
    ? conversations.filter((c) => {
        const q = searchQuery.toLowerCase();
        const name = getConvoDisplayName(c, myId, myUsername).toLowerCase();
        const lastMsg = c.last_message?.body.toLowerCase() ?? '';
        return name.includes(q) || lastMsg.includes(q);
      })
    : conversations;

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-[#f8f9fd] overflow-hidden text-[#191c1f] font-sans">
      
      {/* Panel 1: Conversation List (Left) */}
      <aside
        className={cn(
          'w-full md:w-80 lg:w-[350px] border-r border-[#c6c6cf]/20 bg-white flex flex-col shrink-0 transition-all duration-300',
          activeConvoId !== null ? 'hidden md:flex' : 'flex'
        )}
      >
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-[#000317] tracking-tight">Messaging</h1>
            <button className="w-9 h-9 rounded-full bg-[#000317] hover:bg-[#0f1c3f] flex items-center justify-center text-white shadow transition-all active:scale-95">
              <Plus size={18} />
            </button>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76767f] w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#f2f3f7] border-none rounded-xl text-xs focus:ring-1 focus:ring-[#000317] outline-none text-[#191c1f] placeholder:text-[#76767f]/70"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <div className="flex items-center justify-center py-20 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#ffe08f]" />
              <span className="text-xs text-[#6B7280]">Loading chats...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <MessageSquare className="w-8 h-8 text-slate-300 mb-3" />
              <p className="text-xs text-[#6B7280]">
                {searchQuery ? 'No chats match your search.' : 'No conversations started yet.'}
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
                  onClick={() => setActiveConvoId(convo.id)}
                  className={cn(
                    'group px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-all border-b border-[#c6c6cf]/10',
                    isActive
                      ? 'bg-slate-50 border-l-4 border-l-[#ffe08f]'
                      : 'hover:bg-slate-50/50 border-l-4 border-l-transparent'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <img className="w-11 h-11 rounded-full object-cover border border-[#c6c6cf]/30" src={getAvatar(seed)} alt="" />
                    {wsConnected && isActive && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className={cn("text-xs font-bold truncate", isActive ? "text-[#000317]" : "text-[#1A1F36]")}>
                        {displayName}
                      </h3>
                      {convo.last_message && (
                        <span className="text-[9px] text-[#6B7280] font-medium shrink-0 ml-2">
                          {formatConvoTime(convo.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] text-[#6B7280] truncate max-w-[180px]">
                        {convo.last_message ? convo.last_message.body : 'No messages yet'}
                      </p>
                      {convo.unread_count > 0 && (
                        <span className="bg-[#000317] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2">
                          {convo.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Panel 2: Active Chat Window (Center) */}
      <section
        className={cn(
          'flex-1 flex flex-col bg-[#f8f9fd] relative transition-all duration-300',
          activeConvoId === null ? 'hidden md:flex' : 'flex'
        )}
      >
        {activeConvo ? (
          <>
            {/* Active chat header */}
            <header className="h-16 border-b border-[#c6c6cf]/20 bg-white/90 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConvoId(null)}
                  className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-[#000317] transition-colors mr-1"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="relative">
                  <img className="w-10 h-10 rounded-full object-cover border border-[#ffe08f]" src={getAvatar(getAvatarSeed(activeConvo, myId, myUsername))} alt="" />
                  {wsConnected && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[#000317]">{getConvoDisplayName(activeConvo, myId, myUsername)}</h2>
                  <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider">
                    {wsConnected ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>

              {/* Chat action options */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleClearMessages(activeConvo.id)}
                  disabled={deletingConvoId === activeConvo.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-100 transition-colors disabled:opacity-50 text-[10px] font-bold uppercase tracking-wider"
                >
                  {deletingConvoId === activeConvo.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  Clear
                </button>
              </div>
            </header>

            {/* Messages Canvas */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingMsgs ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#ffe08f]" />
                  <span className="text-xs text-[#6B7280]">Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-10 h-10 text-slate-300 mb-2 animate-bounce" />
                  <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">No Messages Yet</p>
                  <p className="text-[11px] text-[#6B7280] mt-1">Initiate conversation. Say Hello!</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-4">
                    <span className="px-3.5 py-1 bg-white border border-[#c6c6cf]/10 text-[9px] font-bold text-[#6B7280] rounded-full uppercase tracking-wider shadow-sm">
                      {new Date(messages[0].created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    {messages.map((msg, idx) => {
                      const isOwn = isOwnMessage(msg.sender, myId, myUsername);
                      const showSenderName =
                        activeConvo.is_group_chat &&
                        !isOwn &&
                        (idx === 0 || messages[idx - 1].sender.id !== msg.sender.id);

                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex w-full',
                            isOwn ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <div className={cn('flex flex-col max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
                            {showSenderName && (
                              <span className="text-[9px] font-bold text-[#6B7280] mb-1 ml-1">
                                {msg.sender.first_name || msg.sender.username}
                              </span>
                            )}
                            <div
                              className={cn(
                                'px-4 py-2.5 text-xs leading-relaxed shadow-sm',
                                isOwn
                                  ? 'bg-[#000317] text-white rounded-2xl rounded-tr-none'
                                  : 'bg-[#F0F2F5] text-[#191c1f] rounded-2xl rounded-tl-none border border-[#c6c6cf]/10'
                              )}
                            >
                              {msg.body}
                            </div>
                            <div className="flex items-center gap-1 mt-1 px-1">
                              <span className="text-[9px] text-[#6B7280] font-medium">
                                {formatMessageTime(msg.created_at)}
                              </span>
                              {isOwn && (
                                <CheckCheck size={12} className="text-[#ffe08f]" />
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

            {/* Input Composer Box */}
            <footer className="p-4 bg-white border-t border-[#c6c6cf]/20 shrink-0">
              <div className="max-w-4xl mx-auto flex items-center gap-2 bg-[#f2f3f7] p-2 rounded-2xl border border-transparent focus-within:border-[#000317] transition-all">
                <button className="p-2 text-[#76767f] hover:text-[#000317] transition-colors rounded-lg">
                  <Paperclip size={18} />
                </button>
                <input
                  type="text"
                  placeholder="Write your message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-xs py-2 px-1 text-[#191c1f]"
                  disabled={sendingMsg}
                />
                <button className="p-2 text-[#76767f] hover:text-[#000317] transition-colors rounded-lg hidden sm:block">
                  <Smile size={18} />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sendingMsg}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                    inputText.trim() && !sendingMsg
                      ? 'bg-[#000317] text-white hover:bg-[#0f1c3f] active:scale-95 shadow'
                      : 'bg-slate-200 text-slate-400'
                  )}
                >
                  {sendingMsg ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} className="fill-current" />
                  )}
                </button>
              </div>
            </footer>
          </>
        ) : (
          /* Empty Active Chat Panel Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f8f9fd]">
            <div className="w-20 h-20 bg-white border border-[#c6c6cf]/20 rounded-full flex items-center justify-center text-[#76767f] mb-5 shadow-sm">
              <Send size={28} className="text-[#ffe08f]" />
            </div>
            <h3 className="text-base font-bold text-[#000317] uppercase tracking-wider mb-2">Select a Conversation</h3>
            <p className="text-xs text-[#6B7280] max-w-xs leading-relaxed">
              Connect with defense aspirants, share preparation updates, or clear doubts through DMs.
            </p>
          </div>
        )}
      </section>

      {/* Panel 3: Info/Details Panel (Right Side, Desktop only) */}
      {activeConvo && sidebarProfile && (
        <aside className="hidden lg:flex w-80 border-l border-[#c6c6cf]/20 bg-white flex-col overflow-y-auto shrink-0 transition-all duration-300">
          <div className="p-6 text-center space-y-4">
            <div className="relative inline-block mx-auto">
              <img className="w-24 h-24 rounded-full object-cover border-4 border-[#ffe08f]/20" src={getAvatar(getAvatarSeed(activeConvo, myId, myUsername))} alt="" />
              <div className="absolute bottom-1 right-1 w-4.5 h-4.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#000317]">{getConvoDisplayName(activeConvo, myId, myUsername)}</h2>
              <p className="text-[10px] text-[#6B7280] font-semibold mt-1">
                {sidebarProfile.entry_type} Aspirant
              </p>
            </div>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {sidebarProfile.recommended && (
                <span className="px-2.5 py-0.5 bg-[#ffe08f]/20 text-[#785d00] text-[9px] font-bold rounded-full uppercase tracking-wide flex items-center gap-1">
                  <Shield size={10} className="fill-current" /> Recommended
                </span>
              )}
              <span className="px-2.5 py-0.5 bg-slate-100 text-[#45464e] text-[9px] font-bold rounded-full uppercase tracking-wide">
                Attempts: {sidebarProfile.attempts}
              </span>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#c6c6cf]/10 space-y-4">
            <h3 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Candidate Bio</h3>
            <p className="text-xs text-[#45464e] leading-relaxed italic">
              "{sidebarProfile.bio}"
            </p>
            <div className="flex items-center gap-2 text-xs text-[#000317] font-semibold">
              <MapPin size={12} className="text-[#ffe08f]" />
              <span>{sidebarProfile.location}</span>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#c6c6cf]/10">
            <h3 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">Allotted SSB Board</h3>
            <p className="text-xs font-bold text-[#000317]">{sidebarProfile.ssb_board}</p>
          </div>

          <div className="mt-auto p-6 border-t border-[#c6c6cf]/10 space-y-2 shrink-0">
            <button className="w-full flex items-center gap-2 p-2 text-red-600 font-bold text-xs uppercase tracking-wider hover:bg-red-50 rounded-lg transition-all">
              <Slash size={12} /> Block Aspirant
            </button>
            <button className="w-full flex items-center gap-2 p-2 text-[#76767f] font-bold text-xs uppercase tracking-wider hover:bg-slate-50 rounded-lg transition-all">
              <Flag size={12} /> Report Profile
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};

export default ChatPage;
