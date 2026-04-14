import Image from "next/image";

import { LocationMapSection } from "@/components/map/location-map-section";
import { SearchForm } from "@/components/search/search-form";
import { getBrands, getLocations, getSearchResults } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [brands, locations, searchResults] = await Promise.all([
    getBrands(),
    getLocations(),
    getSearchResults({
      q: "",
      weekday: "",
      timeRange: "",
      durationRange: "",
      brand: "",
      area: "",
    }),
  ]);

  return (
    <div className="page-stack">
      <section className="hero panel">
        <p className="eyebrow">Gym studio schedule search</p>
        <div className="hero-photo">
          <Image
            src="/images/hero-studio-program.png"
            alt="スタジオプログラムに参加している様子"
            fill
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1120px) calc(100vw - 80px), 1072px"
          />
        </div>
        <SearchForm brands={brands} />
      </section>

      <LocationMapSection locations={locations} searchResults={searchResults} />
    </div>
  );
}
