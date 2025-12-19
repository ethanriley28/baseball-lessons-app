import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: "100vh", background: "#f6f7fb", padding: 24 }}>
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <div
              style={{
                border: "1px solid #e5e7eb",
                background: "#fff",
                borderRadius: 16,
                padding: 16,
                fontWeight: 900,
                color: "#111827",
              }}
            >
              Loading…
            </div>
          </div>
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
