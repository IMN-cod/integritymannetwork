"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Search,
  Trash2,
  Mail,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Reply,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  isRead: boolean;
  repliedAt: string | null;
  createdAt: string;
}

interface Pagination { page: number; limit: number; total: number; pages: number; }

function getStatus(msg: Message) {
  if (msg.repliedAt) return "replied";
  if (msg.isRead) return "read";
  return "unread";
}

const statusConfig: Record<string, { variant: "warning" | "secondary" | "success"; icon: typeof Clock; label: string }> = {
  unread: { variant: "warning", icon: Clock, label: "Unread" },
  read: { variant: "secondary", icon: Eye, label: "Read" },
  replied: { variant: "success", icon: CheckCircle2, label: "Replied" },
};

const STATUS_FILTERS = ["", "unread", "read", "replied"];

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const fetchMessages = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/messages?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.messages);
      setUnreadCount(data.unreadCount);
      setPagination(data.pagination);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const markAsRead = async (msg: Message) => {
    if (msg.isRead) return;
    try {
      await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msg.id, isRead: true }),
      });
      await fetchMessages(pagination.page);
    } catch {
      // silent fail
    }
  };

  const markAsReplied = async (id: string) => {
    try {
      await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, replied: true, isRead: true }),
      });
      setSelectedMessage(null);
      await fetchMessages(pagination.page);
    } catch {
      alert("Failed to update message");
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this message permanently?")) return;
    try {
      await fetch("/api/admin/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (selectedMessage?.id === id) setSelectedMessage(null);
      await fetchMessages(pagination.page);
    } catch {
      alert("Failed to delete message");
    }
  };

  const openMessage = (msg: Message) => {
    setSelectedMessage(msg);
    markAsRead(msg);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Messages</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage contact form submissions.
            {unreadCount > 0 && <span className="text-orange-500 ml-2">({unreadCount} unread)</span>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchMessages()}>
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Card variant="admin">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input variant="admin" placeholder="Search messages..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm px-3 focus:outline-none focus:ring-1 focus:ring-orange-500">
              <option value="">All Messages</option>
              {STATUS_FILTERS.filter(Boolean).map((s) => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {messages.map((msg) => {
                  const status = getStatus(msg);
                  const config = statusConfig[status];
                  return (
                    <div
                      key={msg.id}
                      onClick={() => openMessage(msg)}
                      className={`px-6 py-5 hover:bg-gray-50 transition-colors cursor-pointer ${status === "unread" ? "bg-gray-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <p className={`text-sm font-medium ${status === "unread" ? "text-gray-900" : "text-gray-700"}`}>{msg.name}</p>
                            <Badge variant={config.variant} className="text-[10px]">{config.label}</Badge>
                          </div>
                          <p className="text-sm text-gray-900 mb-1">{msg.subject || "(No subject)"}</p>
                          <p className="text-xs text-gray-500 truncate">{msg.message}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-400">
                            {new Date(msg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          <a href={`mailto:${msg.email}?subject=Re: ${msg.subject || "Your message"}`} onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon"><Mail className="w-4 h-4" /></Button>
                          </a>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {messages.length === 0 && (
                <div className="text-center py-12"><MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No messages found.</p></div>
              )}

              {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Page {pagination.page} of {pagination.pages}</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchMessages(pagination.page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => fetchMessages(pagination.page + 1)}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedMessage(null)} />
          <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 font-display">Message Details</h2>
              <button onClick={() => setSelectedMessage(null)} className="text-gray-500 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500 mb-1">From</p><p className="text-sm text-gray-900">{selectedMessage.name}</p></div>
                <div><p className="text-xs text-gray-500 mb-1">Email</p><p className="text-sm text-orange-500">{selectedMessage.email}</p></div>
              </div>
              <div><p className="text-xs text-gray-500 mb-1">Subject</p><p className="text-sm text-gray-900">{selectedMessage.subject || "(No subject)"}</p></div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Message</p>
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                Received: {new Date(selectedMessage.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <a href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || "Your message"}`}>
                  <Button><Mail className="w-4 h-4" />Reply via Email</Button>
                </a>
                {!selectedMessage.repliedAt && (
                  <Button variant="outline" onClick={() => markAsReplied(selectedMessage.id)}>
                    <Reply className="w-4 h-4" />Mark as Replied
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
