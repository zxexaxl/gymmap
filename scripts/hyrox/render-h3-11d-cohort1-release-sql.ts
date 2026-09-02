/* eslint-disable @typescript-eslint/no-explicit-any -- renderer consumes the validated release manifest */
import fs from "node:fs/promises";

type Json = Record<string, any>;

const input = "data/hyrox/h3-11d-cohort1-production-release.json";
const output = "scripts/hyrox/apply-h3-11d-cohort1-production-release.sql";
const fixtureOutput = "scripts/hyrox/setup-h3-11d-cohort1-release-validation.sql";

function q(value: unknown) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

function json(value: unknown) { return `${q(JSON.stringify(value))}::jsonb`; }
function uuid(value: string) { return `${q(value)}::uuid`; }
function ts(value: string | null) { return value ? `${q(value)}::timestamptz` : "null"; }
function hyroxId() { return "(select id from public.training_disciplines where slug='hyrox')"; }
function protocolId() { return "(select p.id from public.training_review_protocols p join public.training_disciplines d on d.id=p.discipline_id where d.slug='hyrox' and p.protocol_key='hyrox-review-coverage' and p.protocol_version='h3-11a-v1')"; }
function dimensionId(slug: string) { return `(select x.id from public.training_review_dimensions x join public.training_disciplines d on d.id=x.discipline_id where d.slug='hyrox' and x.slug=${q(slug)})`; }
function factTypeId(slug: string) { return `(select id from public.training_raw_fact_types where slug=${q(slug)})`; }
function equipmentTypeId(slug: string) { return `(select id from public.equipment_types where slug=${q(slug)})`; }
function capabilityTypeId(slug: string) { return `(select id from public.training_capability_types where slug=${q(slug)})`; }
function ltdId(locationId: string) { return `(select ltd.id from public.location_training_disciplines ltd join public.training_disciplines d on d.id=ltd.discipline_id where ltd.location_id=${uuid(locationId)} and d.slug='hyrox')`; }

function insert(table: string, columns: string[], values: string[], id: string) {
  return `insert into public.${table} (${columns.join(", ")})\nselect ${values.join(", ")}\nwhere not exists (select 1 from public.${table} where id=${uuid(id)});`;
}

function naturalConflict(table: string, id: string, predicate: string, label: string) {
  return `if exists (select 1 from public.${table} where (${predicate}) and id<>${uuid(id)}) then raise exception 'H3-11D Cohort 1 conflict: ${label}'; end if;`;
}

function idConflict(table: string, id: string, predicate: string, label: string) {
  return `if exists (select 1 from public.${table} where id=${uuid(id)} and not (${predicate})) then raise exception 'H3-11D Cohort 1 deterministic-id conflict: ${label}'; end if;`;
}

function exact(fields: Array<[string, string]>) {
  return fields.map(([column, value]) => `${column} is not distinct from ${value}`).join(" and ");
}

