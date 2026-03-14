import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./ProfileForm";
import { ManagerForm } from "./ManagerForm";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      managerId: true,
      manager: { select: { id: true, name: true, email: true } },
    },
  });
  if (!user) return null;

  return (
    <>
      <h1 className="govuk-heading-xl">Profile</h1>
      <dl className="govuk-summary-list govuk-!-margin-bottom-6">
        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key">Email</dt>
          <dd className="govuk-summary-list__value">{user.email}</dd>
        </div>
        {user.manager && (
          <div className="govuk-summary-list__row">
            <dt className="govuk-summary-list__key">Manager</dt>
            <dd className="govuk-summary-list__value">{user.manager.name ?? user.manager.email}</dd>
          </div>
        )}
        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key">Role</dt>
          <dd className="govuk-summary-list__value">{user.role}</dd>
        </div>
      </dl>
      <ProfileForm defaultName={user.name ?? ""} />
      <ManagerForm currentManagerId={user.managerId ?? undefined} />
      <p className="govuk-body govuk-!-margin-top-6">
        OIDC stub: profile is created on first sign-in. When you switch to real OIDC, name and role will come from your identity provider.
      </p>
    </>
  );
}
