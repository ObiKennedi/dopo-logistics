"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MessageSquare, 
  User, 
  Compass, 
  PlusCircle,
  LogOut
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Request", href: "/user-request", icon: PlusCircle },
  { label: "Track", href: "/user-track", icon: Compass },
  { label: "Support", href: "/support", icon: MessageSquare },
  { label: "Profile", href: "/profile", icon: User },
];

export const UserNav = () => {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar for Desktop / Tablet */}
      <aside className="dopo-sidebar">
        <div className="dopo-sidebar__header">
          <Link href="/dashboard" className="dopo-sidebar__logo">
            <img src="/logo.png" alt="DOPO Logo" className="dopo-sidebar__logo-img" />
          </Link>
        </div>

        <nav className="dopo-sidebar__nav">
          <ul className="dopo-sidebar__list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href} className="dopo-sidebar__item">
                  <Link
                    href={item.href}
                    className={`dopo-sidebar__link ${isActive ? "dopo-sidebar__link--active" : ""}`}
                  >
                    <Icon className="dopo-sidebar__icon" size={20} />
                    <span className="dopo-sidebar__label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="dopo-sidebar__footer">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="dopo-sidebar__logout-btn"
          >
            <LogOut size={20} />
            <span className="dopo-sidebar__label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Bottom Navigation for Mobile */}
      <nav className="dopo-mobile-nav">
        <ul className="dopo-mobile-nav__list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href} className="dopo-mobile-nav__item">
                <Link
                  href={item.href}
                  className={`dopo-mobile-nav__link ${isActive ? "dopo-mobile-nav__link--active" : ""}`}
                >
                  <Icon className="dopo-mobile-nav__icon" size={22} />
                  <span className="dopo-mobile-nav__label">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
};