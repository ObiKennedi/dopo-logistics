"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Package, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  PlusCircle, 
  Truck, 
  ShoppingBag, 
  SearchCheck, 
  Hotel, 
  Clock, 
  CheckCircle2, 
  RotateCcw,
  ArrowRight
} from "lucide-react";
import LinkButton from "@/components/essentials/LinkButton";
import type { Order, OrderStatus, ServiceType } from "@prisma/client";
import "@/styles/user/OrdersTable.scss";

interface OrdersTableProps {
  orders: Order[];
  userName?: string | null;
}

const formatServiceLabel = (service: ServiceType | string) => {
  switch (service) {
    case "ERRAND_RUNNING":
    case "Errand Running":
      return "Errand Running";
    case "DELIVERY_SERVICES":
    case "Delivery Services":
      return "Delivery Services";
    case "SHOPPING_ASSISTANCE":
    case "Shopping Assistance":
      return "Shopping Assistance";
    case "PROCUREMENT":
    case "Procurement":
      return "Procurement";
    case "PRICE_CHECK":
    case "Price Check & Market Survey":
      return "Price Check";
    case "HOTEL_RESERVATION":
    case "Hotel Search & Reservation":
      return "Hotel Reservation";
    default:
      return service;
  }
};

const getServiceClass = (service: ServiceType | string) => {
  switch (service) {
    case "DELIVERY_SERVICES":
    case "Delivery Services":
      return "orders-dashboard__service-badge--delivery";
    case "ERRAND_RUNNING":
    case "Errand Running":
      return "orders-dashboard__service-badge--errand";
    case "SHOPPING_ASSISTANCE":
    case "Shopping Assistance":
      return "orders-dashboard__service-badge--shopping";
    case "PROCUREMENT":
    case "Procurement":
      return "orders-dashboard__service-badge--procurement";
    case "PRICE_CHECK":
    case "Price Check & Market Survey":
      return "orders-dashboard__service-badge--price-check";
    case "HOTEL_RESERVATION":
    case "Hotel Search & Reservation":
      return "orders-dashboard__service-badge--hotel";
    default:
      return "";
  }
};

const getServiceIcon = (service: ServiceType | string) => {
  switch (service) {
    case "DELIVERY_SERVICES":
    case "Delivery Services":
      return <Truck size={14} />;
    case "ERRAND_RUNNING":
    case "Errand Running":
      return <Package size={14} />;
    case "SHOPPING_ASSISTANCE":
    case "Shopping Assistance":
    case "PROCUREMENT":
    case "Procurement":
      return <ShoppingBag size={14} />;
    case "PRICE_CHECK":
    case "Price Check & Market Survey":
      return <SearchCheck size={14} />;
    case "HOTEL_RESERVATION":
    case "Hotel Search & Reservation":
      return <Hotel size={14} />;
    default:
      return <Package size={14} />;
  }
};

const formatStatusLabel = (status: OrderStatus | string) => {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "CONFIRMED":
      return "Confirmed";
    case "IN_PROGRESS":
      return "In Progress";
    case "PICKED_UP":
      return "Picked Up";
    case "DELIVERED":
      return "Delivered";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
};

const getStatusClass = (status: OrderStatus | string) => {
  switch (status) {
    case "PENDING":
      return "orders-dashboard__status-pill--pending";
    case "CONFIRMED":
      return "orders-dashboard__status-pill--confirmed";
    case "IN_PROGRESS":
      return "orders-dashboard__status-pill--in-progress";
    case "PICKED_UP":
      return "orders-dashboard__status-pill--picked-up";
    case "DELIVERED":
      return "orders-dashboard__status-pill--delivered";
    case "COMPLETED":
      return "orders-dashboard__status-pill--completed";
    case "CANCELLED":
      return "orders-dashboard__status-pill--cancelled";
    default:
      return "";
  }
};

