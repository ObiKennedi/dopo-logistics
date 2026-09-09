"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { CardWrapper } from "./CardWrapper";
import { AuthErrorCard } from "./AuthErrorCard";
import { requestPasswordResetAction } from "@/actions/authActions";
import "@/styles/auth/AuthForm.scss";

export const ForgotPasswordForm = () => {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, null);

  const errorMessage = state && "error" in state ? state.error : null;
  const successMessage = state && "success" in state ? state.success : null;

  return (
    <CardWrapper
      headerLabel="Reset your password"
      backButtonLabel="Remember your password?"
      backButtonHref="/login"
      backButtonText="Login"
      showSocial={false}
      showFooter
    >
      <form action={formAction} className="auth-form">
        {successMessage && (
          <div className="auth-form__success-banner">
            <CheckCircle2 className="auth-form__success-icon" />
            <p>{successMessage}</p>
          </div>
        )}

        <AuthErrorCard error={errorMessage} />

        <div className="auth-form__field">
          <label htmlFor="email" className="auth-form__label">
            Email Address
          </label>
          <div className="auth-form__input-wrap">
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="john@example.com"
              disabled={isPending}
              className="auth-form__input"
            />
          </div>
        </div>

        <button type="submit" disabled={isPending} className="auth-form__submit-btn">
          {isPending ? (
            <>
              <Loader2 className="auth-form__spinner" />
              <span>Sending code...</span>
            </>
          ) : (
            "Send Reset Code"
          )}
        </button>
      </form>
    </CardWrapper>
  );
};
