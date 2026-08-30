"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { FavoriteProgramButton } from "@/components/favorites/favorite-program-button";
import { useFavoritePrograms } from "@/components/favorites/use-favorite-programs";
import { Button, CardSurface, FreshnessIndicator, Input } from "@/components/ui";
import type { FavoriteScheduleItem, FavoriteScheduleResponse } from "@/lib/favorite-programs";
import { buildProgramPath } from "@/lib/site";
import type { Weekday } from "@/lib/types";
import { formatDate, formatTime, formatWeekday, getLocationAddress } from "@/lib/utils";

import styles from "./favorite-schedule-view.module.css";

const weekdayIndexes: Record<Weekday, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

type FavoriteScheduleState = {
  requestKey: string;
  data: FavoriteScheduleResponse | null;
  error: string | null;
};

function getMondayBasedWeekday(date = new Date()) {
  return (date.getDay() + 6) % 7;
}

function getDayHeading(weekday: Weekday, startWeekday: number) {
  const dayOffset = (weekdayIndexes[weekday] - startWeekday + 7) % 7;
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  const relativeLabel = dayOffset === 0 ? "今日" : dayOffset === 1 ? "明日" : formatWeekday(weekday);
  const dateLabel = new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", weekday: "short" }).format(date);
  return `${relativeLabel}・${dateLabel}`;
}

