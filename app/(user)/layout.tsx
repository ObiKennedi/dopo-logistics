import React from "react";
import { UserNav } from "@/components/user/UserNav";
import { Loader } from "@/components/essentials/Loader";
import { Suspense } from "react";
import "@/styles/user/UserNav.scss";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="user-dashboard-layout">
      {/* Desktop Sidebar & Mobile Bottom Nav */}
      <UserNav />

      {/* Main Content Area */}
      <main className="user-dashboard-layout__content">
        <Suspense fallback={<Loader message="Loading user dashboard..." fullscreen={false} />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}