import Link from "next/link";

import { Badge, CardSurface } from "@/components/ui";
import {
  formatPublicUpdateDate,
  type PublicUpdateCategory,
  type PublicUpdateRecord,
} from "@/lib/public-updates";

const categoryPresentation: Record<
  PublicUpdateCategory,
  { label: string; tone: "neutral" | "accent" | "success" }
> = {
  LESSON_DATA: { label: "レッスン", tone: "accent" },
  HYROX_DATA: { label: "HYROX", tone: "success" },
  PRODUCT_FEATURE: { label: "機能改善", tone: "neutral" },
};

type PublicUpdateItemProps = {
  update: PublicUpdateRecord;
};

export function PublicUpdateItem({ update }: PublicUpdateItemProps) {
  const category = categoryPresentation[update.category];
  const isRetracted = update.status === "RETRACTED";

  return (
    <CardSurface
      className={`public-update-item${isRetracted ? " public-update-item--retracted" : ""}`}
      aria-labelledby={`public-update-${update.id}`}
    >
      <div className="public-update-item__meta">
        <time dateTime={update.publishedAt}>{formatPublicUpdateDate(update.publishedAt)}</time>
        <Badge tone={category.tone}>{category.label}</Badge>
        {update.status === "CORRECTED" ? <Badge tone="warning">訂正あり</Badge> : null}
      </div>

      <h2 id={`public-update-${update.id}`}>
        {isRetracted ? "この更新は取り下げました" : update.title}
      </h2>

      {!isRetracted && update.summary ? <p className="public-update-item__summary">{update.summary}</p> : null}

      {!isRetracted && update.affectedEntityCount && update.affectedEntityType ? (
        <p className="public-update-item__scope">
          対象: {update.affectedEntityCount}{update.affectedEntityType}
        </p>
      ) : null}

      {update.correctionNote ? (
        <p className="public-update-item__correction-note">
          <strong>{isRetracted ? "取り下げ理由" : "訂正内容"}</strong>
          <span>{update.correctionNote}</span>
        </p>
      ) : null}

      {!isRetracted && update.destination ? (
        <Link className="public-update-item__destination" href={update.destination.href}>
          {update.destination.label}
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </CardSurface>
  );
}