export const OrdersTable: React.FC<OrdersTableProps> = ({ orders, userName }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = orders.length;
    const active = orders.filter(
      (o) => o.status === "IN_PROGRESS" || o.status === "PICKED_UP" || o.status === "CONFIRMED"
    ).length;
    const completed = orders.filter(
      (o) => o.status === "DELIVERED" || o.status === "COMPLETED"
    ).length;
    const pending = orders.filter((o) => o.status === "PENDING").length;

    return { total, active, completed, pending };
  }, [orders]);

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (statusFilter !== "ALL" && order.status !== statusFilter) {
        return false;
      }

      // 2. Service Filter
      if (serviceFilter !== "ALL" && order.serviceType !== serviceFilter) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const tracking = order.trackingNumber.toLowerCase();
        const details = (order.itemDetails || "").toLowerCase();
        const pickup = (order.pickupLocation || "").toLowerCase();
        const delivery = (order.deliveryLocation || "").toLowerCase();
        const hotel = (order.hotelCity || "").toLowerCase();
        const serviceName = formatServiceLabel(order.serviceType).toLowerCase();

        return (
          tracking.includes(query) ||
          details.includes(query) ||
          pickup.includes(query) ||
          delivery.includes(query) ||
          hotel.includes(query) ||
          serviceName.includes(query)
        );
      }

      return true;
    });
  }, [orders, statusFilter, serviceFilter, searchQuery]);

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "ALL" || serviceFilter !== "ALL";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setServiceFilter("ALL");
  };

  return (
    <div className="orders-dashboard">
      {/* Header */}
      <div className="orders-dashboard__header">
        <div>
          <h1 className="orders-dashboard__welcome-title">
            Welcome back{userName ? `, ${userName}` : ""}
          </h1>
          <p className="orders-dashboard__welcome-subtitle">
            Manage, track, and monitor all your errand and delivery orders in one place.
          </p>
        </div>
        <LinkButton href="/request" className="orders-dashboard__new-btn">
          <PlusCircle size={18} />
          Place New Request
        </LinkButton>
      </div>

      {/* Metrics Cards */}
      <div className="orders-dashboard__metrics">
        <div className="orders-dashboard__metric-card orders-dashboard__metric-card--all">
          <div className="orders-dashboard__metric-icon">
            <Package size={22} />
          </div>
          <div className="orders-dashboard__metric-info">
            <span className="orders-dashboard__metric-value">{metrics.total}</span>
            <span className="orders-dashboard__metric-label">Total Orders</span>
          </div>
        </div>

        <div className="orders-dashboard__metric-card orders-dashboard__metric-card--active">
          <div className="orders-dashboard__metric-icon">
            <Truck size={22} />
          </div>
          <div className="orders-dashboard__metric-info">
            <span className="orders-dashboard__metric-value">{metrics.active}</span>
            <span className="orders-dashboard__metric-label">In Progress</span>
          </div>
        </div>

        <div className="orders-dashboard__metric-card orders-dashboard__metric-card--completed">
          <div className="orders-dashboard__metric-icon">
            <CheckCircle2 size={22} />
          </div>
          <div className="orders-dashboard__metric-info">
            <span className="orders-dashboard__metric-value">{metrics.completed}</span>
            <span className="orders-dashboard__metric-label">Completed</span>
          </div>
        </div>

        <div className="orders-dashboard__metric-card orders-dashboard__metric-card--pending">
          <div className="orders-dashboard__metric-icon">
            <Clock size={22} />
          </div>
          <div className="orders-dashboard__metric-info">
            <span className="orders-dashboard__metric-value">{metrics.pending}</span>
            <span className="orders-dashboard__metric-label">Pending</span>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="orders-dashboard__table-wrapper">
        {/* Controls / Filter Bar */}
        <div className="orders-dashboard__controls">
          <div className="orders-dashboard__search-box">
            <Search className="orders-dashboard__search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by tracking code, route, or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="orders-dashboard__search-input"
            />
          </div>

          <div className="orders-dashboard__filters">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="orders-dashboard__select"
              aria-label="Filter by Status"
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

            {/* Service Type Filter */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="orders-dashboard__select"
              aria-label="Filter by Service Type"
            >
              <option value="ALL">All Service Types</option>
              <option value="DELIVERY_SERVICES">Delivery Services</option>
              <option value="ERRAND_RUNNING">Errand Running</option>
              <option value="SHOPPING_ASSISTANCE">Shopping Assistance</option>
              <option value="PROCUREMENT">Procurement</option>
              <option value="PRICE_CHECK">Price Check</option>
              <option value="HOTEL_RESERVATION">Hotel Reservation</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="orders-dashboard__reset-btn"
                title="Reset Filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* When NO orders exist at all */}
        {orders.length === 0 ? (
          <div className="orders-dashboard__empty-state">
            <div className="orders-dashboard__empty-icon-wrap">
              <Package size={34} />
            </div>
            <h3 className="orders-dashboard__empty-title">No orders yet</h3>
            <p className="orders-dashboard__empty-text">
              You haven’t placed any delivery or errand requests yet. Any requests tied to your email will automatically appear here.
            </p>
            <LinkButton href="/request" className="orders-dashboard__empty-action-btn">
              <PlusCircle size={18} />
              Place Your First Request
            </LinkButton>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* When filters return 0 results */
          <div className="orders-dashboard__empty-state">
            <div className="orders-dashboard__empty-icon-wrap">
              <Search size={32} />
            </div>
            <h3 className="orders-dashboard__empty-title">No matching orders found</h3>
            <p className="orders-dashboard__empty-text">
              Try adjusting your search query or reset the filters to view your orders.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="orders-dashboard__empty-action-btn"
            >
              <RotateCcw size={16} />
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="orders-dashboard__table-scroll">
              <table className="orders-dashboard__table">
                <thead>
                  <tr>
                    <th>Tracking Code</th>
                    <th>Service Type</th>
                    <th>Details & Route</th>
                    <th>Status</th>
                    <th>Date Placed</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    const routeDisplay =
                      order.pickupLocation || order.deliveryLocation ? (
                        <div className="orders-dashboard__route-details">
                          <span className="orders-dashboard__route-main">
                            {order.pickupLocation || "Pickup"} <ArrowRight size={12} /> {order.deliveryLocation || "Destination"}
                          </span>
                          {order.itemDetails && (
                            <span className="orders-dashboard__route-sub" title={order.itemDetails}>
                              {order.itemDetails}
                            </span>
                          )}
                        </div>
                      ) : order.hotelCity ? (
                        <div className="orders-dashboard__route-details">
                          <span className="orders-dashboard__route-main">
                            City: {order.hotelCity}
                          </span>
                          {order.checkInDate && (
                            <span className="orders-dashboard__route-sub">
                              Check-in: {new Date(order.checkInDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="orders-dashboard__route-details">
                          <span className="orders-dashboard__route-main">
                            {order.itemDetails || "Standard Request"}
                          </span>
                          {order.budget && (
                            <span className="orders-dashboard__route-sub">
                              Budget: {order.budget}
                            </span>
                          )}
                        </div>
                      );

                    return (
                      <tr key={order.id}>
                        <td>
                          <div className="orders-dashboard__tracking-cell">
                            <span className="orders-dashboard__tracking-code">
                              {order.trackingNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(order.trackingNumber)}
                              className="orders-dashboard__copy-btn"
                              title="Copy Tracking Code"
                              aria-label="Copy Tracking Code"
                            >
                              {copiedId === order.trackingNumber ? (
                                <Check size={14} color="#10b981" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`orders-dashboard__service-badge ${getServiceClass(
                              order.serviceType
                            )}`}
                          >
                            {getServiceIcon(order.serviceType)}
                            <span>{formatServiceLabel(order.serviceType)}</span>
                          </span>
                        </td>

                        <td>{routeDisplay}</td>

                        <td>
                          <span
                            className={`orders-dashboard__status-pill ${getStatusClass(
                              order.status
                            )}`}
                          >
                            <span className="orders-dashboard__status-pill-dot" />
                            <span>{formatStatusLabel(order.status)}</span>
                          </span>
                        </td>

                        <td>
                          <span className="orders-dashboard__date-cell">
                            {formattedDate}
                          </span>
                        </td>

                        <td>
                          <div className="orders-dashboard__action-cell">
                            <Link
                              href={`/user-track?code=${order.trackingNumber}`}
                              className="orders-dashboard__track-btn"
                            >
                              <span>Track</span>
                              <ExternalLink size={13} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="orders-dashboard__mobile-cards">
              {filteredOrders.map((order) => {
                const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <div key={order.id} className="orders-dashboard__mobile-card">
                    <div className="orders-dashboard__mobile-card-header">
                      <div className="orders-dashboard__tracking-cell">
                        <span className="orders-dashboard__tracking-code">
                          {order.trackingNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.trackingNumber)}
                          className="orders-dashboard__copy-btn"
                          aria-label="Copy Tracking Code"
                        >
                          {copiedId === order.trackingNumber ? (
                            <Check size={14} color="#10b981" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>

                      <span
                        className={`orders-dashboard__status-pill ${getStatusClass(
                          order.status
                        )}`}
                      >
                        <span className="orders-dashboard__status-pill-dot" />
                        <span>{formatStatusLabel(order.status)}</span>
                      </span>
                    </div>

                    <div className="orders-dashboard__mobile-card-body">
                      <div>
                        <span
                          className={`orders-dashboard__service-badge ${getServiceClass(
                            order.serviceType
                          )}`}
                        >
                          {getServiceIcon(order.serviceType)}
                          <span>{formatServiceLabel(order.serviceType)}</span>
                        </span>
                      </div>

                      {order.pickupLocation || order.deliveryLocation ? (
                        <div className="orders-dashboard__route-details">
                          <span className="orders-dashboard__route-main">
                            {order.pickupLocation || "Pickup"} <ArrowRight size={12} /> {order.deliveryLocation || "Destination"}
                          </span>
                          {order.itemDetails && (
                            <span className="orders-dashboard__route-sub">
                              {order.itemDetails}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="orders-dashboard__route-details">
                          <span className="orders-dashboard__route-main">
                            {order.itemDetails || order.hotelCity || "Request details"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="orders-dashboard__mobile-card-footer">
                      <span>{formattedDate}</span>
                      <Link
                        href={`/user-track?code=${order.trackingNumber}`}
                        className="orders-dashboard__track-btn"
                      >
                        <span>Track Order</span>
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
