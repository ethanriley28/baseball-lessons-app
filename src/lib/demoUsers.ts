// src/lib/demoUsers.ts
import { prisma } from "./prisma";

export async function ensureDemoUsers() {
  // Coach (you)
  const coach = await prisma.user.upsert({
    where: { email: "coach@ethanrileytraining.com" },
    update: {},
    create: {
      email: "coach@ethanrileytraining.com",
      name: "Coach Riley",
      role: "COACH", // stored as string
    },
  });

  // Parent (test account)
  const parent = await prisma.user.upsert({
    where: { email: "parent@test.com" },
    update: {},
    create: {
      email: "parent@test.com",
      name: "Test Parent",
      role: "PARENT", // stored as string
    },
  });

  return { coach, parent };
}

export async function getDemoParent() {
  const { parent } = await ensureDemoUsers();
  return parent;
}

export async function getDemoCoach() {
  const { coach } = await ensureDemoUsers();
  return coach;
}
