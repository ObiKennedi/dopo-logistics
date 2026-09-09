"use client";

import { useState, useActionState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { CardWrapper } from "./CardWrapper";
import { AuthErrorCard } from "./AuthErrorCard";
import { signUpAction } from "@/actions/authActions";
import "@/styles/auth/AuthForm.scss";

export const RegisterForm = () => {
  const [state, formAction, isPending] = useActionState(signUpAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <CardWrapper
      headerLabel="Create an account"
      backButtonLabel="Already have an account?"
      backButtonHref="/login"
      backButtonText="Login"
      showSocial
      showFooter
    >
      <form action={formAction} className="auth-form">
        <AuthErrorCard error={state?.error} />

        <div className="auth-form__field">
          <label htmlFor="name" className="auth-form__label">
            Full Name
          </label>
          <div className="auth-form__input-wrap">
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="John Doe"
              disabled={isPending}
              className="auth-form__input"
            />
          </div>
        </div>

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
              <span>Creating account...</span>
            </>
          ) : (
            "Sign Up"
          )}
        </button>
      </form>
    </CardWrapper>
  );
};