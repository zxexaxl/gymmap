import type { Metadata } from "next";
import { connection } from "next/server";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Ga4PageView } from "@/components/analytics/ga4-page-view";
import { AppShell } from "@/components/layout/app-shell";
import { getSiteUrl, siteDescription, siteName } from "@/lib/site";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const clarityProjectId = "weo79q5hg6";
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
const isProductionDeployment = process.env.VERCEL_ENV === "production";
const hasValidGaMeasurementId = /^G-[A-Z0-9]+$/.test(gaMeasurementId);

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "ジム・フィットネスクラブのレッスン検索 | GymMap",
    template: "%s | GymMap",
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ジム・フィットネスクラブのレッスン検索 | GymMap",
    description: siteDescription,
    url: getSiteUrl(),
    siteName,
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ジム・フィットネスクラブのレッスン検索 | GymMap",
    description: siteDescription,
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (process.env.GYMMAP_MAINTENANCE_MODE === "true") {
    await connection();
  }

  return (
    <html lang="ja">
      <body>
        <AppShell>{children}</AppShell>

        {isProductionDeployment && clarityProjectId ? (
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${clarityProjectId}");
              `,
            }}
          />
        ) : null}

        {isProductionDeployment && hasValidGaMeasurementId ? (
          <>
            <Script
              id="google-analytics-bootstrap"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  window.gtag = function(){window.dataLayer.push(arguments);};
                  window.gtag('js', new Date());
                  window.gtag('config', '${gaMeasurementId}', { send_page_view: false });
                `,
              }}
            />
            <Script
              id="google-analytics"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Ga4PageView />
          </>
        ) : null}

        <SpeedInsights />
      </body>
    </html>
  );
}
