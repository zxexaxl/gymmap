"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { rankStoreSearchOptions, rankStructuredAreas } from "@/lib/structured-area";
import type { StoreSearchOption, StructuredAreaOption } from "@/lib/types";

import styles from "./search-form.module.css";

type AreaStoreComboboxProps = {
  id: string;
  initialValue: string;
  initialPrefecture: string;
  initialMunicipality: string;
  areaOptions: StructuredAreaOption[];
  storeOptions: StoreSearchOption[];
};

type Suggestion =
  | { kind: "area"; area: StructuredAreaOption }
  | { kind: "store"; store: StoreSearchOption }
  | { kind: "text"; value: string };

export function AreaStoreCombobox({
  id,
  initialValue,
  initialPrefecture,
  initialMunicipality,
  areaOptions,
  storeOptions,
}: AreaStoreComboboxProps) {
  const instanceId = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(initialValue);
  const [selectedArea, setSelectedArea] = useState<Pick<StructuredAreaOption, "prefecture" | "municipality"> | null>(
    initialPrefecture ? { prefecture: initialPrefecture, municipality: initialMunicipality } : null,
  );
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxId = `${id}-${instanceId}-suggestions`;
  const areaSuggestions = useMemo(() => rankStructuredAreas(areaOptions, value), [areaOptions, value]);
  const storeSuggestions = useMemo(() => rankStoreSearchOptions(storeOptions, value), [storeOptions, value]);
  const suggestions = useMemo<Suggestion[]>(() => [
    ...areaSuggestions.map((area): Suggestion => ({ kind: "area", area })),
    ...storeSuggestions.map((store): Suggestion => ({ kind: "store", store })),
    ...(value.trim() ? [{ kind: "text" as const, value: value.trim() }] : []),
  ], [areaSuggestions, storeSuggestions, value]);
  const hasSuggestions = suggestions.length > 0;
  const activeSuggestion = suggestions[Math.min(activeIndex, Math.max(suggestions.length - 1, 0))];
  const activeOptionId = open && activeSuggestion ? `${listboxId}-option-${Math.min(activeIndex, suggestions.length - 1)}` : undefined;

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  function clearStructuredSelection() {
    setSelectedArea(null);
  }

  function selectSuggestion(suggestion: Suggestion) {
    if (suggestion.kind === "area") {
      setValue(suggestion.area.label);
      setSelectedArea(suggestion.area);
    } else if (suggestion.kind === "store") {
      setValue(suggestion.store.name);
      clearStructuredSelection();
    } else {
      setValue(suggestion.value);
      clearStructuredSelection();
    }
    setOpen(false);
    setActiveIndex(0);
  }

  function optionId(index: number) {
    return `${listboxId}-option-${index}`;
  }

  let optionIndex = 0;

  return (
    <div className={`ui-field ${styles.comboboxField}`} ref={rootRef}>
      <label className="ui-field__label" htmlFor={id}>エリア / 店舗</label>
      <input hidden type="text" name="prefecture" value={selectedArea?.prefecture ?? ""} readOnly />
      <input hidden type="text" name="municipality" value={selectedArea?.municipality ?? ""} readOnly />
      <div className={styles.comboboxControl}>
        <input
          id={id}
          className="ui-input"
          name="area"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && hasSuggestions}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          autoComplete="off"
          value={value}
          placeholder="渋谷 / 新宿 / 店舗名"
          onFocus={() => value.trim() && setOpen(true)}
          onChange={(event) => {
            setValue(event.target.value);
            clearStructuredSelection();
            setActiveIndex(0);
            setOpen(Boolean(event.target.value.trim()));
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && hasSuggestions) {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => open ? (index + 1) % suggestions.length : 0);
            } else if (event.key === "ArrowUp" && hasSuggestions) {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => open ? (index - 1 + suggestions.length) % suggestions.length : suggestions.length - 1);
            } else if (event.key === "Enter" && open && activeSuggestion) {
              event.preventDefault();
              selectSuggestion(activeSuggestion);
            } else if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
            } else if (event.key === "Tab") {
              setOpen(false);
            }
          }}
        />
        {selectedArea ? <span className={styles.structuredIndicator}>エリア</span> : null}
      </div>

      {open && hasSuggestions ? (
        <div className={styles.suggestions} id={listboxId} role="listbox" aria-label="エリアと店舗の候補">
          {areaSuggestions.length ? (
            <div className={styles.suggestionGroup} role="group" aria-label="エリア">
              <p>エリア</p>
              {areaSuggestions.map((area) => {
                const index = optionIndex++;
                return (
                  <button
                    id={optionId(index)}
                    key={`${area.type}-${area.prefecture}-${area.municipality}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    className={styles.suggestion}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectSuggestion({ kind: "area", area })}
                  >
                    <span><strong>{area.label}</strong><small>{area.type === "prefecture" ? "都道府県" : "市区町村"}</small></span>
                    <em>{area.count}店舗</em>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className={styles.suggestionGroup} role="group" aria-label="店舗とフリーワード">
            <p>店舗 / フリーワード</p>
            {storeSuggestions.map((store) => {
              const index = optionIndex++;
              return (
                <button
                  id={optionId(index)}
                  key={store.id}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  className={styles.suggestion}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectSuggestion({ kind: "store", store })}
                >
                  <span><strong>{store.name}</strong><small>{[store.brandName, store.areaLabel].filter(Boolean).join(" · ")}</small></span>
                </button>
              );
            })}
            {(() => {
              const index = optionIndex++;
              return (
                <button
                  id={optionId(index)}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  className={styles.suggestion}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectSuggestion({ kind: "text", value: value.trim() })}
                >
                  <span><strong>「{value.trim()}」をそのまま検索</strong><small>店舗名・住所をフリーワードで検索</small></span>
                </button>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
