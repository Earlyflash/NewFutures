import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Manager: get a single EOY report (with objectives) for approval. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { reportId } = await params;

  const report = await prisma.eOYReport.findUnique({
    where: { id: reportId },
    include: {
      reviewCycle: true,
      user: { select: { id: true, name: true, email: true, managerId: true } },
    },
  });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  if (report.user.managerId !== session.user.id) return NextResponse.json({ error: "Not this employee's manager" }, { status: 403 });

  const objectives = await prisma.objective.findMany({
    where: { userId: report.userId, reviewCycleId: report.reviewCycleId },
    include: { reviews: { select: { type: true, rating: true, comment: true, outcome: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ report, objectives });
}