export function renderReleaseSql(release: Json) {
  const lines: string[] = [
    `-- H3-11D Cohort 1 exact candidate release`,
    `-- manifest ${release.manifestHash}`,
    `-- coherence ${release.hashes.COHORT1_RELEASE_COHERENCE_SHA256}`,
    `-- Generated. Do not edit manually.`,
    `begin;`,
    `do $$ begin`,
    `if (select count(*) from public.training_disciplines where slug='hyrox')<>1 then raise exception 'HYROX discipline authority missing'; end if;`,
    `if (select count(*) from public.training_review_protocols p join public.training_disciplines d on d.id=p.discipline_id where d.slug='hyrox' and p.protocol_key='hyrox-review-coverage' and p.protocol_version='h3-11a-v1')<>1 then raise exception 'H3-11A protocol authority missing'; end if;`,
    `if (select count(*) from public.training_review_dimensions x join public.training_disciplines d on d.id=x.discipline_id where d.slug='hyrox')<>10 then raise exception 'HYROX review dimension authority mismatch'; end if;`,
  ];
  const releaseNote = `Release ${release.hashes.COHORT1_RELEASE_COHERENCE_SHA256}`;
  const claimNote = `H3-11D Cohort 1 accepted positive claim; release ${release.hashes.COHORT1_RELEASE_COHERENCE_SHA256}`;
  for (const facility of release.facilities) {
    lines.push(`if not exists (select 1 from public.gym_locations where id=${uuid(facility.location_id)} and slug=${q(facility.slug)} and name=${q(facility.facility_name)} and is_active) then raise exception 'Cohort facility identity mismatch: ${facility.hgy_id}'; end if;`);
    lines.push(`if not exists (select 1 from public.location_external_identifiers where location_id=${uuid(facility.location_id)} and namespace='hyrox-training-club' and external_identifier=${q(facility.hgy_id)} and verification_status='confirmed') then raise exception 'Cohort HGY identity mismatch: ${facility.hgy_id}'; end if;`);
  }
  for (const source of release.sourceDelta.insert) {
    lines.push(idConflict("training_sources", source.id, exact([["location_id",uuid(source.locationId)],["url",q(source.url)],["canonical_url",q(source.canonicalUrl)],["source_kind",q(source.sourceKind)],["publisher_authority",q(source.publisherAuthority)],["availability_state",q(source.availabilityState)],["last_checked_at",ts(source.lastCheckedAt)],["review_required","false"],["content_hash",q(source.contentHash)],["metadata_json",json(source.metadata)]]), `source ${source.sourceRef}`));
    lines.push(naturalConflict("training_sources", source.id, `location_id=${uuid(source.locationId)} and (url=${q(source.url)} or canonical_url=${q(source.canonicalUrl)})`, `source ${source.sourceRef}`));
  }
  for (const row of release.reviewLedger.cycles) {
    lines.push(idConflict("training_review_cycles", row.id, exact([["location_id",uuid(row.location_id)],["discipline_id",hyroxId()],["protocol_id",protocolId()],["cycle_key",q(row.cycle_key)],["cycle_kind",q(row.cycle_kind)],["reviewed_at",ts(row.reviewed_at)],["reviewer_authority",q(row.reviewer_authority)],["notes",q(releaseNote)]]), `cycle ${row.cycle_key}`));
    lines.push(naturalConflict("training_review_cycles", row.id, `location_id=${uuid(row.location_id)} and cycle_key=${q(row.cycle_key)}`, `cycle ${row.cycle_key}`));
  }
  for (const row of release.reviewLedger.units) lines.push(idConflict("training_review_units", row.id, exact([["review_cycle_id",uuid(row.reviewCycleId)],["discipline_id",hyroxId()],["review_dimension_id",dimensionId(row.dimension)],["review_aspect",q(row.review_aspect)],["review_progress",q(row.review_progress)],["source_sufficiency",q(row.source_sufficiency)],["positive_outcome",q(row.positive_outcome)],["freshness_policy_key_at_review",q(row.freshness_policy_key_at_review)],["coverage_expires_at",ts(row.coverage_expires_at)],["notes",q(row.notes)]]), `unit ${row.unit_key}`));
  for (const row of release.reviewLedger.unitSources) lines.push(idConflict("training_review_unit_sources", row.id, exact([["review_unit_id",uuid(row.reviewUnitId)],["training_source_id",uuid(row.trainingSourceId)],["source_class",q(row.source_class)],["facility_binding",q(row.facility_binding)],["sufficiency_role",q(row.sufficiency_role)],["observed_at",ts(row.observed_at)],["reviewed_at",ts(row.reviewed_at)],["source_availability_state_at_review",q(row.availability)],["source_content_hash_at_review",q(row.content_sha256)],["binding_basis",q(row.binding_basis)]]), `unit source ${row.unit_key}/${row.source_ref}`));
  for (const row of release.canonicalPositive.equipmentClaims) {
    lines.push(idConflict("location_equipment", row.id, exact([["location_id",uuid(row.location_id)],["equipment_type_id",equipmentTypeId(row.equipment_slug)],["availability_state",q(row.availability_state)],["access_mode",q(row.access_mode)],["reservation_requirement",q(row.reservation_requirement)],["verification_status",q(row.verification_status)],["last_confirmed_at",ts(row.last_confirmed_at)],["stale_at",ts(row.stale_at)],["notes",q(claimNote)]]), `equipment ${row.claim_key}`));
    lines.push(naturalConflict("location_equipment", row.id, `location_id=${uuid(row.location_id)} and equipment_type_id=${equipmentTypeId(row.equipment_slug)}`, `equipment ${row.claim_key}`));
  }
  for (const row of release.canonicalPositive.capabilityClaims) {
    lines.push(idConflict("location_training_capabilities", row.id, exact([["location_training_discipline_id",ltdId(row.location_id)],["capability_type_id",capabilityTypeId(row.capability_slug)],["availability_state",q(row.availability_state)],["access_mode",q(row.access_mode)],["reservation_requirement",q(row.reservation_requirement)],["verification_status",q(row.verification_status)],["last_confirmed_at",ts(row.last_confirmed_at)],["stale_at",ts(row.stale_at)],["notes",q(claimNote)]]), `capability ${row.claim_key}`));
    lines.push(naturalConflict("location_training_capabilities", row.id, `location_training_discipline_id=${ltdId(row.location_id)} and capability_type_id=${capabilityTypeId(row.capability_slug)}`, `capability ${row.claim_key}`));
  }
  for (const row of release.canonicalPositive.evidence) {
    const equipment = row.target_table === "location_equipment" ? uuid(row.targetId) : "null";
    const capability = row.target_table === "location_training_capabilities" ? uuid(row.targetId) : "null";
    lines.push(idConflict("training_evidence", row.id, exact([["training_source_id",uuid(row.trainingSourceId)],["location_training_capability_id",capability],["location_equipment_id",equipment],["assertion","'supports'"],["review_status","'accepted'"],["evidence_text",q(row.evidenceText)],["structured_evidence",json({ factId: row.evidence_fact_id, relationshipKey: row.relationship_key, release: release.hashes.COHORT1_RELEASE_COHERENCE_SHA256 })],["observed_at",ts(row.observedAt)],["reviewed_at",ts(row.reviewedAt)],["content_hash",q(row.contentHash)]]), `evidence ${row.relationship_key}`));
  }
  for (const row of release.rawPersistence.rawFactRows) lines.push(idConflict("training_raw_facts", row.id, exact([["location_id",uuid(row.locationId)],["discipline_id",hyroxId()],["review_cycle_id",uuid(row.reviewCycleId)],["review_unit_id",uuid(row.reviewUnitId)],["review_unit_source_id",uuid(row.reviewUnitSourceId)],["training_source_id",uuid(row.trainingSourceId)],["source_class",q(row.sourceClass)],["fact_type_id",factTypeId(row.factTypeSlug)],["review_aspect",q(row.reviewAspect)],["fact_key",q(row.factKey)],["statement",q(row.statement)],["evidence_text",q(row.evidenceText)],["evidence_location_context",q(row.evidenceLocationContext)],["directness",q(row.directness)],["observed_at",ts(row.observedAt)],["reviewed_at",ts(row.reviewedAt)],["reviewer_authority",q(row.reviewerAuthority)],["source_content_hash_at_review",q(row.sourceContentHashAtReview)],["freshness_policy_key",q(row.freshnessPolicyKey)],["freshness_expires_at",ts(row.freshnessExpiresAt)]]), `raw fact ${row.factKey}`));
  for (const row of release.rawPersistence.rawDimensionRows) lines.push(`if exists (select 1 from public.training_raw_fact_dimensions where raw_fact_id=${uuid(row.rawFactId)} and review_dimension_id=${dimensionId(row.dimension)} and not (${exact([["review_cycle_id",uuid(row.reviewCycleId)],["discipline_id",hyroxId()],["review_aspect",q(row.reviewAspect)],["review_unit_id",uuid(row.reviewUnitId)],["review_unit_source_id",uuid(row.reviewUnitSourceId)],["training_source_id",uuid(row.trainingSourceId)],["source_class",q(row.sourceClass)]])})) then raise exception 'H3-11D Cohort 1 raw-dimension conflict: ${row.rawFactId}/${row.dimension}'; end if;`);
  for (const row of release.restrictionPersistence.restrictionRows) lines.push(idConflict("training_access_restrictions", row.id, exact([["location_id",uuid(row.locationId)],["discipline_id",hyroxId()],["review_cycle_id",uuid(row.reviewCycleId)],["review_unit_id",uuid(row.reviewUnitId)],["review_unit_source_id",uuid(row.reviewUnitSourceId)],["training_source_id",uuid(row.trainingSourceId)],["source_class",q(row.sourceClass)],["review_aspect",q(row.reviewAspect)],["restriction_key",q(row.restrictionKey)],["restriction_type",q(row.restrictionType)],["statement",q(row.statement)],["evidence_text",q(row.evidenceText)],["evidence_location_context",q(row.evidenceLocationContext)],["directness",q(row.directness)],["observed_at",ts(row.observedAt)],["reviewed_at",ts(row.reviewedAt)],["reviewer_authority",q(row.reviewerAuthority)],["source_content_hash_at_review",q(row.sourceContentHashAtReview)],["freshness_policy_key",q(row.freshnessPolicyKey)],["freshness_expires_at",ts(row.freshnessExpiresAt)]]), `restriction ${row.restrictionKey}`));
  lines.push(`end $$;`);

  for (const source of release.sourceDelta.insert) lines.push(insert("training_sources",
    ["id", "location_id", "url", "canonical_url", "source_kind", "publisher_authority", "availability_state", "last_checked_at", "review_required", "content_hash", "metadata_json"],
    [uuid(source.id), uuid(source.locationId), q(source.url), q(source.canonicalUrl), q(source.sourceKind), q(source.publisherAuthority), q(source.availabilityState), ts(source.lastCheckedAt), "false", q(source.contentHash), json(source.metadata)], source.id));

  for (const row of release.reviewLedger.cycles) lines.push(insert("training_review_cycles",
    ["id", "location_id", "discipline_id", "protocol_id", "cycle_key", "cycle_kind", "reviewed_at", "reviewer_authority", "notes"],
    [uuid(row.id), uuid(row.location_id), hyroxId(), protocolId(), q(row.cycle_key), q(row.cycle_kind), ts(row.reviewed_at), q(row.reviewer_authority), q(releaseNote)], row.id));

  for (const row of release.reviewLedger.units) lines.push(insert("training_review_units",
    ["id", "review_cycle_id", "discipline_id", "review_dimension_id", "review_aspect", "review_progress", "source_sufficiency", "positive_outcome", "freshness_policy_key_at_review", "coverage_expires_at", "notes"],
    [uuid(row.id), uuid(row.reviewCycleId), hyroxId(), dimensionId(row.dimension), q(row.review_aspect), q(row.review_progress), q(row.source_sufficiency), q(row.positive_outcome), q(row.freshness_policy_key_at_review), ts(row.coverage_expires_at), q(row.notes)], row.id));

  for (const row of release.reviewLedger.unitSources) lines.push(insert("training_review_unit_sources",
    ["id", "review_unit_id", "training_source_id", "source_class", "facility_binding", "sufficiency_role", "observed_at", "reviewed_at", "source_availability_state_at_review", "source_content_hash_at_review", "binding_basis"],
    [uuid(row.id), uuid(row.reviewUnitId), uuid(row.trainingSourceId), q(row.source_class), q(row.facility_binding), q(row.sufficiency_role), ts(row.observed_at), ts(row.reviewed_at), q(row.availability), q(row.content_sha256), q(row.binding_basis)], row.id));

  for (const row of release.canonicalPositive.equipmentClaims) lines.push(insert("location_equipment",
    ["id", "location_id", "equipment_type_id", "availability_state", "access_mode", "reservation_requirement", "verification_status", "last_confirmed_at", "stale_at", "notes"],
    [uuid(row.id), uuid(row.location_id), equipmentTypeId(row.equipment_slug), q(row.availability_state), q(row.access_mode), q(row.reservation_requirement), q(row.verification_status), ts(row.last_confirmed_at), ts(row.stale_at), q(claimNote)], row.id));
  for (const row of release.canonicalPositive.capabilityClaims) lines.push(insert("location_training_capabilities",
    ["id", "location_training_discipline_id", "capability_type_id", "availability_state", "access_mode", "reservation_requirement", "verification_status", "last_confirmed_at", "stale_at", "notes"],
    [uuid(row.id), ltdId(row.location_id), capabilityTypeId(row.capability_slug), q(row.availability_state), q(row.access_mode), q(row.reservation_requirement), q(row.verification_status), ts(row.last_confirmed_at), ts(row.stale_at), q(claimNote)], row.id));

  for (const row of release.canonicalPositive.evidence) {
    const equipment = row.target_table === "location_equipment" ? uuid(row.targetId) : "null";
    const capability = row.target_table === "location_training_capabilities" ? uuid(row.targetId) : "null";
    lines.push(insert("training_evidence",
      ["id", "training_source_id", "location_training_capability_id", "location_equipment_id", "assertion", "review_status", "evidence_text", "structured_evidence", "observed_at", "reviewed_at", "content_hash"],
      [uuid(row.id), uuid(row.trainingSourceId), capability, equipment, q(row.assertion), q(row.reviewStatus), q(row.evidenceText), json({ factId: row.evidence_fact_id, relationshipKey: row.relationship_key, release: release.hashes.COHORT1_RELEASE_COHERENCE_SHA256 }), ts(row.observedAt), ts(row.reviewedAt), q(row.contentHash)], row.id));
  }

  for (const row of release.rawPersistence.rawFactRows) lines.push(insert("training_raw_facts",
    ["id", "location_id", "discipline_id", "review_cycle_id", "review_unit_id", "review_unit_source_id", "training_source_id", "source_class", "fact_type_id", "review_aspect", "fact_key", "statement", "evidence_text", "evidence_location_context", "directness", "observed_at", "reviewed_at", "reviewer_authority", "source_content_hash_at_review", "freshness_policy_key", "freshness_expires_at"],
    [uuid(row.id), uuid(row.locationId), hyroxId(), uuid(row.reviewCycleId), uuid(row.reviewUnitId), uuid(row.reviewUnitSourceId), uuid(row.trainingSourceId), q(row.sourceClass), factTypeId(row.factTypeSlug), q(row.reviewAspect), q(row.factKey), q(row.statement), q(row.evidenceText), q(row.evidenceLocationContext), q(row.directness), ts(row.observedAt), ts(row.reviewedAt), q(row.reviewerAuthority), q(row.sourceContentHashAtReview), q(row.freshnessPolicyKey), ts(row.freshnessExpiresAt)], row.id));

  for (const row of release.rawPersistence.rawDimensionRows) lines.push(`insert into public.training_raw_fact_dimensions (raw_fact_id, review_cycle_id, discipline_id, review_aspect, review_dimension_id, review_unit_id, review_unit_source_id, training_source_id, source_class)\nselect ${uuid(row.rawFactId)}, ${uuid(row.reviewCycleId)}, ${hyroxId()}, ${q(row.reviewAspect)}, ${dimensionId(row.dimension)}, ${uuid(row.reviewUnitId)}, ${uuid(row.reviewUnitSourceId)}, ${uuid(row.trainingSourceId)}, ${q(row.sourceClass)}\nwhere not exists (select 1 from public.training_raw_fact_dimensions where raw_fact_id=${uuid(row.rawFactId)} and review_dimension_id=${dimensionId(row.dimension)});`);

  for (const row of release.restrictionPersistence.restrictionRows) lines.push(insert("training_access_restrictions",
    ["id", "location_id", "discipline_id", "review_cycle_id", "review_unit_id", "review_unit_source_id", "training_source_id", "source_class", "review_aspect", "restriction_key", "restriction_type", "statement", "evidence_text", "evidence_location_context", "directness", "observed_at", "reviewed_at", "reviewer_authority", "source_content_hash_at_review", "freshness_policy_key", "freshness_expires_at"],
    [uuid(row.id), uuid(row.locationId), hyroxId(), uuid(row.reviewCycleId), uuid(row.reviewUnitId), uuid(row.reviewUnitSourceId), uuid(row.trainingSourceId), q(row.sourceClass), q(row.reviewAspect), q(row.restrictionKey), q(row.restrictionType), q(row.statement), q(row.evidenceText), q(row.evidenceLocationContext), q(row.directness), ts(row.observedAt), ts(row.reviewedAt), q(row.reviewerAuthority), q(row.sourceContentHashAtReview), q(row.freshnessPolicyKey), ts(row.freshnessExpiresAt)], row.id));

  lines.push(`commit;`, "");
  return `${lines.join("\n\n").trimEnd()}\n`;
}

