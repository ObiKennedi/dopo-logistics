"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MessageSquare,
  LifeBuoy,
  Search,
  Send,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle2,
  ChevronLeft,
  User,
  Phone,
  Mail,
  Package,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight
} from "lucide-react";
import {
  replyTicketAction,
  updateTicketStatusAction,
  updateTicketPriorityAction,
} from "@/actions/ticketActions";
import {
  sendChatMessageAction,
  updateChatStatusAction,
} from "@/actions/chatActions";
import { TicketStatus, TicketPriority, ChatStatus, SenderType } from "@prisma/client";
import "@/styles/admin/AdminChat.scss";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------
export interface AdminTicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
}

export interface AdminTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
  order?: {
    id: string;
    trackingNumber: string;
    serviceType: string;
    status: string;
  } | null;
  messages: AdminTicketMessage[];
}

export interface AdminChatMessage {
  id: string;
  sessionId: string;
  senderId?: string | null;
  senderType: SenderType;
  senderName: string;
  content: string;
  isRead: boolean;
  attachments: string[];
  createdAt: string;
}

export interface AdminChatSession {
  id: string;
  status: ChatStatus;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    image?: string | null;
    role: string;
  } | null;
  assignedAgent?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  order?: {
    id: string;
    trackingNumber: string;
    serviceType: string;
    status: string;
  } | null;
  messages: AdminChatMessage[];
}

interface AdminChatViewProps {
  initialTickets: AdminTicket[];
  initialChats: AdminChatSession[];
  ticketStats: Record<string, number>;
  chatStats: Record<string, number>;
}

