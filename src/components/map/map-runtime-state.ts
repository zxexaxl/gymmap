export type MapSelectableEntity = {
  id: string;
  publicKey: string;
};

export type ResolvedMapSelection =
  | { kind: "none"; selectedId: null }
  | { kind: "valid"; selectedId: string }
  | { kind: "invalid"; selectedId: null };

export function resolveMapSelection(
  search: string,
  entities: readonly MapSelectableEntity[],
): ResolvedMapSelection {
  const publicKey = new URLSearchParams(search).get("selected");

  if (publicKey === null) {
    return { kind: "none", selectedId: null };
  }

  const entity = entities.find((candidate) => candidate.publicKey === publicKey);

  return entity
    ? { kind: "valid", selectedId: entity.id }
    : { kind: "invalid", selectedId: null };
}

export function buildMapSelectionHref(currentHref: string, publicKey: string | null) {
  const url = new URL(currentHref);

  if (publicKey) {
    url.searchParams.set("selected", publicKey);
  } else {
    url.searchParams.delete("selected");
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
