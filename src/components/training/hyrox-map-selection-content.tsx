import Link from "next/link";

import { Badge, Chip } from "@/components/ui";
import { HyroxOfficialSiteLink } from "@/components/training/hyrox-official-site-link";
import {
  buildHyroxDetailPath,
  HYROX_EQUIPMENT_LABELS,
  type HyroxDiscoveryLocation,
} from "@/lib/hyrox-discovery";
import { trackHyroxFacilitySelect } from "@/lib/hyrox-analytics";

import styles from "./hyrox-map-ui.module.css";

type HyroxMapSelectionContentProps = {
  location: HyroxDiscoveryLocation;
  outsideCurrentResults: boolean;
  resultCount: number;
};

export function HyroxMapSelectionContent({
  location,
  outsideCurrentResults,
  resultCount,
}: HyroxMapSelectionContentProps) {
  return (
    <div className={styles.selectionContent}>
      <div className={styles.selectionIdentity}>
        <Badge tone="accent">Official Training Club</Badge>
        <p className={styles.brand}>{location.brandName}</p>
        <h3 id={`hyrox-map-selection-${location.id}`}>{location.name}</h3>
        <p className={styles.area}>
          {location.prefecture} {location.city}
        </p>
        <p className="muted">{location.address}</p>
        {outsideCurrentResults ? (
          <p className={styles.filterNotice}>現在の都道府県絞り込み外の施設です。</p>
        ) : null}
      </div>

      {location.confirmedEquipment.length > 0 ? (
        <section
          className={styles.equipment}
          aria-labelledby={`hyrox-map-equipment-${location.id}`}
        >
          <h4 id={`hyrox-map-equipment-${location.id}`}>確認できた設備</h4>
          <div className={styles.equipmentChips}>
            {location.confirmedEquipment.map((equipment) => (
              <Chip key={equipment} tone="positive">
                {HYROX_EQUIPMENT_LABELS[equipment]}
              </Chip>
            ))}
          </div>
        </section>
      ) : null}

      <div className={styles.actions}>
        <Link
          className={styles.primaryAction}
          href={buildHyroxDetailPath(location.slug)}
          onClick={() =>
            trackHyroxFacilitySelect({
              facility_id: location.id,
              source: "map_selection",
              action: "open_detail",
              result_count: resultCount,
            })
          }
        >
          GymMapで詳細を見る
        </Link>
        {location.officialUrl ? (
          <HyroxOfficialSiteLink
            facilityId={location.id}
            href={location.officialUrl}
            label={`${location.name}の公式サイトを新しいタブで開く`}
            source="map_selection"
          />
        ) : null}
      </div>
    </div>
  );
}
