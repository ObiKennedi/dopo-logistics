"use client";

import { useState, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { CardWrapper } from "./CardWrapper";
import { AuthErrorCard } from "./AuthErrorCard";
import { loginAction } from "@/actions/authActions";
import "@/styles/auth/AuthForm.scss";

export const LoginForm = () => {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const isVerified = searchParams.get("verified") === "true";
  const isReset = searchParams.get("reset") === "success";

  return (
    <CardWrapper
      headerLabel="Login to your account"
      backButtonLabel="Don't have an account?"
      backButtonHref="/register"
      backButtonText="Register"
      showSocial
      showFooter
    >
      <form action={formAction} className="auth-form">
        {isVerified && (
          <div className="auth-form__success-banner">
            <CheckCircle2 className="auth-form__success-icon" />
            <p>Your email has been verified! You can now log in.</p>
          </div>
        )}
        {isReset && (
          <div className="auth-form__success-banner">
            <CheckCircle2 className="auth-form__success-icon" />
            <p>Your password was reset successfully. Please log in.</p>
          </div>
        )}

        <AuthErrorCard error={state?.error} />

        <div className="auth-form__field">
          <label htmlFor="email" className="auth-form__label">
            Email
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

        <div className="auth-form__field">
          <label htmlFor="password" className="auth-form__label">
            Password
          </label>
          <div className="auth-form__input-wrap">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
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

        <div className="auth-form__meta">
          <Link href="/forgot-password" className="auth-form__forgot-link">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={isPending} className="auth-form__submit-btn">
          {isPending ? (
            <>
              <Loader2 className="auth-form__spinner" />
              <span>Logging in...</span>
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>
    </CardWrapper>
  );
};