function renderValidationFixture(release: Json) {
  const brandId = "11111111-1111-5111-8111-111111111111";
  const lines = [
    "-- Disposable-only Cohort 1 Production-shaped baseline fixture.",
    `insert into public.gym_brands (id,name,slug) values (${uuid(brandId)},'H3-11D validation','h3-11d-validation');`,
  ];
  for (const facility of release.facilities) lines.push(`insert into public.gym_locations (id,brand_id,name,slug,prefecture,city,address_line,is_active) values (${uuid(facility.location_id)},${uuid(brandId)},${q(facility.facility_name)},${q(facility.slug)},${q(facility.prefecture)},${q(facility.city)},${q(facility.address)},true);`);
  for (const source of release.sourceDelta.reuse) lines.push(`insert into public.training_sources (id,location_id,url,canonical_url,source_kind,publisher_authority,availability_state,last_checked_at,review_required,content_hash,metadata_json) values (${uuid(source.id)},${uuid(source.locationId)},${q(source.url)},${q(source.url)},'finder','governing_body','available',${ts(source.lastCheckedAt)},false,${q(source.contentHash)},${json({ sourceRef: source.sourceRef, fixture: true })});`);
  for (const facility of release.facilities) {
    const finder = release.sourceDelta.reuse.find((row: Json) => row.locationId === facility.location_id);
    const ltdIdValue = release.reviewLedger.cycles.find((row: Json) => row.location_id === facility.location_id).id.replace(/^./, "a");
    const ltdEvidenceId = release.reviewLedger.cycles.find((row: Json) => row.location_id === facility.location_id).id.replace(/^./, "b");
    const affiliationId = release.reviewLedger.cycles.find((row: Json) => row.location_id === facility.location_id).id.replace(/^./, "c");
    const affiliationEvidenceId = release.reviewLedger.cycles.find((row: Json) => row.location_id === facility.location_id).id.replace(/^./, "d");
    lines.push(`insert into public.location_training_disciplines (id,location_id,discipline_id,support_state,verification_status,last_confirmed_at,stale_at) values (${uuid(ltdIdValue)},${uuid(facility.location_id)},${hyroxId()},'available','confirmed','2026-08-29T00:00:00Z','2026-11-27T00:00:00Z');`);
    lines.push(`insert into public.location_external_identifiers (location_id,namespace,external_identifier,training_source_id,verification_status,verified_at) values (${uuid(facility.location_id)},'hyrox-training-club',${q(facility.hgy_id)},${uuid(finder.id)},'confirmed','2026-08-29T00:00:00Z');`);
    lines.push(`insert into public.training_affiliations (id,location_id,discipline_id,affiliation_type,awarding_organization,external_identifier,affiliation_state,verification_status,last_confirmed_at,stale_at) values (${uuid(affiliationId)},${uuid(facility.location_id)},${hyroxId()},'training_club','HYROX',${q(facility.hgy_id)},'active','confirmed','2026-08-29T00:00:00Z','2026-11-27T00:00:00Z');`);
    lines.push(`insert into public.training_evidence (id,training_source_id,location_training_discipline_id,assertion,review_status,evidence_text,structured_evidence,observed_at,reviewed_at,content_hash) values (${uuid(ltdEvidenceId)},${uuid(finder.id)},${uuid(ltdIdValue)},'supports','accepted','Disposable official HYROX affiliation baseline','{}'::jsonb,'2026-08-29T00:00:00Z','2026-08-29T00:00:00Z',${q(finder.contentHash)});`);
    lines.push(`insert into public.training_evidence (id,training_source_id,training_affiliation_id,assertion,review_status,evidence_text,structured_evidence,observed_at,reviewed_at,content_hash) values (${uuid(affiliationEvidenceId)},${uuid(finder.id)},${uuid(affiliationId)},'supports','accepted','Disposable official HYROX affiliation baseline','{}'::jsonb,'2026-08-29T00:00:00Z','2026-08-29T00:00:00Z',${q(finder.contentHash)});`);
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const release = JSON.parse(await fs.readFile(input, "utf8"));
  const content = renderReleaseSql(release);
  const fixture = renderValidationFixture(release);
  if (process.argv.includes("--check")) {
    if (await fs.readFile(output, "utf8") !== content) throw new Error("Generated Cohort 1 SQL drift");
    if (await fs.readFile(fixtureOutput, "utf8") !== fixture) throw new Error("Generated Cohort 1 fixture drift");
    process.stdout.write("Cohort 1 release SQL is deterministic.\n");
    return;
  }
  await fs.writeFile(output, content);
  await fs.writeFile(fixtureOutput, fixture);
  process.stdout.write(`Wrote ${output}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
