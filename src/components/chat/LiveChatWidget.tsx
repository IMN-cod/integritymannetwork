"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, MinusCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  senderType: "VISITOR" | "ADMIN" | "BOT";
  createdAt: string;
}

interface ChatSession {
  id: string;
  sessionToken: string;
  status: "BOT" | "WAITING" | "ACTIVE" | "CLOSED";
  visitorName: string | null;
  messages: ChatMessage[];
  assignedAdmin: { firstName: string; lastName: string; displayName: string | null; avatar: string | null } | null;
}

const STORAGE_KEY = "timn_live_chat_token";

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const lastCountRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load existing session from localStorage
  const loadSession = useCallback(async (token: string) => {
    try {
      const res = await fetch(`/api/chat/live?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        lastCountRef.current = data.session.messages.length;
        return data.session;
      } else {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    } catch {
      return null;
    }
  }, []);

  // Poll for new messages
  const poll = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) return;

    try {
      const res = await fetch(`/api/chat/live?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        const newCount = data.session.messages.length;
        if (newCount > lastCountRef.current) {
          const newMessages = data.session.messages.slice(lastCountRef.current);
          const hasAdminOrBot = newMessages.some(
            (m: ChatMessage) => m.senderType === "ADMIN" || m.senderType === "BOT"
          );
          if (hasAdminOrBot && !document.hasFocus()) {
            setUnread(prev => prev + newMessages.filter((m: ChatMessage) => m.senderType !== "VISITOR").length);
          }
          lastCountRef.current = newCount;
        }
      }
    } catch { /* silent */ }
  }, []);

  // Start polling when open
  useEffect(() => {
    if (isOpen && session && session.status !== "CLOSED") {
      pollRef.current = setInterval(poll, 4000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
    // Still poll in background (slower) for unread indicator
    if (session && session.status !== "CLOSED") {
      pollRef.current = setInterval(poll, 15000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [isOpen, session?.status, poll, session]);

  // Scroll on new messages when open
  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [session?.messages?.length, isOpen, scrollToBottom]);

  // Load session on mount
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) {
      loadSession(token);
    }
  }, [loadSession]);

  // Start a new session
  const startSession = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEY, data.sessionToken);
        await loadSession(data.sessionToken);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  // Send a message
  const sendMessage = async () => {
    if (!input.trim() || sending || !session) return;
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) return;

    setSending(true);
    try {
      const res = await fetch("/api/chat/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", token, content: input.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        lastCountRef.current = data.session.messages.length;
        setInput("");
      }
    } catch { /* silent */ }
    setSending(false);
    inputRef.current?.focus();
  };

  // Open chat
  const handleOpen = async () => {
    setIsOpen(true);
    setUnread(0);
    if (!session) {
      await startSession();
    }
  };

  // Start new chat after closed
  const startNewChat = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    await startSession();
  };

  const adminName = session?.assignedAdmin
    ? session.assignedAdmin.displayName || `${session.assignedAdmin.firstName} ${session.assignedAdmin.lastName}`
    : null;

  return (
    <>
      {/* Chat Bubble */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 flex items-center justify-center transition-colors"
            aria-label="Open live chat"
          >
            <MessageCircle className="w-6 h-6" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 z-50 w-90 max-w-[calc(100vw-2rem)] h-130 max-h-[calc(100vh-2rem)] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {adminName ? adminName : "TIMN Support"}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {session?.status === "ACTIVE" ? "Online" : session?.status === "WAITING" ? "Connecting..." : session?.status === "CLOSED" ? "Chat ended" : "Chat with us"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                  <MinusCircle className="w-4 h-4" />
                </button>
                <button onClick={() => { setIsOpen(false); }} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Status Bar */}
            {session?.status === "WAITING" && (
              <div className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/20 text-center">
                <p className="text-xs text-orange-400">Waiting for an admin to join...</p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
              {loading && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                </div>
              )}

              {session?.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderType === "VISITOR" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.senderType === "VISITOR"
                        ? "bg-orange-500 text-white rounded-br-md"
                        : msg.senderType === "ADMIN"
                          ? "bg-zinc-700 text-zinc-100 rounded-bl-md"
                          : "bg-zinc-800 text-zinc-300 rounded-bl-md border border-zinc-700/50"
                    }`}
                  >
                    {msg.senderType === "ADMIN" && (
                      <p className="text-[10px] text-orange-400 font-medium mb-1">Admin</p>
                    )}
                    {msg.senderType === "BOT" && (
                      <p className="text-[10px] text-zinc-500 font-medium mb-1">🤖 Bot</p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {session?.status !== "CLOSED" ? (
              <div className="px-3 py-3 border-t border-zinc-800 bg-zinc-900/80">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                    disabled={sending || loading}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white transition-colors"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </div>
            ) : (
              <div className="px-3 py-3 border-t border-zinc-800 bg-zinc-900/80 text-center">
                <button onClick={startNewChat} className="text-sm text-orange-500 hover:text-orange-400 font-medium transition-colors">
                  Start a new conversation
                </button>
              </div>
            )}

            {/* Branding */}
            <div className="px-4 py-1.5 text-center border-t border-zinc-800/50">
              <p className="text-[10px] text-zinc-600">The Integrity Man Network</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
