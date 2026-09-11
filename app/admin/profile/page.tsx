import React, { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminProfileView } from "@/components/admin/AdminProfileView";
import { Loader } from "@/components/essentials/Loader";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";
import { OrderStatus, TicketStatus, ChatStatus } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Profile & Security Center | DOPO Logistics Operations Hub",
  description:
    "Manage your administrative credentials, security settings, platform oversight permissions, and operations console preferences.",
};

export default async function AdminProfilePage() {
  const session = await auth();

  // 1. Enforce authentication
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/profile");
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
            . Administrative credentials are required to view the operations profile console.
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
              href="/login?callbackUrl=/admin/profile"
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

  // 3. Concurrently fetch admin user profile & platform-wide metrics
  let userRecord = null;
  let totalOrders = 0;
  let activeOrders = 0;
  let totalTickets = 0;
  let openTickets = 0;
  let totalChats = 0;
  let activeChats = 0;
  let totalUsers = 0;

  try {
    const [user, orders, tickets, chats, usersCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          accounts: {
            select: { provider: true },
          },
        },
      }),
      prisma.order.findMany({ select: { status: true } }),
      prisma.ticket.findMany({ select: { status: true } }),
      prisma.chatSession.findMany({ select: { status: true } }),
      prisma.user.count(),
    ]);

    userRecord = user;
    totalOrders = orders.length;
    activeOrders = orders.filter(
      (o) =>
        o.status === OrderStatus.PENDING ||
        o.status === OrderStatus.CONFIRMED ||
        o.status === OrderStatus.IN_PROGRESS ||
        o.status === OrderStatus.PICKED_UP
    ).length;

    totalTickets = tickets.length;
    openTickets = tickets.filter(
      (t) =>
        t.status === TicketStatus.OPEN ||
        t.status === TicketStatus.IN_PROGRESS ||
        t.status === TicketStatus.WAITING_FOR_CUSTOMER
    ).length;

    totalChats = chats.length;
    activeChats = chats.filter(
      (c) => c.status === ChatStatus.ACTIVE || c.status === ChatStatus.WAITING
    ).length;

    totalUsers = usersCount;
  } catch (error) {
    console.error("Error fetching admin profile data:", error);
  }

  const isOAuthUser = userRecord?.accounts?.some((a) => a.provider === "google") ?? false;

  const adminData = {
    id: userRecord?.id || session.user.id,
    name: userRecord?.name || session.user.name || null,
    email: userRecord?.email || session.user.email || "",
    phone: userRecord?.phone || null,
    role: userRecord?.role || session.user.role || "ADMIN",
    image: userRecord?.image || session.user.image || null,
    emailVerified: userRecord?.emailVerified ? userRecord.emailVerified.toISOString() : null,
    createdAt: userRecord?.createdAt ? userRecord.createdAt.toISOString() : new Date().toISOString(),
    isOAuthUser,
  };

  const metrics = {
    totalOrders,
    activeOrders,
    totalTickets,
    openTickets,
    totalChats,
    activeChats,
    totalUsers,
  };

  return (
    <Suspense fallback={<Loader message="Loading administrator profile..." fullscreen={false} />}>
      <AdminProfileView admin={adminData} metrics={metrics} />
    </Suspense>
  );
}
