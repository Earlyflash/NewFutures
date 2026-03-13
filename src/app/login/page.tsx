"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email: email || "demo@newfutures.local",
      name: name || email?.split("@")[0] || "Demo User",
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Sign in failed. Please try again.");
      return;
    }
    window.location.href = callbackUrl;
  }

  return (
    <div className="govuk-width-container">
      <main className="govuk-main-wrapper govuk-main-wrapper--l" id="main-content">
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-two-thirds">
            <h1 className="govuk-heading-xl">Sign in to NewFutures</h1>
            <p className="govuk-body">
              OIDC stub: enter any email to sign in (no password).
            </p>
            <form onSubmit={handleSubmit}>
              <div className="govuk-form-group">
                <label className="govuk-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="govuk-input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="govuk-form-group">
                <label className="govuk-label" htmlFor="name">
                  Name (optional)
                </label>
                <input
                  id="name"
                  type="text"
                  className="govuk-input"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              {error && (
                <div className="govuk-error-message">
                  <span className="govuk-visually-hidden">Error:</span> {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="govuk-button"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="govuk-width-container"><p className="govuk-body">Loading…</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
