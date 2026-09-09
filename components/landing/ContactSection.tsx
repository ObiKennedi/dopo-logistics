"use client"

import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Phone, Mail, MapPin } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import '@/styles/landing/ContactSection.scss';

export const ContactSection = () => {
  const [result, setResult] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      offset: 100,
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setResult('Sending your message...');

    const formData = new FormData(event.currentTarget);
    // Add your Web3Forms access key here
    formData.append('access_key', 'd359094e-60c1-46f7-969d-7de4cd093294');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult('Thank you! Your message has been sent successfully.');
        (event.target as HTMLFormElement).reset();
      } else {
        setResult(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setResult('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact-section" id="contact">
      <div className="contact-section__container">
        {/* Header */}
        <header className="contact-section__header" data-aos="fade-up">
          <span className="contact-section__badge">Get In Touch</span>
          <h2 className="contact-section__title">Contact Us</h2>
          <p className="contact-section__subtitle">
            Have an errand to run, a product to source, or a delivery to make? Reach out to us or send us a message below.
          </p>
        </header>

        <div className="contact-section__grid">
          {/* Left Column: Direct Info Cards */}
          <div className="contact-section__info">
            {/* WhatsApp */}
            <a
              href="https://wa.me/2340000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-card contact-card--whatsapp"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <div className="contact-card__icon-wrapper">
                <FaWhatsapp size={22} className="contact-card__icon" />
              </div>
              <div className="contact-card__content">
                <span className="contact-card__label">Instant Chat</span>
                <h3 className="contact-card__value">WhatsApp Us</h3>
              </div>
            </a>

            {/* Phone */}
            <a
              href="tel:+2340000000000"
              className="contact-card"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <div className="contact-card__icon-wrapper">
                <Phone size={22} className="contact-card__icon" />
              </div>
              <div className="contact-card__content">
                <span className="contact-card__label">Call Us</span>
                <h3 className="contact-card__value">+234 (0) 000 000 0000</h3>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:contact@dopo.delivery"
              className="contact-card"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <div className="contact-card__icon-wrapper">
                <Mail size={22} className="contact-card__icon" />
              </div>
              <div className="contact-card__content">
                <span className="contact-card__label">Email Us</span>
                <h3 className="contact-card__value">contact@dopo.delivery</h3>
              </div>
            </a>

            {/* Address */}
            <div
              className="contact-card contact-card--static"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <div className="contact-card__icon-wrapper">
                <MapPin size={22} className="contact-card__icon" />
              </div>
              <div className="contact-card__content">
                <span className="contact-card__label">Location</span>
                <h3 className="contact-card__value">Owerri, Imo State, Nigeria</h3>
              </div>
            </div>
          </div>

          {/* Right Column: Web3Forms Contact Form */}
          <div className="contact-section__form-wrapper" data-aos="fade-left" data-aos-delay="200">
            <form onSubmit={handleSubmit} className="contact-form">
              <h3 className="contact-form__title">Send a Direct Message</h3>

              {/* Botcheck Spam Protection */}
              <input type="checkbox" name="botcheck" className="contact-form__botcheck" style={{ display: 'none' }} />

              <div className="contact-form__group">
                <label htmlFor="name" className="contact-form__label">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. John Doe"
                  className="contact-form__input"
                />
              </div>

              <div className="contact-form__row">
                <div className="contact-form__group">
                  <label htmlFor="email" className="contact-form__label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="john@example.com"
                    className="contact-form__input"
                  />
                </div>

                <div className="contact-form__group">
                  <label htmlFor="phone" className="contact-form__label">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="+234..."
                    className="contact-form__input"
                  />
                </div>
              </div>

              <div className="contact-form__group">
                <label htmlFor="service" className="contact-form__label">Service Needed</label>
                <select id="service" name="service" className="contact-form__select">
                  <option value="Errand Running">Errand Running</option>
                  <option value="Delivery Services">Delivery Services</option>
                  <option value="Shopping Assistance">Shopping Assistance</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Price Check">Price Check & Market Survey</option>
                  <option value="Hotel Search">Hotel Search & Reservation</option>
                  <option value="Other">Other Inquiry</option>
                </select>
              </div>

              <div className="contact-form__group">
                <label htmlFor="message" className="contact-form__label">Message / Details</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  placeholder="Describe what you need handled..."
                  className="contact-form__textarea"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="contact-form__submit"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>

              {result && (
                <div className={`contact-form__result ${result.includes('Thank you') ? 'contact-form__result--success' : ''}`}>
                  {result}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};