import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Get or create EOY report for current user and a cycle. */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");
  if (!cycleId) return NextResponse.json({ error: "cycleId required" }, { status: 400 });

  let report = await prisma.eOYReport.findUnique({
    where: { userId_reviewCycleId: { userId: session.user.id, reviewCycleId: cycleId } },
    include: { reviewCycle: true },
  });
  if (!report) {
    report = await prisma.eOYReport.create({
      data: { userId: session.user.id, reviewCycleId: cycleId },
      include: { reviewCycle: true },
    });
  }
  return NextResponse.json(report);
}

/** Update own EOY report (self overall rating, or submit). */
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { cycleId, selfOverallRating, action } = body;
  if (!cycleId) return NextResponse.json({ error: "cycleId required" }, { status: 400 });

  const existing = await prisma.eOYReport.findUnique({
    where: { userId_reviewCycleId: { userId: session.user.id, reviewCycleId: cycleId } },
  });
  if (!existing) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  if (action === "SUBMIT") {
    if (existing.status !== "DRAFT") return NextResponse.json({ error: "Already submitted or approved" }, { status: 400 });
    const report = await prisma.eOYReport.update({
      where: { id: existing.id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
      include: { reviewCycle: true },
    });
    return NextResponse.json(report);
  }

  if (existing.status !== "DRAFT") return NextResponse.json({ error: "Cannot edit after submit" }, { status: 400 });
  const report = await prisma.eOYReport.update({
    where: { id: existing.id },
    data: { ...(selfOverallRating != null && { selfOverallRating: Number(selfOverallRating) }) },
    include: { reviewCycle: true },
  });
  return NextResponse.json(report);
}
