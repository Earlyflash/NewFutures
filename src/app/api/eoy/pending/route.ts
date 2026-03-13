import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Manager: list direct reports' EOY reports with status SUBMITTED (pending approval). */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");

  const where: { user: { managerId: string }; status: string; reviewCycleId?: string } = {
    user: { managerId: session.user.id },
    status: "SUBMITTED",
  };
  if (cycleId) where.reviewCycleId = cycleId;

  const reports = await prisma.eOYReport.findMany({
    where,
    include: {
      reviewCycle: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json(reports);
}
