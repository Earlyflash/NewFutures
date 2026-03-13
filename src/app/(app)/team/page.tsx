import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const directReports = await prisma.user.findMany({
    where: { managerId: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      _count: { select: { objectives: true } },
    },
  });

  return (
    <>
      <h1 className="govuk-heading-xl">Team</h1>
      <p className="govuk-body">
        Direct reports you can review. Assign yourself as manager in the database to see team members here.
      </p>
      {directReports.length === 0 ? (
        <div className="govuk-!-margin-top-6">
          <p className="govuk-body">You have no direct reports.</p>
          <p className="govuk-body">Team members appear here when their manager is set to you.</p>
        </div>
      ) : (
        <ul className="govuk-list govuk-!-margin-top-6">
          {directReports.map((user) => (
            <li key={user.id} className="govuk-!-margin-bottom-4">
              <div className="govuk-card">
                <div className="govuk-card__content">
                  <div className="govuk-grid-row">
                    <div className="govuk-grid-column-two-thirds">
                      <h2 className="govuk-heading-s govuk-!-margin-bottom-1">
                        {user.name ?? user.email}
                      </h2>
                      <p className="govuk-body govuk-!-margin-bottom-0">{user.email}</p>
                      <p className="govuk-body-s govuk-!-margin-top-1 govuk-!-margin-bottom-0">
                        {user._count.objectives} objectives
                      </p>
                    </div>
                    <div className="govuk-grid-column-one-third govuk-!-text-align-right">
                      <Link href={`/team/${user.id}`} className="govuk-button govuk-button--secondary">
                        Review
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
