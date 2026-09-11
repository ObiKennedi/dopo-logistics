"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertCircle, 
  Copy, 
  Check, 
  Loader2, 
  Phone, 
  MessageCircle, 
  ShieldAlert, 
  RotateCcw,
  Sparkles,
  Calendar,
  Building,
  ArrowRight,
  ShoppingBag,
  SearchCheck,
  Hotel
} from "lucide-react";
import { trackOrderAction, updateOrderStatusAction } from "@/actions/orderActions";
import { TrackingForm } from "./TrackingForm";
import type { OrderStatus, ServiceType } from "@prisma/client";
import "@/styles/quatre/TrackingView.scss";

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

interface TrackingViewProps {
  initialCode?: string;
  userRole?: string;
}

const statusOrder = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "PICKED_UP",
  "DELIVERED",
];

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

const getServiceClass = (service: ServiceType | string) => {
  switch (service) {
    case "DELIVERY_SERVICES":
    case "Delivery Services":
      return "dopo-tracker__service-badge--delivery";
    case "ERRAND_RUNNING":
    case "Errand Running":
      return "dopo-tracker__service-badge--errand";
    case "SHOPPING_ASSISTANCE":
    case "Shopping Assistance":
      return "dopo-tracker__service-badge--shopping";
    case "PROCUREMENT":
    case "Procurement":
      return "dopo-tracker__service-badge--procurement";
    case "PRICE_CHECK":
    case "Price Check & Market Survey":
    case "Price Check":
      return "dopo-tracker__service-badge--price-check";
    case "HOTEL_RESERVATION":
    case "Hotel Search & Reservation":
    case "Hotel Reservation":
      return "dopo-tracker__service-badge--hotel";
    default:
      return "dopo-tracker__service-badge--default";
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
    case "Price Check":
      return <SearchCheck size={14} />;
    case "HOTEL_RESERVATION":
    case "Hotel Search & Reservation":
    case "Hotel Reservation":
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
      return "dopo-tracker__status-pill--pending";
    case "CONFIRMED":
      return "dopo-tracker__status-pill--confirmed";
    case "IN_PROGRESS":
      return "dopo-tracker__status-pill--in-progress";
    case "PICKED_UP":
      return "dopo-tracker__status-pill--picked-up";
    case "DELIVERED":
      return "dopo-tracker__status-pill--delivered";
    case "COMPLETED":
      return "dopo-tracker__status-pill--completed";
    case "CANCELLED":
      return "dopo-tracker__status-pill--cancelled";
    default:
      return "dopo-tracker__status-pill--default";
  }
};

