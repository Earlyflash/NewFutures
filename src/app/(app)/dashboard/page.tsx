import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const [cycles, objectives, directReports] = await Promise.all([
    prisma.reviewCycle.findMany({
      where: { status: "OPEN" },
      orderBy: { endDate: "desc" },
      take: 3,
    }),
    prisma.objective.count({ where: { userId: session.user.id } }),
    prisma.user.count({ where: { managerId: session.user.id } }),
  ]);

  return (
    <>
      <h1 className="govuk-heading-xl">
        Welcome back{session.user.name ? `, ${session.user.name}` : ""}
      </h1>
      <p className="govuk-body">
        Manage your objectives and performance reviews.
      </p>

      <div className="govuk-grid-row govuk-!-margin-top-6">
        <div className="govuk-grid-column-one-half">
          <div className="govuk-card govuk-card--clickable">
            <div className="govuk-card__content">
              <h2 className="govuk-heading-m govuk-card__heading">
                <Link href="/objectives" className="govuk-link govuk-card__link">
                  My objectives
                </Link>
              </h2>
              <p className="govuk-heading-xl govuk-!-margin-bottom-1">{objectives}</p>
              <p className="govuk-body govuk-!-margin-bottom-0">View and add objectives</p>
            </div>
          </div>
        </div>
        {directReports > 0 && (
          <div className="govuk-grid-column-one-half">
            <div className="govuk-card govuk-card--clickable">
              <div className="govuk-card__content">
                <h2 className="govuk-heading-m govuk-card__heading">
                  <Link href="/team" className="govuk-link govuk-card__link">
                    Team reviews
                  </Link>
                </h2>
                <p className="govuk-heading-xl govuk-!-margin-bottom-1">{directReports}</p>
                <p className="govuk-body govuk-!-margin-bottom-0">Direct reports to review</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {cycles.length > 0 && (
        <div className="govuk-!-margin-top-6">
          <h2 className="govuk-heading-m">Open review cycles</h2>
          <ul className="govuk-list">
            {cycles.map((c) => (
              <li key={c.id} className="govuk-!-margin-bottom-2">
                <span className="govuk-body govuk-!-margin-right-3">{c.name}</span>
                <Link href={`/objectives?cycleId=${c.id}`} className="govuk-link">
                  Add objectives
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
