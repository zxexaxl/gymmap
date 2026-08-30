import Form from "next/form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultSearchFilters, durationRangeOptions, timeRangeOptions, weekdayOptions } from "@/lib/constants";
import type { GymBrand, SearchFilters } from "@/lib/types";

import styles from "./search-form.module.css";

type SearchFormProps = {
  brands: GymBrand[];
  initialValues?: SearchFilters;
  action?: string;
  variant?: "default" | "hero";
};

export function SearchForm({
  brands,
  initialValues = defaultSearchFilters,
  action = "/search",
  variant = "default",
}: SearchFormProps) {
  const advancedFilterCount = [initialValues.timeRange, initialValues.durationRange, initialValues.brand].filter(Boolean).length;

  return (
    <Form className={`${styles.form} ${variant === "hero" ? styles.hero : styles.default}`} action={action}>
      {variant === "hero" ? (
        <div className={styles.heading}>
          <p>レッスン検索</p>
          <h2>希望の条件から探す</h2>
        </div>
      ) : null}

      <div className={styles.primaryFields}>
        <Input
          id={`${variant}-lesson-query`}
          name="q"
          type="search"
          label="レッスン / プログラム"
          defaultValue={initialValues.q}
          placeholder="BODYCOMBAT / ヨガ など"
        />
        <Input
          id={`${variant}-lesson-area`}
          name="area"
          label="エリア / 店舗"
          defaultValue={initialValues.area}
          placeholder="渋谷 / 新宿 / 店舗名"
        />
        <label className={styles.selectField} htmlFor={`${variant}-lesson-weekday`}>
          <span>曜日</span>
          <select id={`${variant}-lesson-weekday`} name="weekday" defaultValue={initialValues.weekday}>
            {weekdayOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <details className={styles.advanced} open={advancedFilterCount > 0}>
        <summary>
          <span>詳細条件</span>
          {advancedFilterCount ? <small>{advancedFilterCount}件を適用中</small> : <small>時間・所要時間・チェーン</small>}
        </summary>
        <div className={styles.advancedFields}>
          <label className={styles.selectField} htmlFor={`${variant}-lesson-time`}>
            <span>開始時刻帯</span>
            <select id={`${variant}-lesson-time`} name="timeRange" defaultValue={initialValues.timeRange}>
              {timeRangeOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className={styles.selectField} htmlFor={`${variant}-lesson-duration`}>
            <span>所要時間</span>
            <select id={`${variant}-lesson-duration`} name="durationRange" defaultValue={initialValues.durationRange}>
              {durationRangeOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <Input
            id={`${variant}-lesson-brand`}
            list={`${variant}-lesson-brands`}
            name="brand"
            label="チェーン名"
            defaultValue={initialValues.brand}
            placeholder="Gold's Gym など"
          />
          <datalist id={`${variant}-lesson-brands`}>
            {brands.map((brand) => <option key={brand.id} value={brand.name} />)}
          </datalist>
        </div>
      </details>

      <div className={styles.actions}>
        <Button type="submit">この条件で探す</Button>
      </div>
    </Form>
  );
}
