# HYROX H2-5 — Reviewed New Location Import Candidate

Candidate hash: `7a80e196c89c594a601ac1446c49534a7a64fc33d50050489c809974db346f5a`
Production observed at: 2026-08-29T13:50:28.000Z
Sources revalidated at: 2026-08-29T13:50:28.000Z

This package is preview-only. It has no production write path and contains no equipment, capability, program, or class inference.

## Import graph

| Table | Candidate count |
| --- | ---: |
| gym_brands | 16 |
| gym_locations | 17 |
| training_sources | 17 |
| location_external_identifiers | 17 |
| location_training_disciplines | 17 |
| training_affiliations | 17 |
| training_evidence | 34 |

## Brand candidates

| Name | Slug | Semantic | Locations | Official authority | Collision |
| --- | --- | --- | ---: | --- | --- |
| Anytime Fitness | anytime-fitness | chain | 1 | https://www.anytimefitness.co.jp/ | clear |
| BeeQuick Fitness | beequick-fitness | chain | 2 | https://www.beequick.jp/ | clear |
| CrossFit Ashiya | crossfit-ashiya | single_location_brand | 1 | https://crossfitashiya.com/ | clear |
| CrossFit Hakata Shingu | crossfit-hakata-shingu | single_location_brand | 1 | https://www.crossfit-hakata-shingu.com/ | clear |
| CrossFit Kumamoto | crossfit-kumamoto | single_location_brand | 1 | https://www.crossfitkumamoto.com/ | clear |
| CrossFit Otoyo Strength | crossfit-otoyo-strength | single_location_brand | 1 | https://www.otoyostrength.com/ | clear |
| CrossFit Rakuhoku | crossfit-rakuhoku | single_location_brand | 1 | https://crossfitrakuhoku.com/ | clear |
| CrossFit Takarazuka | crossfit-takarazuka | single_location_brand | 1 | https://crossfittakarazuka.com/ | clear |
| crossfitokayama | crossfitokayama | single_location_brand | 1 | https://www.crossfitokayama.com/ | clear |
| g-zone | g-zone | chain | 1 | https://g-zone.co.jp/ | clear |
| H-Field Sports Performance Center | h-field-sports-performance-center | single_location_brand | 1 | https://www.h-fieldsendai.com/ | clear |
| Improve KYOTO | improve-kyoto | single_location_brand | 1 | https://improve-hyrox.com/ | clear |
| NOTA GYM | nota-gym | chain | 1 | https://nota-gym.com/ | clear |
| STANCE FITNESS | stance-fitness | chain | 1 | https://stance-design.jp/ | clear |
| Takamatsu CrossFit | takamatsu-crossfit | single_location_brand | 1 | https://takamatsu-crossfit.jp/ | clear |
| ＸＴＲＹ | xtry | single_location_brand | 1 | https://www.xtry.jp/ | clear |

## Location candidates

