import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      managerId: true,
      manager: { select: { id: true, name: true, email: true } },
      _count: { select: { directReports: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const data: { name?: string; managerId?: string | null } = {};
  if (body.name != null) data.name = body.name;
  if (body.managerId !== undefined) {
    if (body.managerId === null || body.managerId === "") {
      data.managerId = null;
    } else {
      data.managerId = body.managerId;
    }
  }
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, email: true, name: true, role: true, managerId: true, manager: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(user);
}
