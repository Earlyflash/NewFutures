import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");
  const userId = searchParams.get("userId") ?? session.user.id;

  const where: { userId: string; reviewCycleId?: string } = { userId };
  if (cycleId) where.reviewCycleId = cycleId;

  const objectives = await prisma.objective.findMany({
    where,
    include: {
      reviewCycle: true,
      reviews: { include: { reviewer: { select: { name: true, email: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(objectives);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { title, description, weight, reviewCycleId } = body;
  if (!title || !reviewCycleId) {
    return NextResponse.json({ error: "title and reviewCycleId required" }, { status: 400 });
  }
  const objective = await prisma.objective.create({
    data: {
      title,
      description: description ?? null,
      weight: Number(weight) || 100,
      reviewCycleId,
      userId: session.user.id,
    },
    include: { reviewCycle: true },
  });
  return NextResponse.json(objective);
}
