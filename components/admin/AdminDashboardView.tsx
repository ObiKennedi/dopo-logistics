"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  ShoppingBag, 
  LifeBuoy, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  Truck,
  Filter
} from "lucide-react";
import { fetchUserDetailsAction, updateUserRoleAction } from "@/actions/adminActions";
import { updateOrderStatusAction } from "@/actions/orderActions";
import type { Role, OrderStatus } from "@prisma/client";
import "@/styles/admin/AdminDashboard.scss";

interface DashboardStats {
  totalUsers: number;
  roleCounts: { CUSTOMER: number; STAFF: number; ADMIN: number };
  totalOrders: number;
  orderStatusCounts: Record<string, number>;
  totalTickets: number;
  ticketStatusCounts: Record<string, number>;
  guestOrdersCount: number;
}

interface SerializedUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role;
  image: string | null;
  emailVerified: string | null;
  createdAt: string;
  ordersCount: number;
  ticketsCount: number;
}

interface SerializedOrder {
  id: string;
  trackingNumber: string;
  serviceType: string;
  status: OrderStatus;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  userId: string | null;
  pickupLocation: string | null;
  deliveryLocation: string | null;
  itemDetails: string | null;
  budget: string | null;
  createdAt: string;
  user?: { id: string; name: string | null; email: string } | null;
}

interface SerializedTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  order?: { trackingNumber: string } | null;
  lastMessage?: { message: string; createdAt: string; isStaff: boolean } | null;
}

