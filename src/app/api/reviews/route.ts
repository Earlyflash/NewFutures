import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { objectiveId, type, rating, comment } = body;
  if (!objectiveId || !type) {
    return NextResponse.json({ error: "objectiveId and type required" }, { status: 400 });
  }
  const objective = await prisma.objective.findUnique({
    where: { id: objectiveId },
    include: { user: { select: { managerId: true } } },
  });
  if (!objective) return NextResponse.json({ error: "Objective not found" }, { status: 404 });
  const isSelf = type === "SELF" && objective.userId === session.user.id;
  const isManager = type === "MANAGER" && objective.user.managerId === session.user.id;
  if (!isSelf && !isManager) {
    return NextResponse.json({ error: "Not allowed to review this objective" }, { status: 403 });
  }
  const review = await prisma.review.upsert({
    where: {
      objectiveId_type: { objectiveId, type },
    },
    create: {
      objectiveId,
      type,
      rating: rating != null ? Number(rating) : null,
      comment: comment ?? null,
      reviewerId: session.user.id,
    },
    update: {
      rating: rating != null ? Number(rating) : undefined,
      comment: comment !== undefined ? comment : undefined,
    },
    include: { reviewer: { select: { name: true } } },
  });
  return NextResponse.json(review);
}
