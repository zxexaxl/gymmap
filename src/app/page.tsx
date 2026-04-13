import { LocationMapSection } from "@/components/map/location-map-section";
import { SearchForm } from "@/components/search/search-form";
import { getBrands, getLocations } from "@/lib/data";

export default async function HomePage() {
  const [brands, locations] = await Promise.all([
    getBrands(),
    getLocations(),
  ]);

  return (
    <div className="page-stack">
      <section className="hero panel">
        <p className="eyebrow">Gym studio schedule search</p>
        <h1>曜日や時間帯から、気になるスタジオプログラムをまとめて探す</h1>
        <p className="hero-copy">
          プログラム名、曜日、時間帯、エリア、チェーン名から、複数のジムのクラス情報を横断して探せます。
        </p>
        <SearchForm brands={brands} />
      </section>

      <LocationMapSection locations={locations} />
    </div>
  );
}
