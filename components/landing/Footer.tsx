import React from 'react';
import '@/styles/landing/Footer.scss';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">
        {/* Top Grid Section */}
        <div className="footer__grid">
          {/* Brand & Bio Column */}
          <div className="footer__brand-col">
            <div className="footer__logo">
              <span className="footer__logo-mark">D</span>
              <div className="footer__logo-text">
                <span className="footer__logo-title">DOPO</span>
                <span className="footer__logo-tagline">LOGISTICS & PROCUREMENT</span>
              </div>
            </div>
            <p className="footer__description">
              Making everyday tasks easier. Reliable, convenient logistics, errands, and procurement services starting from Owerri, Imo State, Nigeria.
            </p>
            <div className="footer__motto">
              <span>Your Errand. Our Responsibility.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer__nav-col">
            <h4 className="footer__heading">Quick Links</h4>
            <ul className="footer__list">
              <li><a href="#about" className="footer__link">About DOPO</a></li>
              <li><a href="#services" className="footer__link">Our Services</a></li>
              <li><a href="#why-us" className="footer__link">Why Choose Us</a></li>
              <li><a href="#contact" className="footer__link">Contact & Support</a></li>
            </ul>
          </div>

          {/* Our Services */}
          <div className="footer__nav-col">
            <h4 className="footer__heading">Services</h4>
            <ul className="footer__list">
              <li><a href="#services" className="footer__link">Errand Running</a></li>
              <li><a href="#services" className="footer__link">Delivery Services</a></li>
              <li><a href="#services" className="footer__link">Shopping Assistance</a></li>
              <li><a href="#services" className="footer__link">Procurement</a></li>
              <li><a href="#services" className="footer__link">Price Check & Survey</a></li>
              <li><a href="#services" className="footer__link">Hotel Search & Booking</a></li>
            </ul>
          </div>

          {/* Direct Contact Info */}
          <div className="footer__nav-col">
            <h4 className="footer__heading">Reach Us</h4>
            <ul className="footer__contact-list">
              <li>
                <span className="footer__contact-label">Location:</span>
                <span className="footer__contact-val">Owerri, Imo State, Nigeria</span>
              </li>
              <li>
                <span className="footer__contact-label">Phone:</span>
                <a href="tel:+2340000000000" className="footer__link">+234 (0) 000 000 0000</a>
              </li>
              <li>
                <span className="footer__contact-label">Email:</span>
                <a href="mailto:hello@dopo.ng" className="footer__link">hello@dopo.ng</a>
              </li>
              <li>
                <span className="footer__contact-label">WhatsApp:</span>
                <a 
                  href="https://wa.me/2340000000000" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="footer__link footer__link--whatsapp"
                >
                  Chat on WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider Line */}
        <hr className="footer__divider" />

        {/* Bottom Bar Section */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            &copy; {currentYear} DOPO Logistics & Procurement. All rights reserved.
          </p>
          <div className="footer__legal">
            <a href="#privacy" className="footer__legal-link">Privacy Policy</a>
            <span className="footer__legal-dot">•</span>
            <a href="#terms" className="footer__legal-link">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};