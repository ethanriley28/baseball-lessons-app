"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      // 1) Create the account via our /api/register endpoint
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create account.");
        setLoading(false);
        return;
      }

      // 2) Auto log them in as PARENT using NextAuth credentials provider
      const signInResult = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (signInResult?.error) {
        console.error("Auto login failed:", signInResult.error);
        // Fall back to manual login if something goes wrong
        router.push("/login?registered=1");
        return;
      }

      // 3) Redirect to dashboard (parent) where they'll see the Add Player area
      router.push("/dashboard?onboarding=1");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
      {error && (
        <div
          style={{
            fontSize: 12,
            color: "#fecaca",
            background: "rgba(127,29,29,0.65)",
            borderRadius: 8,
            padding: "6px 10px",
            border: "1px solid rgba(248,113,113,0.5)",
          }}
        >
          {error}
        </div>
      )}

      {/* Parent name */}
      <div style={{ display: "grid", gap: 4 }}>
        <label
          htmlFor="name"
          style={{ fontSize: 12, color: "#e5e7eb", fontWeight: 500 }}
        >
          Parent name (optional)
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Smith"
          style={{
            borderRadius: 10,
            border: "1px solid #1f2937",
            padding: "8px 10px",
            fontSize: 13,
            background: "#020617",
            color: "#e5e7eb",
            outline: "none",
          }}
        />
      </div>

      {/* Email */}
      <div style={{ display: "grid", gap: 4 }}>
        <label
          htmlFor="email"
          style={{ fontSize: 12, color: "#e5e7eb", fontWeight: 500 }}
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="parent@example.com"
          style={{
            borderRadius: 10,
            border: "1px solid #1f2937",
            padding: "8px 10px",
            fontSize: 13,
            background: "#020617",
            color: "#e5e7eb",
            outline: "none",
          }}
        />
      </div>

      {/* Password */}
      <div style={{ display: "grid", gap: 4 }}>
        <label
          htmlFor="password"
          style={{ fontSize: 12, color: "#e5e7eb", fontWeight: 500 }}
        >
          Password
        </label>
        <div
          style={{
            position: "relative",
          }}
        >
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            style={{
              borderRadius: 10,
              border: "1px solid #1f2937",
              padding: "8px 32px 8px 10px",
              fontSize: 13,
              background: "#020617",
              color: "#e5e7eb",
              outline: "none",
              width: "100%",
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              border: "none",
              background: "transparent",
              color: "#9ca3af",
              fontSize: 13,
              cursor: "pointer",
              padding: 0,
            }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div style={{ display: "grid", gap: 4 }}>
        <label
          htmlFor="confirm"
          style={{ fontSize: 12, color: "#e5e7eb", fontWeight: 500 }}
        >
          Confirm password
        </label>
        <div
          style={{
            position: "relative",
          }}
        >
          <input
            id="confirm"
            type={showConfirm ? "text" : "password"}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            style={{
              borderRadius: 10,
              border: "1px solid #1f2937",
              padding: "8px 32px 8px 10px",
              fontSize: 13,
              background: "#020617",
              color: "#e5e7eb",
              outline: "none",
              width: "100%",
            }}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              border: "none",
              background: "transparent",
              color: "#9ca3af",
              fontSize: 13,
              cursor: "pointer",
              padding: 0,
            }}
            aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirm ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 6,
          borderRadius: 9999,
          border: "none",
          padding: "9px 12px",
          fontSize: 13,
          fontWeight: 600,
          background:
            "linear-gradient(135deg, rgba(56,189,248,1), rgba(59,130,246,1))",
          color: "#020617",
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Creating account..." : "Create Parent Account"}
      </button>
    </form>
  );
}
