import { Badge, Button, CardSurface, Chip, FreshnessIndicator } from "@/components/ui";

type LessonReferenceFixtureProps = Readonly<{
  compact?: boolean;
}>;

export function LessonReferenceFixture({ compact = false }: LessonReferenceFixtureProps) {
  return (
    <CardSurface className="ui-reference-card" data-domain="lesson">
      <div className="ui-reference-card__header">
        <div>
          <p className="ui-reference-card__eyebrow">今日 19:30–20:15</p>
          <h3>BODYCOMBAT 45</h3>
        </div>
        <FreshnessIndicator status="current" label="今週の公式スケジュール" />
      </div>
      <p className="ui-reference-card__lead">スポーツクラブ Example 渋谷</p>
      <div className="ui-reference-card__metadata">
        <Chip>LES MILLS</Chip>
        <Chip>45分</Chip>
        {!compact ? <Chip>東京都渋谷区</Chip> : null}
      </div>
      <div className="ui-reference-card__actions">
        <Button variant="secondary">詳細を見る</Button>
      </div>
    </CardSurface>
  );
}

type HyroxReferenceFixtureProps = Readonly<{
  equipment: readonly string[];
  capabilities: readonly string[];
  freshnessStatus: "current" | "aging" | "stale" | "warning" | "neutral";
  freshnessLabel: string;
  compact?: boolean;
}>;

export function HyroxReferenceFixture({
  equipment,
  capabilities,
  freshnessStatus,
  freshnessLabel,
  compact = false,
}: HyroxReferenceFixtureProps) {
  return (
    <CardSurface className="ui-reference-card" data-domain="hyrox">
      <div className="ui-reference-card__header">
        <div>
          <Badge tone="accent">Official Training Club</Badge>
          <h3>HYROX Training Club Example</h3>
        </div>
        <FreshnessIndicator status={freshnessStatus} label={freshnessLabel} />
      </div>
      <p className="ui-reference-card__lead">東京都渋谷区</p>
      {equipment.length > 0 ? (
        <section className="ui-reference-card__evidence" aria-label="確認できた設備">
          <h4>{compact ? "確認できた設備" : "公式情報で確認できた設備"}</h4>
          <div className="ui-reference-card__metadata">
            {equipment.map((label) => <Chip tone="positive" key={label}>{label}</Chip>)}
          </div>
        </section>
      ) : null}
      {capabilities.length > 0 ? (
        <section className="ui-reference-card__evidence" aria-label="確認できた利用情報">
          <h4>公式情報で確認できた利用情報</h4>
          <div className="ui-reference-card__metadata">
            {capabilities.map((label) => <Badge tone="success" key={label}>{label}</Badge>)}
          </div>
        </section>
      ) : null}
      <p className="ui-reference-card__disclosure">
        施設またはブランドの公式情報で確認できた内容のみを表示しています。掲載がない設備や対応の不在を意味しません。利用条件は施設の公式情報をご確認ください。
      </p>
    </CardSurface>
  );
}
