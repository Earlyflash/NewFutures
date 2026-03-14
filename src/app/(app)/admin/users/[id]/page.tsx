import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminUserForm } from "./AdminUserForm";

export default async function AdminUserEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const role = (session.user as { role?: string }).role;
  if (role !== "HR") notFound();

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
  if (!user) notFound();

  const allUsers = await prisma.user.findMany({
    where: { id: { not: id } },
    select: { id: true, email: true, name: true, role: true },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });

  return (
    <>
      <Link href="/admin/users" className="govuk-back-link">Back to user admin</Link>
      <h1 className="govuk-heading-xl govuk-!-margin-top-6">Edit user</h1>
      <p className="govuk-body govuk-!-margin-bottom-6">
        {user.name ?? user.email}
      </p>
      <AdminUserForm
        user={user}
        managerOptions={allUsers}
      />
    </>
  );
}
