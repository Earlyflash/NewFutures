"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/objectives", label: "My objectives" },
  { href: "/eoy", label: "End of year" },
  { href: "/eoy/pending", label: "Pending approvals" },
  { href: "/profile", label: "Profile" },
];

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const showAdmin = role === "HR";

  return (
    <header className="govuk-header" role="banner" data-module="govuk-header">
      <div className="govuk-header__container govuk-width-container">
        <div className="govuk-header__logo">
          <Link href="/dashboard" className="govuk-header__link govuk-header__link--homepage">
            <span className="govuk-header__logotype-text">NewFutures</span>
          </Link>
        </div>
        <div className="govuk-header__content">
          <nav aria-label="Top level" className="govuk-header__navigation">
            <ul className="govuk-header__navigation-list">
              {nav.map(({ href, label }) => (
                <li key={href} className="govuk-header__navigation-item">
                  <Link
                    href={href}
                    className={`govuk-header__link ${pathname === href ? "govuk-header__link--active" : ""}`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
              {showAdmin && (
                <li className="govuk-header__navigation-item">
                  <Link
                    href="/admin/users"
                    className={`govuk-header__link ${pathname?.startsWith("/admin") ? "govuk-header__link--active" : ""}`}
                  >
                    Admin
                  </Link>
                </li>
              )}
              <li className="govuk-header__navigation-item">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="govuk-header__link govuk-link"
                >
                  Sign out
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
