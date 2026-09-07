"use client";

import { trackExternalLinkClick, type ExternalLinkSource } from "@/lib/analytics/events";

type HyroxOfficialSiteLinkProps = {
  facilityId: string;
  href: string;
  label: string;
  source: ExternalLinkSource;
};

export function HyroxOfficialSiteLink({
  facilityId,
  href,
  label,
  source,
}: HyroxOfficialSiteLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={() =>
        trackExternalLinkClick({
          context: "hyrox",
          facility_id: facilityId,
          destination_type: "facility_official_site",
          source,
        })
      }
    >
      施設公式サイト ↗
    </a>
  );
}