interface AdminDashboardViewProps {
  initialData: {
    stats: DashboardStats;
    users: SerializedUser[];
    orders: SerializedOrder[];
    tickets: SerializedTicket[];
  };
  initialTab?: "users" | "orders" | "tickets";
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ initialData, initialTab = "users" }) => {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<"users" | "orders" | "tickets">(initialTab);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("ALL");
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>("ALL");

  // User 360° Drawer state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerUser, setDrawerUser] = useState<any | null>(null);
  const [drawerSubTab, setDrawerSubTab] = useState<"orders" | "tickets">("orders");
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("CUSTOMER");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Status update tracker
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Open User 360° Drawer
  const handleOpenUserDrawer = async (userId: string) => {
    setSelectedUserId(userId);
    setIsLoadingUser(true);
    setDrawerUser(null);

    const res = await fetchUserDetailsAction(userId);
    setIsLoadingUser(false);

    if (res.success && res.user) {
      setDrawerUser(res);
      setSelectedRole(res.user.role);
    } else {
      showNotification(res.error || "Failed to load user details.");
    }
  };

  // Update User Role
  const handleUpdateRole = async () => {
    if (!drawerUser?.user) return;
    setIsUpdatingRole(true);

    const res = await updateUserRoleAction(drawerUser.user.id, selectedRole);
    setIsUpdatingRole(false);

    if (res.success) {
      showNotification(res.message || "User role updated successfully.");
      // Update local state
      setDrawerUser((prev: any) => ({
        ...prev,
        user: { ...prev.user, role: selectedRole },
      }));
      setData((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === drawerUser.user.id ? { ...u, role: selectedRole } : u)),
      }));
    } else {
      showNotification(res.error || "Failed to update role.");
    }
  };

  // Update Order Status
  const handleOrderStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    const res = await updateOrderStatusAction(orderId, newStatus);
    setUpdatingOrderId(null);

    if (res.success) {
      showNotification(`Order status updated to ${newStatus}.`);
      // Update in data
      setData((prev) => ({
        ...prev,
        orders: prev.orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      }));
      // Update in drawer if open
      if (drawerUser?.orders) {
        setDrawerUser((prev: any) => ({
          ...prev,
          orders: prev.orders.map((o: any) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        }));
      }
    } else {
      showNotification(res.error || "Failed to update order status.");
    }
  };

  // ------------------------------------------------------------------------
  // Filtered Lists
  // ------------------------------------------------------------------------
  const filteredUsers = data.users.filter((user) => {
    const matchesSearch = 
      (user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone || "").includes(searchQuery);

    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredOrders = data.orders.filter((order) => {
    const matchesSearch = 
      order.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = orderStatusFilter === "ALL" || order.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTickets = data.tickets.filter((ticket) => {
    const matchesSearch = 
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = ticketStatusFilter === "ALL" || ticket.status === ticketStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-dash">
      {/* Toast Notice */}
      {actionNotice && (
        <div style={{
          position: "fixed",
          top: "1.5rem",
          right: "1.5rem",
          background: "#0a1854",
          color: "#ffffff",
          border: "1px solid #1e3a8a",
          padding: "0.85rem 1.25rem",
          borderRadius: "10px",
          boxShadow: "0 8px 30px rgba(10,24,84,0.25)",
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.875rem",
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 1. Header Bar */}
      <header className="admin-dash__header">
        <div className="admin-dash__title-group">
          <h1 className="admin-dash__title">
            <ShieldCheck size={28} color="#3b82f6" />
            Executive Administration
          </h1>
          <p className="admin-dash__subtitle">
            Centralized operations hub for user management, order dispatches, and customer inquiries.
          </p>
        </div>

        <div className="admin-dash__actions">
          <Link
            href="/admin/dashboard"
            className="admin-dash__refresh-btn"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={15} />
            <span>Refresh Overview</span>
          </Link>
        </div>
      </header>

      {/* 2. KPI Summary Grid */}
      <section className="admin-dash__kpi-grid">
        {/* Total Users */}
        <div className="admin-dash__kpi-card admin-dash__kpi-card--users">
          <div className="admin-dash__kpi-top">
            <span className="admin-dash__kpi-label">Registered Accounts</span>
            <div className="admin-dash__kpi-icon">
              <Users size={20} color="#3b82f6" />
            </div>
          </div>
          <div className="admin-dash__kpi-value">{data.stats.totalUsers}</div>
          <div className="admin-dash__kpi-breakdown">
            <span className="admin-dash__kpi-pill">
              {data.stats.roleCounts.CUSTOMER} Clients
            </span>
            <span className="admin-dash__kpi-pill">
              {data.stats.roleCounts.STAFF} Staff
            </span>
            <span className="admin-dash__kpi-pill">
              {data.stats.roleCounts.ADMIN} Admins
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="admin-dash__kpi-card admin-dash__kpi-card--orders">
          <div className="admin-dash__kpi-top">
            <span className="admin-dash__kpi-label">Total Shipments / Orders</span>
            <div className="admin-dash__kpi-icon">
              <ShoppingBag size={20} color="#10b981" />
            </div>
          </div>
          <div className="admin-dash__kpi-value">{data.stats.totalOrders}</div>
          <div className="admin-dash__kpi-breakdown">
            <span className="admin-dash__kpi-pill" style={{ color: "#d97706" }}>
              {data.stats.orderStatusCounts.PENDING || 0} Pending
            </span>
            <span className="admin-dash__kpi-pill" style={{ color: "#2563eb" }}>
              {data.stats.orderStatusCounts.IN_PROGRESS || 0} Ongoing
            </span>
            <span className="admin-dash__kpi-pill" style={{ color: "#059669" }}>
              {(data.stats.orderStatusCounts.DELIVERED || 0) + (data.stats.orderStatusCounts.COMPLETED || 0)} Done
            </span>
          </div>
        </div>

        {/* Support Tickets */}
        <div className="admin-dash__kpi-card admin-dash__kpi-card--tickets">
          <div className="admin-dash__kpi-top">
            <span className="admin-dash__kpi-label">Support Inquiries</span>
            <div className="admin-dash__kpi-icon">
              <LifeBuoy size={20} color="#f59e0b" />
            </div>
          </div>
          <div className="admin-dash__kpi-value">{data.stats.totalTickets}</div>
          <div className="admin-dash__kpi-breakdown">
            <span className="admin-dash__kpi-pill" style={{ color: "#d97706" }}>
              {data.stats.ticketStatusCounts.OPEN || 0} Open
            </span>
            <span className="admin-dash__kpi-pill" style={{ color: "#0284c7" }}>
              {data.stats.ticketStatusCounts.IN_PROGRESS || 0} In Progress
            </span>
            <span className="admin-dash__kpi-pill" style={{ color: "#059669" }}>
              {data.stats.ticketStatusCounts.RESOLVED || 0} Resolved
            </span>
          </div>
        </div>

        {/* Guest Requests */}
        <div className="admin-dash__kpi-card admin-dash__kpi-card--guests">
          <div className="admin-dash__kpi-top">
            <span className="admin-dash__kpi-label">Guest / Public Orders</span>
            <div className="admin-dash__kpi-icon">
              <Truck size={20} color="#ec4899" />
            </div>
          </div>
          <div className="admin-dash__kpi-value">{data.stats.guestOrdersCount}</div>
          <div className="admin-dash__kpi-breakdown">
            <span>Orders submitted without logging in</span>
          </div>
        </div>
      </section>

      {/* 3. Navigation Tabs */}
      <nav className="admin-dash__nav-tabs">
        <button
          type="button"
          onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
          className={`admin-dash__tab-btn ${activeTab === "users" ? "admin-dash__tab-btn--active" : ""}`}
        >
          <Users size={18} />
          <span>Users & Clients Directory</span>
          <span className="admin-dash__tab-count">{data.users.length}</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab("orders"); setSearchQuery(""); }}
          className={`admin-dash__tab-btn ${activeTab === "orders" ? "admin-dash__tab-btn--active" : ""}`}
        >
          <ShoppingBag size={18} />
          <span>All Platform Orders</span>
          <span className="admin-dash__tab-count">{data.orders.length}</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab("tickets"); setSearchQuery(""); }}
          className={`admin-dash__tab-btn ${activeTab === "tickets" ? "admin-dash__tab-btn--active" : ""}`}
        >
          <LifeBuoy size={18} />
          <span>Support Inquiries</span>
          <span className="admin-dash__tab-count">{data.tickets.length}</span>
        </button>
      </nav>

      {/* 4. Filter & Search Controls */}
      <div className="admin-dash__filter-row">
        <div className="admin-dash__search-wrap">
          <Search size={18} className="admin-dash__search-icon" />
          <input
            type="text"
            placeholder={
              activeTab === "users" 
                ? "Search users by name, email, or phone..." 
                : activeTab === "orders"
                ? "Search orders by code, customer, email..."
                : "Search tickets by #, subject, client..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-dash__search-input"
          />
        </div>

        <div className="admin-dash__filter-selects">
          {activeTab === "users" && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="admin-dash__select"
            >
              <option value="ALL">All Roles ({data.users.length})</option>
              <option value="CUSTOMER">Customers Only ({data.stats.roleCounts.CUSTOMER})</option>
              <option value="STAFF">Staff ({data.stats.roleCounts.STAFF})</option>
              <option value="ADMIN">Administrators ({data.stats.roleCounts.ADMIN})</option>
            </select>
          )}

          {activeTab === "orders" && (
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="admin-dash__select"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="DELIVERED">Delivered</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}

          {activeTab === "tickets" && (
            <select
              value={ticketStatusFilter}
              onChange={(e) => setTicketStatusFilter(e.target.value)}
              className="admin-dash__select"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_CUSTOMER">Waiting For Customer</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          )}
        </div>
      </div>

      {/* 5. Main Content Tabs */}

      {/* -------------------- TAB 1: USERS DIRECTORY -------------------- */}
      {activeTab === "users" && (
        <div className="admin-dash__table-card">
          <div className="admin-dash__table-scroll">
            <table className="admin-dash__table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Role</th>
                  <th>Contact Phone</th>
                  <th>Verified</th>
                  <th>Orders</th>
                  <th>Tickets</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
                      No registered users found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-dash__user-cell">
                          <div className="admin-dash__avatar">
                            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="admin-dash__user-meta">
                            <span className="admin-dash__user-name">{user.name || "Unnamed User"}</span>
                            <span className="admin-dash__user-email">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`admin-dash__role-badge admin-dash__role-badge--${user.role.toLowerCase()}`}>
                          {user.role === "ADMIN" && <Shield size={12} />}
                          {user.role}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.85rem", color: user.phone ? "#0f172a" : "#64748b" }}>
                          {user.phone || "Not provided"}
                        </span>
                      </td>

                      <td>
                        {user.emailVerified ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#059669", fontSize: "0.8rem", fontWeight: 600 }}>
                            <CheckCircle2 size={14} /> Verified
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#64748b", fontSize: "0.8rem" }}>
                            <Clock size={14} /> Unverified
                          </span>
                        )}
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, color: user.ordersCount > 0 ? "#1d4ed8" : "#64748b" }}>
                          {user.ordersCount}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, color: user.ticketsCount > 0 ? "#d97706" : "#64748b" }}>
                          {user.ticketsCount}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          {new Date(user.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() => handleOpenUserDrawer(user.id)}
                          className="admin-dash__view-btn"
                        >
                          <span>View Details</span>
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------- TAB 2: PLATFORM ORDERS -------------------- */}
      {activeTab === "orders" && (
        <div className="admin-dash__table-card">
          <div className="admin-dash__table-scroll">
            <table className="admin-dash__table">
              <thead>
                <tr>
                  <th>Tracking Code</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Route / Location</th>
                  <th>Status Stage</th>
                  <th>Date Placed</th>
                  <th>Track</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
                      No orders found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8", fontSize: "0.95rem" }}>
                            {order.trackingNumber}
                          </span>
                          {!order.userId && (
                            <span style={{ fontSize: "0.72rem", color: "#db2777", fontWeight: 600 }}>
                              Guest Request
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>{order.customerName}</span>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{order.customerEmail}</span>
                          {order.customerPhone && (
                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{order.customerPhone}</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.85rem", color: "#0f172a", fontWeight: 500 }}>
                          {order.serviceType.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {order.deliveryLocation || order.pickupLocation || order.itemDetails || "No address details"}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <select
                            value={order.status}
                            disabled={updatingOrderId === order.id}
                            onChange={(e) => handleOrderStatusChange(order.id, e.target.value as OrderStatus)}
                            className="admin-dash__select"
                            style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem" }}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="PICKED_UP">Picked Up</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      <td>
                        <Link
                          href={`/track?code=${order.trackingNumber}`}
                          target="_blank"
                          className="admin-dash__view-btn"
                          title="Open live tracking view"
                        >
                          <ExternalLink size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------- TAB 3: PLATFORM TICKETS -------------------- */}
      {activeTab === "tickets" && (
        <div className="admin-dash__table-card">
          <div className="admin-dash__table-scroll">
            <table className="admin-dash__table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>User / Client</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Manage</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
                      No support tickets found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#b45309" }}>
                          {ticket.ticketNumber}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>{ticket.user.name || "Client"}</span>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{ticket.user.email}</span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>
                          {ticket.subject}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          {ticket.category}
                        </span>
                      </td>

                      <td>
                        <span style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: ticket.priority === "URGENT" ? "#dc2626" : ticket.priority === "HIGH" ? "#d97706" : "#64748b"
                        }}>
                          {ticket.priority}
                        </span>
                      </td>

                      <td>
                        <span className={`admin-dash__status-badge admin-dash__status-badge--${ticket.status.toLowerCase().replace(/_/g, "-")}`}>
                          <span className="admin-dash__status-badge-dot" />
                          <span>{ticket.status.replace(/_/g, " ")}</span>
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          {new Date(ticket.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>

                      <td>
                        <Link
                          href="/support"
                          className="admin-dash__view-btn"
                        >
                          <span>Reply</span>
                          <ArrowUpRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------- 6. USER 360° SLIDE-OVER DRAWER -------------------- */}
      {selectedUserId && (
        <div className="admin-dash__drawer-backdrop" onClick={() => setSelectedUserId(null)}>
          <div className="admin-dash__drawer" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="admin-dash__drawer-header">
              <div className="admin-dash__drawer-profile">
                <div className="admin-dash__drawer-avatar">
                  {drawerUser?.user?.name
                    ? drawerUser.user.name.charAt(0).toUpperCase()
                    : drawerUser?.user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    {drawerUser?.user?.name || "Client Details"}
                  </h2>
                  <span style={{ fontSize: "0.825rem", color: "#64748b" }}>
                    {drawerUser?.user?.email}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="admin-dash__drawer-close"
                aria-label="Close Drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="admin-dash__drawer-body">
              {isLoadingUser ? (
                <div className="admin-dash__empty-state">
                  <Clock size={32} className="animate-spin" color="#3b82f6" />
                  <p>Loading full customer 360° history...</p>
                </div>
              ) : drawerUser ? (
                <>
                  {/* Profile Summary & Role Management Card */}
                  <div className="admin-dash__detail-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.85rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Account Profile & Role
                      </span>
                      <span className={`admin-dash__role-badge admin-dash__role-badge--${drawerUser.user.role.toLowerCase()}`}>
                        {drawerUser.user.role}
                      </span>
                    </div>

                    <div className="admin-dash__detail-grid">
                      <div className="admin-dash__detail-item">
                        <span className="admin-dash__detail-label">Phone Number</span>
                        <span className="admin-dash__detail-val">{drawerUser.user.phone || "Not linked"}</span>
                      </div>

                      <div className="admin-dash__detail-item">
                        <span className="admin-dash__detail-label">Email Verified</span>
                        <span className="admin-dash__detail-val">
                          {drawerUser.user.emailVerified ? "Yes (Verified)" : "No (Pending)"}
                        </span>
                      </div>

                      <div className="admin-dash__detail-item">
                        <span className="admin-dash__detail-label">Auth Provider(s)</span>
                        <span className="admin-dash__detail-val">
                          {drawerUser.user.providers?.length > 0 ? drawerUser.user.providers.join(", ") : "Credentials (Email/PW)"}
                        </span>
                      </div>

                      <div className="admin-dash__detail-item">
                        <span className="admin-dash__detail-label">Registered Since</span>
                        <span className="admin-dash__detail-val">
                          {new Date(drawerUser.user.createdAt).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Role Updater Form */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #e2e8f0" }}>
                      <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 600 }}>
                        Assign Role:
                      </span>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as Role)}
                        className="admin-dash__select"
                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.825rem" }}
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="STAFF">Staff Member</option>
                        <option value="ADMIN">System Administrator</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleUpdateRole}
                        disabled={isUpdatingRole || selectedRole === drawerUser.user.role}
                        className="admin-dash__view-btn"
                        style={{ background: "#2563eb", color: "#ffffff", borderColor: "#3b82f6" }}
                      >
                        {isUpdatingRole ? "Saving..." : "Update Role"}
                      </button>
                    </div>
                  </div>

                  {/* Sub-tabs: User's Orders vs User's Tickets */}
                  <div className="admin-dash__subtabs">
                    <button
                      type="button"
                      onClick={() => setDrawerSubTab("orders")}
                      className={`admin-dash__subtab-btn ${drawerSubTab === "orders" ? "admin-dash__subtab-btn--active" : ""}`}
                    >
                      Orders ({drawerUser.orders?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerSubTab("tickets")}
                      className={`admin-dash__subtab-btn ${drawerSubTab === "tickets" ? "admin-dash__subtab-btn--active" : ""}`}
                    >
                      Support Tickets ({drawerUser.tickets?.length || 0})
                    </button>
                  </div>

                  {/* Sub-tab 1: User's Orders List */}
                  {drawerSubTab === "orders" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                      {!drawerUser.orders || drawerUser.orders.length === 0 ? (
                        <div className="admin-dash__empty-state">
                          <ShoppingBag size={30} color="#475569" />
                          <p>This user has not placed any shipment or errand requests yet.</p>
                        </div>
                      ) : (
                        drawerUser.orders.map((order: any) => (
                          <div
                            key={order.id}
                            style={{
                              background: "#ffffff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "12px",
                              padding: "1rem 1.2rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.75rem",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8" }}>
                                {order.trackingNumber}
                              </span>
                              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                {new Date(order.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })}
                              </span>
                            </div>

                            <div style={{ fontSize: "0.85rem", color: "#0f172a" }}>
                              <strong>Service:</strong> {order.serviceType.replace(/_/g, " ")}
                            </div>

                            {(order.pickupLocation || order.deliveryLocation) && (
                              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                📍 {order.pickupLocation || "N/A"} → {order.deliveryLocation || "N/A"}
                              </div>
                            )}

                            {order.itemDetails && (
                              <div style={{ fontSize: "0.8rem", color: "#334155" }}>
                                📦 {order.itemDetails}
                              </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid #f1f5f9" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Stage:</span>
                                <select
                                  value={order.status}
                                  onChange={(e) => handleOrderStatusChange(order.id, e.target.value as OrderStatus)}
                                  className="admin-dash__select"
                                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                >
                                  <option value="PENDING">Pending</option>
                                  <option value="CONFIRMED">Confirmed</option>
                                  <option value="IN_PROGRESS">In Progress</option>
                                  <option value="PICKED_UP">Picked Up</option>
                                  <option value="DELIVERED">Delivered</option>
                                  <option value="COMPLETED">Completed</option>
                                  <option value="CANCELLED">Cancelled</option>
                                </select>
                              </div>

                              <Link
                                href={`/track?code=${order.trackingNumber}`}
                                target="_blank"
                                className="admin-dash__view-btn"
                                style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                              >
                                <span>Track</span>
                                <ExternalLink size={12} />
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Sub-tab 2: User's Support Tickets List */}
                  {drawerSubTab === "tickets" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                      {!drawerUser.tickets || drawerUser.tickets.length === 0 ? (
                        <div className="admin-dash__empty-state">
                          <LifeBuoy size={30} color="#475569" />
                          <p>No support tickets have been opened by this customer.</p>
                        </div>
                      ) : (
                        drawerUser.tickets.map((ticket: any) => (
                          <div
                            key={ticket.id}
                            style={{
                              background: "#ffffff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "12px",
                              padding: "1rem 1.2rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.5rem",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#b45309" }}>
                                {ticket.ticketNumber}
                              </span>
                              <span className={`admin-dash__status-badge admin-dash__status-badge--${ticket.status.toLowerCase().replace(/_/g, "-")}`}>
                                {ticket.status.replace(/_/g, " ")}
                              </span>
                            </div>

                            <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.9rem" }}>
                              {ticket.subject}
                            </div>

                            <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: "#64748b" }}>
                              <span>Category: <strong>{ticket.category}</strong></span>
                              <span>Priority: <strong>{ticket.priority}</strong></span>
                            </div>

                            {ticket.order?.trackingNumber && (
                              <div style={{ fontSize: "0.75rem", color: "#1d4ed8" }}>
                                Linked Order: #{ticket.order.trackingNumber}
                              </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.5rem", borderTop: "1px solid #f1f5f9" }}>
                              <Link
                                href="/support"
                                className="admin-dash__view-btn"
                                style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                              >
                                <span>Go to Support Thread</span>
                                <ArrowUpRight size={12} />
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
