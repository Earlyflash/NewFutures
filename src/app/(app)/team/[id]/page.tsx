import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ManagerReviewForm } from "./ManagerReviewForm";

export default async function TeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const { id: reportId } = await params;

  const report = await prisma.user.findFirst({
    where: { id: reportId, managerId: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      objectives: {
        include: {
          reviewCycle: true,
          reviews: { include: { reviewer: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!report) notFound();

  return (
    <>
      <Link href="/team" className="govuk-back-link">
        Back to team
      </Link>
      <h1 className="govuk-heading-xl govuk-!-margin-top-6">
        Review: {report.name ?? report.email}
      </h1>
      <div className="govuk-!-margin-top-6">
        {report.objectives.length === 0 ? (
          <p className="govuk-body">No objectives to review yet.</p>
        ) : (
          report.objectives.map((obj) => (
            <div key={obj.id} className="govuk-card govuk-!-margin-bottom-4">
              <div className="govuk-card__content">
                <h3 className="govuk-heading-s govuk-!-margin-bottom-2">{obj.title}</h3>
                {obj.description && (
                  <p className="govuk-body govuk-!-margin-bottom-2">{obj.description}</p>
                )}
                <p className="govuk-body-s govuk-!-margin-bottom-2">
                  <span className="govuk-tag govuk-tag--grey">{obj.reviewCycle.name}</span>
                </p>
                {obj.reviews.find((r) => r.type === "SELF") && (
                  <p className="govuk-body govuk-!-margin-bottom-2">
                    Self: {obj.reviews.find((r) => r.type === "SELF")?.rating ?? "—"}/5
                    {obj.reviews.find((r) => r.type === "SELF")?.comment && (
                      <> — {obj.reviews.find((r) => r.type === "SELF")?.comment}</>
                    )}
                  </p>
                )}
                <ManagerReviewForm
                  objectiveId={obj.id}
                  existingReview={obj.reviews.find((r) => r.type === "MANAGER")}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
