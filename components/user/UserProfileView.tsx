"use client";

import React, { useState } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  LogOut, 
  Package, 
  Clock, 
  MessageSquare, 
  RefreshCw, 
  Calendar,
  KeyRound,
  ShieldCheck,
  Check
} from "lucide-react";
import { signOut } from "next-auth/react";
import { updateUserProfileAction, changePasswordAction } from "@/actions/userActions";
import "@/styles/user/UserProfile.scss";

export interface UserProfileData {
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

export interface UserProfileStats {
  totalOrders: number;
  activeOrders: number;
  totalTickets: number;
}

interface UserProfileViewProps {
  user: UserProfileData;
  stats: UserProfileStats;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  stats,
}) => {
  // Personal Details State
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sign out confirmation / loading
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

    const res = await updateUserProfileAction(null, formData);

    if (res.error) {
      setProfileMessage({ type: "error", text: res.error });
    } else if (res.success) {
      setProfileMessage({ type: "success", text: res.success });
      setTimeout(() => setProfileMessage(null), 4000);
    }

    setIsUpdatingProfile(false);
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      setIsChangingPassword(false);
      return;
    }

    const formData = new FormData();
    formData.append("currentPassword", currentPassword);
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);

    const res = await changePasswordAction(null, formData);

    if (res.error) {
      setPasswordMessage({ type: "error", text: res.error });
    } else if (res.success) {
      setPasswordMessage({ type: "success", text: res.success });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMessage(null), 4000);
    }

    setIsChangingPassword(false);
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return "U";
    const parts = nameStr.trim().split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  };

  const formattedJoinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="user-profile">
      {/* Hero Header Card */}
      <div className="user-profile__hero">
        <div className="user-profile__user-group">
          <div className="user-profile__avatar">
            {user.image ? (
              <img src={user.image} alt={user.name || "User Avatar"} />
            ) : (
              <span>{getInitials(user.name || user.email)}</span>
            )}
          </div>

          <div className="user-profile__info">
            <h1 className="user-profile__name">{user.name || "Customer Account"}</h1>
            <div className="user-profile__email-row">
              <Mail size={15} />
              <span>{user.email}</span>
              <span style={{ color: "#cbd5e1" }}>•</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Calendar size={14} />
                <span>Joined {formattedJoinDate}</span>
              </div>
            </div>

            <div className="user-profile__tags">
              <span className="user-profile__badge-role">
                {user.role === "ADMIN" || user.role === "STAFF" ? "Staff / Dispatch" : "Customer"}
              </span>

              {user.emailVerified ? (
                <span className="user-profile__badge-verified">
                  <CheckCircle2 size={13} />
                  <span>Verified Account</span>
                </span>
              ) : (
                <span className="user-profile__badge-unverified">
                  <AlertCircle size={13} />
                  <span>Unverified Email</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Log Out Button */}
        <div className="user-profile__hero-actions">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="user-profile__hero-logout-btn"
            title="Sign out of your account"
          >
            {isLoggingOut ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <LogOut size={16} />
            )}
            <span>{isLoggingOut ? "Signing out..." : "Log Out"}</span>
          </button>
        </div>
      </div>

      {/* Stats Counters */}
      <div className="user-profile__stats">
        <div className="user-profile__stat-card">
          <div className="user-profile__stat-card-icon user-profile__stat-card-icon--blue">
            <Package size={22} />
          </div>
          <div>
            <div className="user-profile__stat-card-value">{stats.totalOrders}</div>
            <div className="user-profile__stat-card-label">Total Orders Placed</div>
          </div>
        </div>

        <div className="user-profile__stat-card">
          <div className="user-profile__stat-card-icon user-profile__stat-card-icon--amber">
            <Clock size={22} />
          </div>
          <div>
            <div className="user-profile__stat-card-value">{stats.activeOrders}</div>
            <div className="user-profile__stat-card-label">Active / Ongoing Shipments</div>
          </div>
        </div>

        <div className="user-profile__stat-card">
          <div className="user-profile__stat-card-icon user-profile__stat-card-icon--purple">
            <MessageSquare size={22} />
          </div>
          <div>
            <div className="user-profile__stat-card-value">{stats.totalTickets}</div>
            <div className="user-profile__stat-card-label">Support Inquiries</div>
          </div>
        </div>

        <div className="user-profile__stat-card">
          <div className="user-profile__stat-card-icon user-profile__stat-card-icon--green">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="user-profile__stat-card-value" style={{ fontSize: "1.15rem", color: "#16a34a" }}>
              Active
            </div>
            <div className="user-profile__stat-card-label">Security & Status</div>
          </div>
        </div>
      </div>

      {/* Profile Form Grid */}
      <div className="user-profile__grid">
        {/* Personal Details */}
        <div className="user-profile__card">
          <div className="user-profile__card-header">
            <User size={18} color="#2563eb" />
            <h2 className="user-profile__card-title">Personal Details</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="user-profile__card-body">
            {profileMessage && (
              <div
                className={`user-profile__alert ${
                  profileMessage.type === "success"
                    ? "user-profile__alert--success"
                    : "user-profile__alert--error"
                }`}
              >
                {profileMessage.type === "success" ? (
                  <Check size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <div className="user-profile__field">
              <label className="user-profile__label">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your full name"
                className="user-profile__input"
              />
            </div>

            <div className="user-profile__field">
              <label className="user-profile__label">Email Address (Read-only)</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="user-profile__input"
              />
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                Email address is tied to your login and order history.
              </span>
            </div>

            <div className="user-profile__field">
              <label className="user-profile__label">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="user-profile__input"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="user-profile__save-btn"
            >
              {isUpdatingProfile ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </form>
        </div>

        {/* Security / Password */}
        <div className="user-profile__card">
          <div className="user-profile__card-header">
            <Lock size={18} color="#2563eb" />
            <h2 className="user-profile__card-title">Password & Security</h2>
          </div>

          <form onSubmit={handleChangePassword} className="user-profile__card-body">
            {passwordMessage && (
              <div
                className={`user-profile__alert ${
                  passwordMessage.type === "success"
                    ? "user-profile__alert--success"
                    : "user-profile__alert--error"
                }`}
              >
                {passwordMessage.type === "success" ? (
                  <Check size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            {!user.isOAuthUser && (
              <div className="user-profile__field">
                <label className="user-profile__label">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="user-profile__input"
                />
              </div>
            )}

            <div className="user-profile__field">
              <label className="user-profile__label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="user-profile__input"
              />
            </div>

            <div className="user-profile__field">
              <label className="user-profile__label">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Re-enter new password"
                className="user-profile__input"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword || !newPassword || !confirmPassword}
              className="user-profile__save-btn"
            >
              {isChangingPassword ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <KeyRound size={15} />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Account Session & Danger Zone */}
      <div className="user-profile__card user-profile__card--danger">
        <div className="user-profile__card-header user-profile__card-header--danger">
          <LogOut size={18} color="#dc2626" />
          <h2 className="user-profile__card-title user-profile__card-title--danger">
            Account Session & Sign Out
          </h2>
        </div>

        <div className="user-profile__card-body">
          <p className="user-profile__danger-desc">
            Logging out will end your current session on this device. You will need your email and password or Google login to sign back in.
          </p>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="user-profile__danger-btn"
          >
            {isLoggingOut ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <LogOut size={16} />
            )}
            <span>{isLoggingOut ? "Signing out..." : "Log Out of DOPO Logistics"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
