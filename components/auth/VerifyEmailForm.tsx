"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";
import { CardWrapper } from "./CardWrapper";
import { AuthErrorCard } from "./AuthErrorCard";
import { verifyEmailOTPAction } from "@/actions/authActions";
import "@/styles/auth/AuthForm.scss";

export const VerifyEmailForm = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [state, formAction, isPending] = useActionState(verifyEmailOTPAction, null);

  return (
    <CardWrapper
      headerLabel="Verify your email"
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
          <Mail className="auth-form__info-icon" />
          <p>
            An OTP code was sent to: <strong>{email || "your email address"}</strong>
          </p>
        </div>

        <div className="auth-form__field">
          <label htmlFor="code" className="auth-form__label">
            Enter 6-Digit OTP
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

        <button type="submit" disabled={isPending} className="auth-form__submit-btn">
          {isPending ? (
            <>
              <Loader2 className="auth-form__spinner" />
              <span>Verifying...</span>
            </>
          ) : (
            "Verify Code"
          )}
        </button>
      </form>
    </CardWrapper>
  );
};