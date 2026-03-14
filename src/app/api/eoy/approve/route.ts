import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const OBJECTIVE_OUTCOMES = ["NOT_MET", "PARTIALLY_MET", "MET", "EXCEEDED"] as const;

/** Manager: approve a submitted EOY report (per-objective ratings, overall rating, recommendation, comment). */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { reportId, managerOverallRating, managerComment, managerRecommendation, objectiveOutcomes } = body;
  if (!reportId) return NextResponse.json({ error: "reportId required" }, { status: 400 });

  const report = await prisma.eOYReport.findUnique({
    where: { id: reportId },
    include: { user: { select: { managerId: true } } },
  });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  if (report.user.managerId !== session.user.id) return NextResponse.json({ error: "Not this employee's manager" }, { status: 403 });
  if (report.status !== "SUBMITTED") return NextResponse.json({ error: "Report not submitted or already approved" }, { status: 400 });

  const objectives = await prisma.objective.findMany({
    where: { userId: report.userId, reviewCycleId: report.reviewCycleId },
    select: { id: true },
  });
  const objectiveIds = new Set(objectives.map((o) => o.id));
  const outcomes = Array.isArray(objectiveOutcomes) ? objectiveOutcomes as { objectiveId: string; outcome: string }[] : [];

  for (const { objectiveId, outcome } of outcomes) {
    if (!objectiveIds.has(objectiveId) || !OBJECTIVE_OUTCOMES.includes(outcome)) continue;
    await prisma.review.upsert({
      where: {
        objectiveId_type: { objectiveId, type: "MANAGER" },
      },
      create: {
        objectiveId,
        type: "MANAGER",
        rating: null,
        outcome,
        comment: null,
        reviewerId: session.user.id!,
      },
      update: { outcome },
    });
  }

  const updated = await prisma.eOYReport.update({
    where: { id: reportId },
    data: {
      status: "APPROVED",
      managerOverallRating: managerOverallRating != null ? Number(managerOverallRating) : null,
      managerComment: managerComment ?? null,
      managerRecommendation: managerRecommendation ?? null,
      approvedAt: new Date(),
    },
    include: { reviewCycle: true, user: { select: { name: true, email: true } } },
  });
  return NextResponse.json(updated);
}
