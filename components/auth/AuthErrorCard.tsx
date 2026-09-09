"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import "@/styles/auth/AuthErrorCard.scss";

interface AuthErrorCardProps {
  error?: string | null;
  message?: string | null;
}

export const AuthErrorCard = ({ error, message }: AuthErrorCardProps) => {
  if (!error && !message) return null;

  const getHumanReadableError = (errCode?: string | null) => {
    if (!errCode) return "An unexpected error occurred. Please try again.";

    switch (errCode) {
      case "CredentialsSignin":
        return "Invalid email or password. Please check your credentials and try again.";
      case "OAuthAccountNotLinked":
        return "This email is already associated with an account using a different login method.";
      case "EmailExists":
        return "An account with this email address already exists.";
      case "InvalidOTP":
        return "The code you entered is invalid or has expired. Please request a new one.";
      case "UserNotFound":
        return "We couldn't find an account matching that email address.";
      case "AccessDenied":
        return "You do not have permission to access this resource.";
      default:
        return errCode; // Displays raw message if custom error message was passed from server action
    }
  };

  const displayText = message || getHumanReadableError(error);

  return (
    <div role="alert" aria-live="polite" className="auth-error-card">
      <div className="auth-error-card__icon-wrap" aria-hidden="true">
        <AlertCircle className="auth-error-card__icon" />
      </div>
      <div className="auth-error-card__content">
        <p className="auth-error-card__text">{displayText}</p>
      </div>
    </div>
  );
};