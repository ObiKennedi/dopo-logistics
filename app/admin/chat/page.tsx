import React, { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { fetchAdminAllTicketsAction } from "@/actions/ticketActions";
import { fetchAdminChatsAction } from "@/actions/chatActions";
import { AdminChatView } from "@/components/admin/AdminChatView";
import { Loader } from "@/components/essentials/Loader";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogIn, RefreshCw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Communications & Support Console | DOPO Logistics Operations Hub",
  description:
    "Unified customer communications center for managing customer support tickets, priority queues, and live interactive chat inquiries.",
};

export default async function AdminChatPage() {
  const session = await auth();

  // 1. Enforce authentication
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/chat");
  }

  // 2. Enforce Administrator or Staff role
  if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
    return (
      <div
        style={{
          minHeight: "75vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
        }}
      >
        <div
          style={{
            maxWidth: "520px",
            width: "100%",
            background: "#ffffff",
            border: "1px solid #fee2e2",
            borderRadius: "20px",
            padding: "2.5rem 2rem",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(10, 24, 84, 0.06)",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem auto",
            }}
          >
            <ShieldAlert size={32} color="#dc2626" />
          </div>

          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: "0.75rem",
            }}
          >
            Elevated Access Required
          </h2>

          <p
            style={{
              fontSize: "0.95rem",
              color: "#64748b",
              lineHeight: 1.6,
              marginBottom: "1.5rem",
            }}
          >
            You are signed in as <strong style={{ color: "#0f172a" }}>{session.user.email}</strong> with role{" "}
            <span
              style={{
                display: "inline-block",
                padding: "0.15rem 0.6rem",
                borderRadius: "999px",
                background: "#eff6ff",
                color: "#1d4ed8",
                fontWeight: 600,
                fontSize: "0.8rem",
              }}
            >
              {session.user.role}
            </span>
            . Administrative privileges are required to participate in customer support channels and chat sessions.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <Link
              href="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.85rem 1.5rem",
                borderRadius: "12px",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.95rem",
                textDecoration: "none",
                transition: "background 0.2s ease",
              }}
            >
              <ArrowLeft size={18} />
              <span>Return to Client Dashboard</span>
            </Link>

            <Link
              href="/login?callbackUrl=/admin/chat"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.85rem 1.5rem",
                borderRadius: "12px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#334155",
                fontWeight: 600,
                fontSize: "0.95rem",
                textDecoration: "none",
              }}
            >
              <LogIn size={18} />
              <span>Switch to Administrative Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Concurrently fetch all tickets and live customer chat sessions
  const [ticketsResult, chatsResult] = await Promise.all([
    fetchAdminAllTicketsAction(),
    fetchAdminChatsAction(),
  ]);

  if (ticketsResult.error && chatsResult.error) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "2rem",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(10, 24, 84, 0.05)",
          }}
        >
          <ShieldAlert size={36} color="#d97706" style={{ margin: "0 auto 1rem auto" }} />
          <h3
            style={{
              color: "#0f172a",
              fontSize: "1.25rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            Communications Hub Offline
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            {ticketsResult.error || chatsResult.error || "Unable to synchronize support communications."}
          </p>
          <Link
            href="/admin/chat"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.25rem",
              borderRadius: "10px",
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            <RefreshCw size={15} />
            <span>Retry Connection</span>
          </Link>
        </div>
      </div>
    );
  }

  const initialTickets = ticketsResult.data?.tickets || [];
  const initialChats = chatsResult.data?.chats || [];
  const ticketStats = ticketsResult.data?.stats || {
    ALL: 0,
    OPEN: 0,
    IN_PROGRESS: 0,
    WAITING_FOR_CUSTOMER: 0,
    RESOLVED: 0,
    CLOSED: 0,
  };
  const chatStats = chatsResult.data?.stats || {
    ALL: 0,
    ACTIVE: 0,
    WAITING: 0,
    CLOSED: 0,
  };

  return (
    <Suspense
      fallback={
        <Loader message="Synchronizing customer conversations..." fullscreen={false} />
      }
    >
      <AdminChatView
        initialTickets={initialTickets}
        initialChats={initialChats}
        ticketStats={ticketStats}
        chatStats={chatStats}
      />
    </Suspense>
  );
}
