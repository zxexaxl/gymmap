import type { Metadata } from "next";
import { connection } from "next/server";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { AppShell } from "@/components/layout/app-shell";
import { getSiteUrl, siteDescription, siteName } from "@/lib/site";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const cloudflareWebAnalyticsToken = process.env.NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN;
const clarityProjectId = "weo79q5hg6";

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

        {clarityProjectId ? (
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

        {cloudflareWebAnalyticsToken ? (
          <Script
            id="cloudflare-web-analytics"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
            defer
            data-cf-beacon={JSON.stringify({ token: cloudflareWebAnalyticsToken })}
          />
        ) : null}

        <SpeedInsights />
      </body>
    </html>
  );
}
