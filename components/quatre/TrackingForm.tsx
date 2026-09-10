"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import "@/styles/quatre/TrackingForm.scss";

export interface TrackingFormProps {
  initialValue?: string;
  placeholder?: string;
  buttonText?: string;
  isLoading?: boolean;
  autoFocus?: boolean;
  className?: string;
  variant?: "default" | "hero" | "compact" | "card";
  onTrack?: (trackingCode: string) => void;
}

export const TrackingForm: React.FC<TrackingFormProps> = ({
  initialValue = "",
  placeholder = "Enter Tracking Code (e.g. DP-8A49K2X1)",
  buttonText = "Track Order",
  isLoading = false,
  autoFocus = false,
  className = "",
  variant = "default",
  onTrack,
}) => {
  const router = useRouter();
  const [code, setCode] = useState(initialValue);

  useEffect(() => {
    if (initialValue) {
      setCode(initialValue);
    }
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    if (onTrack) {
      onTrack(cleanCode);
    } else {
      router.push(`/track?code=${encodeURIComponent(cleanCode)}`);
    }
  };

  const handleClear = () => {
    setCode("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`dopo-tracking-form dopo-tracking-form--${variant} ${className}`}
      role="search"
      aria-label="Track order form"
    >
      <div className="dopo-tracking-form__input-wrap">
        <Search className="dopo-tracking-form__icon" size={18} />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={isLoading}
          required
          className="dopo-tracking-form__input"
          aria-label="Tracking Number"
        />
        {code && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="dopo-tracking-form__clear-btn"
            aria-label="Clear tracking code input"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !code.trim()}
        className="dopo-tracking-form__btn"
      >
        {isLoading ? (
          <>
            <span className="dopo-tracking-form__spinner" />
            <span>Tracking...</span>
          </>
        ) : (
          <>
            <span>{buttonText}</span>
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  );
};

export default TrackingForm;
