import Link from "next/link";

import { Badge, Button, CardSurface, Chip } from "@/components/ui";
import {
  buildHyroxDetailPath,
  HYROX_EQUIPMENT_LABELS,
  type HyroxDiscoveryLocation,
} from "@/lib/hyrox-discovery";

type HyroxFacilityCardProps = {
  location: HyroxDiscoveryLocation;
  onMapFocus: (locationId: string) => void;
};

export function HyroxFacilityCard({ location, onMapFocus }: HyroxFacilityCardProps) {
  return (
    <CardSurface className="hyrox-location-card">
      <div className="hyrox-location-card__identity">
        <Badge tone="accent">Official Training Club</Badge>
        <p className="hyrox-location-brand">{location.brandName}</p>
        <h3>{location.name}</h3>
        <p className="hyrox-location-area">
          {location.prefecture} {location.city}
        </p>
        <p className="muted">{location.address}</p>
      </div>

      {location.confirmedEquipment.length > 0 ? (
        <section className="hyrox-equipment" aria-labelledby={`hyrox-equipment-${location.id}`}>
          <h4 id={`hyrox-equipment-${location.id}`}>公式情報で確認できた設備</h4>
          <div className="hyrox-equipment__chips">
            {location.confirmedEquipment.map((equipment) => (
              <Chip key={equipment} tone="positive">
                {HYROX_EQUIPMENT_LABELS[equipment]}
              </Chip>
            ))}
          </div>
        </section>
      ) : null}

      <div className="hyrox-card-actions">
        <Button variant="ghost" onClick={() => onMapFocus(location.id)}>
          地図で見る
        </Button>
        <Link href={buildHyroxDetailPath(location.slug)}>GymMapで詳細を見る</Link>
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
    </CardSurface>
  );
}
