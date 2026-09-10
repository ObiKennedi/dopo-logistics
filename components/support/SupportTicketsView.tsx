"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Ticket as TicketIcon, 
  MessageSquare, 
  Send, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  ExternalLink, 
  Phone, 
  MessageCircle, 
  X, 
  Sparkles,
  ChevronRight,
  RefreshCw,
  HelpCircle,
  Package,
  Layers
} from "lucide-react";
import { 
  createTicketAction, 
  replyTicketAction, 
  updateTicketStatusAction, 
  updateTicketPriorityAction,
  fetchTicketDetailsAction 
} from "@/actions/ticketActions";
import type { TicketStatus, TicketPriority, TicketCategory } from "@prisma/client";
import "@/styles/support/SupportTickets.scss";

export interface SerializedSender {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
}

export interface SerializedMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
  sender: SerializedSender;
}

export interface SerializedTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  user: SerializedSender;
  order?: {
    id: string;
    trackingNumber: string;
    serviceType: string;
    status: string;
  } | null;
  messages: SerializedMessage[];
}

export interface UserOrderOption {
  id: string;
  trackingNumber: string;
  serviceType: string;
  status: string;
}

interface SupportTicketsViewProps {
  initialTickets: SerializedTicket[];
  userOrders?: UserOrderOption[];
  currentUser: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
  };
}

