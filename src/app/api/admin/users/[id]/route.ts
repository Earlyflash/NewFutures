import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROLES = ["EMPLOYEE", "MANAGER", "HR"] as const;

function isHR(session: { user?: { id?: string; role?: string } | null }) {
  return (session?.user as { role?: string } | undefined)?.role === "HR";
}

/** Get one user. HR only. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isHR(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      managerId: true,
      manager: { select: { id: true, name: true, email: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

/** Update a user's profile (name, role, managerId). HR only. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isHR(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const data: { name?: string; role?: string; managerId?: string | null } = {};

  if (body.name !== undefined) data.name = body.name === "" ? null : String(body.name).trim();
  if (body.role !== undefined) {
    if (ROLES.includes(body.role)) data.role = body.role;
    else return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (body.managerId !== undefined) {
    const raw = body.managerId === null || body.managerId === "" ? null : body.managerId;
    if (raw && raw === id) {
      return NextResponse.json({ error: "User cannot be their own manager" }, { status: 400 });
    }
    if (raw) {
      const exists = await prisma.user.findUnique({ where: { id: raw }, select: { id: true } });
      if (!exists) return NextResponse.json({ error: "Manager not found" }, { status: 400 });
    }
    data.managerId = raw;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      managerId: true,
      manager: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json(user);
}
