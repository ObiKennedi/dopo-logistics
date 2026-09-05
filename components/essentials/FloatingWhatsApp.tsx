"use client"

import React from 'react';
import { FaWhatsapp } from 'react-icons/fa6';
import '@/styles/essentials/FloatingWhatsApp.scss';

interface FloatingWhatsAppProps {
  phoneNumber?: string;
  message?: string;
  tooltipText?: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  phoneNumber = '2340000000000',
  message = 'Hello DOPO Logistics, I would like to inquire about your services.',
  tooltipText = 'Chat with us on WhatsApp',
}) => {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="floating-whatsapp"
      aria-label="Contact DOPO Logistics on WhatsApp"
    >
      <span className="floating-whatsapp__tooltip">{tooltipText}</span>
      <div className="floating-whatsapp__btn">
        <FaWhatsapp className="floating-whatsapp__icon" />
      </div>
    </a>
  );
};

export default FloatingWhatsApp;