| HGY ID | HYROX / canonical name | Slug | Brand | Area | Address | Type | Official URL | Confirmed | Stale | Hash |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HGY_C0V7CK7K15SLUrMhBvyyO0phM | g-zone PARK / g-zone PARK | g-zone-park | g-zone | 京都府 京都市右京区 | 615-0933, 京都府, 京都市右京区梅津後藤町1-3 | fitness_studio | https://g-zone.co.jp/park/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | 73ff9a6f29e80f853da1c209d8e5ffa022ab83874b3b7000de0fb4d71b68a581 |
| HGY_c816ru6QeTv14At3O51pjK8au | Takamatsu CrossFit / Takamatsu CrossFit | takamatsu-crossfit | takamatsu-crossfit | 香川県 高松市 | 7618056, 高松市, 上天神町634 | fitness_studio | https://takamatsu-crossfit.jp/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | 8e7845813a75a7624ae730cdb62aa941fa07608a6c827ce1fef32bca001f212b |
| HGY_Cl8QF5olON4Y0D7mho4iGg34L | CrossFit Ashiya / CrossFit Ashiya | crossfit-ashiya | crossfit-ashiya | 兵庫県 芦屋市 | 659-0013, Ashiya,HYOGO, 7-5 Iwazono-cho | fitness_studio | https://crossfitashiya.com/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | 29ff6219f10449156a5584d9f691b10637e578ca65b9f42ddc9c53428be4eea4 |
| HGY_e48JpyZiFH8V9aqp7zJ8ouQju | Beequick Fitness　Sanda / Beequick Fitness　Sanda | beequick-fitness-sanda | beequick-fitness | 兵庫県 三田市 | 669-1321, Hyogo-ken Sanda-shi, keyakidai 1-6-2 | fitness_club | https://www.beequick.jp/location/sanda/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | 55c85def1e1b16a8299003b4596dec8bdefb9c83378b71b1322a3d85585cb8a3 |
| HGY_gdqY3Z5sigmQLLGmSGbjG26sR | STANCE FITNESS ２ND / STANCE FITNESS ２ND | stance-fitness-2nd | stance-fitness | 京都府 京都市下京区 | 6008387, 京 都 市, 下 京 区 高 辻 大 宮 町 1 0 3 大 宮 高 辻 ビ ル 2 階 | fitness_studio | https://stance-design.jp/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | cd3b480deb826b0a2dc4f7fb703361fb1d8e68db72b7f67005d87f974fdf6245 |
| HGY_gp7GcAxbIZtxk5KpvoDwAOOcr | Improve KYOTO / Improve KYOTO | improve-kyoto | improve-kyoto | 京都府 京都市中京区 | 6048221, 京都, B1F, 280 Tenjinyama-cho, Nishikikoji-dori Muromachi Nishi-iru, Nakagyo-ku | fitness_studio | https://improve-hyrox.com/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | 2d21a15973de40d29a945764602265a28f480e7a8d40802259f84b4b04b1a55f |
| HGY_GyudKibCcLKI0LIwxnYTcv2Te | CrossFit Rakuhoku / CrossFit Rakuhoku | crossfit-rakuhoku | crossfit-rakuhoku | 京都府 京都市左京区 | 606-8004, Kyoto, 7-1 Yamabanakawabatacho | fitness_studio | https://crossfitrakuhoku.com/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | 76171377e437f157e6d282dca94ecb8b169b4fc321a49884bf90fd60af5eb060 |
| HGY_IXvBUmAfS03dK1N7KeulKnC6O | ANYTIME FITNESS NAGAOKAKYO / ANYTIME FITNESS NAGAOKAKYO | anytime-fitness-nagaokakyo | anytime-fitness | 京都府 長岡京市 | 6170826, 長岡京市, 開田4-22-5 | fitness_club | https://www.anytimefitness.co.jp/nagaokakyo/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | 58caf12aa57d48cb920fdce8facab1ac8e000aab1b07f485855be1be62a18e50 |
| HGY_kCFMRp8Q0qOkn2iMEYikZq4Kg | CrossFit Kumamoto / CrossFit Kumamoto | crossfit-kumamoto | crossfit-kumamoto | 熊本県 熊本市中央区 | 8600822, Kumamoto, 331-1 Motoyamamachi Chuo-ku | fitness_studio | https://www.crossfitkumamoto.com/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | 4cba7c274b9c72bd3efaf61d3a5c3d394e229ee4eaf4834967e6639f3a29a2d9 |
| HGY_Kg433w73iQIbSdY97CXEbzUk9 | CrossFit Otoyo Strength / CrossFit Otoyo Strength | crossfit-otoyo-strength | crossfit-otoyo-strength | 高知県 長岡郡大豊町 | 7890166, Kochi, 317-1 Higashidoi, Otoyo-cho, Nagaoka-gun | fitness_studio | https://www.otoyostrength.com/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | fbb1b3b5145bd5c0de96db1f9f7cded8ddd4cb18b0bdde1f1c58f8a92403eb77 |
| HGY_lO4q9FsvCxkbgiBXhBLDbHDI0 | CrossFit Takarazuka / CrossFit Takarazuka | crossfit-takarazuka | crossfit-takarazuka | 兵庫県 宝塚市 | 665-0822, Takarazuka, 1-13-18 Akuranaka | fitness_studio | https://crossfittakarazuka.com/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | 8bc4e851af7489126c3cb012e4008249fdc6af562dc13686ccfc8f88b1f025f0 |
| HGY_MFCsmHPD9dh968h6jJoJMVRcr | ＸＴＲＹ / ＸＴＲＹ | xtry | xtry | 岡山県 岡山市北区 | 7000973, 岡山市, 岡山県岡山市北区下中野377-1 | fitness_studio | https://www.xtry.jp/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | 7b3fc166dcff22b2e13c610645cdf9da115feb3f1244afbbdadeb31bb760dd76 |
| HGY_QT7VhrLDp4OIr5MJDDdEFDsGs | H-Field Sports Performance Center / H-Field Sports Performance Center | h-field-sports-performance-center | h-field-sports-performance-center | 宮城県 仙台市青葉区 | 980-0023, Sendai, 青葉区北目町2番40号 | fitness_studio | https://www.h-fieldsendai.com/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | f78222c8db283388d9f2c6b9c326ef2dce33f2a697109fa4bd28cb082b54ec33 |
| HGY_VNYgC17BsAJ3cLgavQTUPCgay | Beequick Kyotango / Beequick Kyotango | beequick-kyotango | beequick-fitness | 京都府 京丹後市 | 627-0005, Kyoto-fu kyotango-shi, mineyamachoshinmachi 1981-1 | fitness_club | https://www.beequick.jp/location/kyotango/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | 23c9d18bba6f6aca4fb375b389f0ec859979fb986710dd189efbbdea2eff3daa |
| HGY_w0fsND7jBYlmRipHytS9TFkH8 | crossfitokayama / crossfitokayama | crossfitokayama | crossfitokayama | 岡山県 岡山市南区 | 702-8011, Okayama-shi, Crossfitokayama 2978-8 Kori Minami-ku | fitness_studio | https://www.crossfitokayama.com/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | bfe98863601469451ee7fe2dfa4e349fae22950aea451df35b0af554f603508f |
| HGY_w8GnFtzgPzHOTZfWMBGzdEtoC | NOTA GYM 西京極店 / NOTA GYM 西京極店 | nota-gym-6150851 | nota-gym | 京都府 京都市右京区 | 615-0851, 京都市, 京都市右京区西京極西池田町9番地4 コスミック西京極2階 | fitness_studio | https://nota-gym.com/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | 95e1d0e1b17522d05934582366e458dde38b4b550dd7ddbee7c09c74d4b95f1d |
| HGY_wKwr756BgwTwHLwcICNji4PJx | CrossFit Hakata Shingu / CrossFit Hakata Shingu | crossfit-hakata-shingu | crossfit-hakata-shingu | 福岡県 糟屋郡新宮町 | 8110101, Fukuoka, 1793-7 harugami  Oaza Shingumachi kasuyagun | fitness_studio | https://www.crossfit-hakata-shingu.com/ | 2026-08-29T13:50:28.000Z | 2026-11-27T13:50:28.000Z | 7923558e4e523f3ee3e06ebbe209506f2d2420264e33eb3f0c02a0042dab9ded |

