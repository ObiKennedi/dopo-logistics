"use client";

import { useState, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { CardWrapper } from "./CardWrapper";
import { AuthErrorCard } from "./AuthErrorCard";
import { resetPasswordWithOTPAction } from "@/actions/authActions";
import "@/styles/auth/AuthForm.scss";

export const ResetPasswordForm = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [state, formAction, isPending] = useActionState(resetPasswordWithOTPAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <CardWrapper
      headerLabel="Set new password"
      backButtonLabel="Back to Login"
      backButtonHref="/login"
      backButtonText="Login"
      showSocial={false}
      showFooter
    >
      <form action={formAction} className="auth-form">
        <AuthErrorCard error={state?.error} />

        <input type="hidden" name="email" value={email} />

        <div className="auth-form__info-banner">
          <KeyRound className="auth-form__info-icon" />
          <p>
            Enter the reset code sent to: <strong>{email || "your email address"}</strong>
          </p>
        </div>

        <div className="auth-form__field">
          <label htmlFor="code" className="auth-form__label">
            Enter 6-Digit Code
          </label>
          <div className="auth-form__input-wrap">
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
              placeholder="••••••"
              disabled={isPending}
              className="auth-form__input auth-form__input--otp"
            />
          </div>
        </div>

        <div className="auth-form__field">
          <label htmlFor="newPassword" className="auth-form__label">
            New Password
          </label>
          <div className="auth-form__input-wrap">
            <input
              id="newPassword"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="••••••••"
              disabled={isPending}
              className="auth-form__input auth-form__input--has-action"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="auth-form__toggle-btn"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={isPending} className="auth-form__submit-btn">
          {isPending ? (
            <>
              <Loader2 className="auth-form__spinner" />
              <span>Updating password...</span>
            </>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </CardWrapper>
  );
};
