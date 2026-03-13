import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/dashboard");
  return (
    <>
      <Nav />
      <div className="govuk-width-container">
        <main className="govuk-main-wrapper" id="main-content">
          {children}
        </main>
      </div>
    </>
  );
}
