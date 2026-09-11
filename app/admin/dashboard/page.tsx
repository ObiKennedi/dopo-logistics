import React, { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { fetchAdminDashboardDataAction } from "@/actions/adminActions";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";
import { Loader } from "@/components/essentials/Loader";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogIn, RefreshCw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | DOPO Logistics Operations Hub",
  description: "Centralized administration console for managing DOPO clients, dispatches, orders, and support tickets.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const session = await auth();

  // 1. Enforce authentication
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/dashboard");
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
            . Administrative privileges are required to view user dossiers, dispatches, and tickets.
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
              href="/login?callbackUrl=/admin/dashboard"
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

  // 3. Resolve initial tab from URL params if provided
  const resolvedParams = await searchParams;
  const rawTab = typeof resolvedParams?.tab === "string" ? resolvedParams.tab.toLowerCase() : "";
  const initialTab =
    rawTab === "orders" ? "orders" : rawTab === "tickets" ? "tickets" : "users";

  // 4. Fetch dashboard data
  const result = await fetchAdminDashboardDataAction();

  if (result.error || !result.data) {
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
          <h3 style={{ color: "#0f172a", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Unable to Load Dashboard
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            {result.error || "A connection issue occurred while retrieving platform records."}
          </p>
          <Link
            href="/admin/dashboard"
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

  return (
    <Suspense fallback={<Loader message="Synchronizing administrative metrics..." fullscreen={false} />}>
      <AdminDashboardView initialData={result.data} initialTab={initialTab} />
    </Suspense>
  );
}