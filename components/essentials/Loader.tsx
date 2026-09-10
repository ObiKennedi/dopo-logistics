"use client";

import "@/styles/essentials/Loader.scss";

interface LoaderProps {
  message?: string;
  fullscreen?: boolean;
}

export const Loader = ({
  message = "Loading…",
  fullscreen = true,
}: LoaderProps) => {
  return (
    <div
      className={`dopo-loader ${fullscreen ? "dopo-loader--fullscreen" : "dopo-loader--inline"}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      {fullscreen && (
        <>
          <div className="dopo-loader__glow-bg" aria-hidden="true" />
          {["tl", "tr", "bl", "br"].map((pos) => (
            <div key={pos} className={`dopo-loader__corner dopo-loader__corner--${pos}`} aria-hidden="true" />
          ))}
        </>
      )}

      <div className="dopo-loader__center">
        {/* Emblem & Rotating Rings */}
        <div className="dopo-loader__emblem" aria-hidden="true">
          <div className="dopo-loader__ring">
            <svg viewBox="0 0 100 100" fill="none">
              <circle
                cx="50"
                cy="50"
                r="46"
                stroke="url(#dopo-ring-grad)"
                strokeWidth="1.2"
                strokeDasharray="4 8"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="dopo-ring-grad" x1="4" y1="50" x2="96" y2="50" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0a1854" stopOpacity="0.1" />
                  <stop offset="0.5" stopColor="#0a1854" stopOpacity="1" />
                  <stop offset="1" stopColor="#0a1854" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="dopo-loader__ring dopo-loader__ring--inner">
            <svg viewBox="0 0 100 100" fill="none">
              <circle
                cx="50"
                cy="50"
                r="34"
                stroke="rgba(10, 24, 84, 0.3)"
                strokeWidth="0.8"
                strokeDasharray="3 6"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="dopo-loader__pulse" />

          {/* Logo Container */}
          <div className="dopo-loader__logo-wrap">
            <img src="/dopo.png" alt="DOPO Logistics" className="dopo-loader__logo" />
            <div className="dopo-loader__glow" />
          </div>
        </div>

        {/* Dynamic Loading Message */}
        <p className="dopo-loader__message">{message}</p>
      </div>

      {fullscreen && (
        <p className="dopo-loader__tagline" aria-hidden="true">
          Your Errand. Our Responsibility.
        </p>
      )}
    </div>
  );
};