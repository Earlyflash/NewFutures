import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { objectiveId, type, rating, comment, outcome } = body;
  if (!objectiveId || !type) {
    return NextResponse.json({ error: "objectiveId and type required" }, { status: 400 });
  }
  const objective = await prisma.objective.findUnique({
    where: { id: objectiveId },
    include: { user: { select: { managerId: true } } },
  });
  if (!objective) return NextResponse.json({ error: "Objective not found" }, { status: 404 });
  if (type === "SELF") {
    return NextResponse.json(
      { error: "Self-assessments can only be added in the End of year report. Go to End of year, select a cycle, and complete your self-assessment there." },
      { status: 403 }
    );
  }
  const isManager = type === "MANAGER" && objective.user.managerId === session.user.id;
  if (!isManager) {
    return NextResponse.json({ error: "Not allowed to review this objective" }, { status: 403 });
  }
  const validOutcomes = ["NOT_MET", "PARTIALLY_MET", "MET", "EXCEEDED"];
  const outcomeValue = outcome && validOutcomes.includes(outcome) ? outcome : null;
  const review = await prisma.review.upsert({
    where: {
      objectiveId_type: { objectiveId, type },
    },
    create: {
      objectiveId,
      type,
      rating: rating != null ? Number(rating) : null,
      outcome: type === "MANAGER" ? outcomeValue : null,
      comment: comment ?? null,
      reviewerId: session.user.id,
    },
    update: {
      rating: rating != null ? Number(rating) : undefined,
      outcome: type === "MANAGER" && outcome !== undefined ? outcomeValue : undefined,
      comment: comment !== undefined ? comment : undefined,
    },
    include: { reviewer: { select: { name: true } } },
  });
  return NextResponse.json(review);
}
