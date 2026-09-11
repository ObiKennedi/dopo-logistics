"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  X,
  RefreshCw,
  Truck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare
} from "lucide-react";
import { updateOrderStatusAction } from "@/actions/orderActions";
import type { OrderStatus, ServiceType, Role } from "@prisma/client";
import "@/styles/admin/AdminOrders.scss";

export interface SerializedOrder {
  id: string;
  trackingNumber: string;
  serviceType: ServiceType;
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
  hotelCity: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  additionalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    role: Role;
  } | null;
  tickets?: {
    id: string;
    ticketNumber: string;
    status: string;
  }[];
}

interface OrdersStats {
  total: number;
  statusCounts: Record<string, number>;
  guestOrdersCount: number;
  registeredOrdersCount: number;
}

interface AdminOrdersViewProps {
  initialOrders: SerializedOrder[];
  initialStats: OrdersStats;
}

type SortKey = "status" | "date" | "customer" | "trackingNumber";
type SortOrder = "asc" | "desc";

// Lifecycle weighting for natural status sorting
const STATUS_WEIGHT: Record<OrderStatus, number> = {
  PENDING: 1,
  CONFIRMED: 2,
  IN_PROGRESS: 3,
  PICKED_UP: 4,
  DELIVERED: 5,
  COMPLETED: 6,
  CANCELLED: 7,
};

