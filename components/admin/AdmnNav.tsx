"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  MessageSquare, 
  User, 
  LogOut, 
  Bell, 
  Menu, 
  X,
  ShieldCheck
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const adminNavItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Chat", href: "/admin/chat", icon: MessageSquare },
  { label: "Profile", href: "/admin/profile", icon: User },
];

export const AdminNav = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobileNav = () => setMobileOpen((prev) => !prev);

  return (
    <>
      {/* Top Header Bar */}
      <header className="admin-topbar">
        <div className="admin-topbar__left">
          <button 
            type="button" 
            className="admin-topbar__menu-toggle"
            onClick={toggleMobileNav}
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link href="/admin/dashboard" className="admin-topbar__brand">
            <img src="/logo.png" alt="DOPO Logistics Logo" className="admin-topbar__logo-img" />
            <span className="admin-topbar__badge">
              <ShieldCheck size={14} /> ADMIN
            </span>
          </Link>
        </div>

        <div className="admin-topbar__right">
          <button type="button" className="admin-topbar__icon-btn" aria-label="Notifications">
            <Bell size={20} />
          </button>
          
          <div className="admin-topbar__profile">
            <div className="admin-topbar__avatar">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="admin-topbar__user-info">
              <span className="admin-topbar__user-name">{session?.user?.name || "Admin User"}</span>
              <span className="admin-topbar__user-email">{session?.user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div 
          className="admin-sidebar-backdrop" 
          onClick={() => setMobileOpen(false)} 
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${mobileOpen ? "admin-sidebar--open" : ""}`}>
        <div className="admin-sidebar__header">
          <Link href="/admin/dashboard" className="admin-sidebar__logo">
            <img src="/logo.png" alt="DOPO Admin Logo" className="admin-sidebar__logo-img" />
          </Link>
        </div>

        <nav className="admin-sidebar__nav">
          <ul className="admin-sidebar__list">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href} className="admin-sidebar__item">
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`admin-sidebar__link ${isActive ? "admin-sidebar__link--active" : ""}`}
                  >
                    <Icon className="admin-sidebar__icon" size={20} />
                    <span className="admin-sidebar__label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="admin-sidebar__footer">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="admin-sidebar__logout-btn"
          >
            <LogOut size={20} />
            <span className="admin-sidebar__label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};