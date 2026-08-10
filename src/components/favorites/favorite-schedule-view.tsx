"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { FavoriteProgramButton } from "@/components/favorites/favorite-program-button";
import { useFavoritePrograms } from "@/components/favorites/use-favorite-programs";
import type { FavoriteScheduleItem, FavoriteScheduleResponse } from "@/lib/favorite-programs";
import { buildProgramPath } from "@/lib/site";
import type { Weekday } from "@/lib/types";
import { formatDate, formatTime, formatWeekday, getLocationAddress } from "@/lib/utils";

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
      <section className="panel favorite-empty-state">
        <p className="eyebrow">MY PROGRAMS</p>
        <h1>お気に入りはまだありません</h1>
        <p className="muted">人気のレッスンやプログラムページで☆を押すと、今週の開催をまとめて確認できます。</p>
        <Link className="primary-link-button" href="/#popular-programs">レッスンを選ぶ</Link>
      </section>
    );
  }

  const isLoading = response.requestKey !== requestKey;

  return (
    <div className="page-stack favorite-schedule-page">
      <section className="panel favorite-schedule-header">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MY PROGRAMS</p>
            <h1>お気に入りの今週</h1>
            <p className="muted">今日から7日間の登録スケジュールを、開催が近い順にまとめています。</p>
          </div>
          <Link href="/">トップへ戻る</Link>
        </div>
        <div className="favorite-program-controls">
          {favorites.map((program) => (
            <div className="favorite-program-chip" key={program.id}>
              <Link href={buildProgramPath(program.slug)}>{program.name}</Link>
              <FavoriteProgramButton {...program} compact />
            </div>
          ))}
        </div>
        <form className="favorite-area-filter" onSubmit={applyAreaFilter}>
          <label className="field">
            <span>通いやすいエリア・店舗で絞り込む</span>
            <input
              value={areaInput}
              onChange={(event) => setAreaInput(event.target.value)}
              placeholder="新宿 / 渋谷 / 川崎 / 店舗名など"
            />
          </label>
          <button type="submit">絞り込む</button>
          {appliedArea ? <button className="secondary-button" type="button" onClick={() => { setAreaInput(""); setAppliedArea(""); }}>解除</button> : null}
        </form>
      </section>

      {isLoading ? (
        <section className="panel favorite-loading" aria-live="polite">
          <p>今週の開催を読み込んでいます…</p>
        </section>
      ) : response.error ? (
        <section className="panel favorite-empty-state">
          <h2>読み込みに失敗しました</h2>
          <p className="muted">{response.error}</p>
        </section>
      ) : groupedItems.length ? (
        <section className="favorite-week-results">
          <div className="favorite-week-summary">
            <p><strong>{response.data?.totalResults ?? 0}件</strong>の登録スケジュール</p>
            {appliedArea ? <span>「{appliedArea}」で絞り込み中</span> : <span>最大120件を表示</span>}
          </div>
          {groupedItems.map(([weekday, items]) => (
            <section className="panel favorite-day-group" key={weekday}>
              <div className="favorite-day-heading">
                <h2>{getDayHeading(weekday, startWeekday)}</h2>
                <span>{items.length}件</span>
              </div>
              <div className="favorite-schedule-list">
                {items.map((item) => (
                  <article className="favorite-schedule-card" key={item.scheduleId}>
                    <div className="favorite-schedule-time">
                      <strong>{formatTime(item.startTime)}</strong>
                      <span>{formatTime(item.endTime)}まで</span>
                    </div>
                    <div className="favorite-schedule-main">
                      <p className="favorite-schedule-program">{item.rawProgramName}</p>
                      <h3>{item.location.name}</h3>
                      <p className="muted">{item.brandName}・{getLocationAddress(item.location.prefecture, item.location.city)}</p>
                    </div>
                    <div className="favorite-schedule-actions">
                      {item.durationMinutes ? <span>{item.durationMinutes}分</span> : null}
                      <Link href={`/locations/${item.location.slug}`}>店舗を見る</Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
          <p className="favorite-schedule-note">
            掲載内容は変更される場合があります。来館・予約前に各店舗の公式情報をご確認ください。最新確認日: {formatDate(response.data?.latestScheduleUpdate)}
          </p>
        </section>
      ) : (
        <section className="panel favorite-empty-state">
          <h2>条件に合う開催が見つかりませんでした</h2>
          <p className="muted">エリアを広げるか、絞り込みを解除してもう一度確認してください。</p>
        </section>
      )}
    </div>
  );
}
