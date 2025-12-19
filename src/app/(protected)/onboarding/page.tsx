import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Send them to your existing “Add Player” flow:
  redirect("/players/new"); // <-- change this to whatever route you actually use
}
