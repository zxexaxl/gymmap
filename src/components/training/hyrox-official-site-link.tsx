"use client";

import { trackHyroxExternalLinkClick, type HyroxExternalLinkSource } from "@/lib/hyrox-analytics";

type HyroxOfficialSiteLinkProps = {
  facilityId: string;
  href: string;
  label: string;
  source: HyroxExternalLinkSource;
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
        trackHyroxExternalLinkClick({
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
