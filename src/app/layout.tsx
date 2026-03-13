import type { Metadata } from "next";
import "./gds.scss";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "NewFutures – Performance & Objectives",
  description: "End of year performance and objectives management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="govuk-body">
        <SessionProvider>
          <a href="#main-content" className="govuk-skip-link" data-module="govuk-skip-link">
            Skip to main content
          </a>
          {children}
          <script type="module" src="/govuk/govuk-init.js" />
        </SessionProvider>
      </body>
    </html>
  );
}