export function FavoriteScheduleView() {
  const favorites = useFavoritePrograms();
  const [areaInput, setAreaInput] = useState("");
  const [appliedArea, setAppliedArea] = useState("");
  const startWeekday = getMondayBasedWeekday();
  const requestKey = `${favorites.map((program) => program.id).join(",")}|${appliedArea}|${startWeekday}`;
  const [response, setResponse] = useState<FavoriteScheduleState>({ requestKey: "", data: null, error: null });

  useEffect(() => {
    if (!favorites.length) {
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({ startWeekday: String(startWeekday) });
    favorites.forEach((program) => params.append("programId", program.id));

    if (appliedArea) {
      params.set("area", appliedArea);
    }

    fetch(`/api/favorites/schedules?${params.toString()}`, { signal: controller.signal })
      .then(async (result) => {
        if (!result.ok) {
          throw new Error("お気に入りのスケジュールを取得できませんでした。");
        }

        return (await result.json()) as FavoriteScheduleResponse;
      })
      .then((data) => setResponse({ requestKey, data, error: null }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setResponse({
            requestKey,
            data: null,
            error: error instanceof Error ? error.message : "スケジュールを取得できませんでした。",
          });
        }
      });

    return () => controller.abort();
  }, [appliedArea, favorites, requestKey, startWeekday]);

  const groupedItems = useMemo(() => {
    const groups = new Map<Weekday, FavoriteScheduleItem[]>();

    (response.data?.items ?? []).forEach((item) => {
      const weekday = item.weekday as Weekday;
      groups.set(weekday, [...(groups.get(weekday) ?? []), item]);
    });

    return Array.from(groups.entries());
  }, [response.data]);

  function applyAreaFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedArea(areaInput.trim());
  }

  if (!favorites.length) {
    return (
      <CardSurface as="section" className={styles.emptyState}>
        <div className={styles.emptyIcon} aria-hidden="true">☆</div>
        <p className={styles.kicker}>お気に入り</p>
        <h1>お気に入りはまだありません</h1>
        <p>気になるレッスンプログラムを保存すると、今日から7日間の開催予定をここで確認できます。</p>
        <div className={styles.emptyActions}>
          <Link className={styles.primaryLink} href="/#popular-programs">人気プログラムから選ぶ</Link>
          <Link href="/search">条件からレッスンを探す</Link>
        </div>
      </CardSurface>
    );
  }

  const isLoading = response.requestKey !== requestKey;

  return (
    <div className={`page-stack ${styles.page}`}>
      <CardSurface as="section" className={styles.header}>
        <div className={styles.heading}>
          <div>
            <p className={styles.kicker}>お気に入り</p>
            <h1>お気に入りの今週</h1>
            <p>保存した{favorites.length}件のプログラムを、今日から7日間の開催順に確認できます。</p>
          </div>
          <Link href="/search">レッスンを探す</Link>
        </div>
        <div className={styles.programs} aria-label={`保存したプログラム ${favorites.length}件`}>
          {favorites.map((program) => (
            <div className={styles.program} key={program.id}>
              <div>
                <span>保存したプログラム</span>
                <Link href={buildProgramPath(program.slug)}>{program.name}</Link>
              </div>
              <FavoriteProgramButton {...program} compact />
            </div>
          ))}
        </div>
        <form className={styles.filter} onSubmit={applyAreaFilter}>
          <Input
            id="favorite-area-filter"
            label="通いやすいエリア・店舗で絞り込む"
            value={areaInput}
            onChange={(event) => setAreaInput(event.target.value)}
            placeholder="新宿 / 渋谷 / 川崎 / 店舗名など"
          />
          <Button type="submit">絞り込む</Button>
          {appliedArea ? (
            <Button variant="secondary" type="button" onClick={() => { setAreaInput(""); setAppliedArea(""); }}>
              解除
            </Button>
          ) : null}
        </form>
      </CardSurface>

      {isLoading ? (
        <CardSurface as="section" className={styles.status} aria-live="polite">
          <p>今週の開催を読み込んでいます…</p>
        </CardSurface>
      ) : response.error ? (
        <CardSurface as="section" className={styles.status} role="alert">
          <h2>読み込みに失敗しました</h2>
          <p>{response.error}</p>
        </CardSurface>
      ) : groupedItems.length ? (
        <section className={styles.weekResults} aria-labelledby="favorite-week-heading">
          <div className={styles.weekSummary}>
            <p><strong>{response.data?.totalResults ?? 0}件</strong>の登録スケジュール</p>
            {appliedArea ? <span>「{appliedArea}」で絞り込み中</span> : <span>最大120件を表示</span>}
          </div>
          <h2 className={styles.visuallyHidden} id="favorite-week-heading">今日から7日間の開催予定</h2>
          {groupedItems.map(([weekday, items]) => (
            <CardSurface as="section" className={styles.dayGroup} key={weekday}>
              <div className={styles.dayHeading}>
                <h2>{getDayHeading(weekday, startWeekday)}</h2>
                <span>{items.length}件</span>
              </div>
              <div className={styles.scheduleList}>
                {items.map((item) => (
                  <article className={styles.scheduleCard} key={item.scheduleId}>
                    <div className={styles.scheduleTime}>
                      <strong>{formatTime(item.startTime)}</strong>
                      <span>{formatTime(item.endTime)}まで</span>
                    </div>
                    <div className={styles.scheduleMain}>
                      <p>{item.rawProgramName}</p>
                      <h3>{item.location.name}</h3>
                      <span>{item.brandName}・{getLocationAddress(item.location.prefecture, item.location.city)}</span>
                    </div>
                    <div className={styles.scheduleActions}>
                      {item.durationMinutes ? <span>{item.durationMinutes}分</span> : null}
                      <Link href={`/locations/${item.location.slug}`}>詳細とタイムテーブル</Link>
                    </div>
                  </article>
                ))}
              </div>
            </CardSurface>
          ))}
          <div className={styles.note}>
            <FreshnessIndicator status="neutral" label={`スケジュール確認 ${formatDate(response.data?.latestScheduleUpdate)}`} />
            <p>掲載内容は変更される場合があります。来館・予約前に各店舗の公式情報をご確認ください。</p>
          </div>
        </section>
      ) : (
        <CardSurface as="section" className={styles.status}>
          <h2>条件に合う開催が見つかりませんでした</h2>
          <p>エリアを広げるか、絞り込みを解除してもう一度確認してください。</p>
          {appliedArea ? (
            <Button variant="secondary" type="button" onClick={() => { setAreaInput(""); setAppliedArea(""); }}>
              絞り込みを解除
            </Button>
          ) : null}
        </CardSurface>
      )}
    </div>
  );
}
