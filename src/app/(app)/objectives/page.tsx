import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ObjectivesList } from "./ObjectivesList";
import { AddObjectiveForm } from "./AddObjectiveForm";

export default async function ObjectivesPage({
  searchParams,
}: {
  searchParams: Promise<{ cycleId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const { cycleId } = await searchParams;

  const [cycles, objectives] = await Promise.all([
    prisma.reviewCycle.findMany({
      orderBy: { startDate: "desc" },
      where: { status: { in: ["OPEN", "DRAFT"] } },
    }),
    prisma.objective.findMany({
      where: {
        userId: session.user.id,
        ...(cycleId && { reviewCycleId: cycleId }),
      },
      include: {
        reviewCycle: true,
        reviews: { include: { reviewer: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <div className="govuk-grid-row govuk-grid-row--flex">
        <div className="govuk-grid-column-two-thirds">
          <h1 className="govuk-heading-xl">My objectives</h1>
        </div>
        <div className="govuk-grid-column-one-third govuk-!-text-align-right">
          <AddObjectiveForm cycles={cycles} />
        </div>
      </div>

      <ObjectivesList objectives={objectives} cycles={cycles} selectedCycleId={cycleId ?? null} />
    </>
  );
}
