import Link from "next/link";

import { Badge, Chip } from "@/components/ui";
import {
  HYROX_EQUIPMENT_LABELS,
  type HyroxDiscoveryLocation,
} from "@/lib/hyrox-discovery";

import styles from "./hyrox-map-ui.module.css";

type HyroxMapSelectionContentProps = {
  location: HyroxDiscoveryLocation;
  outsideCurrentResults: boolean;
};

export function HyroxMapSelectionContent({
  location,
  outsideCurrentResults,
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
        <Link className={styles.primaryAction} href={`/locations/${location.slug}`}>
          GymMapで詳細を見る
        </Link>
        {location.officialUrl ? (
          <a
            href={location.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${location.name}の公式サイトを新しいタブで開く`}
          >
            施設公式サイト ↗
          </a>
        ) : null}
      </div>
    </div>
  );
}
