"use client";

import React, { useState, useActionState } from "react";
import Link from "next/link";
import { 
  Truck, 
  Package, 
  ShoppingBag, 
  SearchCheck, 
  Hotel, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Compass, 
  RotateCcw,
  Sparkles
} from "lucide-react";
import { createOrderAction } from "@/actions/orderActions";
import "@/styles/user/UserRequestForm.scss";

type ServiceType = 
  | "Delivery Services"
  | "Errand Running"
  | "Shopping Assistance"
  | "Procurement"
  | "Price Check & Market Survey"
  | "Hotel Search & Reservation";

interface UserRequestFormProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

const servicesList: { id: ServiceType; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: "Delivery Services", label: "Delivery", icon: Truck },
  { id: "Errand Running", label: "Errand Running", icon: Package },
  { id: "Shopping Assistance", label: "Shopping", icon: ShoppingBag },
  { id: "Procurement", label: "Procurement", icon: ShoppingBag },
  { id: "Price Check & Market Survey", label: "Price Check", icon: SearchCheck },
  { id: "Hotel Search & Reservation", label: "Hotel Booking", icon: Hotel },
];

export const UserRequestForm: React.FC<UserRequestFormProps> = ({ user }) => {
  const [service, setService] = useState<ServiceType>("Delivery Services");
  const [copied, setCopied] = useState(false);

  // Form field state for live summary preview
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    pickupLocation: "",
    deliveryLocation: "",
    itemDetails: "",
    budget: "",
    hotelCity: "",
    checkInDate: "",
    checkOutDate: "",
    additionalNotes: "",
  });

  const [state, formAction, isPending] = useActionState(createOrderAction, null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (state?.success && state?.trackingNumber) {
    return (
      <div className="user-request">
        <div className="user-request__success-card">
          <div className="user-request__success-icon-wrap">
            <CheckCircle2 size={38} />
          </div>
          <h2 className="user-request__title">Request Placed Successfully!</h2>
          <p className="user-request__subtitle">
            Your request for <strong>{state.serviceName}</strong> has been logged in your dashboard and sent to our operations team.
          </p>

          <div className="user-request__tracking-badge">
            <span className="user-request__tracking-code">{state.trackingNumber}</span>
            <button
              type="button"
              onClick={() => handleCopyTracking(state.trackingNumber)}
              className="orders-dashboard__copy-btn"
              title="Copy Tracking Code"
              aria-label="Copy Tracking Code"
            >
              {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
            </button>
          </div>

          <div className="user-request__actions">
            <Link href="/dashboard" className="user-request__action-btn-primary">
              <Package size={18} />
              View in Dashboard
            </Link>
            <Link
              href={`/user-track?code=${state.trackingNumber}`}
              className="user-request__action-btn-secondary"
            >
              <Compass size={18} />
              Track Live Progress
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-request">
      <div className="user-request__header">
        <h1 className="user-request__title">Place a New Request</h1>
        <p className="user-request__subtitle">
          Submit your errand, delivery, procurement, or hotel booking request directly to our team.
        </p>
      </div>

      <div className="user-request__layout">
        {/* Main Form */}
        <div className="user-request__form-card">
          {state?.error && (
            <div className="auth-error-card" style={{ marginBottom: "1rem" }}>
              <p>{state.error}</p>
            </div>
          )}

          <form action={formAction}>
            <input type="hidden" name="service" value={service} />

            {/* 1. Service Selection */}
            <div style={{ marginBottom: "1.75rem" }}>
              <h3 className="user-request__section-title">
                <Sparkles size={18} color="#2563eb" />
                1. Select Service Type
              </h3>
              <div className="user-request__services-grid">
                {servicesList.map((item) => {
                  const Icon = item.icon;
                  const isActive = service === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setService(item.id)}
                      className={`user-request__service-tile ${
                        isActive ? "user-request__service-tile--active" : ""
                      }`}
                    >
                      <Icon size={22} className="user-request__service-icon" />
                      <span className="user-request__service-name">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Contact Information */}
            <div style={{ marginBottom: "1.75rem" }}>
              <h3 className="user-request__section-title">
                <ShieldCheck size={18} color="#059669" />
                2. Contact & Identity
              </h3>

              {user?.email && (
                <div className="user-request__user-badge" style={{ marginBottom: "1rem" }}>
                  <ShieldCheck size={16} />
                  <span>
                    Linked to your registered account: <strong>{user.email}</strong>
                  </span>
                </div>
              )}

              <div className="user-request__row">
                <div className="user-request__group">
                  <label htmlFor="fullName" className="user-request__label">
                    Full Name *
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="user-request__input"
                    disabled={isPending}
                  />
                </div>

                <div className="user-request__group">
                  <label htmlFor="email" className="user-request__label">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className="user-request__input"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="user-request__group" style={{ marginTop: "1rem" }}>
                <label htmlFor="phone" className="user-request__label">
                  Phone / WhatsApp Number (Optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+234 800 000 0000"
                  className="user-request__input"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* 3. Service Details */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 className="user-request__section-title">
                <Package size={18} color="#2563eb" />
                3. {service} Details
              </h3>

              {/* Delivery & Errand Running */}
              {(service === "Delivery Services" || service === "Errand Running") && (
                <>
                  <div className="user-request__row">
                    <div className="user-request__group">
                      <label htmlFor="pickupLocation" className="user-request__label">
                        Pickup Location / Address *
                      </label>
                      <input
                        id="pickupLocation"
                        name="pickupLocation"
                        type="text"
                        required
                        value={formData.pickupLocation}
                        onChange={handleInputChange}
                        placeholder="Street / Area in Owerri"
                        className="user-request__input"
                        disabled={isPending}
                      />
                    </div>

                    <div className="user-request__group">
                      <label htmlFor="deliveryLocation" className="user-request__label">
                        Delivery Destination Address *
                      </label>
                      <input
                        id="deliveryLocation"
                        name="deliveryLocation"
                        type="text"
                        required
                        value={formData.deliveryLocation}
                        onChange={handleInputChange}
                        placeholder="Destination address or landmark"
                        className="user-request__input"
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  <div className="user-request__group" style={{ marginTop: "1rem" }}>
                    <label htmlFor="itemDetails" className="user-request__label">
                      Package & Item Details *
                    </label>
                    <textarea
                      id="itemDetails"
                      name="itemDetails"
                      required
                      value={formData.itemDetails}
                      onChange={handleInputChange}
                      placeholder="Describe what needs to be picked up or delivered (size, quantity, fragile)..."
                      className="user-request__textarea"
                      disabled={isPending}
                    />
                  </div>
                </>
              )}

              {/* Shopping Assistance & Procurement */}
              {(service === "Shopping Assistance" || service === "Procurement" || service === "Price Check & Market Survey") && (
                <>
                  <div className="user-request__group">
                    <label htmlFor="itemDetails" className="user-request__label">
                      Items List / Requirements *
                    </label>
                    <textarea
                      id="itemDetails"
                      name="itemDetails"
                      required
                      value={formData.itemDetails}
                      onChange={handleInputChange}
                      placeholder="List the specific products, brands, quantities, and preferred markets or stores..."
                      className="user-request__textarea"
                      disabled={isPending}
                    />
                  </div>

                  <div className="user-request__row" style={{ marginTop: "1rem" }}>
                    <div className="user-request__group">
                      <label htmlFor="deliveryLocation" className="user-request__label">
                        Delivery Address
                      </label>
                      <input
                        id="deliveryLocation"
                        name="deliveryLocation"
                        type="text"
                        value={formData.deliveryLocation}
                        onChange={handleInputChange}
                        placeholder="Where should items be delivered?"
                        className="user-request__input"
                        disabled={isPending}
                      />
                    </div>

                    <div className="user-request__group">
                      <label htmlFor="budget" className="user-request__label">
                        Estimated Budget (Optional)
                      </label>
                      <input
                        id="budget"
                        name="budget"
                        type="text"
                        value={formData.budget}
                        onChange={handleInputChange}
                        placeholder="e.g. ₦50,000"
                        className="user-request__input"
                        disabled={isPending}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Hotel Search & Reservation */}
              {service === "Hotel Search & Reservation" && (
                <>
                  <div className="user-request__group">
                    <label htmlFor="hotelCity" className="user-request__label">
                      Destination City / Area *
                    </label>
                    <input
                      id="hotelCity"
                      name="hotelCity"
                      type="text"
                      required
                      value={formData.hotelCity}
                      onChange={handleInputChange}
                      placeholder="e.g. Owerri, Port Harcourt, Lagos..."
                      className="user-request__input"
                      disabled={isPending}
                    />
                  </div>

                  <div className="user-request__row" style={{ marginTop: "1rem" }}>
                    <div className="user-request__group">
                      <label htmlFor="checkInDate" className="user-request__label">
                        Check-In Date *
                      </label>
                      <input
                        id="checkInDate"
                        name="checkInDate"
                        type="date"
                        required
                        value={formData.checkInDate}
                        onChange={handleInputChange}
                        className="user-request__input"
                        disabled={isPending}
                      />
                    </div>

                    <div className="user-request__group">
                      <label htmlFor="checkOutDate" className="user-request__label">
                        Check-Out Date *
                      </label>
                      <input
                        id="checkOutDate"
                        name="checkOutDate"
                        type="date"
                        required
                        value={formData.checkOutDate}
                        onChange={handleInputChange}
                        className="user-request__input"
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  <div className="user-request__group" style={{ marginTop: "1rem" }}>
                    <label htmlFor="budget" className="user-request__label">
                      Budget Per Night (Optional)
                    </label>
                    <input
                      id="budget"
                      name="budget"
                      type="text"
                      value={formData.budget}
                      onChange={handleInputChange}
                      placeholder="e.g. ₦35,000 / night"
                      className="user-request__input"
                      disabled={isPending}
                    />
                  </div>
                </>
              )}

              {/* Additional Notes */}
              <div className="user-request__group" style={{ marginTop: "1rem" }}>
                <label htmlFor="additionalNotes" className="user-request__label">
                  Special Instructions or Notes (Optional)
                </label>
                <textarea
                  id="additionalNotes"
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  placeholder="Any specific delivery instructions, gate codes, contact person, or urgent timing..."
                  className="user-request__textarea"
                  style={{ minHeight: "75px" }}
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="user-request__submit-btn"
            >
              {isPending ? (
                <>
                  <Loader2 className="auth-form__spinner" size={18} />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <span>Submit Order Request</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar Summary */}
        <aside className="user-request__summary-card">
          <h3 className="user-request__summary-title">Request Summary</h3>
          
          <div className="user-request__summary-item">
            <span className="user-request__summary-label">Service</span>
            <span className="user-request__summary-value">{service}</span>
          </div>

          <div className="user-request__summary-item">
            <span className="user-request__summary-label">Customer</span>
            <span className="user-request__summary-value">{formData.fullName || "—"}</span>
          </div>

          {formData.pickupLocation && (
            <div className="user-request__summary-item">
              <span className="user-request__summary-label">Pickup</span>
              <span className="user-request__summary-value" title={formData.pickupLocation}>
                {formData.pickupLocation}
              </span>
            </div>
          )}

          {formData.deliveryLocation && (
            <div className="user-request__summary-item">
              <span className="user-request__summary-label">Delivery</span>
              <span className="user-request__summary-value" title={formData.deliveryLocation}>
                {formData.deliveryLocation}
              </span>
            </div>
          )}

          {formData.hotelCity && (
            <div className="user-request__summary-item">
              <span className="user-request__summary-label">City</span>
              <span className="user-request__summary-value">{formData.hotelCity}</span>
            </div>
          )}

          <div className="user-request__summary-perks">
            <div className="user-request__summary-perk">
              <ShieldCheck size={14} color="#059669" />
              <span>Real-time dashboard tracking</span>
            </div>
            <div className="user-request__summary-perk">
              <CheckCircle2 size={14} color="#2563eb" />
              <span>Prompt verification by DOPO team</span>
            </div>
            <div className="user-request__summary-perk">
              <Compass size={14} color="#7c3aed" />
              <span>Instant tracking code generation</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
