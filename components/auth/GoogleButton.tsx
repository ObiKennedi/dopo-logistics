"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
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
  const [internalLoading, setInternalLoading] = useState(false);

  const handleClick = async () => {
    if (onClick) {
      onClick();
      return;
    }

    try {
      setInternalLoading(true);
      await signIn("google", { redirectTo: "/redirect" });
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      setInternalLoading(false);
    }
  };

  const isButtonLoading = isLoading || internalLoading;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isButtonLoading}
      className={`dopo-google-btn ${className}`}
      aria-label={text}
    >
      <span className="dopo-google-btn__icon-wrap">
        {isButtonLoading ? (
          <span className="dopo-google-btn__spinner" />
        ) : (
          <FcGoogle className="dopo-google-btn__icon" />
        )}
      </span>
      <span className="dopo-google-btn__text">
        {isButtonLoading ? "Redirecting..." : text}
      </span>
    </button>
  );
};