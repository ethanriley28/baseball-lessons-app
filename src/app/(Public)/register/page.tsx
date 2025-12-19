import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session && session.user) {
    const role = (session.user as any).role as string | undefined;

    if (role === "COACH") {
      redirect("/coach");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #1d4ed8 0, #020617 45%, #020617 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(15,23,42,0.96)",
          borderRadius: 18,
          border: "1px solid rgba(148,163,184,0.4)",
          padding: 24,
          boxShadow: "0 24px 60px rgba(15,23,42,0.8)",
        }}
      >
        <header style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: 4,
            }}
          >
            Ethan Riley Training
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: 0,
              color: "#e5e7eb",
            }}
          >
            Create Parent Account
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              marginTop: 6,
            }}
          >
            Sign up as a parent to book lessons, track your athlete&apos;s
            metrics, and manage their player profile.
          </p>
        </header>

        <RegisterForm />

        <p
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          Already have an account?{" "}
          <a
            href="/login"
            style={{
              color: "#60a5fa",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}
