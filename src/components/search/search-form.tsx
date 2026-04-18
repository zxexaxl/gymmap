import { defaultSearchFilters, durationRangeOptions, timeRangeOptions, weekdayOptions } from "@/lib/constants";
import type { GymBrand, SearchFilters } from "@/lib/types";

type SearchFormProps = {
  brands: GymBrand[];
  initialValues?: SearchFilters;
  action?: string;
};

export function SearchForm({ brands, initialValues = defaultSearchFilters, action = "/search" }: SearchFormProps) {
  return (
    <form className="panel search-form" action={action}>
      <div className="field-grid">
        <label className="field">
          <span>プログラム名</span>
          <input name="q" defaultValue={initialValues.q} placeholder="BODYCOMBAT / Yoga など" />
        </label>
        <label className="field field-emphasis">
          <span>曜日</span>
          <select name="weekday" defaultValue={initialValues.weekday}>
            {weekdayOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field field-emphasis">
          <span>開始時刻帯</span>
          <select name="timeRange" defaultValue={initialValues.timeRange}>
            {timeRangeOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field field-emphasis">
          <span>所要時間</span>
          <select name="durationRange" defaultValue={initialValues.durationRange}>
            {durationRangeOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>エリア / 店舗名</span>
          <input name="area" defaultValue={initialValues.area} placeholder="渋谷 / 新宿 / 池袋 など" />
        </label>
        <label className="field">
          <span>チェーン名</span>
          <input list="brands" name="brand" defaultValue={initialValues.brand} placeholder="Gold's Gym など" />
          <datalist id="brands">
            {brands.map((brand) => (
              <option key={brand.id} value={brand.name} />
            ))}
          </datalist>
        </label>
      </div>
      <div className="search-actions">
        <button type="submit">検索する</button>
      </div>
      <p className="form-help">BODYCOMBAT、ヨガ、ピラティス、ZUMBA などのレッスン検索に対応しています。</p>
    </form>
  );
}
