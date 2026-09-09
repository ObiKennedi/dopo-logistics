"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BiArrowBack } from "react-icons/bi";
import { Menu, X } from "lucide-react";
import LinkButton from "../essentials/LinkButton";
import "@/styles/quatre/Navigation.scss";

export function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="quatre-nav" ref={navRef}>
      <div className="quatre-nav__container">
        <div className="quatre-nav__left">
          <LinkButton href="/" className="quatre-nav__back-btn" aria-label="Go to Home">
            <BiArrowBack />
          </LinkButton>
          <Link href="/" className="quatre-nav__logo-link" onClick={closeMenu}>
            <img src="/logo.png" alt="DOPO Logistics Logo" className="logo" />
          </Link>
        </div>

        {/* Desktop Menu */}
        <nav className="quatre-nav__desktop-menu">
          <ul>
            <li>
              <Link
                href="/track"
                className={`quatre-nav__link ${pathname === "/track" ? "quatre-nav__link--active" : ""}`}
              >
                Track an order
              </Link>
            </li>
            <li>
              <Link
                href="/request"
                className={`quatre-nav__link quatre-nav__link--cta ${pathname === "/request" ? "quatre-nav__link--cta-active" : ""}`}
              >
                Place an order
              </Link>
            </li>
            <li>
              <LinkButton
                className="auth-link auth-link--signup"
                href="/register"
              >
                Create an Account
              </LinkButton>
            </li>
            <li>
              <LinkButton
                className="auth-link auth-link--login"
                href="/login"
              >
                Login
              </LinkButton>
            </li>
          </ul>
        </nav>

        {/* Mobile / Tablet Menu Toggle */}
        <button
          type="button"
          className="quatre-nav__toggle"
          onClick={toggleMenu}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      <div className={`quatre-nav__dropdown ${isOpen ? "quatre-nav__dropdown--open" : ""}`}>
        <div className="quatre-nav__dropdown-inner">
          <ul className="quatre-nav__dropdown-list">
            <li>
              <Link
                href="/track"
                onClick={closeMenu}
                className={`quatre-nav__dropdown-link ${pathname === "/track" ? "quatre-nav__dropdown-link--active" : ""}`}
              >
                Track an order
              </Link>
            </li>
            <li>
              <Link
                href="/request"
                onClick={closeMenu}
                className={`quatre-nav__dropdown-link quatre-nav__dropdown-link--cta ${pathname === "/request" ? "quatre-nav__dropdown-link--cta-active" : ""}`}
              >
                Place an order
              </Link>
            </li>
          </ul>

          <div className="quatre-nav__dropdown-auth">
            <LinkButton
              className="auth-link auth-link--signup"
              href="/register"
              onClick={closeMenu}
            >
              Create an Account
            </LinkButton>
            <LinkButton
              className="auth-link auth-link--login"
              href="/login"
              onClick={closeMenu}
            >
              Login
            </LinkButton>
          </div>
        </div>
      </div>
    </header>
  );
}

