import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return <>{children}</>;
}

export const metadata = {
  title: "Baseball Lessons",
  description: "Booking + Coach Dashboard",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

