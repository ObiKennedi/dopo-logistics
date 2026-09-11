"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  LogOut,
  Package,
  LifeBuoy,
  MessageSquare,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Check,
  KeyRound,
  Shield,
  Bell,
  Volume2,
  FileText,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { updateUserProfileAction, changePasswordAction } from "@/actions/userActions";
import "@/styles/admin/AdminProfile.scss";

export interface AdminProfileData {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  image?: string | null;
  emailVerified?: string | null;
  createdAt: string;
  isOAuthUser?: boolean;
}

export interface AdminProfileMetrics {
  totalOrders: number;
  activeOrders: number;
  totalTickets: number;
  openTickets: number;
  totalChats: number;
  activeChats: number;
  totalUsers: number;
}

interface AdminProfileViewProps {
  admin: AdminProfileData;
  metrics: AdminProfileMetrics;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  admin,
  metrics,
}) => {
  // Personal Details Form State
  const [name, setName] = useState(admin.name || "");
  const [phone, setPhone] = useState(admin.phone || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Logout State
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Operational Preferences State (persisted to localStorage)
  const [newOrderAlerts, setNewOrderAlerts] = useState(true);
  const [urgentTicketAlerts, setUrgentTicketAlerts] = useState(true);
  const [liveChatSound, setLiveChatSound] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);

  useEffect(() => {
    try {
      const savedOrderAlerts = localStorage.getItem("dopo_admin_order_alerts");
      const savedTicketAlerts = localStorage.getItem("dopo_admin_ticket_alerts");
      const savedChatSound = localStorage.getItem("dopo_admin_chat_sound");
      const savedDailyDigest = localStorage.getItem("dopo_admin_daily_digest");

      if (savedOrderAlerts !== null) setNewOrderAlerts(savedOrderAlerts === "true");
      if (savedTicketAlerts !== null) setUrgentTicketAlerts(savedTicketAlerts === "true");
      if (savedChatSound !== null) setLiveChatSound(savedChatSound === "true");
      if (savedDailyDigest !== null) setDailyDigest(savedDailyDigest === "true");
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }
  }, []);

  const handleTogglePreference = (
    key: string,
    value: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setter(value);
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // Ignore write errors
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);

    try {
      const result = await updateUserProfileAction(null, formData);
      if (result.error) {
        setProfileMessage({ type: "error", text: result.error });
      } else {
        setProfileMessage({
          type: "success",
          text: result.success || "Administrator profile updated successfully.",
        });
      }
    } catch (err: any) {
      setProfileMessage({
        type: "error",
        text: err.message || "An unexpected error occurred while updating profile.",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 6 characters long.",
      });
      setIsChangingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New passwords do not match.",
      });
      setIsChangingPassword(false);
      return;
    }

    const formData = new FormData();
    formData.append("currentPassword", currentPassword);
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);

    try {
      const result = await changePasswordAction(null, formData);
      if (result.error) {
        setPasswordMessage({ type: "error", text: result.error });
      } else {
        setPasswordMessage({
          type: "success",
          text: result.success || "Administrator password updated successfully.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setPasswordMessage({
        type: "error",
        text: err.message || "An unexpected error occurred while changing password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Format initials
  const initials = admin.name
    ? admin.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  const memberSince = new Date(admin.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const isAdminRole = admin.role === "ADMIN";

  return (
    <div className="admin-profile">
      {/* ------------------------------------------------------------------
          1. Hero Header Card
          ------------------------------------------------------------------ */}
      <section className="admin-profile__hero">
        <div className="admin-profile__user-group">
          <div className="admin-profile__avatar-wrapper">
            <div className="admin-profile__avatar">
              {admin.image ? (
                <img
                  src={admin.image}
                  alt={admin.name || "Admin"}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "22px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="admin-profile__avatar-shield" title="Verified Elevated Access">
              <ShieldCheck size={16} />
            </div>
          </div>

          <div className="admin-profile__identity">
            <div className="admin-profile__name-row">
              <h1 className="admin-profile__name">{admin.name || "Administrative Officer"}</h1>
              <span
                className={`admin-profile__role-badge ${
                  isAdminRole
                    ? "admin-profile__role-badge--admin"
                    : "admin-profile__role-badge--staff"
                }`}
              >
                <Shield size={12} />
                {isAdminRole ? "Platform Administrator" : "Operations Staff"}
              </span>
            </div>

            <div className="admin-profile__meta-list">
              <div className="admin-profile__meta-item">
                <Mail size={14} />
                <span>{admin.email}</span>
              </div>
              {admin.phone && (
                <div className="admin-profile__meta-item">
                  <Phone size={14} />
                  <span>{admin.phone}</span>
                </div>
              )}
              <div className="admin-profile__meta-item">
                <Calendar size={14} />
                <span>Active since {memberSince}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-profile__hero-actions">
          <button
            type="button"
            className="admin-profile__btn-logout"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut size={16} />
            <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          2. Platform Oversight Metrics Grid (4 Cards)
          ------------------------------------------------------------------ */}
      <section className="admin-profile__metrics-grid">
        <div className="admin-profile__metric-card">
          <div className="admin-profile__metric-icon admin-profile__metric-icon--blue">
            <Package size={26} />
          </div>
          <div className="admin-profile__metric-body">
            <span className="admin-profile__metric-value">{metrics.totalOrders}</span>
            <span className="admin-profile__metric-label">Platform Orders</span>
            <span className="admin-profile__metric-sub">
              {metrics.activeOrders} currently in transit
            </span>
          </div>
        </div>

        <div className="admin-profile__metric-card">
          <div className="admin-profile__metric-icon admin-profile__metric-icon--amber">
            <LifeBuoy size={26} />
          </div>
          <div className="admin-profile__metric-body">
            <span className="admin-profile__metric-value">{metrics.totalTickets}</span>
            <span className="admin-profile__metric-label">Support Tickets</span>
            <span className="admin-profile__metric-sub">
              {metrics.openTickets} requiring attention
            </span>
          </div>
        </div>

        <div className="admin-profile__metric-card">
          <div className="admin-profile__metric-icon admin-profile__metric-icon--indigo">
            <MessageSquare size={26} />
          </div>
          <div className="admin-profile__metric-body">
            <span className="admin-profile__metric-value">{metrics.totalChats}</span>
            <span className="admin-profile__metric-label">Live Chats</span>
            <span className="admin-profile__metric-sub">
              {metrics.activeChats} active conversation{metrics.activeChats === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="admin-profile__metric-card">
          <div className="admin-profile__metric-icon admin-profile__metric-icon--emerald">
            <Users size={26} />
          </div>
          <div className="admin-profile__metric-body">
            <span className="admin-profile__metric-value">{metrics.totalUsers}</span>
            <span className="admin-profile__metric-label">Platform Accounts</span>
            <span className="admin-profile__metric-sub">Registered customers & staff</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          3. Dual Column Layout: Forms & Permissions Matrix
          ------------------------------------------------------------------ */}
      <div className="admin-profile__layout">
        {/* Left Column: Personal Information & Security */}
        <div className="admin-profile__col">
          {/* Personal Information Form */}
          <div className="admin-profile__card">
            <div className="admin-profile__card-header">
              <div className="admin-profile__card-title-group">
                <div className="admin-profile__card-icon">
                  <User size={18} />
                </div>
                <div>
                  <h2 className="admin-profile__card-title">Administrative Identity</h2>
                  <p className="admin-profile__card-subtitle">
                    Manage your public profile name and staff contact details
                  </p>
                </div>
              </div>
            </div>

            <div className="admin-profile__card-body">
              <form onSubmit={handleUpdateProfile} className="admin-profile__form">
                {profileMessage && (
                  <div
                    className={`admin-profile__alert ${
                      profileMessage.type === "success"
                        ? "admin-profile__alert--success"
                        : "admin-profile__alert--error"
                    }`}
                  >
                    {profileMessage.type === "success" ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <AlertCircle size={18} />
                    )}
                    <span>{profileMessage.text}</span>
                  </div>
                )}

                <div className="admin-profile__form-row">
                  <div className="admin-profile__field">
                    <label className="admin-profile__label">Full Legal Name</label>
                    <div className="admin-profile__input-wrapper">
                      <User size={16} className="admin-profile__input-icon" />
                      <input
                        type="text"
                        className="admin-profile__input"
                        placeholder="e.g. John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-profile__field">
                    <label className="admin-profile__label">Contact Phone</label>
                    <div className="admin-profile__input-wrapper">
                      <Phone size={16} className="admin-profile__input-icon" />
                      <input
                        type="tel"
                        className="admin-profile__input"
                        placeholder="e.g. +1 (555) 019-2834"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="admin-profile__form-row">
                  <div className="admin-profile__field">
                    <label className="admin-profile__label">
                      <span>System Email Address</span>
                      <span className="admin-profile__readonly-badge">Primary Identity</span>
                    </label>
                    <div className="admin-profile__input-wrapper">
                      <Mail size={16} className="admin-profile__input-icon" />
                      <input
                        type="email"
                        className="admin-profile__input admin-profile__input--readonly"
                        value={admin.email}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="admin-profile__field">
                    <label className="admin-profile__label">
                      <span>Assigned Role</span>
                      <span className="admin-profile__readonly-badge">System Controlled</span>
                    </label>
                    <div className="admin-profile__input-wrapper">
                      <Shield size={16} className="admin-profile__input-icon" />
                      <input
                        type="text"
                        className="admin-profile__input admin-profile__input--readonly"
                        value={admin.role}
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="admin-profile__btn-submit"
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Profile Details</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Security Credentials & Password */}
          <div className="admin-profile__card">
            <div className="admin-profile__card-header">
              <div className="admin-profile__card-title-group">
                <div className="admin-profile__card-icon">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h2 className="admin-profile__card-title">Security & Password</h2>
                  <p className="admin-profile__card-subtitle">
                    Maintain administrative authentication credentials
                  </p>
                </div>
              </div>
            </div>

            <div className="admin-profile__card-body">
              {admin.isOAuthUser ? (
                <div className="admin-profile__oauth-banner">
                  <ShieldCheck size={24} />
                  <div>
                    <strong>Third-Party Single Sign-On Active</strong>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.825rem", opacity: 0.9 }}>
                      Your account authenticates via Google OAuth. Passwords and identity security
                      are managed directly through your Google account security settings.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="admin-profile__form">
                  {passwordMessage && (
                    <div
                      className={`admin-profile__alert ${
                        passwordMessage.type === "success"
                          ? "admin-profile__alert--success"
                          : "admin-profile__alert--error"
                      }`}
                    >
                      {passwordMessage.type === "success" ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <AlertCircle size={18} />
                      )}
                      <span>{passwordMessage.text}</span>
                    </div>
                  )}

                  <div className="admin-profile__field">
                    <label className="admin-profile__label">Current Password</label>
                    <div className="admin-profile__input-wrapper">
                      <Lock size={16} className="admin-profile__input-icon" />
                      <input
                        type="password"
                        className="admin-profile__input"
                        placeholder="••••••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-profile__form-row">
                    <div className="admin-profile__field">
                      <label className="admin-profile__label">New Password</label>
                      <div className="admin-profile__input-wrapper">
                        <Lock size={16} className="admin-profile__input-icon" />
                        <input
                          type="password"
                          className="admin-profile__input"
                          placeholder="Min. 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="admin-profile__field">
                      <label className="admin-profile__label">Confirm New Password</label>
                      <div className="admin-profile__input-wrapper">
                        <Lock size={16} className="admin-profile__input-icon" />
                        <input
                          type="password"
                          className="admin-profile__input"
                          placeholder="Confirm match"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="admin-profile__btn-submit"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={16} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Permissions Matrix & Operational Preferences */}
        <div className="admin-profile__col">
          {/* Permissions Matrix */}
          <div className="admin-profile__card">
            <div className="admin-profile__card-header">
              <div className="admin-profile__card-title-group">
                <div className="admin-profile__card-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h2 className="admin-profile__card-title">Access Privileges Matrix</h2>
                  <p className="admin-profile__card-subtitle">
                    Authorized system operations granted to role: {admin.role}
                  </p>
                </div>
              </div>
            </div>

            <div className="admin-profile__card-body">
              <div className="admin-profile__permissions-list">
                <div className="admin-profile__permission-item">
                  <div className="admin-profile__permission-check">
                    <Check size={14} />
                  </div>
                  <div className="admin-profile__permission-content">
                    <span className="admin-profile__permission-title">
                      Orders & Logistics Operations
                    </span>
                    <span className="admin-profile__permission-desc">
                      Full view of registered & guest shipments, tracking generation, inline status
                      transitions (Pending → Delivered).
                    </span>
                  </div>
                </div>

                <div className="admin-profile__permission-item">
                  <div className="admin-profile__permission-check">
                    <Check size={14} />
                  </div>
                  <div className="admin-profile__permission-content">
                    <span className="admin-profile__permission-title">
                      Live Customer Inquiries & Chat
                    </span>
                    <span className="admin-profile__permission-desc">
                      Real-time customer communications, agent response dispatch, and session
                      lifecycle resolution.
                    </span>
                  </div>
                </div>

                <div className="admin-profile__permission-item">
                  <div className="admin-profile__permission-check">
                    <Check size={14} />
                  </div>
                  <div className="admin-profile__permission-content">
                    <span className="admin-profile__permission-title">
                      Support Tickets & SLA Resolution
                    </span>
                    <span className="admin-profile__permission-desc">
                      Access to platform ticket queues, priority escalations (Urgent/High), and
                      ticket status updates.
                    </span>
                  </div>
                </div>

                <div className="admin-profile__permission-item">
                  <div className="admin-profile__permission-check">
                    <Check size={14} />
                  </div>
                  <div className="admin-profile__permission-content">
                    <span className="admin-profile__permission-title">
                      Platform Security & User Oversight
                    </span>
                    <span className="admin-profile__permission-desc">
                      User role administration, account monitoring, and system operational audit
                      trail logging.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Preferences */}
          <div className="admin-profile__card">
            <div className="admin-profile__card-header">
              <div className="admin-profile__card-title-group">
                <div className="admin-profile__card-icon">
                  <Sliders size={18} />
                </div>
                <div>
                  <h2 className="admin-profile__card-title">Console Preferences</h2>
                  <p className="admin-profile__card-subtitle">
                    Configure your admin workspace notification preferences
                  </p>
                </div>
              </div>
            </div>

            <div className="admin-profile__card-body">
              <div className="admin-profile__preferences-list">
                <div className="admin-profile__preference-item">
                  <div className="admin-profile__preference-info">
                    <span className="admin-profile__preference-title">
                      New Order Inbound Alerts
                    </span>
                    <span className="admin-profile__preference-desc">
                      Receive real-time notifications when a customer books a dispatch
                    </span>
                  </div>
                  <label className="admin-profile__toggle">
                    <input
                      type="checkbox"
                      checked={newOrderAlerts}
                      onChange={(e) =>
                        handleTogglePreference(
                          "dopo_admin_order_alerts",
                          e.target.checked,
                          setNewOrderAlerts
                        )
                      }
                    />
                    <span className="admin-profile__slider"></span>
                  </label>
                </div>

                <div className="admin-profile__preference-item">
                  <div className="admin-profile__preference-info">
                    <span className="admin-profile__preference-title">
                      Urgent Ticket Escalations
                    </span>
                    <span className="admin-profile__preference-desc">
                      Highlight high and urgent tickets in the communications queue
                    </span>
                  </div>
                  <label className="admin-profile__toggle">
                    <input
                      type="checkbox"
                      checked={urgentTicketAlerts}
                      onChange={(e) =>
                        handleTogglePreference(
                          "dopo_admin_ticket_alerts",
                          e.target.checked,
                          setUrgentTicketAlerts
                        )
                      }
                    />
                    <span className="admin-profile__slider"></span>
                  </label>
                </div>

                <div className="admin-profile__preference-item">
                  <div className="admin-profile__preference-info">
                    <span className="admin-profile__preference-title">
                      Live Chat Notification Sound
                    </span>
                    <span className="admin-profile__preference-desc">
                      Play chime when a customer or guest sends an active inquiry
                    </span>
                  </div>
                  <label className="admin-profile__toggle">
                    <input
                      type="checkbox"
                      checked={liveChatSound}
                      onChange={(e) =>
                        handleTogglePreference(
                          "dopo_admin_chat_sound",
                          e.target.checked,
                          setLiveChatSound
                        )
                      }
                    />
                    <span className="admin-profile__slider"></span>
                  </label>
                </div>

                <div className="admin-profile__preference-item">
                  <div className="admin-profile__preference-info">
                    <span className="admin-profile__preference-title">
                      Daily Logistics Digest
                    </span>
                    <span className="admin-profile__preference-desc">
                      Receive daily summary reports of completed shipments & tickets
                    </span>
                  </div>
                  <label className="admin-profile__toggle">
                    <input
                      type="checkbox"
                      checked={dailyDigest}
                      onChange={(e) =>
                        handleTogglePreference(
                          "dopo_admin_daily_digest",
                          e.target.checked,
                          setDailyDigest
                        )
                      }
                    />
                    <span className="admin-profile__slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