export const AdminChatView: React.FC<AdminChatViewProps> = ({
  initialTickets,
  initialChats,
  ticketStats: initialTicketStats,
  chatStats: initialChatStats,
}) => {
  // Primary Channel: "tickets" vs "chats"
  const [activeChannel, setActiveChannel] = useState<"tickets" | "chats">("tickets");

  // State for Tickets
  const [tickets, setTickets] = useState<AdminTicket[]>(initialTickets);
  const [ticketStats, setTicketStats] = useState<Record<string, number>>(initialTicketStats);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    initialTickets.length > 0 ? initialTickets[0].id : null
  );
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>("ALL");
  const [ticketReplyText, setTicketReplyText] = useState("");
  const [isSendingTicketReply, setIsSendingTicketReply] = useState(false);

  // State for Live Chats
  const [chats, setChats] = useState<AdminChatSession[]>(initialChats);
  const [chatStats, setChatStats] = useState<Record<string, number>>(initialChatStats);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    initialChats.length > 0 ? initialChats[0].id : null
  );
  const [chatSearch, setChatSearch] = useState("");
  const [chatStatusFilter, setChatStatusFilter] = useState<string>("ALL");
  const [chatReplyText, setChatReplyText] = useState("");
  const [isSendingChatReply, setIsSendingChatReply] = useState(false);

  // General Notification
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Scroll messages to bottom when thread updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicketId, selectedChatId, tickets, chats]);

  // ------------------------------------------------------------------------
  // Filtered Lists
  // ------------------------------------------------------------------------
  const filteredTickets = useMemo(() => {
    let list = [...tickets];

    if (ticketSearch.trim()) {
      const q = ticketSearch.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.user.name.toLowerCase().includes(q) ||
          t.user.email.toLowerCase().includes(q) ||
          (t.order?.trackingNumber && t.order.trackingNumber.toLowerCase().includes(q))
      );
    }

    if (ticketStatusFilter !== "ALL") {
      list = list.filter((t) => t.status === ticketStatusFilter);
    }

    return list;
  }, [tickets, ticketSearch, ticketStatusFilter]);

  const filteredChats = useMemo(() => {
    let list = [...chats];

    if (chatSearch.trim()) {
      const q = chatSearch.toLowerCase().trim();
      list = list.filter((c) => {
        const name = (c.user?.name || c.guestName || "").toLowerCase();
        const email = (c.user?.email || c.guestEmail || "").toLowerCase();
        const phone = (c.user?.phone || c.guestPhone || "").toLowerCase();
        const order = (c.order?.trackingNumber || "").toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q) || order.includes(q);
      });
    }

    if (chatStatusFilter !== "ALL") {
      list = list.filter((c) => c.status === chatStatusFilter);
    }

    return list;
  }, [chats, chatSearch, chatStatusFilter]);

  // Selected records
  const activeTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) || null,
    [tickets, selectedTicketId]
  );

  const activeChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) || null,
    [chats, selectedChatId]
  );

  // ------------------------------------------------------------------------
  // Handlers for Tickets
  // ------------------------------------------------------------------------
  const handleSendTicketReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeTicket || !ticketReplyText.trim() || isSendingTicketReply) return;

    const text = ticketReplyText.trim();
    setIsSendingTicketReply(true);
    setTicketReplyText("");

    const res = await replyTicketAction(activeTicket.id, text);
    setIsSendingTicketReply(false);

    if (res.success && res.message) {
      // Append message locally
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicket.id
            ? {
                ...t,
                status: res.newStatus || t.status,
                messages: [...t.messages, res.message as AdminTicketMessage],
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );
      showNotification(`Reply dispatched to #${activeTicket.ticketNumber}.`);
    } else {
      showNotification(res.error || "Failed to send ticket response.");
      setTicketReplyText(text); // restore
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    const res = await updateTicketStatusAction(ticketId, newStatus);
    if (res.success) {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
      showNotification(`Ticket status updated to ${newStatus}.`);
    } else {
      showNotification(res.error || "Failed to update status.");
    }
  };

  const handleUpdateTicketPriority = async (ticketId: string, newPriority: TicketPriority) => {
    const res = await updateTicketPriorityAction(ticketId, newPriority);
    if (res.success) {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, priority: newPriority } : t))
      );
      showNotification(`Priority set to ${newPriority}.`);
    } else {
      showNotification(res.error || "Failed to update priority.");
    }
  };

  // ------------------------------------------------------------------------
  // Handlers for Live Chats
  // ------------------------------------------------------------------------
  const handleSendChatReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeChat || !chatReplyText.trim() || isSendingChatReply) return;

    const text = chatReplyText.trim();
    setIsSendingChatReply(true);
    setChatReplyText("");

    const res = await sendChatMessageAction(activeChat.id, text);
    setIsSendingChatReply(false);

    if (res.success && res.message) {
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? {
                ...c,
                status: ChatStatus.ACTIVE,
                messages: [...c.messages, res.message as AdminChatMessage],
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
      showNotification("Message sent to customer.");
    } else {
      showNotification(res.error || "Failed to send chat reply.");
      setChatReplyText(text);
    }
  };

  const handleUpdateChatStatus = async (sessionId: string, newStatus: ChatStatus) => {
    const res = await updateChatStatusAction(sessionId, newStatus);
    if (res.success) {
      setChats((prev) =>
        prev.map((c) => (c.id === sessionId ? { ...c, status: newStatus } : c))
      );
      showNotification(`Chat session status marked as ${newStatus}.`);
    } else {
      showNotification(res.error || "Failed to update chat status.");
    }
  };

  return (
    <div className="admin-chat">
      {/* Toast Notice */}
      {actionNotice && (
        <div
          style={{
            position: "fixed",
            top: "1.5rem",
            right: "1.5rem",
            background: "#0a1854",
            color: "#ffffff",
            border: "1px solid #1e3a8a",
            padding: "0.85rem 1.25rem",
            borderRadius: "10px",
            boxShadow: "0 8px 30px rgba(10, 24, 84, 0.25)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 1. Header Bar */}
      <header className="admin-chat__header">
        <div className="admin-chat__title-group">
          <h1 className="admin-chat__title">
            <MessageSquare size={28} color="#2563eb" />
            Communications & Customer Service
          </h1>
          <p className="admin-chat__subtitle">
            Centralized hub for resolving support tickets and responding to live customer inquiries.
          </p>
        </div>

        <div className="admin-chat__actions">
          <button
            type="button"
            className="admin-chat__refresh-btn"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={15} />
            <span>Refresh Inbox</span>
          </button>
        </div>
      </header>

      {/* 2. Primary Channel Switcher */}
      <nav className="admin-chat__channel-switcher" aria-label="Channel Switcher">
        <button
          type="button"
          onClick={() => setActiveChannel("tickets")}
          className={`admin-chat__channel-btn ${
            activeChannel === "tickets" ? "admin-chat__channel-btn--active" : ""
          }`}
        >
          <LifeBuoy size={18} />
          <span>Support Tickets</span>
          <span className="admin-chat__channel-badge">{tickets.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveChannel("chats")}
          className={`admin-chat__channel-btn ${
            activeChannel === "chats" ? "admin-chat__channel-btn--active" : ""
          }`}
        >
          <MessageSquare size={18} />
          <span>Live Customer Chats</span>
          <span className="admin-chat__channel-badge">{chats.length}</span>
        </button>
      </nav>

      {/* 3. Main Two-Pane Console */}
      <div className="admin-chat__console">
        {/* ==================================================================
            CHANNEL 1: SUPPORT TICKETS
            ================================================================== */}
        {activeChannel === "tickets" && (
          <>
            {/* Left Pane: Tickets List */}
            <div
              className={`admin-chat__list-pane ${
                selectedTicketId ? "admin-chat__list-pane--hidden-on-mobile" : ""
              }`}
            >
              <div className="admin-chat__search-bar">
                <div className="admin-chat__search-wrap">
                  <Search size={16} className="admin-chat__search-icon" />
                  <input
                    type="text"
                    placeholder="Search tickets by #, client, subject..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="admin-chat__search-input"
                  />
                </div>

                <div className="admin-chat__status-filter-pills">
                  {["ALL", "OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"].map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setTicketStatusFilter(st)}
                        className={`admin-chat__filter-pill ${
                          ticketStatusFilter === st ? "admin-chat__filter-pill--active" : ""
                        }`}
                      >
                        {st.replace(/_/g, " ")}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="admin-chat__items-scroll">
                {filteredTickets.length === 0 ? (
                  <div
                    style={{
                      padding: "3rem 1.5rem",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "0.875rem",
                    }}
                  >
                    No support tickets found.
                  </div>
                ) : (
                  filteredTickets.map((ticket) => {
                    const isSelected = selectedTicketId === ticket.id;
                    const lastMsg = ticket.messages[ticket.messages.length - 1];

                    return (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={`admin-chat__conversation-item ${
                          isSelected ? "admin-chat__conversation-item--active" : ""
                        }`}
                      >
                        <div className="admin-chat__avatar">
                          {ticket.user.name ? ticket.user.name.charAt(0).toUpperCase() : "U"}
                        </div>

                        <div className="admin-chat__item-content">
                          <div className="admin-chat__item-top">
                            <span className="admin-chat__item-name">{ticket.user.name}</span>
                            <span className="admin-chat__item-time">
                              {new Date(ticket.updatedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>

                          <div className="admin-chat__item-subject">
                            #{ticket.ticketNumber} • {ticket.subject}
                          </div>

                          <div className="admin-chat__item-snippet">
                            {lastMsg ? lastMsg.message : ticket.description}
                          </div>

                          <div className="admin-chat__item-badges">
                            <span
                              className={`admin-chat__badge-pill admin-chat__badge-pill--${ticket.status.toLowerCase()}`}
                            >
                              {ticket.status.replace(/_/g, " ")}
                            </span>

                            <span
                              className={`admin-chat__priority-pill admin-chat__priority-pill--${ticket.priority.toLowerCase()}`}
                            >
                              {ticket.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Pane: Ticket Thread */}
            <div
              className={`admin-chat__thread-pane ${
                !selectedTicketId ? "admin-chat__thread-pane--hidden-on-mobile" : ""
              }`}
            >
              {activeTicket ? (
                <>
                  {/* Thread Header */}
                  <div className="admin-chat__thread-header">
                    <div className="admin-chat__thread-header-left">
                      <button
                        type="button"
                        onClick={() => setSelectedTicketId(null)}
                        className="admin-chat__back-btn"
                        aria-label="Back to ticket list"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <div className="admin-chat__avatar">
                        {activeTicket.user.name ? activeTicket.user.name.charAt(0).toUpperCase() : "U"}
                      </div>

                      <div className="admin-chat__thread-meta">
                        <div className="admin-chat__thread-title">
                          <span>#{activeTicket.ticketNumber}</span>
                          <span style={{ color: "#64748b", fontWeight: 400 }}>•</span>
                          <span>{activeTicket.subject}</span>
                        </div>

                        <div className="admin-chat__thread-subtitle">
                          <span>{activeTicket.user.name} ({activeTicket.user.email})</span>
                          {activeTicket.order && (
                            <Link
                              href={`/track?code=${activeTicket.order.trackingNumber}`}
                              target="_blank"
                              style={{
                                color: "#1d4ed8",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                fontWeight: 600,
                                textDecoration: "none",
                              }}
                            >
                              <Package size={13} />
                              <span>Order #{activeTicket.order.trackingNumber}</span>
                              <ExternalLink size={11} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="admin-chat__thread-header-right">
                      {/* Priority selector */}
                      <select
                        value={activeTicket.priority}
                        onChange={(e) =>
                          handleUpdateTicketPriority(activeTicket.id, e.target.value as TicketPriority)
                        }
                        className="admin-chat__thread-select"
                        title="Update Ticket Priority"
                        aria-label="Ticket Priority"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>

                      {/* Status selector */}
                      <select
                        value={activeTicket.status}
                        onChange={(e) =>
                          handleUpdateTicketStatus(activeTicket.id, e.target.value as TicketStatus)
                        }
                        className="admin-chat__thread-select"
                        title="Update Ticket Status"
                        aria-label="Ticket Status"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="WAITING_FOR_CUSTOMER">Waiting For Customer</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="admin-chat__messages-area">
                    {/* Initial Description Banner */}
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "1rem 1.25rem",
                        fontSize: "0.875rem",
                        color: "#334155",
                        lineHeight: 1.5,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#64748b",
                          textTransform: "uppercase",
                          marginBottom: "0.35rem",
                        }}
                      >
                        Initial Inquiry Description ({activeTicket.category})
                      </div>
                      <p style={{ margin: 0 }}>{activeTicket.description}</p>
                    </div>

                    <div className="admin-chat__date-divider">
                      <span>Conversation Thread</span>
                    </div>

                    {activeTicket.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`admin-chat__message-group ${
                          msg.isStaff ? "admin-chat__message-group--agent" : "admin-chat__message-group--customer"
                        }`}
                      >
                        <span className="admin-chat__bubble-sender">
                          {msg.isStaff ? "Support Team" : activeTicket.user.name}
                        </span>

                        <div className="admin-chat__bubble">{msg.message}</div>

                        <div className="admin-chat__bubble-meta">
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply Composer */}
                  <form onSubmit={handleSendTicketReply} className="admin-chat__composer">
                    <textarea
                      rows={1}
                      placeholder="Type a response to the customer... (Enter to send)"
                      value={ticketReplyText}
                      onChange={(e) => setTicketReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendTicketReply();
                        }
                      }}
                      className="admin-chat__composer-input"
                    />

                    <button
                      type="submit"
                      disabled={!ticketReplyText.trim() || isSendingTicketReply}
                      className="admin-chat__send-btn"
                    >
                      <span>Reply</span>
                      <Send size={15} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="admin-chat__empty-thread">
                  <LifeBuoy size={40} color="#94a3b8" />
                  <p>Select a ticket from the left panel to review message history and reply.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ==================================================================
            CHANNEL 2: LIVE CUSTOMER CHATS
            ================================================================== */}
        {activeChannel === "chats" && (
          <>
            {/* Left Pane: Chats List */}
            <div
              className={`admin-chat__list-pane ${
                selectedChatId ? "admin-chat__list-pane--hidden-on-mobile" : ""
              }`}
            >
              <div className="admin-chat__search-bar">
                <div className="admin-chat__search-wrap">
                  <Search size={16} className="admin-chat__search-icon" />
                  <input
                    type="text"
                    placeholder="Search chats by name, email, phone..."
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    className="admin-chat__search-input"
                  />
                </div>

                <div className="admin-chat__status-filter-pills">
                  {["ALL", "ACTIVE", "WAITING", "CLOSED"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setChatStatusFilter(st)}
                      className={`admin-chat__filter-pill ${
                        chatStatusFilter === st ? "admin-chat__filter-pill--active" : ""
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-chat__items-scroll">
                {filteredChats.length === 0 ? (
                  <div
                    style={{
                      padding: "3rem 1.5rem",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "0.875rem",
                    }}
                  >
                    No chat conversations found.
                  </div>
                ) : (
                  filteredChats.map((chat) => {
                    const isSelected = selectedChatId === chat.id;
                    const customerName = chat.user?.name || chat.guestName || "Guest User";
                    const lastMsg = chat.messages[chat.messages.length - 1];

                    return (
                      <div
                        key={chat.id}
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`admin-chat__conversation-item ${
                          isSelected ? "admin-chat__conversation-item--active" : ""
                        }`}
                      >
                        <div className="admin-chat__avatar">
                          {customerName ? customerName.charAt(0).toUpperCase() : "G"}
                        </div>

                        <div className="admin-chat__item-content">
                          <div className="admin-chat__item-top">
                            <span className="admin-chat__item-name">{customerName}</span>
                            <span className="admin-chat__item-time">
                              {new Date(chat.updatedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="admin-chat__item-snippet">
                            {lastMsg ? lastMsg.content : "Session initiated"}
                          </div>

                          <div className="admin-chat__item-badges">
                            <span
                              className={`admin-chat__badge-pill admin-chat__badge-pill--${chat.status.toLowerCase()}`}
                            >
                              {chat.status}
                            </span>
                            {chat.order && (
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  color: "#1d4ed8",
                                  fontWeight: 600,
                                }}
                              >
                                #{chat.order.trackingNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Pane: Live Chat Thread */}
            <div
              className={`admin-chat__thread-pane ${
                !selectedChatId ? "admin-chat__thread-pane--hidden-on-mobile" : ""
              }`}
            >
              {activeChat ? (
                <>
                  {/* Chat Thread Header */}
                  <div className="admin-chat__thread-header">
                    <div className="admin-chat__thread-header-left">
                      <button
                        type="button"
                        onClick={() => setSelectedChatId(null)}
                        className="admin-chat__back-btn"
                        aria-label="Back to chat list"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <div className="admin-chat__avatar">
                        {(activeChat.user?.name || activeChat.guestName || "G").charAt(0).toUpperCase()}
                      </div>

                      <div className="admin-chat__thread-meta">
                        <div className="admin-chat__thread-title">
                          <span>{activeChat.user?.name || activeChat.guestName || "Guest User"}</span>
                          <span
                            className={`admin-chat__badge-pill admin-chat__badge-pill--${activeChat.status.toLowerCase()}`}
                            style={{ fontSize: "0.7rem" }}
                          >
                            {activeChat.status}
                          </span>
                        </div>

                        <div className="admin-chat__thread-subtitle">
                          <span>{activeChat.user?.email || activeChat.guestEmail || "No email"}</span>
                          {(activeChat.user?.phone || activeChat.guestPhone) && (
                            <>
                              <span>•</span>
                              <span>{activeChat.user?.phone || activeChat.guestPhone}</span>
                            </>
                          )}
                          {activeChat.order && (
                            <>
                              <span>•</span>
                              <Link
                                href={`/track?code=${activeChat.order.trackingNumber}`}
                                target="_blank"
                                style={{
                                  color: "#1d4ed8",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  fontWeight: 600,
                                  textDecoration: "none",
                                }}
                              >
                                <Package size={13} />
                                <span>Order #{activeChat.order.trackingNumber}</span>
                                <ExternalLink size={11} />
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="admin-chat__thread-header-right">
                      <select
                        value={activeChat.status}
                        onChange={(e) =>
                          handleUpdateChatStatus(activeChat.id, e.target.value as ChatStatus)
                        }
                        className="admin-chat__thread-select"
                        title="Update Chat Status"
                        aria-label="Chat Status"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="WAITING">Waiting on Customer</option>
                        <option value="CLOSED">Close Chat</option>
                      </select>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="admin-chat__messages-area">
                    <div className="admin-chat__date-divider">
                      <span>Live Session Started</span>
                    </div>

                    {activeChat.messages.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "2rem",
                          color: "#94a3b8",
                          fontSize: "0.875rem",
                        }}
                      >
                        No messages in this chat session yet. Send the first response below.
                      </div>
                    ) : (
                      activeChat.messages.map((msg) => {
                        const isAgent = msg.senderType === SenderType.AGENT;

                        return (
                          <div
                            key={msg.id}
                            className={`admin-chat__message-group ${
                              isAgent
                                ? "admin-chat__message-group--agent"
                                : "admin-chat__message-group--customer"
                            }`}
                          >
                            <span className="admin-chat__bubble-sender">
                              {isAgent ? msg.senderName || "Support Specialist" : activeChat.user?.name || activeChat.guestName || "Customer"}
                            </span>

                            <div className="admin-chat__bubble">{msg.content}</div>

                            <div className="admin-chat__bubble-meta">
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Chat Composer */}
                  <form onSubmit={handleSendChatReply} className="admin-chat__composer">
                    <textarea
                      rows={1}
                      placeholder="Send real-time reply to customer... (Enter to send)"
                      value={chatReplyText}
                      onChange={(e) => setChatReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChatReply();
                        }
                      }}
                      className="admin-chat__composer-input"
                    />

                    <button
                      type="submit"
                      disabled={!chatReplyText.trim() || isSendingChatReply}
                      className="admin-chat__send-btn"
                    >
                      <span>Send</span>
                      <Send size={15} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="admin-chat__empty-thread">
                  <MessageSquare size={40} color="#94a3b8" />
                  <p>Select a live chat conversation from the left to engage with the customer.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
