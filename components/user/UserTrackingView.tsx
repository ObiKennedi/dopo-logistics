"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertCircle, 
  Copy, 
  Check, 
  Phone, 
  MessageCircle, 
  ShieldAlert, 
  Sparkles,
  Compass
} from "lucide-react";
import { TrackingForm } from "@/components/quatre/TrackingForm";
import { trackOrderAction, updateOrderStatusAction } from "@/actions/orderActions";
import type { OrderStatus, ServiceType } from "@prisma/client";
import "@/styles/quatre/TrackingView.scss";
import "@/styles/user/UserTrackingView.scss";

interface OrderData {
  id: string;
  trackingNumber: string;
  serviceType: ServiceType;
  status: OrderStatus;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  pickupLocation?: string | null;
  deliveryLocation?: string | null;
  itemDetails?: string | null;
  budget?: string | null;
  hotelCity?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  additionalNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RecentOrderSummary {
  id: string;
  trackingNumber: string;
  serviceType: ServiceType;
  status: OrderStatus;
}

interface UserTrackingViewProps {
  userOrders?: RecentOrderSummary[];
  userRole?: string;
  initialCode?: string;
}

const getStepNumber = (status: OrderStatus | string): number => {
  switch (status) {
    case "PENDING":
      return 1;
    case "CONFIRMED":
      return 2;
    case "IN_PROGRESS":
      return 3;
    case "PICKED_UP":
      return 4;
    case "DELIVERED":
    case "COMPLETED":
      return 5;
    case "CANCELLED":
      return 0;
    default:
      return 1;
  }
};

const formatServiceLabel = (service: ServiceType | string) => {
  switch (service) {
    case "ERRAND_RUNNING":
      return "Errand Running";
    case "DELIVERY_SERVICES":
      return "Delivery Services";
    case "SHOPPING_ASSISTANCE":
      return "Shopping Assistance";
    case "PROCUREMENT":
      return "Procurement";
    case "PRICE_CHECK":
      return "Price Check & Survey";
    case "HOTEL_RESERVATION":
      return "Hotel Reservation";
    default:
      return service;
  }
};

export const UserTrackingView: React.FC<UserTrackingViewProps> = ({
  userOrders = [],
  userRole,
  initialCode = "",
}) => {
  const searchParams = useSearchParams();
  const queryCode = searchParams.get("code") || initialCode;

  const [activeCode, setActiveCode] = useState(queryCode);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Admin update state
  const [adminStatus, setAdminStatus] = useState<OrderStatus>("PENDING" as OrderStatus);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<string | null>(null);

  const isAdmin = userRole === "ADMIN" || userRole === "STAFF";

  const handleLookup = async (trackingCode: string) => {
    if (!trackingCode || !trackingCode.trim()) return;

    setIsLoading(true);
    setError(null);
    setStatusUpdateMessage(null);
    setActiveCode(trackingCode);

    const result = await trackOrderAction(trackingCode);

    if (result.error) {
      setError(result.error);
      setOrder(null);
    } else if (result.order) {
      setOrder(result.order as OrderData);
      setAdminStatus(result.order.status);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (queryCode) {
      setActiveCode(queryCode);
      handleLookup(queryCode);
    }
  }, [queryCode]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdminStatusUpdate = async () => {
    if (!order) return;

    setIsUpdatingStatus(true);
    setStatusUpdateMessage(null);

    const res = await updateOrderStatusAction(order.id, adminStatus);

    if (res.error) {
      setStatusUpdateMessage(res.error);
    } else if (res.success && res.newStatus) {
      setOrder((prev) => (prev ? { ...prev, status: res.newStatus as OrderStatus } : null));
      setStatusUpdateMessage("Status updated successfully!");
      setTimeout(() => setStatusUpdateMessage(null), 3000);
    }

    setIsUpdatingStatus(false);
  };

  const currentStep = order ? getStepNumber(order.status) : 0;
  const progressPercent = currentStep > 0 ? ((currentStep - 1) / 4) * 100 : 0;

  return (
    <div className="user-tracking">
      {/* Header */}
      <div className="user-tracking__header">
        <h1 className="user-tracking__title">Live Order & Shipment Tracker</h1>
        <p className="user-tracking__subtitle">
          Track packages, delivery milestones, errand updates, and procurement progress in real-time.
        </p>
      </div>

      {/* Search & Quick Pick Section */}
      <div className="user-tracking__search-card">
        <h3 className="user-tracking__search-title">
          <Compass size={18} color="#2563eb" />
          Track Any Shipment
        </h3>

        {/* Reusable Tracking Form */}
        <TrackingForm
          initialValue={activeCode}
          onTrack={handleLookup}
          isLoading={isLoading}
          variant="hero"
          placeholder="Enter Tracking Code (e.g. DP-8A49K2X1)"
          buttonText="Track Package"
        />

        {/* Quick Select Chips from User's Orders */}
        {userOrders.length > 0 && (
          <div className="user-tracking__recent-section">
            <span className="user-tracking__recent-label">Your Recent Shipments:</span>
            <div className="user-tracking__recent-list">
              {userOrders.map((item) => {
                const isCurrent = activeCode === item.trackingNumber;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleLookup(item.trackingNumber)}
                    className={`user-tracking__recent-chip ${
                      isCurrent ? "user-tracking__recent-chip--active" : ""
                    }`}
                  >
                    <span>{item.trackingNumber}</span>
                    <span className="user-tracking__chip-status">
                      {item.status.toLowerCase().replace("_", " ")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Error View */}
      {error && (
        <div className="dopo-tracker__error-box">
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <div>
            <strong>Tracking Lookup Notice:</strong> {error}
          </div>
        </div>
      )}

      {/* Order Details & Tracking Result */}
      {order && (
        <>
          {/* Admin Status Modifier Panel */}
          {isAdmin && (
            <div className="dopo-tracker__admin-panel">
              <div className="dopo-tracker__admin-badge">
                <ShieldAlert size={18} />
                <span>Admin Quick Status Actions</span>
              </div>

              <div className="dopo-tracker__admin-controls">
                <select
                  value={adminStatus}
                  onChange={(e) => setAdminStatus(e.target.value as OrderStatus)}
                  className="dopo-tracker__admin-select"
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PICKED_UP">Picked Up / In Transit</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <button
                  type="button"
                  onClick={handleAdminStatusUpdate}
                  disabled={isUpdatingStatus || adminStatus === order.status}
                  className="dopo-tracker__admin-save-btn"
                >
                  {isUpdatingStatus ? "Updating..." : "Update Status"}
                </button>

                {statusUpdateMessage && (
                  <span style={{ fontSize: "0.85rem", color: "#059669", fontWeight: 600 }}>
                    {statusUpdateMessage}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="dopo-tracker__result-card">
            {/* Header: Tracking Code & Status */}
            <div className="dopo-tracker__order-header">
              <div className="dopo-tracker__code-group">
                <span className="dopo-tracker__code-label">Tracking Number</span>
                <div className="dopo-tracker__code-wrap">
                  <span className="dopo-tracker__code-text">{order.trackingNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.trackingNumber)}
                    className="orders-dashboard__copy-btn"
                    title="Copy Code"
                  >
                    {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <span className="orders-dashboard__service-badge orders-dashboard__service-badge--delivery">
                  {formatServiceLabel(order.serviceType)}
                </span>
                <span className="orders-dashboard__status-pill orders-dashboard__status-pill--in-progress">
                  <span className="orders-dashboard__status-pill-dot" />
                  <span>{order.status}</span>
                </span>
              </div>
            </div>

            {/* Stepper / Timeline */}
            {order.status === "CANCELLED" ? (
              <div className="dopo-tracker__cancelled-banner">
                <AlertCircle size={20} />
                <span>This order request was cancelled. If you have any inquiries, please reach out to customer support.</span>
              </div>
            ) : (
              <div className="dopo-tracker__stepper">
                {/* Connecting Bar */}
                <div className="dopo-tracker__stepper-bar">
                  <div
                    className="dopo-tracker__stepper-bar-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Step 1: Order Placed */}
                <div className="dopo-tracker__step">
                  <div
                    className={`dopo-tracker__step-icon-wrap ${
                      currentStep > 1
                        ? "dopo-tracker__step-icon-wrap--completed"
                        : currentStep === 1
                        ? "dopo-tracker__step-icon-wrap--active"
                        : ""
                    }`}
                  >
                    {currentStep > 1 ? <Check size={18} /> : <Clock size={18} />}
                  </div>
                  <div className="dopo-tracker__step-info">
                    <span
                      className={`dopo-tracker__step-title ${
                        currentStep === 1 ? "dopo-tracker__step-title--active" : ""
                      }`}
                    >
                      Request Placed
                    </span>
                    <span className="dopo-tracker__step-desc">Received in system</span>
                  </div>
                </div>

                {/* Step 2: Confirmed */}
                <div className="dopo-tracker__step">
                  <div
                    className={`dopo-tracker__step-icon-wrap ${
                      currentStep > 2
                        ? "dopo-tracker__step-icon-wrap--completed"
                        : currentStep === 2
                        ? "dopo-tracker__step-icon-wrap--active"
                        : ""
                    }`}
                  >
                    {currentStep > 2 ? <Check size={18} /> : <CheckCircle2 size={18} />}
                  </div>
                  <div className="dopo-tracker__step-info">
                    <span
                      className={`dopo-tracker__step-title ${
                        currentStep === 2 ? "dopo-tracker__step-title--active" : ""
                      }`}
                    >
                      Confirmed
                    </span>
                    <span className="dopo-tracker__step-desc">Verified by dispatch</span>
                  </div>
                </div>

                {/* Step 3: In Progress */}
                <div className="dopo-tracker__step">
                  <div
                    className={`dopo-tracker__step-icon-wrap ${
                      currentStep > 3
                        ? "dopo-tracker__step-icon-wrap--completed"
                        : currentStep === 3
                        ? "dopo-tracker__step-icon-wrap--active"
                        : ""
                    }`}
                  >
                    {currentStep > 3 ? <Check size={18} /> : <Package size={18} />}
                  </div>
                  <div className="dopo-tracker__step-info">
                    <span
                      className={`dopo-tracker__step-title ${
                        currentStep === 3 ? "dopo-tracker__step-title--active" : ""
                      }`}
                    >
                      In Progress
                    </span>
                    <span className="dopo-tracker__step-desc">Errand / task ongoing</span>
                  </div>
                </div>

                {/* Step 4: Out for Delivery / Picked Up */}
                <div className="dopo-tracker__step">
                  <div
                    className={`dopo-tracker__step-icon-wrap ${
                      currentStep > 4
                        ? "dopo-tracker__step-icon-wrap--completed"
                        : currentStep === 4
                        ? "dopo-tracker__step-icon-wrap--active"
                        : ""
                    }`}
                  >
                    {currentStep > 4 ? <Check size={18} /> : <Truck size={18} />}
                  </div>
                  <div className="dopo-tracker__step-info">
                    <span
                      className={`dopo-tracker__step-title ${
                        currentStep === 4 ? "dopo-tracker__step-title--active" : ""
                      }`}
                    >
                      In Transit
                    </span>
                    <span className="dopo-tracker__step-desc">Picked up & moving</span>
                  </div>
                </div>

                {/* Step 5: Delivered */}
                <div className="dopo-tracker__step">
                  <div
                    className={`dopo-tracker__step-icon-wrap ${
                      currentStep >= 5 ? "dopo-tracker__step-icon-wrap--completed" : ""
                    }`}
                  >
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="dopo-tracker__step-info">
                    <span
                      className={`dopo-tracker__step-title ${
                        currentStep >= 5 ? "dopo-tracker__step-title--completed" : ""
                      }`}
                    >
                      Delivered
                    </span>
                    <span className="dopo-tracker__step-desc">Fulfilled & completed</span>
                  </div>
                </div>
              </div>
            )}

            {/* Order Details Grid */}
            <div className="dopo-tracker__details-grid">
              {/* Route & Locations */}
              <div className="dopo-tracker__detail-box">
                <span className="dopo-tracker__detail-title">
                  <MapPin size={16} color="#2563eb" />
                  Route & Locations
                </span>

                {order.pickupLocation && (
                  <div className="dopo-tracker__detail-item">
                    <span className="dopo-tracker__detail-label">Pickup Address:</span>
                    <span className="dopo-tracker__detail-value">{order.pickupLocation}</span>
                  </div>
                )}

                {order.deliveryLocation && (
                  <div className="dopo-tracker__detail-item">
                    <span className="dopo-tracker__detail-label">Delivery Destination:</span>
                    <span className="dopo-tracker__detail-value">{order.deliveryLocation}</span>
                  </div>
                )}

                {order.hotelCity && (
                  <div className="dopo-tracker__detail-item">
                    <span className="dopo-tracker__detail-label">City:</span>
                    <span className="dopo-tracker__detail-value">{order.hotelCity}</span>
                  </div>
                )}

                {order.checkInDate && (
                  <div className="dopo-tracker__detail-item">
                    <span className="dopo-tracker__detail-label">Stay Period:</span>
                    <span className="dopo-tracker__detail-value">
                      {new Date(order.checkInDate).toLocaleDateString()} — {order.checkOutDate ? new Date(order.checkOutDate).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                )}
              </div>

              {/* Items & Notes */}
              <div className="dopo-tracker__detail-box">
                <span className="dopo-tracker__detail-title">
                  <Package size={16} color="#059669" />
                  Request Details
                </span>

                {order.itemDetails && (
                  <div className="dopo-tracker__detail-item">
                    <span className="dopo-tracker__detail-label">Items Description:</span>
                    <span className="dopo-tracker__detail-value">{order.itemDetails}</span>
                  </div>
                )}

                {order.budget && (
                  <div className="dopo-tracker__detail-item">
                    <span className="dopo-tracker__detail-label">Budget:</span>
                    <span className="dopo-tracker__detail-value">{order.budget}</span>
                  </div>
                )}

                <div className="dopo-tracker__detail-item">
                  <span className="dopo-tracker__detail-label">Date Placed:</span>
                  <span className="dopo-tracker__detail-value">
                    {new Date(order.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>

                {order.additionalNotes && (
                  <div className="dopo-tracker__detail-item">
                    <span className="dopo-tracker__detail-label">Special Notes:</span>
                    <span className="dopo-tracker__detail-value">{order.additionalNotes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Support Footer */}
            <div className="dopo-tracker__support-card">
              <div className="dopo-tracker__support-info">
                <Phone size={20} color="#2563eb" />
                <div>
                  <strong style={{ fontSize: "0.95rem", color: "#0a1854", display: "block" }}>
                    Have questions about this delivery?
                  </strong>
                  <span style={{ fontSize: "0.825rem", color: "#64748b" }}>
                    Contact our operations and dispatch team directly.
                  </span>
                </div>
              </div>

              <div className="dopo-tracker__support-actions">
                <a
                  href="https://wa.me/2348000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dopo-tracker__support-btn dopo-tracker__support-btn--whatsapp"
                >
                  <MessageCircle size={15} />
                  WhatsApp
                </a>
                <a
                  href="tel:+2348000000000"
                  className="dopo-tracker__support-btn dopo-tracker__support-btn--call"
                >
                  <Phone size={14} />
                  Call Support
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
