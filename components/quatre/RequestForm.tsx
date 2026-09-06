"use client"

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import "@/styles/quatre/RequestForm.scss";

type ServiceType = 
  | 'Errand Running'
  | 'Delivery Services'
  | 'Shopping Assistance'
  | 'Procurement'
  | 'Price Check & Market Survey'
  | 'Hotel Search & Reservation';

export const RequestForm = () => {
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get('service');

  const [service, setService] = useState<ServiceType>('Delivery Services');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (serviceParam) {
      const validServices: ServiceType[] = [
        'Errand Running',
        'Delivery Services',
        'Shopping Assistance',
        'Procurement',
        'Price Check & Market Survey',
        'Hotel Search & Reservation'
      ];
      if (validServices.includes(serviceParam as ServiceType)) {
        setService(serviceParam as ServiceType);
      }
    }
  }, [serviceParam]);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    pickupLocation: '',
    deliveryLocation: '',
    itemDetails: '',
    budget: '',
    hotelCity: '',
    checkInDate: '',
    checkOutDate: '',
    additionalNotes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const sendTelegramAlert = async () => {
    const BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
    const CHAT_ID = 'YOUR_TELEGRAM_CHAT_ID';

    let message = `🚨 *New Request Received!*\n\n`;
    message += `👤 *Name:* ${formData.fullName}\n`;
    message += `📞 *Phone:* ${formData.phone}\n`;
    message += `✉️ *Email:* ${formData.email || 'N/A'}\n`;
    message += `🛠 *Service:* ${service}\n\n`;

    if (service === 'Delivery Services' || service === 'Errand Running') {
      message += `📍 *Pickup:* ${formData.pickupLocation}\n`;
      message += `🏁 *Destination:* ${formData.deliveryLocation}\n`;
      message += `📦 *Details:* ${formData.itemDetails}\n`;
    } else if (service === 'Shopping Assistance' || service === 'Procurement' || service === 'Price Check & Market Survey') {
      message += `🛒 *Items/Requirements:* ${formData.itemDetails}\n`;
      message += `💰 *Budget:* ${formData.budget || 'N/A'}\n`;
    } else if (service === 'Hotel Search & Reservation') {
      message += `🏨 *City:* ${formData.hotelCity}\n`;
      message += `📅 *Check-In:* ${formData.checkInDate}\n`;
      message += `📅 *Check-Out:* ${formData.checkOutDate}\n`;
      message += `💰 *Budget:* ${formData.budget || 'N/A'}\n`;
    }

    if (formData.additionalNotes) {
      message += `\n📝 *Notes:* ${formData.additionalNotes}`;
    }

    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      });
    } catch (err) {
      console.error('Telegram Notification Error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Google Forms submission endpoint URL
    const GOOGLE_FORM_URL = 'https://docs.google.com/forms/u/0/d/e/YOUR_GOOGLE_FORM_ID/formResponse';

    const googleFormData = new FormData();
    // Map your entry IDs from your Google Form here
    googleFormData.append('entry.1000001', formData.fullName);
    googleFormData.append('entry.1000002', formData.phone);
    googleFormData.append('entry.1000003', formData.email);
    googleFormData.append('entry.1000004', service);
    googleFormData.append('entry.1000005', `${formData.pickupLocation} | ${formData.deliveryLocation}`);
    googleFormData.append('entry.1000006', formData.itemDetails);
    googleFormData.append('entry.1000007', formData.additionalNotes);

    try {
      // Submit to Google Forms (mode: 'no-cors' is required due to cross-origin response restriction)
      await fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: googleFormData,
      });

      // Send Instant Telegram Notification
      await sendTelegramAlert();

      setSubmitted(true);
    } catch (error) {
      console.error('Form submission failed:', error);
      alert('There was an issue submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="request-form-container request-form-container--success">
        <div className="request-form__success-card">
          <div className="request-form__success-icon">✓</div>
          <h2>Request Submitted!</h2>
          <p>Thank you, {formData.fullName}. We have received your request for <strong>{service}</strong> and will reach out to you shortly via phone or WhatsApp.</p>
          <button onClick={() => setSubmitted(false)} className="request-form__btn">
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="request-form-container">
      <div className="request-form">
        <header className="request-form__header">
          <span className="request-form__badge">DOPO Services</span>
          <h1 className="request-form__title">Place Your Request</h1>
          <p className="request-form__subtitle">Fill in the details below and our team will get it handled promptly.</p>
        </header>

        <form onSubmit={handleSubmit} className="request-form__body">
          {/* Service Selector */}
          <div className="request-form__group">
            <label className="request-form__label">Select Service Type</label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value as ServiceType)}
              className="request-form__select"
            >
              <option value="Delivery Services">Delivery Services</option>
              <option value="Errand Running">Errand Running</option>
              <option value="Shopping Assistance">Shopping Assistance</option>
              <option value="Procurement">Procurement</option>
              <option value="Price Check & Market Survey">Price Check & Market Survey</option>
              <option value="Hotel Search & Reservation">Hotel Search & Reservation</option>
            </select>
          </div>

          {/* Contact Details (Always Visible) */}
          <div className="request-form__grid">
            <div className="request-form__group">
              <label className="request-form__label">Full Name *</label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="request-form__input"
              />
            </div>

            <div className="request-form__group">
              <label className="request-form__label">Phone / WhatsApp Number *</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+234..."
                className="request-form__input"
              />
            </div>
          </div>

          <div className="request-form__group">
            <label className="request-form__label">Email Address (Optional)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="john@example.com"
              className="request-form__input"
            />
          </div>

          {/* Dynamic Service-Specific Fields */}
          {(service === 'Delivery Services' || service === 'Errand Running') && (
            <div className="request-form__grid">
              <div className="request-form__group">
                <label className="request-form__label">Pickup Location *</label>
                <input
                  type="text"
                  name="pickupLocation"
                  required
                  value={formData.pickupLocation}
                  onChange={handleInputChange}
                  placeholder="Street / Area in Owerri"
                  className="request-form__input"
                />
              </div>

              <div className="request-form__group">
                <label className="request-form__label">Delivery Location *</label>
                <input
                  type="text"
                  name="deliveryLocation"
                  required
                  value={formData.deliveryLocation}
                  onChange={handleInputChange}
                  placeholder="Destination Address"
                  className="request-form__input"
                />
              </div>
            </div>
          )}

          {(service === 'Shopping Assistance' || service === 'Procurement' || service === 'Price Check & Market Survey') && (
            <div className="request-form__group">
              <label className="request-form__label">Estimated Budget (Optional)</label>
              <input
                type="text"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                placeholder="e.g. ₦20,000"
                className="request-form__input"
              />
            </div>
          )}

          {service === 'Hotel Search & Reservation' && (
            <>
              <div className="request-form__group">
                <label className="request-form__label">Destination City *</label>
                <input
                  type="text"
                  name="hotelCity"
                  required
                  value={formData.hotelCity}
                  onChange={handleInputChange}
                  placeholder="e.g. Owerri, Port Harcourt"
                  className="request-form__input"
                />
              </div>

              <div className="request-form__grid">
                <div className="request-form__group">
                  <label className="request-form__label">Check-In Date *</label>
                  <input
                    type="date"
                    name="checkInDate"
                    required
                    value={formData.checkInDate}
                    onChange={handleInputChange}
                    className="request-form__input"
                  />
                </div>

                <div className="request-form__group">
                  <label className="request-form__label">Check-Out Date *</label>
                  <input
                    type="date"
                    name="checkOutDate"
                    required
                    value={formData.checkOutDate}
                    onChange={handleInputChange}
                    className="request-form__input"
                  />
                </div>
              </div>
            </>
          )}

          {/* Description / Item Details */}
          <div className="request-form__group">
            <label className="request-form__label">
              {service === 'Delivery Services' && 'Item Description & Weight *'}
              {service === 'Errand Running' && 'Task Description & Instructions *'}
              {service === 'Shopping Assistance' && 'Shopping List & Preferred Brands *'}
              {service === 'Procurement' && 'Items, Quantities & Specifications *'}
              {service === 'Price Check & Market Survey' && 'Items / Brands to Survey *'}
              {service === 'Hotel Search & Reservation' && 'Room Preferences & Budget *'}
            </label>
            <textarea
              name="itemDetails"
              required
              rows={4}
              value={formData.itemDetails}
              onChange={handleInputChange}
              placeholder="Provide clear details about what you need done..."
              className="request-form__textarea"
            ></textarea>
          </div>

          <div className="request-form__group">
            <label className="request-form__label">Additional Notes / Special Instructions</label>
            <textarea
              name="additionalNotes"
              rows={2}
              value={formData.additionalNotes}
              onChange={handleInputChange}
              placeholder="Any extra preferences or timelines..."
              className="request-form__textarea"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="request-form__btn"
          >
            {isSubmitting ? 'Submitting Request...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
};