import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const role = (session.user as { role?: string }).role;
  if (role !== "HR") notFound();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      manager: { select: { name: true, email: true } },
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });

  return (
    <>
      <h1 className="govuk-heading-xl">User admin</h1>
      <p className="govuk-body govuk-!-margin-bottom-6">
        Edit user profiles: name, role and manager assignment.
      </p>
      <table className="govuk-table">
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th scope="col" className="govuk-table__header">Name</th>
            <th scope="col" className="govuk-table__header">Email</th>
            <th scope="col" className="govuk-table__header">Role</th>
            <th scope="col" className="govuk-table__header">Manager</th>
            <th scope="col" className="govuk-table__header">
              <span className="govuk-visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {users.map((u) => (
            <tr key={u.id} className="govuk-table__row">
              <td className="govuk-table__cell">{u.name ?? "—"}</td>
              <td className="govuk-table__cell">{u.email}</td>
              <td className="govuk-table__cell">{u.role}</td>
              <td className="govuk-table__cell">
                {u.manager ? (u.manager.name ?? u.manager.email) : "—"}
              </td>
              <td className="govuk-table__cell">
                <Link href={`/admin/users/${u.id}`} className="govuk-link">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
