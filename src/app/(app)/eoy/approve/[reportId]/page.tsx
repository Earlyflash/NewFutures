import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ApproveReportForm } from "./ApproveReportForm";

export default async function EoyApprovePage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const { reportId } = await params;

  const report = await prisma.eOYReport.findUnique({
    where: { id: reportId },
    include: {
      reviewCycle: true,
      user: { select: { id: true, name: true, email: true, managerId: true } },
    },
  });
  if (!report || report.user.managerId !== session.user.id) notFound();

  const objectives = await prisma.objective.findMany({
    where: { userId: report.userId, reviewCycleId: report.reviewCycleId },
    include: { reviews: { select: { type: true, rating: true, comment: true, outcome: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (report.status !== "SUBMITTED") {
    return (
      <>
        <Link href="/eoy/pending" className="govuk-back-link">Back to pending</Link>
        <h1 className="govuk-heading-xl govuk-!-margin-top-6">Report already processed</h1>
        <p className="govuk-body">This report has already been approved or is not submitted.</p>
        <Link href="/eoy/pending" className="govuk-button govuk-!-margin-top-4">Return to pending</Link>
      </>
    );
  }

  return (
    <>
      <Link href="/eoy/pending" className="govuk-back-link">Back to pending</Link>
      <h1 className="govuk-heading-xl govuk-!-margin-top-6">
        Approve report: {report.user.name ?? report.user.email}
      </h1>
      <p className="govuk-body">{report.reviewCycle.name}</p>

      <ApproveReportForm
        reportId={report.id}
        employeeName={report.user.name ?? report.user.email}
        employeeOverallSelfRating={report.selfOverallRating}
        objectives={objectives.map((obj) => {
          const selfR = obj.reviews.find((r) => r.type === "SELF");
          const mgrR = obj.reviews.find((r) => r.type === "MANAGER");
          return {
            id: obj.id,
            title: obj.title,
            description: obj.description,
            selfRating: selfR?.rating ?? null,
            selfOutcome: selfR?.outcome ?? null,
            selfComment: selfR?.comment ?? null,
            managerOutcome: mgrR?.outcome ?? null,
            managerComment: mgrR?.comment ?? null,
          };
        })}
        initialOverallRating={report.managerOverallRating}
        initialRecommendation={report.managerRecommendation}
        initialComment={report.managerComment ?? ""}
      />
    </>
  );
}
