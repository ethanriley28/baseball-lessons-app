"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const callbackUrl = useMemo(() => {
    const raw = sp.get("callbackUrl");
    return raw && raw.startsWith("/") ? raw : "/dashboard";
  }, [sp]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (res?.error) {
        alert("Login failed. Check email/password.");
        return;
      }

      // NextAuth returns a url sometimes, but we can safely route to callbackUrl
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Network error logging in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f6f7fb", padding: 24 }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div
          style={{
            border: "1px solid #e5e7eb",
            background: "#fff",
            borderRadius: 18,
            padding: 16,
            boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#111827" }}>
            Login
          </h1>
          <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
            You’ll be redirected after signing in.
          </div>

          <form onSubmit={onSubmit} style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6, color: "#111827" }}>
                Email
              </div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: 12,
                  padding: "10px 12px",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6, color: "#111827" }}>
                Password
              </div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                autoComplete="current-password"
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: 12,
                  padding: "10px 12px",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              style={{
                marginTop: 6,
                border: "1px solid #111827",
                background: busy ? "#9ca3af" : "#111827",
                color: "#fff",
                fontWeight: 900,
                padding: "12px 14px",
                borderRadius: 14,
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "Signing in..." : "Sign In"}
            </button>

            <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
              Redirect after login: <b>{callbackUrl}</b>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
