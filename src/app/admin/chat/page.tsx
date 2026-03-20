"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, MessageSquare, Send, Search, Plus, Trash2, Edit3,
  ArrowLeft, Loader2, X,
  Megaphone, MessageCircle, Activity, ToggleLeft, ToggleRight,
  RefreshCw, Save, Headset, UserCheck, Clock, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface AdminConversation {
  id: string;
  user1: { id: string; name: string; email: string; avatar: string | null; role: string };
  user2: { id: string; name: string; email: string; avatar: string | null; role: string };
  lastMessageAt: string;
  _count: { messages: number };
  messages: Array<{ content: string; isBot: boolean; isRead: boolean; createdAt: string }>;
}

interface DmMessage {
  id: string;
  content: string;
  type: string;
  isRead: boolean;
  isBot: boolean;
  createdAt: string;
  sender: { id: string; name: string; avatar: string | null; role: string };
  isMine: boolean;
}

interface BotResponseItem {
  id: string;
  trigger: string;
  response: string;
  category: string;
  isActive: boolean;
  priority: number;
  useCount: number;
  createdAt: string;
}

interface ChatStats {
  totalConversations: number;
  totalMessages: number;
  totalUnread: number;
}

interface LiveSession {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  status: "BOT" | "WAITING" | "ACTIVE" | "CLOSED";
  lastActivity: string;
  createdAt: string;
  assignedAdmin: { id: string; firstName: string; lastName: string; displayName: string | null } | null;
  messages: Array<{ content: string; senderType: string; createdAt: string }>;
  _count: { messages: number };
}

interface LiveMessage {
  id: string;
  content: string;
  senderType: "VISITOR" | "ADMIN" | "BOT";
  senderId: string | null;
  createdAt: string;
}

interface LiveStats {
  waiting: number;
  active: number;
  total: number;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

// ═══════════════════════════════════════════
// MAIN ADMIN CHAT PAGE
// ═══════════════════════════════════════════

export default function AdminChatPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"conversations" | "bot" | "live">("live");
  const [loading, setLoading] = useState(true);

  // Conversations state
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [stats, setStats] = useState<ChatStats>({ totalConversations: 0, totalMessages: 0, totalUnread: 0 });
  const [convFilter, setConvFilter] = useState<"all" | "mine" | "unread">("all");
  const [convSearch, setConvSearch] = useState("");
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [convMessages, setConvMessages] = useState<DmMessage[]>([]);
  const [replyInput, setReplyInput] = useState("");
  const [replyTo, setReplyTo] = useState<{ userId: string; name: string } | null>(null);
  const [sending, setSending] = useState(false);

  // Bot state
  const [botResponses, setBotResponses] = useState<BotResponseItem[]>([]);
  const [showBotForm, setShowBotForm] = useState(false);
  const [editingBot, setEditingBot] = useState<BotResponseItem | null>(null);
  const [botForm, setBotForm] = useState({ trigger: "", response: "", category: "general", priority: 0 });
  const [savingBot, setSavingBot] = useState(false);

  // Broadcast
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  // Live Support state
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats>({ waiting: 0, active: 0, total: 0 });
  const [liveFilter, setLiveFilter] = useState<"active" | "waiting" | "mine" | "closed">("active");
  const [liveSearch, setLiveSearch] = useState("");
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [liveReply, setLiveReply] = useState("");
  const [liveSending, setLiveSending] = useState(false);
  const [liveSessionDetail, setLiveSessionDetail] = useState<LiveSession | null>(null);

