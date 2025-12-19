import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AddPlayerForm } from "@/components/AddPlayerForm";


export default async function NewPlayerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  if (role !== "PARENT") redirect("/coach");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
          Add Your Player
        </h1>
        <AddPlayerForm />
      </div>
    </main>
  );
}
