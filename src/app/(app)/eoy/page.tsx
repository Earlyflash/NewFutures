import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { EOYReportClient } from "./EOYReportClient";

export default async function EOYPage({
  searchParams,
}: {
  searchParams: Promise<{ cycleId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const { cycleId } = await searchParams;

  const [cycles, pendingCount] = await Promise.all([
    prisma.reviewCycle.findMany({
      orderBy: { startDate: "desc" },
      where: { status: { in: ["OPEN", "IN_REVIEW", "CLOSED"] } },
    }),
    prisma.eOYReport.count({
      where: { user: { managerId: session.user.id }, status: "SUBMITTED" },
    }),
  ]);

  let report = null;
  let objectives: { id: string; title: string; description: string | null; weight: number; reviews: { type: string; rating: number | null; comment: string | null; outcome: string | null }[] }[] = [];
  if (cycleId) {
    report = await prisma.eOYReport.upsert({
      where: { userId_reviewCycleId: { userId: session.user.id, reviewCycleId: cycleId } },
      create: { userId: session.user.id, reviewCycleId: cycleId },
      update: {},
      include: { reviewCycle: true },
    });
    objectives = await prisma.objective.findMany({
      where: { userId: session.user.id, reviewCycleId: cycleId },
      select: {
        id: true,
        title: true,
        description: true,
        weight: true,
        reviews: { select: { type: true, rating: true, comment: true, outcome: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  return (
    <>
      <h1 className="govuk-heading-xl">End of year report</h1>
      <p className="govuk-body">
        Complete your self-assessment and overall rating, then submit to your manager for approval.
      </p>
      {pendingCount > 0 && (
        <div className="govuk-notification-banner govuk-notification-banner--role-alert" role="alert">
          <div className="govuk-notification-banner__header">
            <h2 className="govuk-notification-banner__title">Pending approvals</h2>
          </div>
          <div className="govuk-notification-banner__content">
            <p className="govuk-body">
              You have {pendingCount} report{pendingCount !== 1 ? "s" : ""} waiting for your approval.{" "}
              <Link href="/eoy/pending" className="govuk-link govuk-link--no-visited-state">
                Review and approve
              </Link>
            </p>
          </div>
        </div>
      )}
      <div className="govuk-!-margin-top-6">
        <h2 className="govuk-heading-m">Select a review cycle</h2>
        <ul className="govuk-list">
          {cycles.map((c) => (
            <li key={c.id} className="govuk-!-margin-bottom-2">
              <Link
                href={cycleId === c.id ? "/eoy" : `/eoy?cycleId=${c.id}`}
                className={`govuk-link ${cycleId === c.id ? "govuk-link--no-visited-state govuk-!-font-weight-bold" : ""}`}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {report && (
        <EOYReportClient
          report={report}
          objectives={objectives}
        />
      )}
    </>
  );
}