export const AdminOrdersView: React.FC<AdminOrdersViewProps> = ({
  initialOrders,
  initialStats,
}) => {
  const [orders, setOrders] = useState<SerializedOrder[]>(initialOrders);
  const [stats, setStats] = useState<OrdersStats>(initialStats);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatusTab, setActiveStatusTab] = useState<string>("ALL");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("ALL");

  // Sorting States
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // UI States
  const [selectedOrder, setSelectedOrder] = useState<SerializedOrder | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Toggle sorting on column headers
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder(key === "date" ? "desc" : "asc");
    }
    setCurrentPage(1);
  };

  // Update order status action handler
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status === newStatus) return;

    const oldStatus = targetOrder.status;
    setUpdatingOrderId(orderId);

    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    // Update stats count optimistically
    setStats((prev) => {
      const newCounts = { ...prev.statusCounts };
      if (newCounts[oldStatus] !== undefined && newCounts[oldStatus] > 0) {
        newCounts[oldStatus]--;
      }
      if (newCounts[newStatus] !== undefined) {
        newCounts[newStatus]++;
      }
      return { ...prev, statusCounts: newCounts };
    });

    const res = await updateOrderStatusAction(orderId, newStatus);
    setUpdatingOrderId(null);

    if (res.success) {
      showNotification(`Order #${targetOrder.trackingNumber} updated to ${newStatus}.`);
    } else {
      // Revert if error
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: oldStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: oldStatus } : null));
      }
      setStats((prev) => {
        const newCounts = { ...prev.statusCounts };
        if (newCounts[newStatus] !== undefined && newCounts[newStatus] > 0) {
          newCounts[newStatus]--;
        }
        if (newCounts[oldStatus] !== undefined) {
          newCounts[oldStatus]++;
        }
        return { ...prev, statusCounts: newCounts };
      });
      showNotification(res.error || "Failed to update order status.");
    }
  };

  // ------------------------------------------------------------------------
  // Filter & Sort Pipeline
  // ------------------------------------------------------------------------
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.trackingNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          (o.customerPhone && o.customerPhone.includes(q)) ||
          (o.deliveryLocation && o.deliveryLocation.toLowerCase().includes(q)) ||
          (o.pickupLocation && o.pickupLocation.toLowerCase().includes(q)) ||
          o.serviceType.toLowerCase().includes(q)
      );
    }

    // 2. Status tab filter
    if (activeStatusTab !== "ALL") {
      result = result.filter((o) => o.status === activeStatusTab);
    }

    // 3. Service type filter
    if (serviceFilter !== "ALL") {
      result = result.filter((o) => o.serviceType === serviceFilter);
    }

    // 4. Client type filter
    if (clientTypeFilter === "REGISTERED") {
      result = result.filter((o) => !!o.userId);
    } else if (clientTypeFilter === "GUEST") {
      result = result.filter((o) => !o.userId);
    }

    // 5. Sorting
    result.sort((a, b) => {
      let comparison = 0;

      if (sortKey === "status") {
        const weightA = STATUS_WEIGHT[a.status] || 99;
        const weightB = STATUS_WEIGHT[b.status] || 99;
        comparison = weightA - weightB;
      } else if (sortKey === "date") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortKey === "customer") {
        comparison = a.customerName.localeCompare(b.customerName);
      } else if (sortKey === "trackingNumber") {
        comparison = a.trackingNumber.localeCompare(b.trackingNumber);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [orders, searchQuery, activeStatusTab, serviceFilter, clientTypeFilter, sortKey, sortOrder]);

  // Pagination calculation
  const totalItems = filteredAndSortedOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedOrders = filteredAndSortedOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statusTabOptions: { label: string; value: string; count: number }[] = [
    { label: "All Orders", value: "ALL", count: stats.total },
    { label: "Pending", value: "PENDING", count: stats.statusCounts.PENDING || 0 },
    { label: "Confirmed", value: "CONFIRMED", count: stats.statusCounts.CONFIRMED || 0 },
    { label: "In Progress", value: "IN_PROGRESS", count: stats.statusCounts.IN_PROGRESS || 0 },
    { label: "Picked Up", value: "PICKED_UP", count: stats.statusCounts.PICKED_UP || 0 },
    { label: "Delivered", value: "DELIVERED", count: stats.statusCounts.DELIVERED || 0 },
    { label: "Completed", value: "COMPLETED", count: stats.statusCounts.COMPLETED || 0 },
    { label: "Cancelled", value: "CANCELLED", count: stats.statusCounts.CANCELLED || 0 },
  ];

  return (
    <div className="admin-orders">
      {/* Toast Notification */}
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
      <header className="admin-orders__header">
        <div className="admin-orders__title-group">
          <h1 className="admin-orders__title">
            <ShoppingBag size={28} color="#2563eb" />
            Platform Orders & Shipments
          </h1>
          <p className="admin-orders__subtitle">
            Manage dispatches, monitor fulfillment progress, and update real-time shipment stages.
          </p>
        </div>

        <div className="admin-orders__actions">
          <button
            type="button"
            className="admin-orders__refresh-btn"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={15} />
            <span>Refresh Orders</span>
          </button>
        </div>
      </header>

      {/* 2. KPI Stat Cards */}
      <section className="admin-orders__stats-grid">
        <div className="admin-orders__stat-card admin-orders__stat-card--total">
          <div className="admin-orders__stat-top">
            <span className="admin-orders__stat-label">Total Shipments</span>
            <div className="admin-orders__stat-icon">
              <ShoppingBag size={20} color="#2563eb" />
            </div>
          </div>
          <div className="admin-orders__stat-value">{stats.total}</div>
          <div className="admin-orders__stat-meta">
            <span>{stats.registeredOrdersCount} Client</span> • <span>{stats.guestOrdersCount} Guest</span>
          </div>
        </div>

        <div className="admin-orders__stat-card admin-orders__stat-card--pending">
          <div className="admin-orders__stat-top">
            <span className="admin-orders__stat-label">Awaiting Confirmation</span>
            <div className="admin-orders__stat-icon">
              <Clock size={20} color="#d97706" />
            </div>
          </div>
          <div className="admin-orders__stat-value">{stats.statusCounts.PENDING || 0}</div>
          <div className="admin-orders__stat-meta" style={{ color: "#d97706" }}>
            Needs staff assignment
          </div>
        </div>

        <div className="admin-orders__stat-card admin-orders__stat-card--ongoing">
          <div className="admin-orders__stat-top">
            <span className="admin-orders__stat-label">Active / In Transit</span>
            <div className="admin-orders__stat-icon">
              <Truck size={20} color="#0284c7" />
            </div>
          </div>
          <div className="admin-orders__stat-value">
            {(stats.statusCounts.CONFIRMED || 0) +
              (stats.statusCounts.IN_PROGRESS || 0) +
              (stats.statusCounts.PICKED_UP || 0)}
          </div>
          <div className="admin-orders__stat-meta">Dispatched or in delivery</div>
        </div>

        <div className="admin-orders__stat-card admin-orders__stat-card--completed">
          <div className="admin-orders__stat-top">
            <span className="admin-orders__stat-label">Delivered & Fulfilled</span>
            <div className="admin-orders__stat-icon">
              <CheckCircle2 size={20} color="#059669" />
            </div>
          </div>
          <div className="admin-orders__stat-value">
            {(stats.statusCounts.DELIVERED || 0) + (stats.statusCounts.COMPLETED || 0)}
          </div>
          <div className="admin-orders__stat-meta" style={{ color: "#059669" }}>
            Successfully concluded
          </div>
        </div>
      </section>

      {/* 3. Status Tabs / Pills */}
      <nav className="admin-orders__status-tabs" aria-label="Filter orders by status">
        {statusTabOptions.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setActiveStatusTab(tab.value);
              setCurrentPage(1);
            }}
            className={`admin-orders__tab-pill ${
              activeStatusTab === tab.value ? "admin-orders__tab-pill--active" : ""
            }`}
          >
            <span>{tab.label}</span>
            <span className="admin-orders__tab-count">{tab.count}</span>
          </button>
        ))}
      </nav>

      {/* 4. Controls: Search, Multi-Filter, Quick Sort */}
      <div className="admin-orders__controls-card">
        <div className="admin-orders__search-wrap">
          <Search size={18} className="admin-orders__search-icon" />
          <input
            type="text"
            placeholder="Search code, customer name, email, phone, location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-orders__search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="admin-orders__search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear Search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="admin-orders__filter-group">
          {/* Service Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => {
              setServiceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-orders__select"
            aria-label="Filter by service"
          >
            <option value="ALL">All Services</option>
            <option value="DELIVERY_SERVICES">Delivery Services</option>
            <option value="ERRAND_RUNNING">Errand Running</option>
            <option value="SHOPPING_ASSISTANCE">Shopping Assistance</option>
            <option value="PROCUREMENT">Procurement</option>
            <option value="PRICE_CHECK">Price Check</option>
            <option value="HOTEL_RESERVATION">Hotel Reservation</option>
          </select>

          {/* Client Type Filter */}
          <select
            value={clientTypeFilter}
            onChange={(e) => {
              setClientTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-orders__select"
            aria-label="Filter by client type"
          >
            <option value="ALL">All Clients</option>
            <option value="REGISTERED">Registered Users</option>
            <option value="GUEST">Guest Orders</option>
          </select>

          {/* Quick Sort by Status Button */}
          <button
            type="button"
            onClick={() => handleSort("status")}
            className={`admin-orders__sort-btn ${
              sortKey === "status" ? "admin-orders__sort-btn--active" : ""
            }`}
            title="Sort orders by their fulfillment status"
          >
            <Filter size={15} />
            <span>Sort by Status</span>
            {sortKey === "status" && (
              sortOrder === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />
            )}
          </button>
        </div>
      </div>

      {/* 5. Orders Table */}
      <div className="admin-orders__table-card">
        <div className="admin-orders__table-scroll">
          <table className="admin-orders__table">
            <thead>
              <tr>
                <th
                  className="sortable"
                  onClick={() => handleSort("trackingNumber")}
                  title="Sort by tracking code"
                >
                  <div className="admin-orders__th-content">
                    <span>Tracking Code</span>
                    <span
                      className={`admin-orders__sort-indicator ${
                        sortKey === "trackingNumber" ? "admin-orders__sort-indicator--active" : ""
                      }`}
                    >
                      {sortKey === "trackingNumber" ? (
                        sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={13} />
                      )}
                    </span>
                  </div>
                </th>

                <th
                  className="sortable"
                  onClick={() => handleSort("customer")}
                  title="Sort by customer name"
                >
                  <div className="admin-orders__th-content">
                    <span>Customer Details</span>
                    <span
                      className={`admin-orders__sort-indicator ${
                        sortKey === "customer" ? "admin-orders__sort-indicator--active" : ""
                      }`}
                    >
                      {sortKey === "customer" ? (
                        sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={13} />
                      )}
                    </span>
                  </div>
                </th>

                <th>Service Type</th>

                <th>Destination / Route</th>

                <th
                  className="sortable"
                  onClick={() => handleSort("status")}
                  title="Sort by lifecycle status (Pending -> Delivered)"
                >
                  <div className="admin-orders__th-content">
                    <span>Status Stage</span>
                    <span
                      className={`admin-orders__sort-indicator ${
                        sortKey === "status" ? "admin-orders__sort-indicator--active" : ""
                      }`}
                    >
                      {sortKey === "status" ? (
                        sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={13} />
                      )}
                    </span>
                  </div>
                </th>

                <th
                  className="sortable"
                  onClick={() => handleSort("date")}
                  title="Sort by creation date"
                >
                  <div className="admin-orders__th-content">
                    <span>Date Placed</span>
                    <span
                      className={`admin-orders__sort-indicator ${
                        sortKey === "date" ? "admin-orders__sort-indicator--active" : ""
                      }`}
                    >
                      {sortKey === "date" ? (
                        sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={13} />
                      )}
                    </span>
                  </div>
                </th>

                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-orders__empty-row">
                    <div className="admin-orders__empty-state">
                      <ShoppingBag size={36} color="#94a3b8" />
                      <p>No orders found matching your search or active filter criteria.</p>
                      {(searchQuery || activeStatusTab !== "ALL" || serviceFilter !== "ALL" || clientTypeFilter !== "ALL") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setActiveStatusTab("ALL");
                            setServiceFilter("ALL");
                            setClientTypeFilter("ALL");
                          }}
                          className="admin-orders__sort-btn"
                          style={{ marginTop: "0.5rem" }}
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isUpdating = updatingOrderId === order.id;

                  return (
                    <tr key={order.id}>
                      {/* 1. Tracking Number */}
                      <td>
                        <div className="admin-orders__tracking-cell">
                          <div className="admin-orders__tracking-number-row">
                            <span className="admin-orders__tracking-code">
                              {order.trackingNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(order.trackingNumber)}
                              className="admin-orders__copy-btn"
                              title="Copy tracking number"
                              aria-label="Copy tracking number"
                            >
                              {copiedCode === order.trackingNumber ? (
                                <Check size={13} color="#10b981" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                          {!order.userId ? (
                            <span className="admin-orders__guest-badge">Guest Request</span>
                          ) : (
                            <span className="admin-orders__registered-badge">Client</span>
                          )}
                        </div>
                      </td>

                      {/* 2. Customer Details */}
                      <td>
                        <div className="admin-orders__customer-cell">
                          <span className="admin-orders__customer-name">
                            {order.customerName}
                          </span>
                          <span className="admin-orders__customer-email">
                            {order.customerEmail}
                          </span>
                          {order.customerPhone && (
                            <span className="admin-orders__customer-phone">
                              <Phone size={12} />
                              {order.customerPhone}
                              <a
                                href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-orders__whatsapp-link"
                                title="Open WhatsApp Chat"
                              >
                                (WA)
                              </a>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Service Type */}
                      <td>
                        <span className="admin-orders__service-pill">
                          {order.serviceType.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* 4. Route / Location */}
                      <td>
                        <div
                          style={{
                            maxWidth: "220px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontSize: "0.825rem",
                            color: "#64748b",
                          }}
                          title={order.deliveryLocation || order.pickupLocation || order.itemDetails || "No address provided"}
                        >
                          {order.deliveryLocation ||
                            order.pickupLocation ||
                            order.itemDetails ||
                            (order.hotelCity ? `Hotel in ${order.hotelCity}` : "No address specified")}
                        </div>
                      </td>

                      {/* 5. Status Stage (Admin update dropdown) */}
                      <td>
                        <div className="admin-orders__status-select-wrap">
                          <select
                            value={order.status}
                            disabled={isUpdating}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value as OrderStatus)
                            }
                            className={`admin-orders__status-select admin-orders__status-select--${order.status.toLowerCase()}`}
                            aria-label={`Update status for ${order.trackingNumber}`}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="PICKED_UP">Picked Up</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>

                          {isUpdating && (
                            <RefreshCw size={14} className="admin-orders__status-spinner" />
                          )}
                        </div>
                      </td>

                      {/* 6. Date Placed */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <span style={{ fontSize: "0.825rem", color: "#0f172a", fontWeight: 500 }}>
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* 7. Action Buttons */}
                      <td>
                        <div
                          className="admin-orders__action-group"
                          style={{ justifyContent: "flex-end" }}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="admin-orders__details-btn"
                            title="View full order dossier"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>

                          <Link
                            href={`/track?code=${order.trackingNumber}`}
                            target="_blank"
                            className="admin-orders__icon-btn"
                            title="Open live public tracking view"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        {totalItems > 0 && (
          <div className="admin-orders__table-footer">
            <div className="admin-orders__footer-text">
              Showing <strong>{Math.min(totalItems, (currentPage - 1) * pageSize + 1)}</strong> to{" "}
              <strong>{Math.min(totalItems, currentPage * pageSize)}</strong> of{" "}
              <strong>{totalItems}</strong> orders
            </div>

            <div className="admin-orders__pagination-group">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="admin-orders__select"
                style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem" }}
              >
                <option value={10}>10 per page</option>
                <option value={15}>15 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>

              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="admin-orders__page-btn"
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              <span style={{ fontSize: "0.825rem", color: "#475569", fontWeight: 600 }}>
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="admin-orders__page-btn"
                aria-label="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Slide-Over Order Dossier Drawer */}
      {selectedOrder && (
        <div
          className="admin-orders__drawer-backdrop"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="admin-orders__drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="admin-orders__drawer-header">
              <div className="admin-orders__drawer-title-group">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="admin-orders__drawer-tracking">
                    #{selectedOrder.trackingNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedOrder.trackingNumber)}
                    className="admin-orders__copy-btn"
                    title="Copy tracking code"
                  >
                    {copiedCode === selectedOrder.trackingNumber ? (
                      <Check size={14} color="#10b981" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
                <span style={{ fontSize: "0.825rem", color: "#64748b" }}>
                  {selectedOrder.serviceType.replace(/_/g, " ")} • Placed on{" "}
                  {new Date(selectedOrder.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="admin-orders__drawer-close"
                aria-label="Close Drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="admin-orders__drawer-body">
              {/* Status Update Banner */}
              <div className="admin-orders__drawer-status-box">
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "#1d4ed8",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Order Status Management
                </span>

                <div className="admin-orders__drawer-status-controls">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) =>
                      handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)
                    }
                    className={`admin-orders__status-select admin-orders__status-select--${selectedOrder.status.toLowerCase()}`}
                    style={{ flex: 1, padding: "0.6rem 0.9rem", fontSize: "0.875rem" }}
                  >
                    <option value="PENDING">Pending Confirmation</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="PICKED_UP">Picked Up</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>

                  <Link
                    href={`/track?code=${selectedOrder.trackingNumber}`}
                    target="_blank"
                    className="admin-orders__sort-btn"
                    title="View live tracking page"
                  >
                    <ExternalLink size={14} />
                    <span>Track</span>
                  </Link>
                </div>
              </div>

              {/* Customer Information Card */}
              <div className="admin-orders__detail-card">
                <span className="admin-orders__detail-card-title">Customer Dossier</span>

                <div className="admin-orders__detail-grid">
                  <div className="admin-orders__detail-item">
                    <span className="admin-orders__detail-label">Full Name</span>
                    <span className="admin-orders__detail-val">{selectedOrder.customerName}</span>
                  </div>

                  <div className="admin-orders__detail-item">
                    <span className="admin-orders__detail-label">Email Address</span>
                    <span className="admin-orders__detail-val">{selectedOrder.customerEmail}</span>
                  </div>

                  <div className="admin-orders__detail-item">
                    <span className="admin-orders__detail-label">Phone Contact</span>
                    <span className="admin-orders__detail-val">
                      {selectedOrder.customerPhone || "Not provided"}
                    </span>
                  </div>

                  <div className="admin-orders__detail-item">
                    <span className="admin-orders__detail-label">Account Association</span>
                    <span className="admin-orders__detail-val">
                      {selectedOrder.userId ? (
                        <span style={{ color: "#0284c7", fontWeight: 600 }}>
                          Registered Account
                        </span>
                      ) : (
                        <span style={{ color: "#db2777", fontWeight: 600 }}>Guest User</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logistics & Route Details */}
              <div className="admin-orders__detail-card">
                <span className="admin-orders__detail-card-title">Logistics & Route</span>

                <div className="admin-orders__detail-grid">
                  <div className="admin-orders__detail-item">
                    <span className="admin-orders__detail-label">Pickup Location</span>
                    <span className="admin-orders__detail-val">
                      {selectedOrder.pickupLocation || "N/A"}
                    </span>
                  </div>

                  <div className="admin-orders__detail-item">
                    <span className="admin-orders__detail-label">Delivery Destination</span>
                    <span className="admin-orders__detail-val">
                      {selectedOrder.deliveryLocation || "N/A"}
                    </span>
                  </div>

                  {selectedOrder.hotelCity && (
                    <>
                      <div className="admin-orders__detail-item">
                        <span className="admin-orders__detail-label">Hotel City</span>
                        <span className="admin-orders__detail-val">
                          {selectedOrder.hotelCity}
                        </span>
                      </div>
                      <div className="admin-orders__detail-item">
                        <span className="admin-orders__detail-label">Stay Dates</span>
                        <span className="admin-orders__detail-val">
                          {selectedOrder.checkInDate || "N/A"} to{" "}
                          {selectedOrder.checkOutDate || "N/A"}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="admin-orders__detail-item">
                    <span className="admin-orders__detail-label">Estimated Budget</span>
                    <span className="admin-orders__detail-val">
                      {selectedOrder.budget || "Not specified"}
                    </span>
                  </div>

                  <div className="admin-orders__detail-item">
                    <span className="admin-orders__detail-label">Payment Status</span>
                    <span className="admin-orders__detail-val" style={{ textTransform: "uppercase" }}>
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>

                {selectedOrder.itemDetails && (
                  <div className="admin-orders__detail-item" style={{ marginTop: "0.5rem" }}>
                    <span className="admin-orders__detail-label">Item / Errand Specifications</span>
                    <p
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "0.75rem 1rem",
                        fontSize: "0.85rem",
                        color: "#334155",
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {selectedOrder.itemDetails}
                    </p>
                  </div>
                )}

                {selectedOrder.additionalNotes && (
                  <div className="admin-orders__detail-item" style={{ marginTop: "0.5rem" }}>
                    <span className="admin-orders__detail-label">Additional Instructions</span>
                    <p
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "0.75rem 1rem",
                        fontSize: "0.85rem",
                        color: "#64748b",
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {selectedOrder.additionalNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Linked Support Tickets */}
              {selectedOrder.tickets && selectedOrder.tickets.length > 0 && (
                <div className="admin-orders__detail-card">
                  <span className="admin-orders__detail-card-title">
                    Linked Support Tickets ({selectedOrder.tickets.length})
                  </span>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {selectedOrder.tickets.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          padding: "0.6rem 0.85rem",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: "#b45309",
                            fontSize: "0.85rem",
                          }}
                        >
                          #{t.ticketNumber}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