export const TrackingView: React.FC<TrackingViewProps> = ({ initialCode = "", userRole }) => {
  const searchParams = useSearchParams();
  const queryCode = searchParams.get("code") || initialCode;

  const [code, setCode] = useState(queryCode);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Admin update state
  const [adminStatus, setAdminStatus] = useState<OrderStatus>("PENDING" as OrderStatus);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<string | null>(null);

  const isAdmin = userRole === "ADMIN" || userRole === "STAFF";

  const handleSearch = async (trackingCode: string) => {
    if (!trackingCode || !trackingCode.trim()) return;

    setIsLoading(true);
    setError(null);
    setStatusUpdateMessage(null);

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
      setCode(queryCode);
      handleSearch(queryCode);
    }
  }, [queryCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(code);
  };

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
    <div className="dopo-tracker">
      {/* 1. Search Box Hero */}
      <div className="dopo-tracker__search-card">
        <span className="dopo-tracker__badge">
          <Sparkles size={13} />
          Live Order Tracker
        </span>
        <h1 className="dopo-tracker__title">Track Your Package & Errand</h1>
        <p className="dopo-tracker__subtitle">
          Enter your DOPO tracking code (e.g. DP-8A49K2X1) to check live dispatch and delivery updates.
        </p>

        <div style={{ width: "100%", maxWidth: "540px" }}>
          <TrackingForm
            initialValue={code}
            onTrack={handleSearch}
            isLoading={isLoading}
            variant="hero"
          />
        </div>
      </div>

      {/* 2. Error View */}
      {error && (
        <div className="dopo-tracker__error-box">
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <div>
            <strong>Lookup Failed:</strong> {error}
          </div>
        </div>
      )}

      {/* 3. Result & Status Timeline */}
      {order && (
        <>
          {/* Admin Status Modifier Panel */}
          {isAdmin && (
            <div className="dopo-tracker__admin-panel">
              <div className="dopo-tracker__admin-badge">
                <ShieldAlert size={18} />
                <span>Admin Quick Actions</span>
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
                    className="dopo-tracker__copy-btn"
                    title={copied ? "Copied to clipboard!" : "Copy Tracking Number"}
                    aria-label="Copy Tracking Number"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="dopo-tracker__copy-icon--success" />
                        <span className="dopo-tracker__copy-label">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span className="dopo-tracker__copy-label">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="dopo-tracker__badges-wrap">
                <span className={`dopo-tracker__service-badge ${getServiceClass(order.serviceType)}`}>
                  {getServiceIcon(order.serviceType)}
                  <span>{formatServiceLabel(order.serviceType)}</span>
                </span>
                <span className={`dopo-tracker__status-pill ${getStatusClass(order.status)}`}>
                  <span className="dopo-tracker__status-pill-dot" />
                  <span>{formatStatusLabel(order.status)}</span>
                </span>
              </div>
            </div>

            {/* Stepper / Timeline */}
            {order.status === "CANCELLED" ? (
              <div className="dopo-tracker__cancelled-banner">
                <AlertCircle size={20} />
                <span>This order request was cancelled. If you have questions, please contact our support team.</span>
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
              {/* Route & Destination */}
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
                    <span className="dopo-tracker__detail-label">Delivery Address:</span>
                    <span className="dopo-tracker__detail-value">{order.deliveryLocation}</span>
                  </div>
                )}

                {order.hotelCity && (
                  <div className="dopo-tracker__detail-item">
                    <span className="dopo-tracker__detail-label">Destination City:</span>
                    <span className="dopo-tracker__detail-value">{order.hotelCity}</span>
                  </div>
                )}

                {order.checkInDate && (
                  <div className="dopo-tracker__detail-item">
                    <span className="dopo-tracker__detail-label">Reservation Dates:</span>
                    <span className="dopo-tracker__detail-value">
                      {new Date(order.checkInDate).toLocaleDateString()} to {order.checkOutDate ? new Date(order.checkOutDate).toLocaleDateString() : "N/A"}
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
                    <span className="dopo-tracker__detail-label">Items / Description:</span>
                    <span className="dopo-tracker__detail-value">{order.itemDetails}</span>
                  </div>
                )}

                {order.budget && (
                  <div className="dopo-tracker__detail-item">
                    <span className="dopo-tracker__detail-label">Estimated Budget:</span>
                    <span className="dopo-tracker__detail-value">{order.budget}</span>
                  </div>
                )}

                <div className="dopo-tracker__detail-item">
                  <span className="dopo-tracker__detail-label">Date Submitted:</span>
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

            {/* Support Action Card */}
            <div className="dopo-tracker__support-card">
              <div className="dopo-tracker__support-info">
                <Phone size={20} color="#2563eb" />
                <div>
                  <strong style={{ fontSize: "0.95rem", color: "#0a1854", display: "block" }}>
                    Need urgent updates on this order?
                  </strong>
                  <span style={{ fontSize: "0.825rem", color: "#64748b" }}>
                    Our customer dispatch team in Owerri is ready to assist you.
                  </span>
                </div>
              </div>

              <div className="dopo-tracker__support-actions">
                <a
                  href="https://wa.me/2349161033552"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dopo-tracker__support-btn dopo-tracker__support-btn--whatsapp"
                >
                  <MessageCircle size={15} />
                  WhatsApp Support
                </a>
                <a
                  href="tel:+2349161033552"
                  className="dopo-tracker__support-btn dopo-tracker__support-btn--call"
                >
                  <Phone size={14} />
                  Call Us
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
