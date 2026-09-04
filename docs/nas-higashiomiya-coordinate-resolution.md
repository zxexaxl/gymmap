# NAS東大宮（新館） coordinate authority resolution

`NAS_HIGASHIOMIYA_COORDINATE_AUTHORITY_RESOLVED`

Accepted database coordinate: **35.947483, 139.641284**, building/facility level.
Existing location ID: `a6d34e4b-6cc1-4f6f-9fd0-793240e203d4`.
Raw named Place destination: 35.9474829, 139.6412836. The existing columns are
numeric(9,6): explicitly round once to six decimals (approximately 0.04 m change).
Digits preserve the mapping source, not surveyed precision. No address correction,
new facility, sibling coordinate copy, or schema change is proposed.

## Evidence chain, independently rechecked 2026-09-04

1. [NAS official mobile page](https://www.nas-club.co.jp/higashiomiya_newbuild/sp/)
   identifies the new building at 東大宮5丁目26-1, phone 048-793-4950, east exit
   three minutes. Its [official access diagram](https://www.nas-club.co.jp/higashiomiya_newbuild/sp/img/fig-map-about_251201.png)
   marks the northwest part of the block south of 山直月極駐車場, east of the
   station-side north–south street. This is building identity evidence, not a
   source of decimal coordinates. The facility page describes floors 1–4; it
   does not give a separate commercial building name.
2. [東大宮商店会's own member page](https://higashi-omiya.com/archives/shop/nas-club)
   names NAS東大宮（新館）, same phone and NAS URL, but 5-26-3. Its active Google
   embed selects NAS Place `0x6018c79bdaf3a333:0x64cd9be1ef07650d`. Its exterior
   photo shows the dark grey, green-banded NAS building on a street corner.
   This locally maintained member listing was not used in the earlier review.
3. [Kawai's own teaching-venue page](https://www.kawai.jp/physical/search/nashigashioomiya/)
   independently publishes 5丁目26-3 and an active embed selecting the **same
   named NAS new-building Place**, with a link to NAS's venue. Embed camera
   centres differ; neither is interpreted as the destination. The selected
   Place's explicit `!3d35.9474829!4d139.6412836` is the numeric source.
4. [Co-tenant nursery's official page](https://nursery.living-platform.com/facility/higashiomiya/)
   has **5-26-3 in its address table, 5-26-1 in its access section**, and an
   address-map embed using 5-26-3. The live rendered page and downloaded HTML
   both show this. [Saitama City's nursery record](https://www.city.saitama.lg.jp/kosodate/map/category17/p105602.html)
   uses 5-26-1. The NAS Place identifies the nursery on floor 1. The nursery is
   corroboration of building/address identity, **not a copied coordinate**.
5. The [current named NAS map](https://www.google.com/maps/place/スポーツクラブNAS東大宮（新館）/@35.9474829,139.6412836,19z/data=!4m6!3m5!1s0x6018c79bdaf3a333:0x64cd9be1ef07650d!8m2!3d35.9474829!4d139.6412836!16s%2Fg%2F11r9b87b33)
   was visually inspected at building scale. The pin lies on the west/northwest
   portion/edge of the long NAS building, south of 山直月極駐車場 and north of
   エステ・スクエア東大宮. This agrees with NAS's diagram and the merchant
   association's exterior. It is not the north-side parking building, the
   southern apartment, or a different NAS facility.
6. [GSI standard map at the Place point](https://maps.gsi.go.jp/#18/35.947483/139.641284/&base=std&ls=std&disp=1)
   has no building fill there. GSI's available photo layer shows parking in that
   portion of the block. It therefore does **not** independently verify the
   current building footprint. This limitation is explicit, not treated as
   proof of absence. Current facility/merchant exterior and building map show
   a building missing from that coverage; exact aerial capture date was not
   established. No interpolation from the old geometry was performed.

## What 26-1 versus 26-3 means for this decision

The independently published operational addresses refer to the **same new
building/site**, rather than documenting two NAS destinations: matching NAS
name/phone/website, two venue-specific map publishers selecting the same Place,
co-tenant's own dual address, and the street-block/exterior correspondence close
the former identity gap. This is an evidence-based facility identity conclusion.
It does **not** assert that 26-1 and 26-3 are legally interchangeable parcels,
that a subdivision occurred, or which publisher has the correct postal suffix.
That cadastral history is not required for this building-level coordinate repair.
Production's official 26-1 address remains unchanged.

The new building is the four-storey facility in this block. Historical reporting
described its 2021 opening as a new facility near an existing club; the old-club
address 5-35-1 found in legacy directories is not used for coordinate authority.
No nearby NAS/sub-brand row provides an accepted coordinate in this decision.

## Alternatives

- GSI 35.947292,139.641830 is a **26番 block address result**, not a 26-1 house,
  NAS building, or surveyed entrance. It is about 53.6 m southeast of the named
  facility point. Neither its result title nor the old building geometry supports
  preferring it to the now-corroborated facility Place. No claim of a measured
  parcel centroid is made. It is not retained as an equally supported NAS pin.
- The dormant NAS HTML shortlink to Osaka (34.6658125,135.5813645) remains rejected:
  commented-out and geographically unrelated. It is not a current NAS map link.
- Embed viewport/camera centres are rejected as destinations. Merchant/Kawai
  embeds are independent publication decisions but share Google's underlying
  Place; they are not independent surveys.

## Repair boundary

Only authored latitude/longitude changes are allowed. Existing updated_at trigger
remains enabled. Membership, 143 schedules, ownership, slug, address, Map runtime,
S1, HYROX, and migrations remain unchanged. **No Production mutation authorized.**
Validation and final-main release details are recorded separately in the release
packet; an authority decision alone does not claim those gates passed.

## Durable evidence and validation

[Named facility/building screenshot](nas-higashiomiya-coordinate-evidence/google-building.png),
[NAS diagram](nas-higashiomiya-coordinate-evidence/nas-static.png),
[GSI facility-point view](nas-higashiomiya-coordinate-evidence/gsi-facility-point.png),
[GSI address-point view](nas-higashiomiya-coordinate-evidence/gsi-address-point.png).
[Validation and release procedure](nas-higashiomiya-coordinate-validation.md),
[native17 machine result](nas-higashiomiya-coordinate-evidence/validation.json),
[actual candidate Map scope](nas-higashiomiya-coordinate-evidence/ui-map-scope.png).
