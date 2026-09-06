"use client"

import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '@/styles/landing/ServiceSection.scss';

import Link from 'next/link';

interface Service {
  id: string;
  title: string;
  description: string;
  actionText: string;
  href: string;
  icon: string;
}

const servicesData: Service[] = [
  {
    id: 'errands',
    title: 'Errand Running',
    description: "Need something handled but don't have the time? We take care of everyday tasks, pickups, collections, payments and other legitimate errands on your behalf.",
    actionText: 'Request an Errand',
    href: '/request?service=Errand%20Running',
    icon: '🏃‍♂️',
  },
  {
    id: 'delivery',
    title: 'Delivery Services',
    description: 'From documents and packages to groceries and business items, we get your items where they need to go—safely and efficiently.',
    actionText: 'Request a Delivery',
    href: '/request?service=Delivery%20Services',
    icon: '📦',
  },
  {
    id: 'shopping',
    title: 'Shopping Assistance',
    description: "Send us your shopping list and requirements. We'll source what you need within your preferred specifications and budget.",
    actionText: 'Request Shopping Assistance',
    href: '/request?service=Shopping%20Assistance',
    icon: '🛒',
  },
  {
    id: 'procurement',
    title: 'Procurement',
    description: 'We help individuals and businesses source products efficiently, from everyday purchases to bulk and specialized procurement needs.',
    actionText: 'Request Procurement',
    href: '/request?service=Procurement',
    icon: '🏢',
  },
  {
    id: 'price-check',
    title: 'Price Check & Market Survey',
    description: 'Want to know what something costs before you buy? We compare prices across available sellers and markets, helping you make informed purchasing decisions.',
    actionText: 'Request a Price Check',
    href: '/request?service=Price%20Check%20%26%20Market%20Survey',
    icon: '📊',
  },
  {
    id: 'hotel-reservation',
    title: 'Hotel Search & Reservation',
    description: "Looking for a place to stay? Tell us your destination, dates and budget, and we'll help you find suitable accommodation options and assist with reservations where applicable.",
    actionText: 'Find a Hotel',
    href: '/request?service=Hotel%20Search%20%26%20Reservation',
    icon: '🏨',
  },
];

export const ServicesSection = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      offset: 100,
    });
  }, []);

  return (
    <section className="services-section" id='services'>
      <div className="services-section__container">
        {/* Header */}
        <header className="services-section__header" data-aos="fade-up">
          <span className="services-section__badge">What We Do</span>
          <h2 className="services-section__title">Our Services</h2>
          <p className="services-section__subtitle">
            Whatever needs getting done, we've got it handled. From everyday errands to business procurement, DOPO provides reliable, convenient services designed to save you time, reduce the hassle and keep things moving.
          </p>
        </header>

        {/* Services Grid */}
        <div className="services-section__grid">
          {servicesData.map((service, index) => (
            <article
              key={service.id}
              className="services-card"
              data-aos="fade-up"
              data-aos-delay={100 * (index + 1)}
            >
              <div className="services-card__icon-wrapper" aria-hidden="true">
                <span className="services-card__icon">{service.icon}</span>
              </div>
              
              <div className="services-card__body">
                <h3 className="services-card__title">{service.title}</h3>
                <p className="services-card__description">{service.description}</p>
              </div>

              <div className="services-card__footer">
                <Link href={service.href} className="services-card__link">
                  <span>{service.actionText}</span>
                  <svg
                    className="services-card__arrow"
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};