"use client"

import { useEffect } from "react"
import AOS from "aos"
import "aos/dist/aos.css"
import { ArrowRight, Zap, ShieldCheck, Globe } from "lucide-react"
import LinkButton from "../essentials/LinkButton"
import "@/styles/landing/HeroSection.scss"

export const HeroSection = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            once: true,
            easing: "ease-out-cubic",
        });
    }, []);

    return (
        <section className="hero-section">
            <div className="hero-bg-container">
                <img 
                    src="/background.jfif" 
                    alt="DOPO logistics background"
                    className="hero-image" 
                />
                <div className="hero-overlay" />
                <div className="hero-glow" />
            </div>

            <div className="hero-content">
                <div className="hero-badge" data-aos="fade-down" data-aos-duration="700">
                    <span className="badge-dot" />
                    <span>Global Logistics &amp; Smart Procurement</span>
                </div>

                <div className="hero-text-block">
                    <h1 data-aos="fade-up" data-aos-duration="800" data-aos-delay="100">
                        DOPO Logistics &amp; <span className="gradient-text">Procurement Services</span>
                    </h1>
                    <h3 data-aos="fade-up" data-aos-duration="800" data-aos-delay="200">
                        Let your errands be our responsibility
                    </h3>
                    <p data-aos="fade-up" data-aos-duration="800" data-aos-delay="300">
                        Sourcing quality products and delivering them to your doorstep with speed, transparency, and uncompromising security.
                    </p>
                </div>

                <div className="hero-actions" data-aos="fade-up" data-aos-duration="800" data-aos-delay="400">
                    <LinkButton href="/register" className="btn-primary">
                        <span>Get Started</span>
                        <ArrowRight size={18} className="btn-icon" />
                    </LinkButton>
                    <LinkButton href="#services" className="btn-secondary">
                        <span>Explore Services</span>
                    </LinkButton>
                </div>

                <div className="hero-features" data-aos="fade-up" data-aos-duration="800" data-aos-delay="500">
                    <div className="feature-item">
                        <Zap size={16} className="feature-icon" color="#38bdf8" />
                        <span>Fast Delivery</span>
                    </div>
                    <div className="feature-item">
                        <ShieldCheck size={16} className="feature-icon" color="#34d399" />
                        <span>Secure Handling</span>
                    </div>
                    <div className="feature-item">
                        <Globe size={16} className="feature-icon" color="#818cf8" />
                        <span>End-to-End Tracking</span>
                    </div>
                </div>
            </div>

            <a href="#services" className="hero-scroll-indicator" aria-label="Scroll to services">
                <span className="mouse">
                    <span className="wheel" />
                </span>
            </a>
        </section>
    )
}