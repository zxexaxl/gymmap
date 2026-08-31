import type { ReactNode } from "react";

import { Button, CardSurface } from "@/components/ui";

import styles from "./map-presentation.module.css";

export type MapLocationPresentationState =
  | "not_requested"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable"
  | "obtained"
  | "stale"
  | "refreshing";

type MapChromeProps = {
  label: string;
  children: ReactNode;
};

export function MapChrome({ label, children }: MapChromeProps) {
  return (
    <div className={styles.chrome} role="group" aria-label={label}>
      {children}
    </div>
  );
}

type CurrentLocationControlProps = {
  state: MapLocationPresentationState;
  message: ReactNode;
  onClick: () => void;
  disabled?: boolean;
};

const locationLabels: Record<MapLocationPresentationState, string> = {
  not_requested: "現在地を使う",
  requesting: "現在地を取得中",
  granted: "現在地を確認する",
  denied: "位置情報の設定を確認",
  unavailable: "現在地を再取得",
  obtained: "現在地を表示中",
  stale: "現在地を更新",
  refreshing: "現在地を更新中",
};

export function CurrentLocationControl({
  state,
  message,
  onClick,
  disabled = false,
}: CurrentLocationControlProps) {
  const pending = state === "requesting" || state === "refreshing";

  return (
    <div className={styles.locationControl} data-location-state={state}>
      <Button
        type="button"
        variant="secondary"
        className={styles.locationButton}
        onClick={onClick}
        disabled={disabled}
        loading={pending}
        loadingLabel={locationLabels[state]}
        aria-describedby="map-location-status"
      >
        <span className={styles.locationGlyph} aria-hidden="true">◎</span>
        {locationLabels[state]}
      </Button>
      <p id="map-location-status" className={styles.locationMessage} aria-live="polite">
        {message}
      </p>
    </div>
  );
}

type MapSelectionSurfaceProps = {
  ariaLabel: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  placement?: "desktop" | "mobile";
};

export function MapSelectionSurface({
  ariaLabel,
  closeLabel,
  onClose,
  children,
  placement = "desktop",
}: MapSelectionSurfaceProps) {
  return (
    <CardSurface
      as="div"
      role="region"
      className={`${styles.selectionSurface} ${placement === "mobile" ? styles.mobileSurface : styles.desktopSurface}`}
      aria-label={ariaLabel}
    >
      <div className={styles.sheetHandle} aria-hidden="true" />
      <Button
        type="button"
        variant="ghost"
        iconOnly
        aria-label={closeLabel}
        className={styles.closeButton}
        onClick={onClose}
      >
        ×
      </Button>
      <div className={styles.selectionContent} aria-live="polite">{children}</div>
    </CardSurface>
  );
}

type MapStateNoticeProps = {
  kind: "loading" | "empty" | "error";
  children: ReactNode;
  action?: ReactNode;
};

export function MapStateNotice({ kind, children, action }: MapStateNoticeProps) {
  return (
    <div
      className={styles.stateNotice}
      data-state-kind={kind}
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "error" ? "assertive" : "polite"}
    >
      <span className={styles.stateIcon} aria-hidden="true">
        {kind === "loading" ? "…" : kind === "empty" ? "○" : "!"}
      </span>
      <div>{children}</div>
      {action ? <div className={styles.stateAction}>{action}</div> : null}
    </div>
  );
}
