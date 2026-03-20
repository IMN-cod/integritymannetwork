"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hash, Users, Send, Plus, Shield, Search,
  MessageSquare, Smile,
  ArrowLeft, X, Reply, Loader2,
  Bot, Crown, Wifi, WifiOff,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  memberCount: number;
  messageCount: number;
  unread: number;
  userRole: string | null;
  isMuted: boolean;
}

interface ChatUser {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
}

interface ChatMessage {
  id: string;
  content: string;
  type: string;
  mediaUrl: string | null;
  isEdited: boolean;
  parentId: string | null;
  createdAt: string;
  user: ChatUser;
}

interface OnlineMember {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  channelRole?: string;
  isOnline?: boolean;
}

interface DmConversation {
  id: string;
  otherUser: ChatUser;
  lastMessage: { content: string; createdAt: string; isRead: boolean; isMine: boolean; isBot: boolean } | null;
  unread: number;
}

interface DmMessage {
  id: string;
  content: string;
  type: string;
  isRead: boolean;
  isBot: boolean;
  createdAt: string;
  sender: ChatUser;
  isMine: boolean;
}

// ═══════════════════════════════════════════
// CHANNEL ICONS MAP
// ═══════════════════════════════════════════

const CHANNEL_ICONS: Record<string, string> = {
  general: "💬",
  integrity: "📖",
  purpose: "⭐",
  marketplace: "💼",
  networking: "🏠",
  prayer: "🙏",
  announcements: "📢",
};

// ═══════════════════════════════════════════
// EMOJI PICKER (mini)
// ═══════════════════════════════════════════

const QUICK_EMOJIS = ["👍", "❤️", "🙏", "🔥", "💪", "🙌", "✅", "👏", "💯", "⭐", "😊", "🎯"];

// ═══════════════════════════════════════════
// HELPER: format time
// ═══════════════════════════════════════════

function formatMessageTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (hours < 48) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<OnlineMember[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineMember[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [mobileMembers, setMobileMembers] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [channelInfo, setChannelInfo] = useState<{ name: string; description: string | null; memberCount: number } | null>(null);

  // DM State
  const [view, setView] = useState<"channels" | "dms">("channels");
  const [dmConversations, setDmConversations] = useState<DmConversation[]>([]);
  const [activeDm, setActiveDm] = useState<string | null>(null);
  const [dmMessages, setDmMessages] = useState<DmMessage[]>([]);
  const [dmInput, setDmInput] = useState("");
  const [dmPartner, setDmPartner] = useState<ChatUser | null>(null);
  const [showNewDm, setShowNewDm] = useState(false);
  const [dmSearch, setDmSearch] = useState("");
  const [searchResults, setSearchResults] = useState<OnlineMember[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const dmEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ── Load channels ──
  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/community/channels");
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels);
        if (!activeChannel && data.channels.length > 0) {
          setActiveChannel(data.channels[0].slug);
        }
      }
    } catch {
      // If no channels exist yet, use defaults
    } finally {
      setLoading(false);
    }
  }, [activeChannel]);

  // ── Load channel messages ──
  const fetchMessages = useCallback(async (slug: string) => {
    try {
      const res = await fetch(`/api/community/channels/${slug}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setMembers(data.members);
        setOnlineUsers(data.onlineUsers);
        setChannelInfo(data.channel);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // ── Load DM conversations ──
  const fetchDmConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setDmConversations(data.conversations);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // ── Load DM messages ──
  const fetchDmMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/messages?conversationId=${convId}`);
      if (res.ok) {
        const data = await res.json();
        setDmMessages(data.messages);
        setDmPartner(data.conversation?.otherUser || null);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // ── Search users for new DM ──
  const searchUsers = useCallback(async (q: string) => {
    try {
      const res = await fetch(`/api/community/members?search=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.members.filter((m: OnlineMember) => m.id !== session?.user?.id));
      }
    } catch {
      // Silently fail
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchChannels();
      fetchDmConversations();
    }
  }, [status, fetchChannels, fetchDmConversations]);

  useEffect(() => {
    if (activeChannel && view === "channels") {
      fetchMessages(activeChannel);
    }
  }, [activeChannel, view, fetchMessages]);

  useEffect(() => {
    if (activeDm && view === "dms") {
      fetchDmMessages(activeDm);
    }
  }, [activeDm, view, fetchDmMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    dmEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dmMessages]);

  // Poll for new messages
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (view === "channels" && activeChannel) fetchMessages(activeChannel);
      if (view === "dms" && activeDm) fetchDmMessages(activeDm);
      fetchDmConversations();
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [view, activeChannel, activeDm, fetchMessages, fetchDmMessages, fetchDmConversations]);

  // ── Send channel message ──
  const sendChannelMessage = async () => {
    if (!messageInput.trim() || !activeChannel || sendingMessage) return;
    setSendingMessage(true);
    try {
      const res = await fetch(`/api/community/channels/${activeChannel}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageInput.trim(),
          parentId: replyTo?.id || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setMessageInput("");
        setReplyTo(null);
        setShowEmoji(false);
      }
    } catch {
      // Fail silently
    } finally {
      setSendingMessage(false);
    }
  };

  // ── Send DM ──
  const sendDm = async (receiverId?: string) => {
    const content = dmInput.trim();
    const targetId = receiverId || dmPartner?.id;
    if (!content || !targetId) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: targetId, content }),
      });
      if (res.ok) {
        const data = await res.json();
        setDmMessages((prev) => [...prev, data.message]);
        if (data.botReply) {
          setTimeout(() => {
            setDmMessages((prev) => [
              ...prev,
              {
                id: data.botReply.id,
                content: data.botReply.content,
                type: "TEXT",
                isRead: false,
                isBot: true,
                createdAt: data.botReply.createdAt,
                sender: dmPartner || { id: targetId, name: "Bot", avatar: null, role: "SYSTEM" },
                isMine: false,
              },
            ]);
          }, 800);
        }
        setDmInput("");
        if (!activeDm) setActiveDm(data.conversationId);
        setShowNewDm(false);
        fetchDmConversations();
      }
    } catch {
      // Fail silently
    }
  };

  // ── Start new DM ──
  const startNewDm = async (user: OnlineMember) => {
    setDmPartner({ id: user.id, name: user.name, avatar: user.avatar, role: user.role });
    setShowNewDm(false);
    setView("dms");

    // Check if conversation already exists
    const existing = dmConversations.find((c) => c.otherUser.id === user.id);
    if (existing) {
      setActiveDm(existing.id);
    } else {
      setActiveDm(null);
      setDmMessages([]);
    }
  };

  // ── Loading / Auth check ──
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-zinc-400">Loading community...</p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <MessageSquare className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Join the Community</h2>
          <p className="text-sm text-zinc-400 mb-6">Sign in to access channels, chat with members, and connect with the brotherhood.</p>
          <Link href="/auth/login?callbackUrl=/community">
            <Button>Sign In to Continue</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalDmUnread = dmConversations.reduce((sum, c) => sum + c.unread, 0);

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  return (
    <div className="h-screen bg-zinc-950 flex overflow-hidden">
      {/* ── LEFT SIDEBAR ── */}
      <aside className={cn(
        "w-72 bg-zinc-900/60 border-r border-zinc-800/50 flex flex-col shrink-0 transition-transform duration-300",
        "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50",
        mobileSidebar ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-zinc-800/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              <h2 className="text-sm font-bold text-white tracking-wide">TIMN Community</h2>
            </div>
            <button onClick={() => setMobileSidebar(false)} className="lg:hidden text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg bg-zinc-800/50 p-0.5 mb-3">
            <button
              onClick={() => setView("channels")}
              className={cn("flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5",
                view === "channels" ? "bg-orange-500/20 text-orange-500" : "text-zinc-400 hover:text-white"
              )}
            >
              <Hash className="w-3 h-3" /> Channels
            </button>
            <button
              onClick={() => { setView("dms"); fetchDmConversations(); }}
              className={cn("flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 relative",
                view === "dms" ? "bg-orange-500/20 text-orange-500" : "text-zinc-400 hover:text-white"
              )}
            >
              <MessageCircle className="w-3 h-3" /> Messages
              {totalDmUnread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalDmUnread > 9 ? "9+" : totalDmUnread}
                </span>
              )}
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <Input placeholder="Search..." className="pl-8 py-1.5 text-xs h-8" />
          </div>
        </div>

        {/* CHANNELS VIEW */}
        {view === "channels" && (
          <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
            <p className="text-[10px] px-2 py-1.5 text-zinc-600 uppercase tracking-wider font-semibold">
              Channels ({channels.length})
            </p>
            {channels.length === 0 ? (
              <div className="px-2 py-6 text-center">
                <Hash className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">No channels yet</p>
              </div>
            ) : (
              channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => { setActiveChannel(ch.slug); setMobileSidebar(false); }}
                  className={cn(
                    "flex items-center justify-between w-full px-2.5 py-2.5 rounded-lg text-sm transition-all group",
                    activeChannel === ch.slug
                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{CHANNEL_ICONS[ch.slug] || "💬"}</span>
                    <span className="truncate font-medium">{ch.name}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {ch.isMuted && <WifiOff className="w-3 h-3 text-zinc-600" />}
                    {ch.unread > 0 && (
                      <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-5 text-center">
                        {ch.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* DMS VIEW */}
        {view === "dms" && (
          <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold">
                Direct Messages
              </p>
              <button
                onClick={() => { setShowNewDm(true); setDmSearch(""); searchUsers(""); }}
                className="text-orange-500 hover:text-orange-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {dmConversations.length === 0 ? (
              <div className="px-2 py-6 text-center">
                <MessageCircle className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">No conversations yet</p>
                <button
                  onClick={() => { setShowNewDm(true); searchUsers(""); }}
                  className="text-xs text-orange-500 hover:text-orange-400 mt-2"
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              dmConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => { setActiveDm(conv.id); setMobileSidebar(false); }}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-2.5 py-2.5 rounded-lg text-left transition-all",
                    activeDm === conv.id
                      ? "bg-orange-500/10 border border-orange-500/20"
                      : "hover:bg-zinc-800/40"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                      {conv.otherUser.avatar ? (
                        <img src={conv.otherUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        getInitials(conv.otherUser.name)
                      )}
                    </div>
                    {conv.otherUser.role === "ADMIN" || conv.otherUser.role === "SUPER_ADMIN" ? (
                      <Crown className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-orange-500" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white truncate">{conv.otherUser.name}</p>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-zinc-600 shrink-0 ml-1">
                          {formatMessageTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-zinc-500 truncate">
                        {conv.lastMessage?.isBot && <Bot className="w-3 h-3 inline mr-0.5" />}
                        {conv.lastMessage?.isMine ? "You: " : ""}
                        {conv.lastMessage?.content || "No messages yet"}
                      </p>
                      {conv.unread > 0 && (
                        <span className="bg-orange-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shrink-0 ml-1">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* User Footer */}
        <div className="p-3 border-t border-zinc-800/50">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-500">
                {session?.user?.name ? getInitials(session.user.name) : "?"}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-zinc-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{session?.user?.name}</p>
              <p className="text-[10px] text-green-400 flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5" /> Online
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── CHANNEL CHAT VIEW ── */}
        {view === "channels" && (
          <>
            {/* Header */}
            <header className="px-4 sm:px-6 py-3 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-950/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileSidebar(true)} className="lg:hidden text-zinc-400 hover:text-white">
                  <MessageSquare className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CHANNEL_ICONS[activeChannel || ""] || "💬"}</span>
                    <h2 className="text-sm font-bold text-white">{channelInfo?.name || activeChannel}</h2>
                    <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]">
                      {channelInfo?.memberCount || 0} members
                    </Badge>
                  </div>
                  {channelInfo?.description && (
                    <p className="text-xs text-zinc-500 mt-0.5 hidden sm:block">{channelInfo.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-800/50">
                  <Search className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMobileMembers(!mobileMembers)}
                  className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-800/50"
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1">
                {/* Welcome Banner */}
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
                      <span className="text-3xl">{CHANNEL_ICONS[activeChannel || ""] || "💬"}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Welcome to #{channelInfo?.name || activeChannel}</h3>
                    <p className="text-sm text-zinc-400 max-w-md">{channelInfo?.description || "Start the conversation!"}</p>
                  </div>
                )}

                {/* Date dividers & Messages */}
                {messages.map((msg, i) => {
                  const prevMsg = messages[i - 1];
                  const showDateDivider = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                  const isConsecutive = prevMsg && prevMsg.user.id === msg.user.id && !showDateDivider &&
                    new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 300000;

                  return (
                    <div key={msg.id}>
                      {showDateDivider && (
                        <div className="flex items-center gap-3 py-3">
                          <div className="flex-1 h-px bg-zinc-800/50" />
                          <span className="text-[10px] text-zinc-600 px-3 py-1 bg-zinc-900/50 rounded-full">
                            {new Date(msg.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                          </span>
                          <div className="flex-1 h-px bg-zinc-800/50" />
                        </div>
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex gap-3 group rounded-lg px-3 py-1 -mx-3 transition-colors hover:bg-zinc-800/20",
                          isConsecutive ? "pt-0" : "pt-2"
                        )}
                      >
                        {/* Avatar */}
                        {!isConsecutive ? (
                          <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0 mt-0.5 cursor-pointer hover:border-orange-500/50 transition-colors">
                            {msg.user.avatar ? (
                              <img src={msg.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              getInitials(msg.user.name)
                            )}
                          </div>
                        ) : (
                          <div className="w-9 shrink-0 flex items-center justify-center">
                            <span className="text-[10px] text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
                              {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {!isConsecutive && (
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-white hover:underline cursor-pointer">{msg.user.name}</span>
                              {(msg.user.role === "ADMIN" || msg.user.role === "SUPER_ADMIN") && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-orange-500/20 text-orange-400 flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5" /> Admin
                                </span>
                              )}
                              {msg.user.role === "MODERATOR" && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-500/20 text-blue-400 flex items-center gap-0.5">
                                  <Shield className="w-2.5 h-2.5" /> Mod
                                </span>
                              )}
                              <span className="text-[10px] text-zinc-600">{formatMessageTime(msg.createdAt)}</span>
                            </div>
                          )}

                          {/* Reply indicator */}
                          {msg.parentId && (
                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-0.5 pl-2 border-l-2 border-zinc-700">
                              <Reply className="w-3 h-3" /> replying to a message
                            </div>
                          )}

                          <p className="text-sm text-zinc-300 leading-relaxed wrap-break-word">{msg.content}</p>

                          {msg.isEdited && <span className="text-[10px] text-zinc-600 ml-1">(edited)</span>}
                        </div>

                        {/* Action buttons — visible on hover */}
                        <div className="flex items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-1">
                          <button
                            onClick={() => setReplyTo(msg)}
                            className="p-1 rounded hover:bg-zinc-700/50 text-zinc-500 hover:text-white transition-colors"
                            title="Reply"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1 rounded hover:bg-zinc-700/50 text-zinc-500 hover:text-white transition-colors" title="React">
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Members Sidebar (right) */}
              <aside className={cn(
                "w-60 bg-zinc-900/30 border-l border-zinc-800/50 p-4 overflow-y-auto shrink-0",
                "max-xl:hidden",
                mobileMembers ? "max-xl:block max-xl:fixed max-xl:right-0 max-xl:inset-y-0 max-xl:z-50 max-xl:w-64 max-xl:bg-zinc-900" : ""
              )}>
                {onlineUsers.length > 0 && (
                  <>
                    <p className="text-[10px] px-2 py-1.5 text-zinc-600 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      Online — {onlineUsers.length}
                    </p>
                    <div className="space-y-0.5 mb-4">
                      {onlineUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => startNewDm(u)}
                          className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-zinc-800/30 transition-colors text-left"
                        >
                          <div className="relative">
                            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                              {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(u.name)}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-zinc-900" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-zinc-300 truncate">{u.name}</p>
                            <p className="text-[10px] text-zinc-600">{u.role}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <p className="text-[10px] px-2 py-1.5 text-zinc-600 uppercase tracking-wider font-semibold">
                  Members — {members.length}
                </p>
                <div className="space-y-0.5">
                  {members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => startNewDm(m)}
                      className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-zinc-800/30 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                        {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(m.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-300 truncate">{m.name}</p>
                        <p className="text-[10px] text-zinc-600">{m.channelRole || m.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </aside>
            </div>

            {/* Reply Banner */}
            <AnimatePresence>
              {replyTo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 border-t border-zinc-800/50 bg-zinc-900/50"
                >
                  <div className="flex items-center gap-3 py-2">
                    <Reply className="w-4 h-4 text-orange-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-orange-400 font-medium">Replying to {replyTo.user.name}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{replyTo.content}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="text-zinc-500 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Input */}
            <div className="px-4 sm:px-6 py-3 border-t border-zinc-800/50 shrink-0">
              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmoji && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-1 mb-2 flex-wrap"
                  >
                    {QUICK_EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setMessageInput((prev) => prev + e)}
                        className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-lg transition-colors"
                      >
                        {e}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmoji(!showEmoji)}
                  className="w-9 h-9 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 flex items-center justify-center transition-colors shrink-0"
                >
                  <Smile className="w-4 h-4 text-zinc-400" />
                </button>
                <div className="flex-1 relative">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={`Message #${channelInfo?.name || activeChannel || "general"}...`}
                    className="pr-12"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendChannelMessage();
                      }
                    }}
                  />
                  <button
                    onClick={sendChannelMessage}
                    disabled={!messageInput.trim() || sendingMessage}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center transition-all",
                      messageInput.trim() ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-zinc-700/50 text-zinc-500"
                    )}
                  >
                    {sendingMessage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── DM CHAT VIEW ── */}
        {view === "dms" && (
          <>
            {activeDm || dmPartner ? (
              <>
                {/* DM Header */}
                <header className="px-4 sm:px-6 py-3 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-950/80 backdrop-blur-sm shrink-0">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setMobileSidebar(true)} className="lg:hidden text-zinc-400 hover:text-white">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                        {dmPartner?.avatar ? (
                          <img src={dmPartner.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(dmPartner?.name || "?")
                        )}
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white">{dmPartner?.name}</h2>
                        <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                          {(dmPartner?.role === "ADMIN" || dmPartner?.role === "SUPER_ADMIN") && (
                            <><Crown className="w-3 h-3 text-orange-500" /> Admin</>
                          )}
                          {dmPartner?.role === "MEMBER" && "Member"}
                          {dmPartner?.role === "MODERATOR" && <><Shield className="w-3 h-3 text-blue-400" /> Moderator</>}
                        </p>
                      </div>
                    </div>
                  </div>
                </header>

                {/* DM Messages */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1">
                  {dmMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <MessageCircle className="w-12 h-12 text-zinc-700 mb-4" />
                      <h3 className="text-lg font-bold text-white mb-1">Start a conversation</h3>
                      <p className="text-sm text-zinc-400">Send a message to {dmPartner?.name}</p>
                    </div>
                  )}

                  {dmMessages.map((msg, i) => {
                    const prevMsg = dmMessages[i - 1];
                    const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex items-center gap-3 py-3">
                            <div className="flex-1 h-px bg-zinc-800/50" />
                            <span className="text-[10px] text-zinc-600 px-3 py-1 bg-zinc-900/50 rounded-full">
                              {new Date(msg.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                            </span>
                            <div className="flex-1 h-px bg-zinc-800/50" />
                          </div>
                        )}

                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn("flex gap-3 mb-2", msg.isMine ? "justify-end" : "justify-start")}
                        >
                          {!msg.isMine && (
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                              {msg.isBot ? (
                                <Bot className="w-4 h-4 text-orange-500" />
                              ) : msg.sender.avatar ? (
                                <img src={msg.sender.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                getInitials(msg.sender.name)
                              )}
                            </div>
                          )}

                          <div className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2.5",
                            msg.isMine
                              ? "bg-orange-500 text-white rounded-br-sm"
                              : msg.isBot
                                ? "bg-zinc-800/80 border border-orange-500/20 text-zinc-200 rounded-bl-sm"
                                : "bg-zinc-800/80 text-zinc-200 rounded-bl-sm"
                          )}>
                            {msg.isBot && (
                              <p className="text-[10px] text-orange-400 font-medium mb-0.5 flex items-center gap-1">
                                <Bot className="w-3 h-3" /> TIMN Bot
                              </p>
                            )}
                            <p className="text-sm leading-relaxed wrap-break-word">{msg.content}</p>
                            <div className={cn("flex items-center gap-1.5 mt-1", msg.isMine ? "justify-end" : "")}>
                              <span className={cn("text-[10px]", msg.isMine ? "text-white/60" : "text-zinc-600")}>
                                {formatMessageTime(msg.createdAt)}
                              </span>
                              {msg.isMine && msg.isRead && <span className="text-[10px] text-white/60">✓✓</span>}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                  <div ref={dmEndRef} />
                </div>

                {/* DM Input */}
                <div className="px-4 sm:px-6 py-3 border-t border-zinc-800/50 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={dmInput}
                        onChange={(e) => setDmInput(e.target.value)}
                        placeholder={`Message ${dmPartner?.name || ""}...`}
                        className="pr-12"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendDm();
                          }
                        }}
                      />
                      <button
                        onClick={() => sendDm()}
                        disabled={!dmInput.trim()}
                        className={cn(
                          "absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center transition-all",
                          dmInput.trim() ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-zinc-700/50 text-zinc-500"
                        )}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </> 
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-1">Your Messages</h3>
                  <p className="text-sm text-zinc-400 mb-4">Select a conversation or start a new one</p>
                  <Button size="sm" onClick={() => { setShowNewDm(true); searchUsers(""); }}>
                    <Plus className="w-4 h-4" /> New Message
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── NEW DM MODAL ── */}
      <AnimatePresence>
        {showNewDm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-20 px-4"
            onClick={() => setShowNewDm(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white">New Message</h3>
                  <button onClick={() => setShowNewDm(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    placeholder="Search members..."
                    className="pl-10"
                    value={dmSearch}
                    onChange={(e) => { setDmSearch(e.target.value); searchUsers(e.target.value); }}
                  />
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {searchResults.length === 0 ? (
                  <p className="text-center text-sm text-zinc-500 py-8">No members found</p>
                ) : (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => startNewDm(user)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors text-left"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300">
                          {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(user.name)}
                        </div>
                        {user.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-zinc-900" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                          {user.role}
                          {user.isOnline && <span className="text-green-400">• Online</span>}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileSidebar(false)} />
      )}
    </div>
  );
}
