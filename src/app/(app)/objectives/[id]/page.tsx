import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ObjectiveEdit } from "./ObjectiveEdit";

export default async function ObjectivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const { id } = await params;

  const objective = await prisma.objective.findFirst({
    where: { id, userId: session.user.id },
    include: {
      reviewCycle: true,
      reviews: { include: { reviewer: { select: { name: true } } } },
    },
  });
  if (!objective) notFound();

  return (
    <>
      <Link href="/objectives" className="govuk-back-link">
        Back to objectives
      </Link>
      <ObjectiveEdit objective={objective} />
    </>
  );
}
