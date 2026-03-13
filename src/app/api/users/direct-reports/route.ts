import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const reports = await prisma.user.findMany({
    where: { managerId: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      _count: { select: { objectives: true } },
    },
  });
  return NextResponse.json(reports);
}
