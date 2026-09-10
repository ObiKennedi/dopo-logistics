"use client"

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Copy, Check, Compass, UserPlus, RefreshCw, ArrowRight } from 'lucide-react';
import { createOrderAction } from '@/actions/orderActions';
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
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const fd = new FormData();
    fd.append('service', service);
    fd.append('fullName', formData.fullName);
    fd.append('email', formData.email);
    fd.append('phone', formData.phone);
    fd.append('pickupLocation', formData.pickupLocation);
    fd.append('deliveryLocation', formData.deliveryLocation);
    fd.append('itemDetails', formData.itemDetails);
    fd.append('budget', formData.budget);
    fd.append('hotelCity', formData.hotelCity);
    fd.append('checkInDate', formData.checkInDate);
    fd.append('checkOutDate', formData.checkOutDate);
    fd.append('additionalNotes', formData.additionalNotes);

    try {
      const res = await createOrderAction(null, fd);

      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.success && res.trackingNumber) {
        setTrackingNumber(res.trackingNumber);
        setSubmitted(true);
      } else {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Form submission notice:', error);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="request-form-container request-form-container--success">
        <div className="request-form__success-card">
          <div className="request-form__success-icon">✓</div>
          <h2>Request Successfully Placed!</h2>
          <p>
            Thank you, <strong>{formData.fullName}</strong>. We have registered your request for{' '}
            <strong>{service}</strong> in our dispatch system.
          </p>

          {trackingNumber && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              margin: '1.25rem 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                YOUR TRACKING NUMBER
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0a1854', fontFamily: 'monospace' }}>
                  {trackingNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyTracking(trackingNumber)}
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#2563eb',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                  title="Copy Tracking Code"
                >
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
            {trackingNumber && (
              <Link
                href={`/track?code=${trackingNumber}`}
                className="request-form__btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  textDecoration: 'none',
                }}
              >
                <Compass size={16} />
                <span>Track Package</span>
              </Link>
            )}

            <Link
              href="/register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0a1854',
                fontSize: '0.9rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <UserPlus size={16} />
              <span>Create Account</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setTrackingNumber(null);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.5rem 1rem'
              }}
            >
              Submit Another Request
            </button>
          </div>
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
              <label className="request-form__label">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                className="request-form__input"
              />
            </div>
          </div>

          <div className="request-form__group">
            <label className="request-form__label">Phone / WhatsApp Number (Optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+234..."
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