export const SupportTicketsView: React.FC<SupportTicketsViewProps> = ({
  initialTickets = [],
  userOrders = [],
  currentUser,
}) => {
  const [tickets, setTickets] = useState<SerializedTicket[]>(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    initialTickets.length > 0 ? initialTickets[0].id : null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "STAFF";

  // Active Ticket
  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  // Auto-scroll messages stream on change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTicket?.messages]);

  // Status and Priority helpers
  const formatCategory = (cat: TicketCategory) => {
    switch (cat) {
      case "ORDER_INQUIRY":
        return "Order Inquiry";
      case "DELIVERY_DELAY":
        return "Delivery Delay";
      case "PAYMENT_ISSUE":
        return "Payment Issue";
      case "COMPLAINT":
        return "Complaint";
      case "TECHNICAL":
        return "Technical";
      default:
        return "General Support";
    }
  };

  const formatStatus = (status: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return "Open";
      case "IN_PROGRESS":
        return "In Progress";
      case "WAITING_FOR_CUSTOMER":
        return "Waiting on You";
      case "RESOLVED":
        return "Resolved";
      case "CLOSED":
        return "Closed";
      default:
        return status;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Stats calculation
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "IN_PROGRESS" || t.status === "WAITING_FOR_CUSTOMER"
  ).length;
  const resolvedCount = tickets.filter(
    (t) => t.status === "RESOLVED" || t.status === "CLOSED"
  ).length;

  // Filter and Search tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesFilter =
      filterStatus === "ALL" ||
      (filterStatus === "OPEN" && t.status === "OPEN") ||
      (filterStatus === "IN_PROGRESS" &&
        (t.status === "IN_PROGRESS" || t.status === "WAITING_FOR_CUSTOMER")) ||
      (filterStatus === "RESOLVED" &&
        (t.status === "RESOLVED" || t.status === "CLOSED"));

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      t.ticketNumber.toLowerCase().includes(query) ||
      t.subject.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.order?.trackingNumber.toLowerCase().includes(query) ||
      t.user.name?.toLowerCase().includes(query) ||
      t.user.email.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  // Handle Reply Submission
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim() || isSendingReply) return;

    setIsSendingReply(true);
    setStatusMessage(null);

    const res = await replyTicketAction(activeTicket.id, replyText);

    if (res.error) {
      setStatusMessage(res.error);
    } else if (res.success && res.message) {
      const newMsg = res.message;
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id === activeTicket.id) {
            return {
              ...t,
              status: res.newStatus || t.status,
              updatedAt: new Date().toISOString(),
              messages: [...t.messages, newMsg as SerializedMessage],
            };
          }
          return t;
        })
      );
      setReplyText("");
    }

    setIsSendingReply(false);
  };

  // Handle Ticket Creation
  const handleCreateTicketSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreatingTicket(true);
    setTicketError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createTicketAction(null, formData);

    if (res.error) {
      setTicketError(res.error);
      setIsCreatingTicket(false);
    } else if (res.success && res.ticketId) {
      // Refresh details
      const detailRes = await fetchTicketDetailsAction(res.ticketId);
      if (detailRes.success && detailRes.ticket) {
        setTickets((prev) => [detailRes.ticket as SerializedTicket, ...prev]);
        setSelectedTicketId(res.ticketId);
      }
      setIsCreatingTicket(false);
      setIsModalOpen(false);
    }
  };

  // Handle Status Change (Admin / Customer)
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!activeTicket) return;

    const res = await updateTicketStatusAction(activeTicket.id, newStatus);
    if (res.success && res.newStatus) {
      setTickets((prev) =>
        prev.map((t) => (t.id === activeTicket.id ? { ...t, status: res.newStatus! } : t))
      );
    }
  };

  // Handle Priority Change (Admin)
  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!activeTicket || !isAdmin) return;

    const res = await updateTicketPriorityAction(activeTicket.id, newPriority);
    if (res.success && res.newPriority) {
      setTickets((prev) =>
        prev.map((t) => (t.id === activeTicket.id ? { ...t, priority: res.newPriority! } : t))
      );
    }
  };

  return (
    <div className="support-hub">
      {/* Header */}
      <div className="support-hub__header">
        <div className="support-hub__title-group">
          <h1 className="support-hub__title">
            <MessageSquare size={26} color="#2563eb" />
            Customer Support & Inquiries
          </h1>
          <p className="support-hub__subtitle">
            {isAdmin
              ? "Manage all customer support inquiries, assign tickets, and resolve operational issues."
              : "Need help with an order, delivery, or custom errand? Submit a ticket or talk with our team."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="support-hub__create-btn"
        >
          <Plus size={18} />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="support-hub__stats">
        <div className="support-hub__stat-card">
          <div className="support-hub__stat-card-icon support-hub__stat-card-icon--blue">
            <TicketIcon size={22} />
          </div>
          <div className="support-hub__stat-card-info">
            <span className="support-hub__stat-card-value">{openCount}</span>
            <span className="support-hub__stat-card-label">Open Tickets</span>
          </div>
        </div>

        <div className="support-hub__stat-card">
          <div className="support-hub__stat-card-icon support-hub__stat-card-icon--amber">
            <Clock size={22} />
          </div>
          <div className="support-hub__stat-card-info">
            <span className="support-hub__stat-card-value">{inProgressCount}</span>
            <span className="support-hub__stat-card-label">In Progress</span>
          </div>
        </div>

        <div className="support-hub__stat-card">
          <div className="support-hub__stat-card-icon support-hub__stat-card-icon--green">
            <CheckCircle size={22} />
          </div>
          <div className="support-hub__stat-card-info">
            <span className="support-hub__stat-card-value">{resolvedCount}</span>
            <span className="support-hub__stat-card-label">Resolved / Closed</span>
          </div>
        </div>

        <div className="support-hub__stat-card">
          <div className="support-hub__stat-card-icon support-hub__stat-card-icon--purple">
            <Layers size={22} />
          </div>
          <div className="support-hub__stat-card-info">
            <span className="support-hub__stat-card-value">{totalCount}</span>
            <span className="support-hub__stat-card-label">Total Inquiries</span>
          </div>
        </div>
      </div>

      {/* Direct Escalation Hotline Banner */}
      <div className="support-hotline-card">
        <div className="support-hotline-card__info">
          <div className="support-hotline-card__icon-box">
            <Phone size={24} color="#ffffff" />
          </div>
          <div>
            <div className="support-hotline-card__title">Urgent or Real-Time Assistance?</div>
            <div className="support-hotline-card__desc">
              Connect directly with our 24/7 on-demand dispatchers and customer hotline.
            </div>
          </div>
        </div>

        <div className="support-hotline-card__actions">
          <a
            href="https://wa.me/2348000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="support-hotline-card__btn support-hotline-card__btn--wa"
          >
            <MessageCircle size={16} />
            <span>WhatsApp Support</span>
          </a>
          <a
            href="tel:+2348000000000"
            className="support-hotline-card__btn support-hotline-card__btn--phone"
          >
            <Phone size={15} />
            <span>Call Hotline</span>
          </a>
        </div>
      </div>

      {/* Toolbar: Filters & Search */}
      <div className="support-hub__toolbar">
        <div className="support-hub__filters">
          <button
            type="button"
            onClick={() => setFilterStatus("ALL")}
            className={`support-hub__filter-btn ${
              filterStatus === "ALL" ? "support-hub__filter-btn--active" : ""
            }`}
          >
            All Tickets ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("OPEN")}
            className={`support-hub__filter-btn ${
              filterStatus === "OPEN" ? "support-hub__filter-btn--active" : ""
            }`}
          >
            Open ({openCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("IN_PROGRESS")}
            className={`support-hub__filter-btn ${
              filterStatus === "IN_PROGRESS" ? "support-hub__filter-btn--active" : ""
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("RESOLVED")}
            className={`support-hub__filter-btn ${
              filterStatus === "RESOLVED" ? "support-hub__filter-btn--active" : ""
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>

        <div className="support-hub__search-box">
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by ticket #, subject, order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="support-hub__layout">
        {/* Left Side: Ticket List */}
        <div className="support-hub__list-panel">
          <div className="support-hub__list-header">
            <span>Inquiries ({filteredTickets.length})</span>
            {filteredTickets.length > 0 && (
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                Select to view thread
              </span>
            )}
          </div>

          <div className="support-hub__list-scroll">
            {filteredTickets.length === 0 ? (
              <div className="support-empty">
                <div className="support-empty__icon">
                  <TicketIcon size={24} />
                </div>
                <div className="support-empty__title">No tickets found</div>
                <div className="support-empty__desc">
                  {searchQuery || filterStatus !== "ALL"
                    ? "Try adjusting your search query or filter."
                    : "You haven't opened any support inquiries yet. Click 'New Support Ticket' to start."}
                </div>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                const lastMsg = t.messages[t.messages.length - 1];

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`support-card ${isSelected ? "support-card--active" : ""}`}
                  >
                    <div className="support-card__top">
                      <span className="support-card__number">{t.ticketNumber}</span>
                      <span className="support-card__date">{formatTimeAgo(t.updatedAt)}</span>
                    </div>

                    <div className="support-card__subject">{t.subject}</div>

                    <div className="support-card__preview">
                      {lastMsg ? lastMsg.message : t.description}
                    </div>

                    <div className="support-card__meta">
                      <div className="support-card__tags">
                        <span
                          className={`badge-status badge-status--${t.status.toLowerCase()}`}
                        >
                          <span className="badge-status-dot" />
                          <span>{formatStatus(t.status)}</span>
                        </span>
                        <span
                          className={`badge-priority badge-priority--${t.priority.toLowerCase()}`}
                        >
                          {t.priority}
                        </span>
                      </div>

                      <span className="badge-category">{formatCategory(t.category)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Conversation Thread */}
        <div className="support-hub__thread-panel">
          {activeTicket ? (
            <div className="support-thread">
              {/* Thread Header */}
              <div className="support-thread__header">
                <div className="support-thread__header-top">
                  <div className="support-thread__subject-wrap">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="support-card__number">{activeTicket.ticketNumber}</span>
                      <span
                        className={`badge-status badge-status--${activeTicket.status.toLowerCase()}`}
                      >
                        <span className="badge-status-dot" />
                        <span>{formatStatus(activeTicket.status)}</span>
                      </span>
                      <span
                        className={`badge-priority badge-priority--${activeTicket.priority.toLowerCase()}`}
                      >
                        {activeTicket.priority} Priority
                      </span>
                    </div>
                    <h2 className="support-thread__subject">{activeTicket.subject}</h2>
                  </div>

                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    Opened {new Date(activeTicket.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="support-thread__header-meta">
                  <span className="badge-category">{formatCategory(activeTicket.category)}</span>

                  {activeTicket.order && (
                    <Link
                      href={`/user-track?code=${activeTicket.order.trackingNumber}`}
                      className="support-thread__order-pill"
                      title="Track associated shipment"
                    >
                      <Package size={13} />
                      <span>Order #{activeTicket.order.trackingNumber}</span>
                      <ExternalLink size={11} />
                    </Link>
                  )}

                  {isAdmin && (
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      Customer: <strong>{activeTicket.user.name || activeTicket.user.email}</strong>
                    </span>
                  )}
                </div>

                {/* Admin Status & Priority Modifiers */}
                {isAdmin && (
                  <div className="support-thread__admin-bar">
                    <div className="support-thread__admin-label">
                      <ShieldCheck size={16} color="#2563eb" />
                      <span>Admin Management:</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                      <select
                        value={activeTicket.status}
                        onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                        className="support-thread__admin-select"
                        aria-label="Change Ticket Status"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>

                      <select
                        value={activeTicket.priority}
                        onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                        className="support-thread__admin-select"
                        aria-label="Change Ticket Priority"
                      >
                        <option value="LOW">Low Priority</option>
                        <option value="MEDIUM">Medium Priority</option>
                        <option value="HIGH">High Priority</option>
                        <option value="URGENT">Urgent Priority</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages Stream */}
              <div className="support-thread__messages">
                {activeTicket.messages.map((m) => {
                  const isStaff = m.isStaff;
                  return (
                    <div
                      key={m.id}
                      className={`support-msg ${
                        isStaff ? "support-msg--staff" : "support-msg--user"
                      }`}
                    >
                      <div
                        className={`support-msg__avatar ${
                          isStaff ? "support-msg__avatar--staff" : ""
                        }`}
                      >
                        {isStaff ? "DOPO" : (m.sender.name || "U").slice(0, 2).toUpperCase()}
                      </div>

                      <div className="support-msg__content-wrap">
                        <div className="support-msg__meta">
                          <span className="support-msg__sender">
                            {isStaff ? "DOPO Support Team" : m.sender.name || "Customer"}
                          </span>
                          {isStaff && (
                            <span className="support-msg__staff-badge">Staff</span>
                          )}
                          <span className="support-msg__time">
                            {formatTimeAgo(m.createdAt)}
                          </span>
                        </div>

                        <div className="support-msg__bubble">{m.message}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="support-thread__composer">
                {activeTicket.status === "CLOSED" ? (
                  <div className="support-thread__closed-notice">
                    This ticket is closed. Submit a new message below to reopen the inquiry or create a new ticket.
                  </div>
                ) : null}

                <form onSubmit={handleSendReply} className="support-thread__composer-form">
                  <textarea
                    placeholder="Type your response or update here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(e);
                      }
                    }}
                    rows={2}
                    className="support-thread__composer-textarea"
                    disabled={isSendingReply}
                  />

                  <button
                    type="submit"
                    disabled={isSendingReply || !replyText.trim()}
                    className="support-thread__composer-btn"
                  >
                    {isSendingReply ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <>
                        <span>Reply</span>
                        <Send size={15} />
                      </>
                    )}
                  </button>
                </form>

                {statusMessage && (
                  <div style={{ fontSize: "0.8rem", color: "#dc2626" }}>{statusMessage}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="support-empty" style={{ height: "100%" }}>
              <div className="support-empty__icon">
                <MessageSquare size={28} />
              </div>
              <div className="support-empty__title">Select a Ticket to View</div>
              <div className="support-empty__desc">
                Choose an inquiry from the left list or create a new ticket to communicate directly with our support team.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Creation Modal */}
      {isModalOpen && (
        <div className="support-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="support-modal" onClick={(e) => e.stopPropagation()}>
            <div className="support-modal__header">
              <h3 className="support-modal__title">
                <TicketIcon size={20} color="#2563eb" />
                Create New Support Ticket
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="support-modal__close-btn"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit}>
              <div className="support-modal__body">
                {ticketError && (
                  <div className="dopo-tracker__error-box" style={{ margin: 0 }}>
                    <AlertCircle size={18} />
                    <span>{ticketError}</span>
                  </div>
                )}

                {/* Subject */}
                <div className="support-modal__field">
                  <label className="support-modal__label">
                    Subject / Summary <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    required
                    placeholder="e.g. Question regarding delivery timing for DP-8A49K2X1"
                    className="support-modal__input"
                  />
                </div>

                <div className="support-modal__grid-2">
                  {/* Category */}
                  <div className="support-modal__field">
                    <label className="support-modal__label">Category</label>
                    <select name="category" className="support-modal__select" defaultValue="GENERAL">
                      <option value="GENERAL">General Support</option>
                      <option value="ORDER_INQUIRY">Order Inquiry</option>
                      <option value="DELIVERY_DELAY">Delivery Delay</option>
                      <option value="PAYMENT_ISSUE">Payment Issue</option>
                      <option value="COMPLAINT">Complaint</option>
                      <option value="TECHNICAL">Technical Issue</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="support-modal__field">
                    <label className="support-modal__label">Priority</label>
                    <select name="priority" className="support-modal__select" defaultValue="MEDIUM">
                      <option value="LOW">Low (General question)</option>
                      <option value="MEDIUM">Medium (Normal)</option>
                      <option value="HIGH">High (Urgent order update)</option>
                      <option value="URGENT">Urgent (Critical)</option>
                    </select>
                  </div>
                </div>

                {/* Optional Linked Order */}
                {userOrders.length > 0 && (
                  <div className="support-modal__field">
                    <label className="support-modal__label">Link to an Order (Optional)</label>
                    <select name="orderId" className="support-modal__select" defaultValue="none">
                      <option value="none">No order attached</option>
                      {userOrders.map((ord) => (
                        <option key={ord.id} value={ord.id}>
                          {ord.trackingNumber} — {ord.serviceType.replace("_", " ")} ({ord.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Description */}
                <div className="support-modal__field">
                  <label className="support-modal__label">
                    Detailed Description <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    placeholder="Please describe your issue, questions, or details as clearly as possible..."
                    className="support-modal__textarea"
                  />
                </div>
              </div>

              <div className="support-modal__footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="support-modal__cancel-btn"
                  disabled={isCreatingTicket}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="support-modal__submit-btn"
                  disabled={isCreatingTicket}
                >
                  {isCreatingTicket ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Ticket</span>
                      <ChevronRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
