import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** List users for manager dropdown (excludes current user). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const users = await prisma.user.findMany({
    where: { id: { not: session.user.id } },
    select: { id: true, email: true, name: true, role: true },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });
  return NextResponse.json(users);
}
