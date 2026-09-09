"use client";

import React from "react";
import { FcGoogle } from "react-icons/fc";
import "@/styles/auth/GoogleButton.scss";

interface GoogleButtonProps {
  onClick?: () => void;
  isLoading?: boolean;
  text?: string;
  className?: string;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({
  onClick,
  isLoading = false,
  text = "Continue with Google",
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`dopo-google-btn ${className}`}
      aria-label={text}
    >
      <span className="dopo-google-btn__icon-wrap">
        {isLoading ? (
          <span className="dopo-google-btn__spinner" />
        ) : (
          <FcGoogle className="dopo-google-btn__icon" />
        )}
      </span>
      <span className="dopo-google-btn__text">{text}</span>
    </button>
  );
};