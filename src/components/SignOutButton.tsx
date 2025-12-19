"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      style={{
        padding: "10px 14px",
        borderRadius: 9999,
        border: "1px solid #1d4ed8",
        background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
        color: "#fff",
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: "0 10px 20px rgba(37,99,235,0.25)",
      }}
    >
      Sign Out
    </button>
  );
}
