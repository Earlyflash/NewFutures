import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const existing = await prisma.objective.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const objective = await prisma.objective.update({
    where: { id },
    data: {
      ...(body.title != null && { title: body.title }),
      ...(body.description != null && { description: body.description }),
      ...(body.weight != null && { weight: Number(body.weight) }),
    },
    include: { reviewCycle: true },
  });
  return NextResponse.json(objective);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.objective.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.objective.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
