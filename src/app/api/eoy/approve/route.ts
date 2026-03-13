import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Manager: approve a submitted EOY report (set rating + comment). */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { reportId, managerOverallRating, managerComment } = body;
  if (!reportId) return NextResponse.json({ error: "reportId required" }, { status: 400 });

  const report = await prisma.eOYReport.findUnique({
    where: { id: reportId },
    include: { user: { select: { managerId: true } } },
  });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  if (report.user.managerId !== session.user.id) return NextResponse.json({ error: "Not this employee's manager" }, { status: 403 });
  if (report.status !== "SUBMITTED") return NextResponse.json({ error: "Report not submitted or already approved" }, { status: 400 });

  const updated = await prisma.eOYReport.update({
    where: { id: reportId },
    data: {
      status: "APPROVED",
      managerOverallRating: managerOverallRating != null ? Number(managerOverallRating) : null,
      managerComment: managerComment ?? null,
      approvedAt: new Date(),
    },
    include: { reviewCycle: true, user: { select: { name: true, email: true } } },
  });
  return NextResponse.json(updated);
}
