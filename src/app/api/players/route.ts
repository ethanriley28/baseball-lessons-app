import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const role = (session.user as any).role as string | undefined;
    const userId = (session.user as any).id as string | undefined;
    const email = session.user.email as string | undefined;

    if (role !== "PARENT") {
      return NextResponse.json({ error: "Only parents can create players." }, { status: 403 });
    }

    // Make sure we have a parent user
    let parent = null;
    if (userId) {
      parent = await prisma.user.findUnique({ where: { id: userId } });
    } else if (email) {
      parent = await prisma.user.findUnique({ where: { email } });
    }

    if (!parent) {
      return NextResponse.json({ error: "Parent account not found." }, { status: 404 });
    }

    const body = await req.json();

    const {
      name,
      school,
      classYear,
      age,
      position,
      bats,
      height,
      weight,
      travelOrg,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Player name is required." },
        { status: 400 }
      );
    }

    const ageNum =
      typeof age === "number"
        ? age
        : age && !Number.isNaN(Number(age))
        ? Number(age)
        : null;

    const weightNum =
      typeof weight === "number"
        ? weight
        : weight && !Number.isNaN(Number(weight))
        ? Number(weight)
        : null;

    const player = await prisma.player.create({
      data: {
        parentId: parent.id,
        name: name.trim(),
        school: school?.toString().trim() || null,
        classYear: classYear?.toString().trim() || null,
        age: ageNum,
        position: position?.toString().trim() || null,
        bats: bats?.toString().trim() || null,
        height: height?.toString().trim() || null,
        weight: weightNum,
        travelOrg: travelOrg?.toString().trim() || null,
      },
    });

    return NextResponse.json({ success: true, player }, { status: 201 });
  } catch (err) {
    console.error("Create player error:", err);
    return NextResponse.json(
      { error: "Something went wrong creating the player." },
      { status: 500 }
    );
  }
}
