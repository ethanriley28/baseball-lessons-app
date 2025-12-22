// scripts/create-coach.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.COACH_EMAIL || "coach@example.com";
  const password = process.env.COACH_PASSWORD || "ChangeMe123!";
  const name = process.env.COACH_NAME || "Coach";
  const role = "COACH";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash },
    create: { email, name, role, passwordHash },
    select: { id: true, email: true, name: true, role: true },
  });

  console.log("✅ Coach user ready:", user);
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
