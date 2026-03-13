import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");
  return (
    <div className="govuk-width-container">
      <main className="govuk-main-wrapper govuk-main-wrapper--l" id="main-content">
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-two-thirds">
            <h1 className="govuk-heading-xl">NewFutures</h1>
            <p className="govuk-body govuk-!-font-size-19">
              Set objectives, track performance, and plan your future. End-of-year performance made simple.
            </p>
            <Link href="/login" className="govuk-button govuk-button--start">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