## Prefecture breakdown

| Prefecture | Count |
| --- | ---: |
| 京都府 | 7 |
| 兵庫県 | 3 |
| 宮城県 | 1 |
| 岡山県 | 2 |
| 熊本県 | 1 |
| 福岡県 | 1 |
| 香川県 | 1 |
| 高知県 | 1 |

## Location type breakdown

| Type | Count |
| --- | ---: |
| fitness_club | 3 |
| fitness_studio | 14 |

## Frozen idempotency and conflict policy

- serialization: One atomic transaction protected by a transaction-scoped advisory lock.
- brands: Reuse only an exact semantic name+slug identity; any name or slug mismatch blocks the whole set.
- locations: Reuse only an exact reviewed slug identity; URL, normalized-address, proximity, or semantic mismatch blocks.
- sources: Reuse one governing-body finder source by canonical URL only when location and authority match.
- external_identifiers: The namespace+HGY identity may belong to exactly one location; different-location ownership blocks.
- affiliations: Reuse the canonical location+HYROX+training_club+HYROX relation only when external identity matches.
- evidence: Deterministic SHA-256 content hash deduplicates source+target+assertion+observation evidence.
- freshness: Only a strictly newer authoritative observation may advance confirmation fields; older input never regresses them.

## Existing GymMap publication impact

- gym_locations: RLS currently permits public SELECT; is_active=true locations become eligible for existing location pages, map/data loaders, and static params immediately.
- schedule_search: No class_schedules are imported, so the 17 locations do not become schedule-search result rows; the 16 public brands do become available as brand-filter options after cache refresh.
- sitemap: Existing sitemap generation selects active gym locations, so the 17 slugs become sitemap entries on the next build.
- gym_brands: RLS currently permits public SELECT; brand rows are publicly readable immediately, though no standalone brand route was found.
- atomicity: Brand/location identity and the HYROX publication graph must be inserted in the same production transaction to avoid partial public exposure.

The production import is deferred to H2-6 and must use one atomic transaction.
