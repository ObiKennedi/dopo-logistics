import React from "react";
import { AdminNav } from "@/components/admin/AdmnNav";
import { SessionProvider } from "next-auth/react";
import "@/styles/admin/AdminNav.scss";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-dashboard-layout">
        <SessionProvider>
    
    
      {/* Sidebar & Top Navigation */}
      <AdminNav />

      {/* Main Admin Content Area */}
      <main className="admin-dashboard-layout__content">
        <div className="admin-dashboard-layout__container">
          {children}
        </div>
      </main>
      </SessionProvider>
    </div>
  );
}