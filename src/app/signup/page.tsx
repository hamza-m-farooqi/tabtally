"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createAsAdmin, setCreateAsAdmin] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      createAsAdmin,
      adminSecret: form.get("adminSecret"),
    };

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.status === 201) {
      const data = await res.json().catch(() => ({}));
      if (data.status === "PENDING") {
        router.push("/signin?pending=1");
        return;
      }
      router.push("/dashboard");
      return;
    }

    const data = await res.json().catch(() => ({}));
    setError(data.error || "Sign up failed.");
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
          <p className="auth-brand-tagline">Join your team&#39;s<br />expense workspace.</p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <span className="auth-feature-icon">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>Automatic balance calculations</span>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>Expense history &amp; analytics</span>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>Admin &amp; member role system</span>
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
          {/* Mobile logo header */}
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

          <h2 className="auth-form-title">Create your account</h2>
          <p className="auth-form-subtitle">
            Admins are auto-approved; users need admin approval to join.
          </p>

          <form className="auth-form" onSubmit={onSubmit}>
            {/* Name */}
            <div className={`auth-field ${focused === "name" ? "auth-field-focused" : ""}`}>
              <label className="auth-label" htmlFor="signup-name">
                Full name
              </label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                    <path d="M10 10a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" />
                    <path d="M2 18a8 8 0 0116 0" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  className="auth-input"
                  placeholder="Alex Johnson"
                  required
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            {/* Email */}
            <div className={`auth-field ${focused === "email" ? "auth-field-focused" : ""}`}>
              <label className="auth-label" htmlFor="signup-email">
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
                  id="signup-email"
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

            {/* Password */}
            <div className={`auth-field ${focused === "password" ? "auth-field-focused" : ""}`}>
              <label className="auth-label" htmlFor="signup-password">
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
                  id="signup-password"
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

            {/* Admin toggle */}
            <label className="auth-toggle-row">
              <div className="auth-toggle-track">
                <input
                  id="signup-admin"
                  type="checkbox"
                  className="auth-toggle-input"
                  checked={createAsAdmin}
                  onChange={(e) => setCreateAsAdmin(e.target.checked)}
                />
                <span className={`auth-toggle-thumb ${createAsAdmin ? "auth-toggle-thumb-on" : ""}`} />
              </div>
              <span className="auth-toggle-label">Create as Admin</span>
            </label>

            {/* Admin secret (conditional) */}
            {createAsAdmin && (
              <div className={`auth-field auth-field-animate ${focused === "adminSecret" ? "auth-field-focused" : ""}`}>
                <label className="auth-label" htmlFor="signup-admin-secret">
                  Admin signup secret
                </label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </span>
                  <input
                    id="signup-admin-secret"
                    name="adminSecret"
                    type="password"
                    className="auth-input"
                    placeholder="Admin secret key"
                    required
                    onFocus={() => setFocused("adminSecret")}
                    onBlur={() => setFocused(null)}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="auth-error-banner">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button className="auth-submit-btn" type="submit" disabled={loading} id="signup-submit">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" className="spinner-inverse" />
                  Creating account…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create account
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          <p className="auth-switch-text">
            Already have an account?{" "}
            <Link className="auth-switch-link" href="/signin">
              Sign in
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
