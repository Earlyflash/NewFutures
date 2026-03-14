import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const OUTCOMES = ["NOT_MET", "PARTIALLY_MET", "MET", "EXCEEDED"] as const;

/** Save self-assessment for one objective as part of EoY report (draft only). Uses same outcome scale as manager: Not met / Partially met / Met / Exceeded. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { cycleId, objectiveId, outcome, comment } = body;
  if (!cycleId || !objectiveId) {
    return NextResponse.json({ error: "cycleId and objectiveId required" }, { status: 400 });
  }
  const outcomeValue = outcome && OUTCOMES.includes(outcome) ? outcome : null;

  const report = await prisma.eOYReport.findUnique({
    where: { userId_reviewCycleId: { userId: session.user.id, reviewCycleId: cycleId } },
  });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  if (report.status !== "DRAFT") {
    return NextResponse.json({ error: "Cannot edit self-assessment after submitting report" }, { status: 400 });
  }

  const objective = await prisma.objective.findUnique({
    where: { id: objectiveId },
    select: { id: true, userId: true, reviewCycleId: true },
  });
  if (!objective) return NextResponse.json({ error: "Objective not found" }, { status: 404 });
  if (objective.userId !== session.user.id) return NextResponse.json({ error: "Not your objective" }, { status: 403 });
  if (objective.reviewCycleId !== cycleId) return NextResponse.json({ error: "Objective not in this cycle" }, { status: 400 });

  await prisma.review.upsert({
    where: { objectiveId_type: { objectiveId, type: "SELF" } },
    create: {
      objectiveId,
      type: "SELF",
      rating: null,
      outcome: outcomeValue,
      comment: comment ?? null,
      reviewerId: session.user.id,
    },
    update: {
      outcome: outcomeValue,
      comment: comment !== undefined ? comment : undefined,
    },
  });
  return NextResponse.json({ ok: true });
}
