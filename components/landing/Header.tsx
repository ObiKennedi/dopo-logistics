"use client"

import LinkButton from "../essentials/LinkButton"
import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"
import "@/styles/landing/Header.scss"

const NavLinks = [
    {
        label: "Home",
        href: "#",
    },
    {
        label: "About Us",
        href: "#about",
    },
    {
        label: "Services",
        href: "#services",
    },
    {
        label: "Contact Us",
        href: "#contact",
    },
]

const Header = () => {
    const [showMenu, setShowMenu] = useState(false);
    const [isScrolled, setIscrolled] = useState<boolean>(false)

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 100) {
                setIscrolled(true);
            } else {
                setIscrolled(false);
            }
        }
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className={`landing-header ${isScrolled ? 'scrolled' : ''}`}>
            <a href="/">
                <img
                    src="/logo.png" 
                    alt="logo" 
                />
            </a>
            <nav className={`${showMenu ? 'show' : ''} nav-links`}>
                <ul>
                    {NavLinks.map((link, index) => (
                        <li key={index}>
                            <a href={link.href}>{link.label}</a>
                        </li>
                    ))}
                </ul>
                <LinkButton
                    className="auth-link"
                    href="/login"
                > Get Started</LinkButton>
            </nav>
            <button className="mobile-menu-toggle" onClick={() => setShowMenu(!showMenu)}>
                {showMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
        </header>
    )
}

export default Header