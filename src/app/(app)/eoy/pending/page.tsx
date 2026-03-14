import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function EoyPendingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const pending = await prisma.eOYReport.findMany({
    where: { user: { managerId: session.user.id }, status: "SUBMITTED" },
    include: {
      reviewCycle: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <>
      <Link href="/eoy" className="govuk-back-link">Back to End of year</Link>
      <h1 className="govuk-heading-xl govuk-!-margin-top-6">Pending approvals</h1>
      <p className="govuk-body">Reports submitted by your direct reports, waiting for your approval.</p>
      {pending.length === 0 ? (
        <p className="govuk-body govuk-!-margin-top-6">No reports pending approval.</p>
      ) : (
        <ul className="govuk-list govuk-!-margin-top-6">
          {pending.map((r) => (
            <li key={r.id} className="govuk-!-margin-bottom-4">
              <div className="govuk-card">
                <div className="govuk-card__content">
                  <div className="govuk-grid-row">
                    <div className="govuk-grid-column-two-thirds">
                      <h2 className="govuk-heading-s govuk-!-margin-bottom-1">
                        {r.user.name ?? r.user.email}
                      </h2>
                      <p className="govuk-body govuk-!-margin-bottom-0">{r.reviewCycle.name}</p>
                      <p className="govuk-body-s govuk-!-margin-top-1 govuk-!-margin-bottom-0">
                        Submitted {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <div className="govuk-grid-column-one-third govuk-!-text-align-right">
                      <Link href={`/eoy/approve/${r.id}`} className="govuk-button">
                        Review and approve
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