  const msgEndRef = useRef<HTMLDivElement>(null);
  const liveMsgEndRef = useRef<HTMLDivElement>(null);

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/chat?filter=${convFilter}&search=${encodeURIComponent(convSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
        setBotResponses(data.botResponses);
        setStats(data.stats);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [convFilter, convSearch]);

  // ── Fetch conversation messages ──
  const fetchConvMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/messages?conversationId=${convId}`);
      if (res.ok) {
        const data = await res.json();
        setConvMessages(data.messages);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (activeConv) fetchConvMessages(activeConv);
  }, [activeConv, fetchConvMessages]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages]);

  // ── Live Support fetch ──
  const fetchLiveData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/chat/live?filter=${liveFilter}&search=${encodeURIComponent(liveSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setLiveSessions(data.sessions);
        setLiveStats(data.stats);
      }
    } catch { /* silent */ }
  }, [liveFilter, liveSearch]);

  const fetchLiveMessages = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch("/api/admin/chat/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "messages", sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiveMessages(data.session.messages);
        setLiveSessionDetail(data.session);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { if (tab === "live") fetchLiveData(); }, [tab, fetchLiveData]);

  useEffect(() => {
    if (activeSession) fetchLiveMessages(activeSession);
  }, [activeSession, fetchLiveMessages]);

  useEffect(() => {
    liveMsgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveMessages]);

  // Poll for updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (tab === "conversations") {
        fetchData();
        if (activeConv) fetchConvMessages(activeConv);
      } else if (tab === "live") {
        fetchLiveData();
        if (activeSession) fetchLiveMessages(activeSession);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [tab, fetchData, activeConv, fetchConvMessages, fetchLiveData, activeSession, fetchLiveMessages]);

  // ── Send DM ──
  const sendReply = async () => {
    if (!replyInput.trim() || !replyTo || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", userId: replyTo.userId, content: replyInput.trim() }),
      });
      if (res.ok) {
        setReplyInput("");
        if (activeConv) fetchConvMessages(activeConv);
        fetchData();
      }
    } catch {
      // Fail silently
    } finally {
      setSending(false);
    }
  };

  // ── Bot CRUD ──
  const saveBot = async () => {
    if (!botForm.trigger.trim() || !botForm.response.trim() || savingBot) return;
    setSavingBot(true);
    try {
      const action = editingBot ? "bot_update" : "bot_create";
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(editingBot ? { botId: editingBot.id } : {}),
          trigger: botForm.trigger,
          response: botForm.response,
          category: botForm.category,
          priority: botForm.priority,
        }),
      });
      if (res.ok) {
        setShowBotForm(false);
        setEditingBot(null);
        setBotForm({ trigger: "", response: "", category: "general", priority: 0 });
        fetchData();
      }
    } catch {
      // Fail silently
    } finally {
      setSavingBot(false);
    }
  };

  const deleteBot = async (id: string) => {
    try {
      await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bot_delete", botId: id }),
      });
      fetchData();
    } catch {
      // Fail silently
    }
  };

  const toggleBot = async (bot: BotResponseItem) => {
    try {
      await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bot_update",
          botId: bot.id,
          trigger: bot.trigger,
          response: bot.response,
          category: bot.category,
          priority: bot.priority,
          isActive: !bot.isActive,
        }),
      });
      fetchData();
    } catch {
      // Fail silently
    }
  };

  // ── Live Support actions ──
  const claimSession = async (sessionId: string) => {
    try {
      await fetch("/api/admin/chat/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim", sessionId }),
      });
      fetchLiveData();
      fetchLiveMessages(sessionId);
    } catch { /* silent */ }
  };

  const closeSession = async (sessionId: string) => {
    try {
      await fetch("/api/admin/chat/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close", sessionId }),
      });
      setActiveSession(null);
      setLiveMessages([]);
      setLiveSessionDetail(null);
      fetchLiveData();
    } catch { /* silent */ }
  };

  const sendLiveReply = async () => {
    if (!liveReply.trim() || liveSending || !activeSession) return;
    setLiveSending(true);
    try {
      const res = await fetch("/api/admin/chat/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", sessionId: activeSession, content: liveReply.trim() }),
      });
      if (res.ok) {
        setLiveReply("");
        fetchLiveMessages(activeSession);
        fetchLiveData();
      }
    } catch { /* silent */ }
    setLiveSending(false);
  };

  // ── Broadcast ──
  const sendBroadcast = async () => {
    if (!broadcastMsg.trim() || broadcasting) return;
    setBroadcasting(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "broadcast", content: broadcastMsg.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Broadcast sent to ${data.sentTo} users`);
        setBroadcastMsg("");
        setShowBroadcast(false);
        fetchData();
      }
    } catch {
      // Fail silently
    } finally {
      setBroadcasting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" />
            Live Chat & Bot Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor conversations, reply to users, and manage automated bot responses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowBroadcast(true)}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Megaphone className="w-4 h-4 mr-1" /> Broadcast
          </Button>
          <Button size="sm" onClick={() => fetchData()} variant="outline" className="border-gray-200">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="admin" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalConversations}</p>
              <p className="text-xs text-gray-500">Total Conversations</p>
            </div>
          </div>
        </Card>
        <Card variant="admin" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
              <p className="text-xs text-gray-500">Total Messages</p>
            </div>
          </div>
        </Card>
        <Card variant="admin" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUnread}</p>
              <p className="text-xs text-gray-500">Unread Messages</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Toggle */}
      <div className="flex rounded-xl bg-gray-100 p-1 max-w-xl">
        <button
          onClick={() => setTab("live")}
          className={cn("flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
            tab === "live" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Headset className="w-4 h-4" /> Live Support
          {liveStats.waiting > 0 && (
            <Badge className="bg-red-100 text-red-600 border-red-200 text-[10px] animate-pulse">{liveStats.waiting}</Badge>
          )}
        </button>
        <button
          onClick={() => setTab("conversations")}
          className={cn("flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
            tab === "conversations" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <MessageCircle className="w-4 h-4" /> DMs
        </button>
        <button
          onClick={() => setTab("bot")}
          className={cn("flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
            tab === "bot" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Bot className="w-4 h-4" /> Bot
          {botResponses.length > 0 && (
            <Badge className="bg-blue-100 text-blue-600 border-blue-200 text-[10px]">{botResponses.length}</Badge>
          )}
        </button>
      </div>

      {/* ═══ LIVE SUPPORT TAB ═══ */}
      {tab === "live" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session List */}
          <Card variant="admin" className="lg:col-span-1 p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  variant="admin"
                  placeholder="Search visitors..."
                  className="pl-10"
                  value={liveSearch}
                  onChange={(e) => setLiveSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {(["active", "waiting", "mine", "closed"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setLiveFilter(f)}
                    className={cn("text-xs px-3 py-1.5 rounded-full transition-colors capitalize",
                      liveFilter === f ? "bg-blue-100 text-blue-600 font-medium" : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {f}
                    {f === "waiting" && liveStats.waiting > 0 && (
                      <span className="ml-1 w-4 h-4 inline-flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">{liveStats.waiting}</span>
                    )}
                  </button>
                ))}
              </div>
              {/* Quick stats */}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-orange-500" /> {liveStats.waiting} waiting</span>
                <span className="flex items-center gap-1"><Headset className="w-3 h-3 text-green-500" /> {liveStats.active} active</span>
              </div>
            </div>

            <div className="max-h-150 overflow-y-auto divide-y divide-gray-100">
              {liveSessions.length === 0 ? (
                <div className="p-8 text-center">
                  <Headset className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No chat sessions found</p>
                </div>
              ) : (
                liveSessions.map((s) => {
                  const lastMsg = s.messages?.[0];
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSession(s.id)}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-3 text-left transition-colors",
                        activeSession === s.id ? "bg-blue-50" : "hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border",
                        s.status === "WAITING" ? "bg-orange-100 border-orange-200 text-orange-600" :
                        s.status === "ACTIVE" ? "bg-green-100 border-green-200 text-green-600" :
                        s.status === "CLOSED" ? "bg-gray-100 border-gray-200 text-gray-400" :
                        "bg-blue-100 border-blue-200 text-blue-600"
                      )}>
                        {s.visitorName ? getInitials(s.visitorName) : "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {s.visitorName || "Anonymous"}
                          </p>
                          <Badge className={cn("text-[10px] shrink-0 ml-1",
                            s.status === "WAITING" ? "bg-orange-100 text-orange-600 border-orange-200" :
                            s.status === "ACTIVE" ? "bg-green-100 text-green-600 border-green-200" :
                            s.status === "CLOSED" ? "bg-gray-100 text-gray-500 border-gray-200" :
                            "bg-blue-100 text-blue-600 border-blue-200"
                          )}>
                            {s.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {lastMsg?.content || "No messages"}
                        </p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-[10px] text-gray-400 truncate">{s.visitorEmail || "No email"}</p>
                          <span className="text-[10px] text-gray-400 shrink-0">{formatTime(s.lastActivity)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card variant="admin" className="lg:col-span-2 p-0 overflow-hidden flex flex-col">
            {activeSession && liveSessionDetail ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setActiveSession(null); setLiveSessionDetail(null); }} className="lg:hidden text-gray-400 hover:text-gray-600 mr-1">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        {liveSessionDetail.visitorName || "Anonymous Visitor"}
                        <Badge className={cn("text-[10px]",
                          liveSessionDetail.status === "WAITING" ? "bg-orange-100 text-orange-600 border-orange-200" :
                          liveSessionDetail.status === "ACTIVE" ? "bg-green-100 text-green-600 border-green-200" :
                          "bg-gray-100 text-gray-500 border-gray-200"
                        )}>{liveSessionDetail.status}</Badge>
                      </h3>
                      <p className="text-[10px] text-gray-400">
                        {liveSessionDetail.visitorEmail || "No email"} • Started {formatTime(liveSessionDetail.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(liveSessionDetail.status === "WAITING" || liveSessionDetail.status === "BOT") && (
                      <Button
                        size="sm"
                        onClick={() => claimSession(activeSession)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <UserCheck className="w-4 h-4 mr-1" /> Claim
                      </Button>
                    )}
                    {liveSessionDetail.status !== "CLOSED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { if (confirm("Close this chat session?")) closeSession(activeSession); }}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Close
                      </Button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-112.5">
                  {liveMessages.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-3", msg.senderType === "ADMIN" ? "justify-end" : "justify-start")}>
                      {msg.senderType !== "ADMIN" && (
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border",
                          msg.senderType === "BOT" ? "bg-blue-50 border-blue-200" : "bg-gray-100 border-gray-200"
                        )}>
                          {msg.senderType === "BOT" ? <Bot className="w-4 h-4 text-blue-500" /> : (
                            liveSessionDetail.visitorName ? getInitials(liveSessionDetail.visitorName) : "?"
                          )}
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5",
                        msg.senderType === "ADMIN"
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : msg.senderType === "BOT"
                            ? "bg-blue-50 border border-blue-200 text-gray-700 rounded-bl-sm"
                            : "bg-gray-100 text-gray-700 rounded-bl-sm"
                      )}>
                        {msg.senderType === "BOT" && (
                          <p className="text-[10px] text-blue-500 font-medium mb-0.5 flex items-center gap-1">
                            <Bot className="w-3 h-3" /> Bot
                          </p>
                        )}
                        {msg.senderType === "VISITOR" && (
                          <p className="text-[10px] text-gray-400 font-medium mb-0.5">
                            {liveSessionDetail.visitorName || "Visitor"}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <p className={cn("text-[10px] mt-1", msg.senderType === "ADMIN" ? "text-white/60 text-right" : "text-gray-400")}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={liveMsgEndRef} />
                </div>

                {/* Reply Input */}
                {liveSessionDetail.status !== "CLOSED" && (
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Input
                        variant="admin"
                        value={liveReply}
                        onChange={(e) => setLiveReply(e.target.value)}
                        placeholder={`Reply to ${liveSessionDetail.visitorName || "visitor"}...`}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendLiveReply();
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={sendLiveReply}
                        disabled={!liveReply.trim() || liveSending}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {liveSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center py-20">
                <div className="text-center">
                  <Headset className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Live Chat Support</h3>
                  <p className="text-sm text-gray-500">Select a chat session to view the conversation and reply</p>
                  {liveStats.waiting > 0 && (
                    <p className="text-sm text-orange-600 mt-2 font-medium">{liveStats.waiting} visitor{liveStats.waiting !== 1 ? "s" : ""} waiting!</p>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ═══ CONVERSATIONS TAB ═══ */}
      {tab === "conversations" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <Card variant="admin" className="lg:col-span-1 p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  variant="admin"
                  placeholder="Search conversations..."
                  className="pl-10"
                  value={convSearch}
                  onChange={(e) => setConvSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1">
                {(["all", "mine", "unread"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setConvFilter(f)}
                    className={cn("text-xs px-3 py-1.5 rounded-full transition-colors capitalize",
                      convFilter === f ? "bg-blue-100 text-blue-600 font-medium" : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-150 overflow-y-auto divide-y divide-gray-100">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No conversations found</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const otherUser = conv.user1.id === session?.user?.id ? conv.user2 : conv.user1;
                  const lastMsg = conv.messages?.[0];
                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConv(conv.id);
                        setReplyTo({ userId: otherUser.id, name: otherUser.name });
                      }}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-3 text-left transition-colors",
                        activeConv === conv.id ? "bg-blue-50" : "hover:bg-gray-50"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                        {otherUser.avatar ? (
                          <img src={otherUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(otherUser.name)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">{otherUser.name}</p>
                          <span className="text-[10px] text-gray-400 shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 truncate">
                            {lastMsg?.isBot && <Bot className="w-3 h-3 inline mr-0.5 text-blue-500" />}
                            {lastMsg?.content || "No messages"}
                          </p>
                          <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[10px] ml-1 shrink-0">
                            {conv._count.messages}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">{otherUser.email}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {/* Conversation Messages */}
          <Card variant="admin" className="lg:col-span-2 p-0 overflow-hidden flex flex-col">
            {activeConv ? (
              <>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveConv(null)} className="lg:hidden text-gray-400 hover:text-gray-600 mr-1">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      Conversation with {replyTo?.name}
                    </h3>
                  </div>
                  <Badge className="bg-blue-100 text-blue-600 border-blue-200 text-xs">
                    {convMessages.length} messages
                  </Badge>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-112.5">
                  {convMessages.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-3", msg.isMine ? "justify-end" : "justify-start")}>
                      {!msg.isMine && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                          {msg.isBot ? <Bot className="w-4 h-4 text-blue-500" /> : getInitials(msg.sender.name)}
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5",
                        msg.isMine
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : msg.isBot
                            ? "bg-blue-50 border border-blue-200 text-gray-700 rounded-bl-sm"
                            : "bg-gray-100 text-gray-700 rounded-bl-sm"
                      )}>
                        {msg.isBot && (
                          <p className="text-[10px] text-blue-500 font-medium mb-0.5 flex items-center gap-1">
                            <Bot className="w-3 h-3" /> Automated Response
                          </p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={cn("text-[10px] mt-1", msg.isMine ? "text-white/60 text-right" : "text-gray-400")}>
                          {formatTime(msg.createdAt)}
                          {msg.isRead && msg.isMine && " ✓✓"}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={msgEndRef} />
                </div>

                {/* Reply Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Input
                      variant="admin"
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      placeholder={`Reply to ${replyTo?.name}...`}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={sendReply}
                      disabled={!replyInput.trim() || sending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center py-20">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Select a Conversation</h3>
                  <p className="text-sm text-gray-500">Choose a conversation to view messages and reply</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ═══ BOT RESPONSES TAB ═══ */}
      {tab === "bot" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Automated Bot Responses</h3>
              <p className="text-sm text-gray-500">
                Configure keyword triggers and automated replies. Use commas for multiple keywords, or regex patterns wrapped in <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">/pattern/</code>.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setShowBotForm(true);
                setEditingBot(null);
                setBotForm({ trigger: "", response: "", category: "general", priority: 0 });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Response
            </Button>
          </div>

          {/* Bot Form */}
          <AnimatePresence>
            {showBotForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card variant="admin" className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {editingBot ? "Edit Bot Response" : "New Bot Response"}
                    </h4>
                    <button onClick={() => { setShowBotForm(false); setEditingBot(null); }} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Trigger Keywords
                      </label>
                      <Input
                        variant="admin"
                        placeholder="hello, hi, hey (comma-separated)"
                        value={botForm.trigger}
                        onChange={(e) => setBotForm({ ...botForm, trigger: e.target.value })}
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Comma-separated keywords or /regex/ patterns</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
                        <select
                          value={botForm.category}
                          onChange={(e) => setBotForm({ ...botForm, category: e.target.value })}
                          className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white focus:outline-none focus:border-blue-400"
                        >
                          <option value="general">General</option>
                          <option value="greeting">Greeting</option>
                          <option value="support">Support</option>
                          <option value="faq">FAQ</option>
                          <option value="events">Events</option>
                          <option value="donations">Donations</option>
                          <option value="store">Store</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Priority</label>
                        <Input
                          variant="admin"
                          type="number"
                          placeholder="0"
                          value={botForm.priority}
                          onChange={(e) => setBotForm({ ...botForm, priority: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Bot Response Message
                      </label>
                      <textarea
                        value={botForm.response}
                        onChange={(e) => setBotForm({ ...botForm, response: e.target.value })}
                        placeholder="Hello! Welcome to The Integrity Man Network. How can I help you today?"
                        rows={3}
                        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white focus:outline-none focus:border-blue-400 resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => { setShowBotForm(false); setEditingBot(null); }}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveBot}
                      disabled={!botForm.trigger.trim() || !botForm.response.trim() || savingBot}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {savingBot ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                      {editingBot ? "Update" : "Create"}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bot responses list */}
          {botResponses.length === 0 ? (
            <Card variant="admin" className="p-12 text-center">
              <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Bot Responses Yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Create automated responses to handle common questions and greetings.
              </p>
              <Button
                size="sm"
                onClick={() => { setShowBotForm(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" /> Create First Response
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {botResponses.map((bot) => (
                <Card key={bot.id} variant="admin" className={cn("p-5 transition-all", !bot.isActive && "opacity-60")}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <Badge className={cn(
                          "text-[10px]",
                          bot.isActive
                            ? "bg-green-100 text-green-600 border-green-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        )}>
                          {bot.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Priority: {bot.priority} • Used: {bot.useCount} times
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleBot(bot)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title={bot.isActive ? "Deactivate" : "Activate"}
                      >
                        {bot.isActive ? (
                          <ToggleRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingBot(bot);
                          setBotForm({
                            trigger: bot.trigger,
                            response: bot.response,
                            category: bot.category,
                            priority: bot.priority,
                          });
                          setShowBotForm(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-blue-600"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this bot response?")) deleteBot(bot.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Triggers</p>
                      <div className="flex flex-wrap gap-1">
                        {bot.trigger.split(",").map((t, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Response</p>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 line-clamp-3">
                        {bot.response}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[10px] capitalize">
                        {bot.category}
                      </Badge>
                      <span className="text-[10px] text-gray-400">
                        Created {new Date(bot.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ BROADCAST MODAL ═══ */}
      <AnimatePresence>
        {showBroadcast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
            onClick={() => setShowBroadcast(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Broadcast Message</h3>
                </div>
                <button onClick={() => setShowBroadcast(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Send a direct message to all active users. This will create a new conversation with each user.
              </p>
              <textarea
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="Type your broadcast message..."
                rows={4}
                className="w-full text-sm px-4 py-3 rounded-xl border border-gray-200 text-gray-700 bg-gray-50 focus:outline-none focus:border-blue-400 resize-none mb-4"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowBroadcast(false)}>Cancel</Button>
                <Button
                  size="sm"
                  onClick={sendBroadcast}
                  disabled={!broadcastMsg.trim() || broadcasting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {broadcasting ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Sending...</>
                  ) : (
                    <><Megaphone className="w-4 h-4 mr-1" /> Send to All Users</>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
