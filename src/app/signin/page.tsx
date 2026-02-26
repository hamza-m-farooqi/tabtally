"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Spinner from "@/components/Spinner";
import { Suspense } from "react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pending = searchParams.get("pending");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      email: form.get("email"),
      password: form.get("password"),
    };

    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/dashboard");
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (data.status === "PENDING") {
      setError("Waiting for admin approval.");
    } else if (data.status === "REJECTED") {
      setError("Your account was rejected.");
    } else {
      setError(data.error || "Sign in failed.");
    }
    setLoading(false);
  }

  return (
    <main className="auth-shell">
      {/* ── Left branding panel ── */}
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <div className="auth-logo-mark">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
              <rect x="2" y="3" width="20" height="14" rx="3" fill="currentColor" opacity="0.25" />
              <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M2 3h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="auth-brand-name">TabTally</h1>
          <p className="auth-brand-tagline">Shared expenses,<br />tracked beautifully.</p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <span className="auth-feature-icon">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>Daily expense recording</span>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>Smart settlement requests</span>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>Admin-controlled approvals</span>
            </div>
          </div>

          {/* Decorative orbs */}
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          {/* Header */}
          <div className="auth-form-header">
            <div className="auth-form-logo-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <rect x="2" y="3" width="20" height="14" rx="3" fill="currentColor" opacity="0.25" />
                <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M2 3h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="auth-form-logo-label">TabTally</span>
          </div>

          <h2 className="auth-form-title">Welcome back</h2>
          <p className="auth-form-subtitle">
            {pending
              ? "Your account is awaiting admin approval."
              : "Sign in to your workspace to continue."}
          </p>

          {pending && (
            <div className="auth-info-banner">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Your request has been submitted. An admin will review it soon.</span>
            </div>
          )}

          <form className="auth-form" onSubmit={onSubmit}>
            {/* Email field */}
            <div className={`auth-field ${focused === "email" ? "auth-field-focused" : ""}`}>
              <label className="auth-label" htmlFor="signin-email">
                Email address
              </label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </span>
                <input
                  id="signin-email"
                  name="email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  required
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            {/* Password field */}
            <div className={`auth-field ${focused === "password" ? "auth-field-focused" : ""}`}>
              <label className="auth-label" htmlFor="signin-password">
                Password
              </label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                    <path d="M5 9V7a7 7 0 0114 0v2" strokeLinecap="round" />
                    <rect x="3" y="9" width="14" height="11" rx="2" />
                    <circle cx="10" cy="15" r="1" fill="currentColor" />
                  </svg>
                </span>
                <input
                  id="signin-password"
                  name="password"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  required
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="auth-error-banner">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button className="auth-submit-btn" type="submit" disabled={loading} id="signin-submit">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" className="spinner-inverse" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          <p className="auth-switch-text">
            Don&apos;t have an account?{" "}
            <Link className="auth-switch-link" href="/signup">
              Sign up
            </Link>
          </p>
          <div className="auth-back-home">
            <Link href="/" className="auth-back-home-link">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
